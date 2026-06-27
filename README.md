# insight-agent

A LLM-powered chatbot that answers questions over a company knowledge base using two retrieval strategies within a single conversational agent. Built as part of an EMB technical assessment.

---

## Live Demo

Frontend: (add Vercel URL here)
Backend: (add Railway URL here)

---

## What it does

insight-agent routes every question to the right data source automatically:

- Document questions are answered via vector RAG over company policy PDFs with source citations
- Data questions are answered by generating and executing SQL against a live orders table
- Mixed questions use both sources and combine the results into a single answer
- Out of scope questions return a safe fallback with no hallucination

The agent decides which tool to use on its own using OpenAI function calling. No manual routing rules are written anywhere in the code.

---

## Architecture

The system has three layers:

**Agent layer**

The core of the system. Every incoming question is passed to gpt-5-mini with two tools defined: search_documents and query_orders. The model reads the question and the tool descriptions and decides which tool or tools to call. This decision happens at inference time with no hardcoded rules. For mixed questions the agent calls both tools sequentially, collects both results, and synthesises a single answer.

**Retrieval layer**

Two separate retrieval mechanisms handle the two data types:

Agentic RAG handles unstructured document questions. The 5 policy PDFs are chunked and embedded at ingest time using text-embedding-3-small. Embeddings are stored in Chroma with source filename metadata attached to each chunk. At query time the incoming question is embedded using the same model and Chroma performs cosine similarity search to find the most relevant chunks. The agent receives the chunks with their source filenames and writes a grounded answer.

Text-to-SQL handles structured data questions. The orders CSV is loaded into a SQLite database at ingest time. When a data question arrives the agent generates a SQL query against the known schema, executes it against SQLite, and answers from the result set. The orders data is never embedded.

**Streaming layer**

Responses stream to the frontend via Server-Sent Events. The backend yields structured JSON events as each step completes: tool_used fires when the agent picks a tool, token fires for each streamed token of the final answer, sql fires with the generated query, and done signals completion. The frontend reacts to each event type independently so the user sees tool activity before the answer begins.

---

## Tech stack

| Layer | Choice | Reason |
|---|---|---|
| LLM | gpt-5-mini via Azure OpenAI | Existing enterprise subscription, strong tool calling support, streaming support |
| Embeddings | text-embedding-3-small via Azure OpenAI | Same subscription and endpoint as the chat model, 1536 dimensions, cost effective for 5 documents |
| Vector store | Chroma (persistent local) | Built-in metadata storage needed for source citations, automatic persistence without extra code, zero external service dependency at runtime |
| Structured data | SQLite | 200 rows needs no infrastructure, file-based, zero setup |
| Backend | FastAPI | Native async support, StreamingResponse for SSE, clean tool for AI APIs |
| Frontend | Next.js with TypeScript | Required by the brief, Vercel deployment is zero config |
| Deployment | Railway (backend) and Vercel (frontend) | Railway runs Docker containers directly, Vercel is the canonical Next.js platform |

---

## Why Chroma over the alternatives

The assessment listed several vector store options. The decision came down to what the system actually needs:

Chroma stores vectors, the original text, and metadata together as first class features. Citations require knowing which source file each chunk came from. With Chroma that is one metadata field set at ingest time and read at query time. With FAISS that is a separate data structure the developer builds and maintains manually.

Chroma also persists automatically to disk via PersistentClient. FAISS requires explicit save and load calls. For a Dockerised deployment where the container restarts, automatic persistence avoids a class of bugs entirely.

pgvector and Supabase were ruled out because they require running a Postgres instance. Since the orders data already lives in SQLite there is no existing Postgres infrastructure to extend, and spinning up a full database server to store 5 document chunks adds unnecessary operational complexity.

Pinecone was ruled out because it is an external managed service. If Pinecone has an outage or the free tier quota is exhausted the application breaks even if the container is healthy. Chroma has no external runtime dependency.

---

## Why gpt-5-mini over other models

The model needs to support two things reliably: tool calling and token level streaming. These are non-negotiable for the agent architecture.

