"use client"

import { useEffect, useRef } from "react"
import { Message } from "@/types"
import MessageBubble from "./MessageBubble"

interface Props {
  messages: Message[]
}

export default function ChatWindow({ messages }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-[720px] mx-auto px-6 py-6 flex flex-col gap-5">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full mt-32 gap-3 text-center">
            <i className="ti ti-message-circle text-[32px] text-[#9B7FA6]" aria-hidden="true" />
            <p className="text-[14px] text-[#8A8090]">
              Ask anything about company policies or orders
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}