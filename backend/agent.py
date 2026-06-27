import json
import os
os.environ["ANONYMIZED_TELEMETRY"] = "False"

from typing import Generator
from config import chat_client, CHAT_DEPLOYMENT
from prompts import SYSTEM_PROMPT, TOOL_SEARCH_DESCRIPTION, TOOL_SQL_DESCRIPTION
from tools.rag import search_documents
from tools.sql import query_orders

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "search_documents",
            "description": TOOL_SEARCH_DESCRIPTION,
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Natural language search query",
                    }
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "query_orders",
            "description": TOOL_SQL_DESCRIPTION,
            "parameters": {
                "type": "object",
                "properties": {
                    "question": {
                        "type": "string",
                        "description": "Plain English description of the data needed",
                    }
                },
                "required": ["question"],
            },
        },
    },
]


def run_tool(name: str, arguments: dict) -> tuple[str, dict]:
    if name == "search_documents":
        chunks = search_documents(arguments["query"])
        context = "\n\n".join(
            f"[{c['source']} page {c['page']}]: {c['text']}" for c in chunks
        )
        seen = []
        for c in chunks:
            if c["source"] not in seen:
                seen.append(c["source"])
        return context, {"sources": seen}

    if name == "query_orders":
        result = query_orders(arguments["question"])
        context = json.dumps(result["results"], indent=2)
        return context, {"sql": result["sql"], "error": result.get("error")}

    return "Tool not found.", {}


def run_agent(question: str, messages: list[dict]) -> Generator[dict, None, None]:
    conversation = [
        {"role": "system", "content": SYSTEM_PROMPT},
        *messages,
        {"role": "user", "content": question},
    ]

    while True:
        response = chat_client.chat.completions.create(
            model=CHAT_DEPLOYMENT,
            messages=conversation,
            tools=TOOLS,
            tool_choice="auto",
        )

        message = response.choices[0].message

        if not message.tool_calls:
            break

        conversation.append(message)

        for tool_call in message.tool_calls:
            name = tool_call.function.name
            arguments = json.loads(tool_call.function.arguments)

            yield {"type": "tool_used", "tool": name}

            context, metadata = run_tool(name, arguments)

            if name == "search_documents":
                sources = metadata.get("sources", [])
                yielded = []
                for source in sources[:2]:
                    if source not in yielded:
                        yield {"type": "citation", "source": source}
                        yielded.append(source)

            if name == "query_orders" and metadata.get("sql"):
                yield {"type": "sql", "query": metadata["sql"]}

            conversation.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "content": context,
            })

    stream = chat_client.chat.completions.create(
        model=CHAT_DEPLOYMENT,
        messages=conversation,
        stream=True,
    )

    for chunk in stream:
        if not chunk.choices:
            continue
        delta = chunk.choices[0].delta.content
        if delta:
            yield {"type": "token", "content": delta}

    yield {"type": "done"}