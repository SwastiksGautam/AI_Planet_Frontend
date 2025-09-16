# 🤖 Interactive AI Agent for Retrieval-Augmented Generation (RAG)

## 🚧 Project Status
Initial Prototype for a Full-Stack Engineering Assignment.

This project demonstrates a **session-based RAG system prototype** where each new PDF upload creates a clean slate for the knowledge base and conversation history. It serves as a foundation for a no-code/low-code web application, allowing interactive querying of document content via a chat interface.

---

## 🎯 Key Features

### ✅ File Upload & Session Management
- Upload a PDF document.
- Automatically resets knowledge base and chat history for each new session.

### ✅ Retrieval-Augmented Generation (RAG)
- Interactive chat interface where users can ask questions about the uploaded document.
- Uses vector embeddings and OpenAI LLM to retrieve and synthesize accurate answers.

### ✅ Visual Workflow
- React Flow-based visualization of the agent's internal logic.
- "Custom Mode" allows graphical manipulation of nodes (purely visual in this prototype).

---

## ⚙️ High-Level Design (HLD)

### System Architecture
- **Frontend (Client)**  
  Built with React SPA for user interactions and state management.

- **Backend (Server)**  
  FastAPI-based Python API handling:
    - PDF file processing.
    - Vector embeddings generation (OpenAI API).
    - RAG logic orchestration.

- **External Services**  
  - OpenAI API for LLM functionality.
  - Vector store (initially Pinecone, moving toward in-memory).
  - Local SQLite database for session conversation history.

### Data Flows

#### 📄 New Session via File Upload
1. User uploads a PDF file.
2. File sent to backend `/chat` endpoint.
3. Backend resets old knowledge base and conversation history.
4. PDF is processed → Text extraction → Chunking → Vector embeddings generated.
5. Vectors stored in the vector store (in-memory or Pinecone).
6. Success message returned to frontend.

#### 💬 Querying a Question
1. User types a question.
2. Backend invokes LangGraph Agent → OpenAI LLM call.
3. If external knowledge needed → `rag_retriever_tool` invoked.
4. Query embedded → Vector DB searched → Relevant text retrieved.
5. Context passed back to LLM → Final synthesized answer.
6. Answer sent to frontend.

---

## ⚙️ Low-Level Design (LLD)

### Backend Components
- **`main.py`**  
  Central FastAPI application managing `/chat` endpoint, orchestrating file upload and queries.

- **`local_db.py` (SQLite)**  
  Handles temporary storage of conversation history.

- **`vector_db.py` (Pinecone / In-memory)**  
  Manages the document knowledge base, generates embeddings, and performs similarity searches.

- **LangGraph Agent**  
  Hardcoded workflow for AI query processing (to be made dynamic later).

### Frontend Components
- **`App.js`**  
  Manages application state and toggles between modes.

- **`ChatInterface.js`**  
  Handles user interactions: file uploads, question inputs, and chat history.

- **`WorkflowCanvas.js`**  
  Visualizes agent logic graph using React Flow. Custom Mode allows visual edits.

---

## ⚡ Design Decisions & Deployment Analysis

### Why In-Memory Vector DB?
- Avoids free-tier resource limits (e.g., Render).
- Simplifies deployment without external dependencies.
  
**Pros**:
- Stability on free services.
- Fast prototyping.

**Cons**:
- Knowledge is lost after restart.
- Limited scalability.

---

## 🚀 Roadmap for Full Assignment Compliance

### 1️⃣ Backend Refactoring
- New API: `POST /build_stack` to accept dynamic workflow graph (nodes + edges).
- Dynamic workflow parser.
- Integration of SerpAPI or similar web search tool.

### 2️⃣ Tech Stack Migration
- Migrate from SQLite → PostgreSQL for persistent storage.
- Migrate from Pinecone → ChromaDB.

### 3️⃣ Deployment Strategy
- Create Dockerfile for frontend & backend.
- Implement `docker-compose.yml` to launch:
    - Backend API
    - Frontend UI
    - PostgreSQL
    - ChromaDB

---

## 🚀 Setup & Installation

### Prerequisites
- Python 3.8+
- OpenAI API Key
- Node.js and npm (for frontend)
- Docker (for future deployment)

### Installation
1. Clone the repository:
    ```bash
    git clone https://github.com/your-username/rag-interactive-agent.git
    cd rag-interactive-agent
    ```

2. Backend Setup:
    ```bash
    python -m venv venv
    source venv/bin/activate      # Linux/macOS
    venv\Scripts\activate         # Windows
    pip install -r requirements.txt
    ```

3. Configure Environment:
    ```bash
    export OPENAI_API_KEY="your-openai-api-key"
    ```

4. Run Backend Server:
    ```bash
    uvicorn main:app --reload
    ```

5. Start Frontend:
    ```bash
    cd frontend
    npm install
    npm start
    ```

---

## 📚 Future Enhancements
- Fully dynamic workflow engine.
- Persistent storage for conversations and workflows.
- Scalable, multi-user support.



Made with ❤️ for learning and prototyping RAG systems.
