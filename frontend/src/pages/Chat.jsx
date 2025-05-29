import React, { useState, useEffect, useRef } from "react";

const AVATARS = {
  user: "https://ui-avatars.com/api/?name=User&background=C68EFD&color=fff",
  bot: "https://ui-avatars.com/api/?name=Bot&background=333&color=fff"
};

const MOOD_EMOJIS = [
  { emoji: "😊", label: "Happy" },
  { emoji: "😔", label: "Sad" },
  { emoji: "😰", label: "Anxious" },
  { emoji: "😡", label: "Angry" },
  { emoji: "😕", label: "Confused" },
  { emoji: "😐", label: "Neutral" }
];

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedMood, setSelectedMood] = useState(null);
  const messagesEndRef = useRef(null);
  const wsRef = useRef(null);
  const currentBotResponseRef = useRef(""); // Track current streaming response

  useEffect(() => {
    // Setup WebSocket connection
    let sessionId = localStorage.getItem("session_id") || "";
    wsRef.current = new WebSocket(`${process.env.CHAT_APP_BACKEND_URL}/ws/chat?session_id=${sessionId}`);
    
    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.session_id) {
        localStorage.setItem("session_id", data.session_id);
      }

      if (data.streaming) {
        // Handle streaming chunks
        setIsStreaming(true);
        currentBotResponseRef.current += data.chunk;
        
        setMessages((prev) => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          if (lastIndex >= 0 && updated[lastIndex].sender === "bot") {
            updated[lastIndex].text = currentBotResponseRef.current;
            updated[lastIndex].isStreaming = true;
          }
          return updated;
        });
        
      } else if (data.complete) {
        // Streaming finished
        setIsStreaming(false);
        setIsLoading(false);
        
        setMessages((prev) => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          if (lastIndex >= 0 && updated[lastIndex].sender === "bot") {
            updated[lastIndex].isStreaming = false;
          }
          return updated;
        });
        
        currentBotResponseRef.current = ""; // Reset for next message
        
      } else if (data.error) {
        // Handle error
        setIsStreaming(false);
        setIsLoading(false);
        
        setMessages((prev) => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          if (lastIndex >= 0 && updated[lastIndex].sender === "bot") {
            updated[lastIndex].text = data.chunk;
            updated[lastIndex].isError = true;
            updated[lastIndex].isStreaming = false;
          }
          return updated;
        });
        
        currentBotResponseRef.current = "";
        
      } else if (data.answer) {
        // Fallback for non-streaming response (if backend doesn't stream)
        setMessages((prev) => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          if (lastIndex >= 0 && updated[lastIndex].sender === "bot") {
            updated[lastIndex].text = data.answer;
            updated[lastIndex].isStreaming = false;
          }
          return updated;
        });
        setIsLoading(false);
        setIsStreaming(false);
      }
    };

    wsRef.current.onopen = () => {
      console.log("WebSocket connected");
    };

    wsRef.current.onclose = () => {
      console.log("WebSocket disconnected");
    };

    wsRef.current.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsLoading(false);
      setIsStreaming(false);
    };

    return () => {
      wsRef.current && wsRef.current.close();
    };
  }, []);

  const handleSend = async () => {
    if ((!input.trim() && !image) || isLoading || isStreaming) return;
    
    setIsLoading(true);
    currentBotResponseRef.current = ""; // Reset streaming response

    let userMessage = { sender: "user", text: input, image: imagePreview };
    let botMessage = { sender: "bot", text: "", isStreaming: false };
    
    setMessages((prev) => [...prev, userMessage, botMessage]);
    setInput("");
    setImage(null);
    setImagePreview(null);

    // Send message via WebSocket
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ question: input }));
    } else {
      // Handle connection error
      setIsLoading(false);
      setMessages((prev) => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        if (lastIndex >= 0 && updated[lastIndex].sender === "bot") {
          updated[lastIndex].text = "Connection error. Please try again.";
          updated[lastIndex].isError = true;
        }
        return updated;
      });
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center px-2 py-8"
      style={{
        background: "linear-gradient(135deg, #8F87F1 0%, #C68EFD 100%)",
        minHeight: "100vh"
      }}
    >
      <div className="w-full max-w-2xl flex flex-col items-center mb-6">
        <div className="flex flex-col items-center gap-2">
          <span className="text-4xl">🧑‍⚕️</span>
          <h1 className="text-3xl md:text-4xl font-bold text-[#FED2E2] text-center drop-shadow-sm">We're here to listen</h1>
          <p className="text-base md:text-lg text-gray-700 text-center max-w-lg">
            This is a safe space. How are you feeling today? Select a mood or start chatting below.
          </p>
        </div>
        <div className="flex gap-2 mt-3 mb-2">
          {MOOD_EMOJIS.map((mood) => (
            <button
              key={mood.label}
              className={`text-2xl p-2 rounded-full border transition-all duration-200 focus:outline-none ${selectedMood === mood.label ? 'bg-[#C68EFD] text-white border-[#C68EFD]' : 'bg-white border-gray-200 hover:bg-[#e0f7fa]'}`}
              aria-label={mood.label}
              onClick={() => setSelectedMood(mood.label)}
            >
              {mood.emoji}
            </button>
          ))}
        </div>
        {selectedMood && (
          <div className="text-sm text-gray-600 mb-2">You selected: <span className="font-semibold">{selectedMood}</span></div>
        )}
      </div>
      
      <div className="w-full max-w-2xl flex flex-col rounded-3xl shadow-2xl bg-white/80 border border-[#e0f7fa] p-0 md:p-2" style={{ minHeight: '70vh', maxHeight: '70vh' }}>
        <div className="flex-1 overflow-y-auto px-4 py-4" style={{ minHeight: '50vh' }}>
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 text-lg mt-10">
              <span>Start the conversation. We're here for you 💬</span>
            </div>
          )}
          
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`my-3 flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.sender === "bot" && (
                <img 
                  src={AVATARS.bot} 
                  alt="Bot" 
                  className={`w-10 h-10 rounded-full mr-3 self-end shadow-lg border-2 border-[#C68EFD] bg-white ${msg.isStreaming ? 'animate-pulse' : ''}`} 
                />
              )}
              
              <div
                className={`max-w-[70%] px-5 py-3 rounded-2xl shadow-md flex flex-col gap-2 text-base md:text-lg ${
                  msg.sender === "user"
                    ? "bg-gradient-to-br from-[#C68EFD] to-[#b2f5ea] text-black rounded-br-none"
                    : msg.isError
                    ? "bg-gradient-to-br from-red-100 to-red-200 text-red-800 rounded-bl-none"
                    : "bg-gradient-to-br from-[#f1f8e9] to-[#e0f7fa] text-gray-800 rounded-bl-none"
                }`}
              >
                {msg.image && (
                  <img
                    src={msg.image}
                    alt="sent"
                    className="max-w-[200px] max-h-[200px] rounded-lg border border-[#C68EFD] mb-1"
                    style={{ objectFit: "cover" }}
                  />
                )}
                
                <div className="flex items-center gap-2">
                  {msg.sender === "bot" && /<\/?(b|ul|li|ol|strong|em|i|a|br|p|h[1-6])[^>]*>/i.test(msg.text) ? (
                    <span dangerouslySetInnerHTML={{ __html: msg.text }} />
                  ) : (
                    <span>{msg.text}</span>
                  )}
                  
                  {msg.isStreaming && (
                    <div className="flex space-x-1 ml-2">
                      <div className="w-2 h-2 bg-[#C68EFD] rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-[#C68EFD] rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                      <div className="w-2 h-2 bg-[#C68EFD] rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                    </div>
                  )}
                </div>
              </div>
              
              {msg.sender === "user" && (
                <img src={AVATARS.user} alt="User" className="w-10 h-10 rounded-full ml-3 self-end shadow-lg border-2 border-[#C68EFD] bg-white" />
              )}
            </div>
          ))}
          
          {isLoading && !isStreaming && (
            <div className="my-3 flex justify-start items-center gap-2">
              <img src={AVATARS.bot} alt="Bot" className="w-10 h-10 rounded-full mr-3 self-end shadow-lg border-2 border-[#C68EFD] bg-white animate-bounce" />
              <div className="px-5 py-3 rounded-2xl shadow-md bg-gradient-to-br from-[#f1f8e9] to-[#e0f7fa] text-gray-800 rounded-bl-none text-base md:text-lg flex items-center gap-2">
                <span className="animate-pulse">Typing...</span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input */}
        <div className="w-full flex items-center gap-2 px-4 pb-4 pt-2 bg-white/70 rounded-b-3xl border-t border-[#e0f7fa]">
          <input
            type="text"
            className="flex-1 bg-[#f8fafc] text-gray-800 border border-[#e0f7fa] rounded-full px-5 py-3 focus:outline-none focus:border-[#C68EFD] text-base md:text-lg shadow-sm"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={isLoading || isStreaming}
            aria-label="Type your message"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || isStreaming}
            className="bg-[#C68EFD] text-white font-semibold px-6 py-3 rounded-full hover:bg-[#16a178] transition text-base md:text-lg shadow-md focus:outline-none focus:ring-2 focus:ring-[#C68EFD] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            {isLoading || isStreaming ? (
              <span className="animate-pulse">...</span>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-7.5-15-7.5v6l10 1.5-10 1.5v6z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;