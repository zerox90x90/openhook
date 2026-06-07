import { Link2, Plus, Settings, Trash2, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import type { Endpoint } from "@/lib/types"
import { useState, useCallback } from "react"
import { ResponseSettings } from "@/components/response-settings"

interface EndpointHeaderProps {
  endpoint: Endpoint | null
  onNew: () => void
  onClear: () => void
  onUpdateEndpoint: (data: Partial<Pick<Endpoint, "default_status" | "default_content" | "default_content_type">>) => void
  onUploadFile: (file: File) => Promise<Endpoint | null>
  onDeleteFile: () => Promise<Endpoint | null>
}

export function EndpointHeader({ endpoint, onNew, onClear, onUpdateEndpoint, onUploadFile, onDeleteFile }: EndpointHeaderProps) {
  const [copied, setCopied] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const hookUrl = endpoint ? `${window.location.origin}/hooks/${endpoint.id}` : ""

  const copyUrl = useCallback(async () => {
    if (!hookUrl) return
    await navigator.clipboard.writeText(hookUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [hookUrl])

  return (
    <>
      <header className="flex items-center gap-3 border-b bg-card px-4 py-3">
        <div className="flex items-center gap-2">
          <Link2 className="h-5 w-5 text-primary" />
          <span className="text-lg font-bold tracking-tight">OpenHook</span>
        </div>

        <Separator orientation="vertical" className="h-6" />

        <div className="flex flex-1 items-center gap-2">
          <Input
            readOnly
            value={hookUrl}
            className="flex-1 font-mono text-sm bg-muted/50"
            onClick={copyUrl}
          />
          <Button size="sm" variant="outline" onClick={copyUrl}>
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        <Button size="sm" variant="outline" onClick={() => setSettingsOpen(true)}>
          <Settings className="h-3.5 w-3.5" />
          Response
        </Button>

        <Button size="sm" onClick={onNew}>
          <Plus className="h-3.5 w-3.5" />
          New URL
        </Button>

        <Button size="sm" variant="outline" onClick={onClear}>
          <Trash2 className="h-3.5 w-3.5" />
          Clear
        </Button>
      </header>

      {endpoint && (
        <ResponseSettings
          endpoint={endpoint}
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          onSave={onUpdateEndpoint}
          onUploadFile={onUploadFile}
          onDeleteFile={onDeleteFile}
        />
      )}
    </>
  )
}
