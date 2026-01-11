# 📘 KozoFlow AI Service - Technical Spec (Ollama + Llama 3.1)

> **Role:** Dedicated Microservice for AI Logic & RAG Processing  
> **Communication:** Called by the Node.js Backend via REST API  
> **Infrastructure:** Relies on Ollama running locally + Pinecone for vector storage

---

## 1. Technology Stack

| Component | Technology |
|-----------|------------|
| **Language** | Python 3.10+ |
| **Framework** | FastAPI (Async Web Server) |
| **AI Orchestration** | LangChain & LangGraph |
| **LLM Provider** | Ollama (Local) |
| **Chat Model** | llama3.1 (Supports Native Tool Calling) |
| **Embedding Model** | nomic-embed-text |
| **Vector Store** | Pinecone |
| **Database Access** | SQLAlchemy (MySQL connection) |
| **Data Validation** | Pydantic |

---

## 2. Project Structure

```
kozoflow_ai/
├── app/
│   ├── __init__.py
│   ├── main.py                 # Entry point (FastAPI app)
│   ├── core/
│   │   ├── config.py           # Env vars & settings
│   │   └── pinecone_client.py  # Pinecone connection
│   ├── services/
│   │   ├── llm_factory.py      # Configures ChatOllama with Llama 3.1
│   │   ├── cv_extractor.py     # CV Extraction Logic
│   │   ├── vector_service.py   # Pinecone operations
│   │   └── brain_agent.py      # LangGraph Agent (The "Brain")
│   └── api/
│       └── v1/
│           └── endpoints/
│               ├── cv.py       # API for Talent Scanner
│               └── chat.py     # API for Smart Integrator
├── .env
├── requirements.txt
└── Dockerfile
```

---

## 3. Environment Configuration

```env
# AI Service Settings
AI_SERVICE_HOST=0.0.0.0
AI_SERVICE_PORT=6000

# Ollama (Local LLM)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1
OLLAMA_EMBED_MODEL=nomic-embed-text

# Pinecone (Vector Store)
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENVIRONMENT=your_environment
PINECONE_INDEX_NAME=kozoflow-candidates

# MySQL Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=kozoflow
```

---

## 4. API Specifications (Endpoints)

### Module A: Talent Scanner (CV Analysis)

#### `POST /api/v1/cv/analyze`
**Goal:** JSON Extraction from CV

**Request:**
```json
{
  "raw_text": "John Doe, React Developer with 5 years experience..."
}
```

**Response:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "skills": ["React", "Node.js", "MySQL"],
  "years_experience": 5,
  "current_role": "Senior Developer"
}
```

**Prompt Strategy:**
> "You are an expert HR data extractor. Extract the following fields from the CV into strict JSON: name, email, skills (array), years_experience (int), current_role. Do not output any markdown text outside the JSON."

---

#### `POST /api/v1/cv/embed`
**Goal:** Create and store vector embedding in Pinecone

**Request:**
```json
{
  "candidate_id": "123",
  "text": "React Developer with 5 years experience in Node.js..."
}
```

**Response:**
```json
{
  "success": true,
  "vector_id": "candidate_123"
}
```

---

### Module B & C: Smart Integrator (The Brain)

#### `POST /api/v1/chat/query`
**Goal:** Smart Router using Llama 3.1 for intelligent responses

**Request:**
```json
{
  "message": "Who is the best React candidate?",
  "conversation_history": []
}
```

**Response:**
```json
{
  "answer": "Based on the candidates in our database, John Doe has the highest match score for React with 5 years of experience...",
  "sources": ["candidates", "code_reviews"]
}
```

---

## 5. Implementation Details

### A. The LLM Factory (`services/llm_factory.py`)

```python
from langchain_ollama import ChatOllama, OllamaEmbeddings
from app.core.config import settings

def get_chat_model(json_mode: bool = False):
    return ChatOllama(
        base_url=settings.OLLAMA_BASE_URL,
        model="llama3.1",  # Supports native tool calling
        temperature=0,
        format="json" if json_mode else ""
    )

def get_embeddings():
    return OllamaEmbeddings(
        base_url=settings.OLLAMA_BASE_URL,
        model="nomic-embed-text"
    )
```

---

### B. Pinecone Vector Service (`services/vector_service.py`)

```python
from pinecone import Pinecone
from app.core.config import settings

pc = Pinecone(api_key=settings.PINECONE_API_KEY)
index = pc.Index(settings.PINECONE_INDEX_NAME)

async def upsert_candidate_vector(candidate_id: str, vector: list[float], metadata: dict):
    """Store candidate embedding in Pinecone"""
    index.upsert(vectors=[{
        "id": f"candidate_{candidate_id}",
        "values": vector,
        "metadata": metadata
    }])

async def search_candidates(query_vector: list[float], top_k: int = 5):
    """Search for similar candidates"""
    results = index.query(vector=query_vector, top_k=top_k, include_metadata=True)
    return results.matches
```

---

### C. Node.js Backend Integration

The Node.js backend calls the AI service via REST:

```typescript
// In backend: services/ai.service.ts
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export async function analyzeCv(rawText: string) {
  const response = await fetch(`${AI_SERVICE_URL}/api/v1/cv/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw_text: rawText })
  });
  return response.json();
}

export async function chatQuery(message: string, history: any[] = []) {
  const response = await fetch(`${AI_SERVICE_URL}/api/v1/chat/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, conversation_history: history })
  });
  return response.json();
}
```

---

## 6. Requirements

```txt
fastapi>=0.104.0
uvicorn>=0.24.0
langchain>=0.1.0
langchain-ollama>=0.1.0
langgraph>=0.0.40
pinecone-client>=3.0.0
sqlalchemy>=2.0.0
pymysql>=1.1.0
pydantic>=2.0.0
python-dotenv>=1.0.0
```

---

## 7. Running the Service

```bash
cd kozoflow_ai

# Install dependencies
pip install -r requirements.txt

# Start the service
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The AI service will be available at `http://localhost:8000`