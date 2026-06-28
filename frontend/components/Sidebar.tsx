"use client"

import { useEffect, useState } from "react"
import { Conversation, fetchConversations } from "@/lib/api"

interface Props {
  currentId: number | null
  onSelect: (conversation: Conversation) => void
  onNewChat: () => void
  refreshTrigger: number
}

export default function Sidebar({ currentId, onSelect, onNewChat, refreshTrigger }: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    fetchConversations().then(setConversations)
  }, [refreshTrigger])

  return (
    <div
      className={`flex flex-col border-r border-[#DDD8D8] bg-[#F3EDF5] transition-all duration-200 flex-shrink-0 ${
        collapsed ? "w-12" : "w-56"
      }`}
    >
      <div className="flex items-center justify-between px-3 py-3 border-b border-[#DDD8D8]">
        {!collapsed && (
          <span className="text-[11px] font-medium text-[#7A5F82] uppercase tracking-wider">
            Chats
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-[#9B7FA6] hover:text-[#7A5F82] transition-colors ml-auto"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <i
            className={`ti ${collapsed ? "ti-layout-sidebar-right" : "ti-layout-sidebar"} text-[16px]`}
            aria-hidden="true"
          />
        </button>
      </div>

      {!collapsed && (
        <button
          onClick={onNewChat}
          className="flex items-center gap-2 mx-3 mt-3 px-3 py-2 rounded-[8px] bg-[#9B7FA6] text-white text-[12px] font-medium hover:bg-[#8A6E95] transition-colors"
        >
          <i className="ti ti-plus text-[14px]" aria-hidden="true" />
          New chat
        </button>
      )}

      {collapsed && (
        <button
          onClick={onNewChat}
          className="flex items-center justify-center py-3 text-[#9B7FA6] hover:text-[#7A5F82] transition-colors"
          aria-label="New chat"
        >
          <i className="ti ti-plus text-[16px]" aria-hidden="true" />
        </button>
      )}

      {!collapsed && (
        <div className="flex-1 overflow-y-auto py-2">
          {conversations.length === 0 && (
            <p className="text-[11px] text-[#8A8090] px-4 mt-4 text-center">
              No conversations yet
            </p>
          )}
          {conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelect(c)}
              className={`w-full text-left px-3 py-2 mx-0 text-[12px] rounded-[6px] truncate transition-colors ${
                currentId === c.id
                  ? "bg-[#EFE6F4] text-[#2D2030]"
                  : "text-[#5C5265] hover:bg-[#E8DCF0]"
              }`}
            >
              {c.title}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}