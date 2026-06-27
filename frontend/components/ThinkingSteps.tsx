"use client"

import { useEffect, useRef } from "react"
import { ThinkingStep } from "@/types"
import { toolLabel } from "@/lib/stream"

interface Props {
  steps: ThinkingStep[]
}

const toolIcon: Record<string, string> = {
  search_documents: "ti-file-search",
  query_orders: "ti-database",
}

const doneIcon = "ti-circle-check"

export default function ThinkingSteps({ steps }: Props) {
  if (steps.length === 0) return null

  return (
    <div className="flex flex-col gap-1 mb-2">
      {steps.map((step, i) => (
        <div
          key={i}
          className="flex items-center gap-2 text-[12px] text-[#5C5265] animate-slide-in"
        >
          <i
            className={`ti ${step.done ? doneIcon : toolIcon[step.tool]} text-[#9B7FA6] text-[13px]`}
            aria-hidden="true"
          />
          <span>{toolLabel(step.tool)}</span>
        </div>
      ))}
    </div>
  )
}