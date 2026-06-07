import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { KeyValueTable } from "@/components/key-value-table"
import { BodyViewer } from "@/components/body-viewer"
import { MethodBadge } from "@/components/method-badge"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { RequestPayload } from "@/lib/types"
import { formatBytes, formatLocalDate, timeAgo } from "@/lib/types"
import { ChevronDown, ChevronRight, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface RequestDetailProps {
  request: RequestPayload
  onDelete?: (requestId: string) => void
}

export function RequestDetail({ request, onDelete }: RequestDetailProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    meta: true,
    headers: true,
    query: true,
    body: true,
  })

  const toggle = (key: string) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))

  const chevron = (open: boolean) =>
    open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-4 space-y-1">
        <div className="flex items-center gap-3 mb-4">
          <MethodBadge method={request.method} />
          <span className="text-sm font-mono truncate flex-1">{request.url}</span>
          {request.country && (
            <Badge variant="secondary" className="text-xs">{request.country}</Badge>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(request.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        <Collapsible open={openSections.meta} onOpenChange={() => toggle("meta")}>
          <CollapsibleTrigger className="flex items-center gap-1.5 py-2 text-sm font-semibold w-full hover:text-primary transition-colors">
            {chevron(openSections.meta)}
            Request Details
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium text-xs w-32">Method</TableCell>
                  <TableCell className="text-xs"><MethodBadge method={request.method} /></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-xs">Host</TableCell>
                  <TableCell className="font-mono text-xs">{request.ip}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-xs">Date</TableCell>
                  <TableCell className="text-xs">
                    {formatLocalDate(request.created_at)}{" "}
                    <span className="text-muted-foreground">({timeAgo(request.created_at)})</span>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-xs">Size</TableCell>
                  <TableCell className="text-xs">{formatBytes(request.size)}</TableCell>
                </TableRow>
                {request.user_agent && (
                  <TableRow>
                    <TableCell className="font-medium text-xs">User-Agent</TableCell>
                    <TableCell className="font-mono text-xs break-all">{request.user_agent}</TableCell>
                  </TableRow>
                )}
                <TableRow>
                  <TableCell className="font-medium text-xs">Content-Type</TableCell>
                  <TableCell className="font-mono text-xs">{request.content_type || <span className="text-muted-foreground">(none)</span>}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-xs">ID</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{request.id}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        <Collapsible open={openSections.headers} onOpenChange={() => toggle("headers")}>
          <CollapsibleTrigger className="flex items-center gap-1.5 py-2 text-sm font-semibold w-full hover:text-primary transition-colors">
            {chevron(openSections.headers)}
            Headers{" "}
            <span className="text-xs font-normal text-muted-foreground">
              ({Object.keys(request.headers).length})
            </span>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <KeyValueTable data={request.headers} emptyMessage="No headers" />
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        <Collapsible open={openSections.query} onOpenChange={() => toggle("query")}>
          <CollapsibleTrigger className="flex items-center gap-1.5 py-2 text-sm font-semibold w-full hover:text-primary transition-colors">
            {chevron(openSections.query)}
            Query Parameters{" "}
            <span className="text-xs font-normal text-muted-foreground">
              ({Object.keys(request.query).length})
            </span>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <KeyValueTable data={request.query} emptyMessage="No query parameters" />
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        <Collapsible open={openSections.body} onOpenChange={() => toggle("body")}>
          <CollapsibleTrigger className="flex items-center gap-1.5 py-2 text-sm font-semibold w-full hover:text-primary transition-colors">
            {chevron(openSections.body)}
            Body
            {request.size > 0 && (
              <span className="text-xs font-normal text-muted-foreground">
                ({formatBytes(request.size)})
              </span>
            )}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <BodyViewer body={request.body} contentType={request.content_type} />
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  )
}
