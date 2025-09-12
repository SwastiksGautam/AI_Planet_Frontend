import os
import io
import re
from typing import Optional, TypedDict, Annotated, Sequence

# FastAPI and Pydantic Imports
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# PDF Reader
from PyPDF2 import PdfReader

# LangChain & LangGraph Imports
from langchain_core.messages import BaseMessage, SystemMessage, HumanMessage, AIMessage, ToolMessage
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, END
from operator import add as add_messages

# Your custom database and client imports
from db.vector_db import pinecone_index, openai_client
from db.local_db import init_db, store_conversation, get_recent_conversations, clear_conversations

# Define a constant for our Pinecone namespace
PINECONE_NAMESPACE = "rag-namespace-1"

# --- In-memory user memory ---
user_memory = {
    "name": None,
    "age": None,
    "birthplace": None
}

# --- Helper function to extract name, age, and birthplace ---
def extract_user_info(message: str):
    # Extract name
    name_match = re.search(r"i am (\w+)", message, re.IGNORECASE)
    if name_match:
        user_memory["name"] = name_match.group(1)
    
    # Extract age
    age_match = re.search(r"(\d{1,3}) ?years? old", message, re.IGNORECASE)
    if age_match:
        user_memory["age"] = int(age_match.group(1))
    
    # Extract birthplace
    birth_match = re.search(r"(?:born in|from)\s+([\w\s]+)", message, re.IGNORECASE)
    if birth_match:
        user_memory["birthplace"] = birth_match.group(1).strip()

# --- 1. LANGGRAPH AGENT DEFINITION ---

@tool
def rag_retriever_tool(query: str) -> str:
    """Searches and retrieves relevant context from uploaded documents in Pinecone."""
    print(f"[TOOL] Retrieving context for query: {query}")
    if not pinecone_index.describe_index_stats().get('total_vector_count', 0) > 0:
        return "No documents have been uploaded yet. Please upload a document first."
    
    response = openai_client.embeddings.create(input=[query], model="text-embedding-3-small")
    query_embedding = response.data[0].embedding
    
    results = pinecone_index.query(
        vector=query_embedding, 
        top_k=3, 
        include_metadata=True, 
        namespace=PINECONE_NAMESPACE
    )
    
    if not results['matches']:
        return "No relevant information found in the documents for this query."
        
    context = "\n\n---\n\n".join([match['metadata']['text'] for match in results['matches']])
    return context

tools = [rag_retriever_tool]
tools_dict = {t.name: t for t in tools}
chat_model = ChatOpenAI(model="gpt-4o-mini", temperature=0)
model_with_tools = chat_model.bind_tools(tools)

class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], add_messages]

def should_continue(state: AgentState) -> str:
    return "take_action" if state['messages'][-1].tool_calls else END

def call_llm(state: AgentState):
    """Calls the LLM to decide on an action or generate a response."""
    print("---CALLING LLM---")
    
    # Include user memory in system prompt
    system_prompt = SystemMessage(content=f"""
You are a helpful and conversational research assistant. You have two main jobs:
1. Chat with the user in a friendly way.
2. Answer questions about documents the user has uploaded using your `rag_retriever_tool`.

User info:
- Name: {user_memory.get('name', 'Unknown')}
- Age: {user_memory.get('age', 'Unknown')}
- Birthplace: {user_memory.get('birthplace', 'Unknown')}

Rules:
- If the user asks a conversational question or makes a statement, respond naturally. DO NOT use the tool for these.
- If the user asks a specific question that requires information from their documents, you MUST use the `rag_retriever_tool`.
- After using the tool, base your answer strictly on the context provided. If the tool returns no relevant information, say that you couldn't find the answer in the documents.
""")
    
    messages_with_prompt = [system_prompt] + state['messages']
    response = model_with_tools.invoke(messages_with_prompt)
    return {"messages": [response]}

def take_action(state: AgentState):
    """Executes the tool chosen by the LLM."""
    print("---TAKING ACTION---")
    tool_calls = state['messages'][-1].tool_calls
    tool_messages = []
    for tool_call in tool_calls:
        tool_name = tool_call['name']
        tool_to_call = tools_dict[tool_name]
        output = tool_to_call.invoke(tool_call['args'])
        tool_messages.append(ToolMessage(content=str(output), tool_call_id=tool_call['id']))
    return {"messages": tool_messages}

graph = StateGraph(AgentState)
graph.add_node("llm", call_llm)
graph.add_node("take_action", take_action)
graph.set_entry_point("llm")
graph.add_conditional_edges("llm", should_continue, {"take_action": "take_action", END: END})
graph.add_edge("take_action", "llm")
rag_agent = graph.compile()

# --- 2. FASTAPI APPLICATION SETUP & ENDPOINTS ---

app = FastAPI()
origins = ["http://localhost:3000", "http://127.0.0.1:3000"]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.on_event("startup")
def startup_event(): 
    init_db()

@app.get("/")
def read_root(): 
    return {"message": "Welcome to the LangGraph RAG API"}

@app.post("/chat")
async def chat(query: Optional[str] = Form(None), file: Optional[UploadFile] = File(None)):
    if file:
        print(f"[📄] File upload received: {file.filename}")
        
        # 1. Clear Pinecone
        print("[♻️] Clearing document knowledge...")
        if pinecone_index.describe_index_stats().total_vector_count > 0:
            pinecone_index.delete(delete_all=True, namespace=PINECONE_NAMESPACE)
        
        # 2. Clear Chat History (keep memory intact)
        print("[♻️] Clearing conversation history...")
        clear_conversations()
        
        reader = PdfReader(io.BytesIO(await file.read()))
        full_text = "".join(page.extract_text() for page in reader.pages if page.extract_text())
        chunks = [chunk.strip() for chunk in full_text.split('\n') if chunk.strip()]
        if chunks:
            response = openai_client.embeddings.create(input=chunks, model="text-embedding-3-small")
            vectors = [(f"{file.filename}-{i}", res.embedding, {"text": chunk}) for i, (res, chunk) in enumerate(zip(response.data, chunks))]
            pinecone_index.upsert(vectors=vectors, namespace=PINECONE_NAMESPACE)
            store_conversation(query="File Upload", context=full_text, response="Document ingested successfully.", file_uploaded=True)
            return {"response": f"New session started. Successfully indexed '{file.filename}'."}
        else:
            return {"response": f"No text extracted from '{file.filename}'."}
            
    elif query:
        print(f"[💬] Received query: {query}")
        
        # Extract user info
        extract_user_info(query)
        
        # Handle personal info queries
        if re.search(r"what.*name|age|birthplace|born", query, re.IGNORECASE):
            parts = []
            if user_memory.get("name"):
                parts.append(f"Your name is {user_memory['name']}")
            if user_memory.get("age"):
                parts.append(f"your age is {user_memory['age']}")
            if user_memory.get("birthplace"):
                parts.append(f"and you were born in {user_memory['birthplace']}")
            
            final_answer = ", ".join(parts) + "." if parts else "I don't have that information yet."
            store_conversation(query=query, context="", response=final_answer, file_uploaded=False)
            return {"response": final_answer}
        
        # Normal RAG query
        history = get_recent_conversations(limit=5)
        history.append(HumanMessage(content=query))
        result = rag_agent.invoke({"messages": history})
        final_answer = result['messages'][-1].content
        store_conversation(query=query, context="", response=final_answer, file_uploaded=False)
        return {"response": final_answer}
        
    return {"response": "Please provide a query or a file."}
