import { MethodBadge } from "@/components/method-badge"
import { cn } from "@/lib/utils"
import { timeAgo } from "@/lib/types"
import type { RequestPayload } from "@/lib/types"

interface RequestListItemProps {
  request: RequestPayload
  isSelected: boolean
  onClick: () => void
}

export function RequestListItem({ request, isSelected, onClick }: RequestListItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-3 py-2.5 border-b transition-colors",
        isSelected
          ? "bg-accent border-l-2 border-l-primary"
          : request.unread
            ? "bg-primary/5 border-l-2 border-l-blue-500 hover:bg-muted/50"
            : "hover:bg-muted/50 border-l-2 border-l-transparent"
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        <MethodBadge method={request.method} />
        <span className="text-sm font-mono truncate flex-1">{request.path}</span>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="truncate">{request.ip}</span>
        <span className="shrink-0">{timeAgo(request.created_at)}</span>
      </div>
    </button>
  )
}
