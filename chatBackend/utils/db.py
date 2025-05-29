# db.py
from cassandra.cluster import Cluster, ExecutionProfile, EXEC_PROFILE_DEFAULT, ProtocolVersion
from cassandra.auth import PlainTextAuthProvider
from langchain_community.vectorstores import Cassandra
from langchain.indexes.vectorstore import VectorStoreIndexWrapper
from utils.embeddings import get_embedding_model
import os, base64
from dotenv import load_dotenv

load_dotenv()

def get_cassandra_session():
    scb_base64 = os.environ["ASTRA_SCB_BASE64"]
    scb_path = "secure-connect-mental-health-manual.zip"

    with open(scb_path, "wb") as f:
        f.write(base64.b64decode(scb_base64))

    if not hasattr(get_cassandra_session, "session"):
        cloud_config = {
            'secure_connect_bundle': scb_path,
            'connect_timeout': 30
        }
        auth_provider = PlainTextAuthProvider("token", os.getenv("DATABASE_TOKEN"))
        profile = ExecutionProfile(request_timeout=30)
        cluster = Cluster(
            cloud=cloud_config,
            auth_provider=auth_provider,
            execution_profiles={EXEC_PROFILE_DEFAULT: profile},
            protocol_version=ProtocolVersion.V4
        )
        get_cassandra_session.session = cluster.connect()
    return get_cassandra_session.session

def get_vectorindex():
    session = get_cassandra_session()
    embeddings = get_embedding_model()
    vector_store = Cassandra(
        embedding=embeddings,
        session=session,
        keyspace="default_keyspace",
        table_name="table1"
    )
    vector_index = VectorStoreIndexWrapper(vectorstore=vector_store)
    return vector_index