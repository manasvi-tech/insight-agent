import { SSEEvent, SSEEventType } from "@/types"

export async function* streamChat(
  question: string,
  messages: { role: string; content: string }[]
): AsyncGenerator<SSEEvent> {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"

  const response = await fetch(`${backendUrl}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, messages }),
  })

  if (!response.ok) {
    yield { type: "error", message: `Request failed with status ${response.status}` }
    return
  }

  if (!response.body) {
    yield { type: "error", message: "No response body received" }
    return
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split("\n")
    buffer = lines.pop() ?? ""

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith("data:")) continue

      const jsonStr = trimmed.slice(5).trim()
      if (!jsonStr) continue

      try {
        const event = JSON.parse(jsonStr) as SSEEvent
        yield event
      } catch {
        continue
      }
    }
  }
}

export function toolLabel(tool: string): string {
  if (tool === "search_documents") return "searching documents"
  if (tool === "query_orders") return "querying orders table"
  return tool
}

export function stripInlineSource(text: string): string {
  return text
    .replace(/\n?Source:\s*\[[\w_\.]+\.pdf[^\]]*\]/gi, "")
    .replace(/\n?Source:\s*[\w_\.]+\.pdf/gi, "")
    .trim()
}

export function extractAllSources(text: string): string[] {
  const bracketMatches = [...text.matchAll(/Source:\s*\[([\w_\.]+\.pdf)[^\]]*\]/gi)]
  const plainMatches = [...text.matchAll(/Source:\s*([\w_\.]+\.pdf)/gi)]
  const all = [
    ...bracketMatches.map((m) => m[1]),
    ...plainMatches.map((m) => m[1]),
  ]
  return [...new Set(all)]
}