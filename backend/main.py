import os
os.environ["ANONYMIZED_TELEMETRY"] = "False"

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from models import ChatRequest, SSEEvent
from agent import run_agent

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def sse(event: SSEEvent) -> str:
    return f"data: {event.model_dump_json()}\n\n"


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/chat")
async def chat(request: ChatRequest):
    async def generate():
        try:
            for event in run_agent(
                question=request.question,
                messages=[m.model_dump() for m in request.messages],
            ):
                yield sse(SSEEvent(**event))
        except Exception as e:
            yield sse(SSEEvent(type="error", message=str(e)))

    return StreamingResponse(generate(), media_type="text/event-stream")