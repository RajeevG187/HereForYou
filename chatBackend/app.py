from fastapi import FastAPI, Request, Response, WebSocket, WebSocketDisconnect
import uuid
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import time
from langchain_google_genai import ChatGoogleGenerativeAI
import os
from dotenv import load_dotenv
from chain import get_chain
from utils.db import get_vectorindex
import secrets
from collections import deque
import asyncio

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL"), "https://api-hitter.vercel.app", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

llm = ChatGoogleGenerativeAI(
    model="gemini-2.0-flash-001",
    google_api_key=os.getenv("GOOGLE_API_KEY")
)

vector_index = None
rag_chain = None

# In-memory conversation storage (temporary, not persistent)
# Structure: {session_id: deque([{"role": "user/assistant", "content": "..."}])}
session_conversations = {}
active_connections = {}

# Cleanup task to remove old sessions (runs every 30 minutes)
async def cleanup_old_sessions():
    while True:
        await asyncio.sleep(1800)  # 30 minutes
        current_time = time.time()
        expired_sessions = []
        
        for session_id in list(session_conversations.keys()):
            # Remove sessions older than 2 hours of inactivity
            if session_id not in active_connections:
                expired_sessions.append(session_id)
        
        for session_id in expired_sessions:
            if session_id in session_conversations:
                del session_conversations[session_id]
            print(f"Cleaned up expired session: {session_id}")

@app.on_event("startup")
async def startup_event():
    global vector_index, rag_chain
    vector_index = get_vectorindex()
    rag_chain = get_chain(vector_index, llm)
    # Start cleanup task
    asyncio.create_task(cleanup_old_sessions())

@app.get("/api/ping")
async def ping():
    return {"status": "ok"}

def format_chat_history(conversation_history):
    """Convert conversation history to readable format for the LLM"""
    if not conversation_history:
        return ""
    
    formatted_history = []
    for msg in conversation_history:
        role = "Patient" if msg["role"] == "user" else "Assistant"
        formatted_history.append(f"{role}: {msg['content']}")
    
    return "\n".join(formatted_history)

def add_to_conversation(session_id, role, content):
    """Add a message to the conversation history"""
    if session_id not in session_conversations:
        # Use deque with maxlen to automatically limit conversation history
        session_conversations[session_id] = deque(maxlen=25)  # Keep last 20 messages
    
    session_conversations[session_id].append({
        "role": role,
        "content": content,
        "timestamp": time.time()
    })

@app.websocket("/ws/chat")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    session_id = websocket.query_params.get("session_id")
    if not session_id:
        session_id = str(uuid.uuid4())
    
    active_connections[session_id] = websocket
    
    try:
        while True:
            data = await websocket.receive_json()
            question = data.get("question", "").strip()
            
            if not question:
                continue
            
            # Add user message to conversation history
            add_to_conversation(session_id, "user", question)
            
            # Get conversation history for context
            conversation_history = session_conversations.get(session_id, deque())
            chat_history_text = format_chat_history(conversation_history)
            # Generate response using RAG chain with streaming
            try:
                full_answer = ""
                
                # Send streaming chunks as they arrive
                async for chunk in rag_chain.astream({
                    "input": question,
                    "chat_history": chat_history_text
                }):
                    if "answer" in chunk:
                        chunk_text = chunk["answer"]
                        full_answer += chunk_text
                        
                        # Send each chunk immediately
                        await websocket.send_json({
                            "chunk": chunk_text,
                            "session_id": session_id,
                            "streaming": True
                        })
                
                # Send final message to indicate streaming is complete
                await websocket.send_json({
                    "session_id": session_id,
                    "streaming": False,
                    "complete": True
                })
                
                # Add complete response to conversation history
                add_to_conversation(session_id, "assistant", full_answer)
                
            except Exception as e:
                error_msg = "I'm sorry, I'm having trouble processing your message right now. Please try again."
                await websocket.send_json({
                    "chunk": error_msg,
                    "session_id": session_id,
                    "error": True,
                    "streaming": False
                })
                print(f"Error processing message: {e}")
    
    except WebSocketDisconnect:
        if session_id in active_connections:
            del active_connections[session_id]
        print(f"Client {session_id} disconnected")

    await websocket.accept()
    session_id = websocket.query_params.get("session_id")
    if not session_id:
        session_id = str(uuid.uuid4())
    
    active_connections[session_id] = websocket
    
    try:
        while True:
            data = await websocket.receive_json()
            question = data.get("question", "").strip()
            
            if not question:
                continue
            
            # Add user message to conversation history
            add_to_conversation(session_id, "user", question)
            
            # Get conversation history for context
            conversation_history = session_conversations.get(session_id, deque())
            chat_history_text = format_chat_history(conversation_history)
            
            # Generate response using RAG chain with conversation context
            try:
                answer = ""
                async for chunk in rag_chain.astream({
                    "input": question,
                    "chat_history": chat_history_text
                }):
                    if "answer" in chunk:
                        answer += chunk["answer"]
                
                # Add assistant response to conversation history
                add_to_conversation(session_id, "assistant", answer)
                
                await websocket.send_json({
                    "answer": answer, 
                    "session_id": session_id
                })
                
            except Exception as e:
                error_msg = "I'm sorry, I'm having trouble processing your message right now. Please try again."
                await websocket.send_json({
                    "answer": error_msg,
                    "session_id": session_id,
                    "error": True
                })
                print(f"Error processing message: {e}")
    
    except WebSocketDisconnect:
        # Clean up when user disconnects
        if session_id in active_connections:
            del active_connections[session_id]
        # Keep conversation history for a while in case they reconnect
        # It will be cleaned up by the background task
        print(f"Client {session_id} disconnected")

@app.post("/api/chat/end")
async def end_chat(request: Request):
    """Explicitly end a chat session and clean up memory"""
    data = await request.json()
    session_id = data.get("session_id")
    
    if session_id:
        # Remove from active connections
        if session_id in active_connections:
            del active_connections[session_id]
        
        # Remove conversation history
        if session_id in session_conversations:
            del session_conversations[session_id]
    
    return {"message": "Session ended successfully"}

@app.get("/api/chat/history/{session_id}")
async def get_session_history(session_id: str):
    """Optional endpoint to retrieve conversation history (for debugging)"""
    conversation = session_conversations.get(session_id, deque())
    return {"session_id": session_id, "history": list(conversation)}