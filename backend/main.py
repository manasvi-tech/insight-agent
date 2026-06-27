import os
os.environ["ANONYMIZED_TELEMETRY"] = "False"

import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from models import ChatRequest, SSEEvent
from agent import run_agent
from logger import logger

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    logger.info(f"REQUEST | {request.method} {request.url.path}")
    response = await call_next(request)
    duration = round(time.time() - start, 2)
    logger.info(f"RESPONSE | {request.method} {request.url.path} | {response.status_code} | {duration}s")
    return response


def sse(event: SSEEvent) -> str:
    return f"data: {event.model_dump_json()}\n\n"


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/chat")
async def chat(request: ChatRequest):
    async def generate():
        start = time.time()
        logger.info(f"CHAT | question: {request.question[:80]}")
        try:
            for event in run_agent(
                question=request.question,
                messages=[m.model_dump() for m in request.messages],
            ):
                if event["type"] == "tool_used":
                    logger.info(f"TOOL | {event['tool']}")
                if event["type"] == "error":
                    logger.error(f"ERROR | {event.get('message')}")
                if event["type"] == "done":
                    duration = round(time.time() - start, 2)
                    logger.info(f"DONE | total time: {duration}s")
                yield sse(SSEEvent(**event))
        except Exception as e:
            logger.error(f"EXCEPTION | {str(e)}", exc_info=True)
            yield sse(SSEEvent(type="error", message=str(e)))

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        }
    )