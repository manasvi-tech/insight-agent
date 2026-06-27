export default function TopBar() {
  return (
    <div className="flex items-center justify-between px-6 h-13 border-b border-[#DDD8D8] bg-white flex-shrink-0">
      <div className="flex items-center gap-2">
        <span className="text-[15px] font-medium text-[#1A1520] tracking-tight">
          insight-agent
        </span>
        <span className="text-[12px] text-[#8A8090] ml-1">
          knowledge base assistant
        </span>
      </div>
    </div>
  )
}