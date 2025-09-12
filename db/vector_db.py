# C:\Users\HP\Documents\AI Planet\db\vector_db.py

import os
import openai
from dotenv import load_dotenv
import pinecone
from pinecone import ServerlessSpec
import time

load_dotenv()

# Initialize OpenAI client (this part remains the same)
openai_client = None
try:
    openai_client = openai.OpenAI()
    print("[✔️] OpenAI client initialized successfully.")
except Exception as e:
    print(f"[❌] Error initializing OpenAI client: {e}")


# Initialize Pinecone index with a startup cleanup
pinecone_index = None
try:
    api_key = os.getenv("PINECONE_API_KEY")
    if not api_key:
        raise ValueError("PINECONE_API_KEY not found in environment variables.")

    pc = pinecone.Pinecone(api_key=api_key)
    index_name = "aiplanet"

    # --- NEW LOGIC: DELETE THE INDEX IF IT EXISTS ---
    if index_name in pc.list_indexes().names():
        print(f"[♻️] Deleting existing Pinecone index '{index_name}'...")
        pc.delete_index(index_name)
        # Wait for the deletion to complete before proceeding
        while index_name in pc.list_indexes().names():
            time.sleep(1)
        print(f"[✔️] Index '{index_name}' deleted successfully.")

    # --- CREATE A NEW, EMPTY INDEX ---
    print(f"[ℹ️] Creating new Pinecone index '{index_name}'...")
    pc.create_index(
        name=index_name,
        dimension=1536,  # Dimension for text-embedding-3-small
        metric="cosine",
        spec=ServerlessSpec(cloud='aws', region='us-east-1')
    )

    # Wait for the new index to be ready
    print("[ℹ️] Waiting for index to initialize...")
    while not pc.describe_index(index_name).status['ready']:
        time.sleep(1)

    # Connect to the newly created index
    pinecone_index = pc.Index(index_name)
    print(f"[✔️] Connected to new Pinecone index '{index_name}'.")

except Exception as e:
    print(f"[❌] Error during Pinecone setup: {e}")
    pinecone_index = None