import { ScrollArea } from "@/components/ui/scroll-area"
import { RequestListItem } from "@/components/request-list-item"
import type { RequestPayload } from "@/lib/types"
import { Inbox } from "lucide-react"

interface RequestListProps {
  requests: RequestPayload[]
  selectedId: string | null
  onSelect: (request: RequestPayload) => void
  total: number
}

export function RequestList({ requests, selectedId, onSelect, total }: RequestListProps) {
  return (
    <div className="flex flex-col h-full border-r bg-card">
      <div className="flex items-center gap-2 px-3 py-2.5 border-b">
        <Inbox className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">
          Inbox{" "}
          <span className="text-muted-foreground">({total})</span>
        </span>
      </div>
      <ScrollArea className="flex-1">
        {requests.map((req) => (
          <RequestListItem
            key={req.id}
            request={req}
            isSelected={req.id === selectedId}
            onClick={() => onSelect(req)}
          />
        ))}
      </ScrollArea>
    </div>
  )
}
