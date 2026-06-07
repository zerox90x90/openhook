import { Activity, Zap } from "lucide-react"

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 p-8 text-center">
      <div className="relative">
        <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
          <Activity className="h-10 w-10 text-muted-foreground" />
        </div>
        <div className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-blue-500 animate-pulse" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Waiting for the first request</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Send a request to your unique URL above and it will appear here instantly.
          Try it with <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">curl</code>.
        </p>
      </div>
      <div className="rounded-lg bg-muted/50 p-4 w-full max-w-lg">
        <code className="text-xs font-mono text-muted-foreground block break-all">
          <span className="text-emerald-500">curl</span> -X POST {window.location.origin}/hooks/
          <span className="text-blue-500">YOUR_ID</span> \<br />
          &nbsp;&nbsp;-H "Content-Type: application/json" \<br />
          &nbsp;&nbsp;-d '&#123;"hello": "world"&#125;'
        </code>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Zap className="h-3 w-3" />
        <span>Real-time updates enabled</span>
      </div>
    </div>
  )
}
