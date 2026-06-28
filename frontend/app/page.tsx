"use client"

import { useState, useCallback } from "react"
import { Message } from "@/types"
import { streamChat, stripInlineSource, toolLabel } from "@/lib/stream"
import { createConversation, fetchMessages, Conversation } from "@/lib/api"
import TopBar from "@/components/TopBar"
import ChatWindow from "@/components/ChatWindow"
import InputBar from "@/components/InputBar"
import Sidebar from "@/components/Sidebar"

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [conversationId, setConversationId] = useState<number | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  function updateLastMessage(updater: (msg: Message) => Message) {
    setMessages((prev) => {
      const updated = [...prev]
      updated[updated.length - 1] = updater(updated[updated.length - 1])
      return updated
    })
  }

  function handleNewChat() {
    setMessages([])
    setConversationId(null)
  }

  async function handleSelectConversation(conversation: Conversation) {
    setConversationId(conversation.id)
    const msgs = await fetchMessages(conversation.id)
    setMessages(
      msgs.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
        thinkingSteps: [],
        citations: [],
        sqlQueries: [],
        sqlResults: [],
        isStreaming: false,
      }))
    )
  }

  const handleSend = useCallback(
    async (question: string) => {
      if (isStreaming) return

      let currentConversationId = conversationId

      if (!currentConversationId) {
        const conversation = await createConversation(question)
        if (conversation) {
          currentConversationId = conversation.id
          setConversationId(conversation.id)
          setRefreshTrigger((prev) => prev + 1)
        }
      }

      const userMessage: Message = {
        role: "user",
        content: question,
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: "",
        thinkingSteps: [],
        citations: [],
        sqlQueries: [],
        sqlResults: [],
        isStreaming: true,
      }

      setMessages((prev) => [...prev, userMessage, assistantMessage])
      setIsStreaming(true)

      const history = (() => {
        const allMessages = messages.map((m) => ({
          role: m.role,
          content: m.content,
        }))
        if (allMessages.length <= 6) return allMessages
        const first2 = allMessages.slice(0, 2)
        const last4 = allMessages.slice(-4)
        return [...first2, ...last4]
      })()

      try {
        for await (const event of streamChat(question, history, currentConversationId)) {
          if (event.type === "tool_used" && event.tool) {
            const tool = event.tool as "search_documents" | "query_orders"
            updateLastMessage((msg) => ({
              ...msg,
              thinkingSteps: [
                ...(msg.thinkingSteps ?? []),
                { tool, label: toolLabel(tool), done: false },
              ],
            }))

            await new Promise((r) => setTimeout(r, 600))

            updateLastMessage((msg) => ({
              ...msg,
              thinkingSteps: msg.thinkingSteps?.map((s, i) =>
                i === (msg.thinkingSteps?.length ?? 0) - 1
                  ? { ...s, done: true }
                  : s
              ),
            }))
          }

          if (event.type === "citation" && event.source) {
            updateLastMessage((msg) => {
              const existing = msg.citations ?? []
              const alreadyExists = existing.some((c) => c.source === event.source)
              if (alreadyExists) return msg
              return {
                ...msg,
                citations: [...existing, { source: event.source! }],
              }
            })
          }

          if (event.type === "sql" && event.query) {
            updateLastMessage((msg) => ({
              ...msg,
              sqlQueries: [...(msg.sqlQueries ?? []), event.query!],
            }))
          }

          if (event.type === "sql_results" && event.results) {
            updateLastMessage((msg) => ({
              ...msg,
              sqlResults: event.results,
            }))
          }

          if (event.type === "token" && event.content) {
            updateLastMessage((msg) => ({
              ...msg,
              content: msg.content + event.content,
            }))
          }

          if (event.type === "done") {
            updateLastMessage((msg) => ({
              ...msg,
              isStreaming: false,
            }))
            setIsStreaming(false)
          }

          if (event.type === "error") {
            updateLastMessage((msg) => ({
              ...msg,
              content: event.message ?? "Something went wrong.",
              isStreaming: false,
            }))
            setIsStreaming(false)
          }
        }
      } catch (err) {
        updateLastMessage((msg) => ({
          ...msg,
          content: "Could not reach the backend. Make sure it is running.",
          isStreaming: false,
        }))
        setIsStreaming(false)
      }
    },
    [messages, isStreaming, conversationId]
  )

  return (
    <div className="flex flex-col h-screen bg-[#F7F5F3]">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          currentId={conversationId}
          onSelect={handleSelectConversation}
          onNewChat={handleNewChat}
          refreshTrigger={refreshTrigger}
        />
        <div className="flex flex-col flex-1 overflow-hidden">
          <ChatWindow messages={messages} />
          <InputBar onSend={handleSend} disabled={isStreaming} />
        </div>
      </div>
    </div>
  )
}