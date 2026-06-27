"use client"

import { useState, useRef, KeyboardEvent } from "react"

interface Props {
  onSend: (question: string) => void
  disabled: boolean
}

export default function InputBar({ onSend, disabled }: Props) {
  const [value, setValue] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handleSend() {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue("")
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleInput() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }

  return (
    <div className="px-6 py-3.5 border-t border-[#DDD8D8] bg-white flex-shrink-0">
      <div className="max-w-[720px] mx-auto flex gap-2 items-end">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          rows={1}
          placeholder="Ask about policies or orders..."
          disabled={disabled}
          className="flex-1 text-[13px] px-3.5 py-2.5 rounded-[10px] border border-[#C8C0CC] bg-[#EFE6F4] text-[#1A1520] placeholder-[#8A7A8A] resize-none outline-none leading-relaxed font-sans disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          aria-label="Send message"
          className="w-[34px] h-[34px] rounded-[8px] bg-[#9B7FA6] flex items-center justify-center flex-shrink-0 disabled:opacity-40 hover:bg-[#8A6E95] transition-colors"
        >
          <i className="ti ti-arrow-up text-white text-[15px]" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}