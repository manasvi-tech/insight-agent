"use client"

import { Message } from "@/types"
import ThinkingSteps from "./ThinkingSteps"
import { stripInlineSource, extractAllSources } from "@/lib/stream"

interface Props {
  message: Message
}

function downloadCSV(results: Record<string, unknown>[]) {
  if (!results || results.length === 0) return
  const headers = Object.keys(results[0])
  const rows = results.map((row) =>
    headers.map((h) => JSON.stringify(row[h] ?? "")).join(",")
  )
  const csv = [headers.join(","), ...rows].join("\n")
  const blob = new Blob([csv], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "results.csv"
  a.click()
  URL.revokeObjectURL(url)
}

export default function MessageBubble({ message }: Props) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[72%] bg-[#9B7FA6] text-white text-[13px] px-4 py-2.5 rounded-[16px_16px_4px_16px] leading-relaxed">
          {message.content}
        </div>
      </div>
    )
  }

  const sources = message.isStreaming ? [] : extractAllSources(message.content)
  const cleanContent = message.isStreaming
    ? message.content
    : stripInlineSource(message.content)

  const hasTable = message.sqlResults && message.sqlResults.length > 0
  const tableHeaders = hasTable ? Object.keys(message.sqlResults![0]) : []

  return (
    <div className="flex flex-col items-start max-w-[85%]">
      {message.thinkingSteps && message.thinkingSteps.length > 0 && (
        <ThinkingSteps steps={message.thinkingSteps} />
      )}

      <div className="bg-white text-[#1A1520] text-[13px] px-4 py-3 rounded-[4px_16px_16px_16px] leading-[1.7] border border-[#DDD8D8] whitespace-pre-wrap">
        {cleanContent}
        {message.isStreaming && message.content === "" && (
          <span className="flex items-center gap-1 mt-1">
            <span
              className="w-2 h-2 rounded-full bg-[#9B7FA6] animate-bounce"
              style={{ animationDelay: "0ms", animationDuration: "600ms" }}
            />
            <span
              className="w-2 h-2 rounded-full bg-[#9B7FA6] animate-bounce"
              style={{ animationDelay: "150ms", animationDuration: "600ms" }}
            />
            <span
              className="w-2 h-2 rounded-full bg-[#9B7FA6] animate-bounce"
              style={{ animationDelay: "300ms", animationDuration: "600ms" }}
            />
          </span>
        )}
      </div>

      {hasTable && (
        <div className="mt-3 w-full">
          <div className="flex items-center justify-between mb-1.5 px-1">
            <span className="text-[11px] text-[#8A8090]">
              {message.sqlResults!.length} rows returned
            </span>
            <button
              onClick={() => downloadCSV(message.sqlResults!)}
              className="flex items-center gap-1.5 text-[11px] text-[#9B7FA6] hover:text-[#7A5F82] transition-colors"
            >
              <i className="ti ti-download text-[13px]" aria-hidden="true" />
              Download CSV
            </button>
          </div>
          <div className="overflow-x-auto rounded-[8px] border border-[#DDD8D8]">
            <table className="w-full text-[11px] border-collapse">
              <thead>
                <tr className="bg-[#F3EDF5]">
                  {tableHeaders.map((h) => (
                    <th
                      key={h}
                      className="text-left px-3 py-2 text-[#5B3F6B] font-medium border-b border-[#DDD8D8] whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {message.sqlResults!.map((row, i) => (
                  <tr
                    key={i}
                    className={i % 2 === 0 ? "bg-white" : "bg-[#FAF8F7]"}
                  >
                    {tableHeaders.map((h) => (
                      <td
                        key={h}
                        className="px-3 py-2 text-[#1A1520] border-b border-[#DDD8D8] whitespace-nowrap"
                      >
                        {String(row[h] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 mt-1.5 px-1">
        {sources.map((source, i) => (
          <div key={i} className="relative group">
            <i
              className="ti ti-link text-[#9B7FA6] text-[14px] cursor-pointer"
              aria-hidden="true"
            />
            <div className="absolute bottom-full left-0 mb-1.5 px-2.5 py-1 bg-[#2D2535] text-white text-[11px] rounded-[5px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
              {source}
              <div className="absolute top-full left-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-[#2D2535]" />
            </div>
          </div>
        ))}

        {message.sqlQueries && message.sqlQueries.length > 0 && (
          <div className="flex flex-col gap-2 w-full">
            {message.sqlQueries.map((sql, i) => (
              <div
                key={i}
                className="bg-white border border-[#DDD8D8] border-l-2 border-l-[#9B7FA6] rounded-r-[6px] px-3 py-2 font-mono text-[11px] text-[#5C5265] leading-relaxed"
              >
                {sql}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}