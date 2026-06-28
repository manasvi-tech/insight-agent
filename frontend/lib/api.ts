const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"

export interface Conversation {
  id: number
  title: string
  created_at: string
}

export interface ConversationMessage {
  role: string
  content: string
}

export async function fetchConversations(): Promise<Conversation[]> {
  const res = await fetch(`${backendUrl}/conversations`)
  if (!res.ok) return []
  return res.json()
}

export async function createConversation(question: string): Promise<Conversation | null> {
  const res = await fetch(`${backendUrl}/conversations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  })
  if (!res.ok) return null
  return res.json()
}

export async function fetchMessages(conversationId: number): Promise<ConversationMessage[]> {
  const res = await fetch(`${backendUrl}/conversations/${conversationId}/messages`)
  if (!res.ok) return []
  return res.json()
}