gpt-5-mini was selected after testing. The gpt-4o series was in deprecation on this Azure subscription and could not be deployed. gpt-5-mini supports parallel function calling, follows tool descriptions accurately, and handles streaming without issues. It was verified in the Azure playground before being used in code.

The o-series models were considered but ruled out. They are optimised for deep reasoning tasks and have known limitations with streaming and tool calling in agentic loops.

---

## Routing logic

Routing is handled entirely by the model using OpenAI function calling. Two tools are defined with precise natural language descriptions:

search_documents is described as the tool for questions about policies, rules, procedures, warranties, refunds, returns, HR leave, pricing, and discounts.

query_orders is described as the tool for questions involving numbers, counts, totals, revenue, specific order details, order status, or anything requiring structured data about orders.

The model reads the incoming question alongside these descriptions and decides which tool to call. For mixed questions it calls both tools in sequence. This approach requires no if-else routing logic in application code and generalises correctly to novel question phrasings without any changes.

---

## Streaming architecture

The backend uses FastAPI StreamingResponse with the text/event-stream content type (Server-Sent Events). The agent is implemented as a Python generator that yields events as each step completes.

This means tool activity events reach the frontend before the answer begins streaming. The user sees which tools are being called during the wait rather than watching a blank screen. Each SSE event is a JSON object with a type field. The frontend in lib/stream.ts parses these events and updates React state for each type independently.

---

## Data

Five PDF documents form the knowledge base:

- hr_leave_policy.pdf
- returns_policy.pdf
- warranty_policy.pdf
- product_faq.pdf
- pricing_discounts_policy.pdf

The orders table has 200 rows with columns: order_id, customer, product, amount, status, order_date. Status values are: delivered, shipped, cancelled, processing, pending, returned.

---

## Running locally

**Prerequisites**

- Python 3.11
- Node.js 20
- Docker Desktop
- Azure OpenAI resource with gpt-5-mini and text-embedding-3-small deployed

**Environment setup**

Copy .env.example to .env in the backend folder and fill in your Azure credentials:

```
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your-key
AZURE_OPENAI_CHAT_DEPLOYMENT=gpt-5-mini
AZURE_OPENAI_EMBEDDING_DEPLOYMENT=text-embedding-3-small
AZURE_OPENAI_API_VERSION=2024-02-01
```

**Run with Docker**

```bash
docker-compose up --build
```

Frontend: http://localhost:3002
Backend: http://localhost:8000
Health check: http://localhost:8000/health

**Run without Docker**

```bash
cd backend
pip install -r requirements.txt
python ingest.py
uvicorn main:app --reload --port 8000
```

```bash
cd frontend
npm install
npm run dev
```

---

## Project structure

```
insight-agent/
├── backend/
│   ├── main.py           # FastAPI app, SSE streaming endpoint
│   ├── agent.py          # Agent loop, tool orchestration, generator pattern
│   ├── tools/
│   │   ├── rag.py        # Chroma search, cosine similarity retrieval
│   │   └── sql.py        # SQL generation and SQLite execution
│   ├── ingest.py         # One-time ingestion: embed PDFs, load CSV
│   ├── prompts.py        # System prompt with dynamic date injection
│   ├── models.py         # Pydantic request and response models
│   ├── config.py         # Azure OpenAI client initialisation
│   ├── logger.py         # Structured logging
│   └── data/
│       └── documents/    # 5 policy PDFs
├── frontend/
│   ├── app/
│   │   └── page.tsx      # Main chat page, stream consumption
│   ├── components/
│   │   ├── ChatWindow.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── ThinkingSteps.tsx
│   │   ├── InputBar.tsx
│   │   └── TopBar.tsx
│   └── lib/
│       └── stream.ts     # SSE parser, source extraction utilities
├── docker-compose.yml
└── CLAUDE.md
```

---

## Known constraints

- The current date is injected dynamically into the system prompt at request time so time-based SQL queries are always accurate
- Conversation history is maintained on the frontend with a sliding window of the last 6 messages plus the first 2 messages of the session
- The agent is capped at 2 tool call iterations per question to prevent loops
- Out of scope questions return exactly "I don't have that information" with no hallucination