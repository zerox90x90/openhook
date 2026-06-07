import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Check, Copy, WrapText } from "lucide-react"
import { cn } from "@/lib/utils"

interface BodyViewerProps {
  body: string
  contentType: string
}

function tryParseJson(text: string): string | null {
  try {
    const parsed = JSON.parse(text)
    return JSON.stringify(parsed, null, 2)
  } catch {
    return null
  }
}

export function BodyViewer({ body, contentType }: BodyViewerProps) {
  const [copied, setCopied] = useState(false)
  const [wrap, setWrap] = useState(true)

  const copyBody = useCallback(async () => {
    await navigator.clipboard.writeText(body)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [body])

  if (!body) {
    return <div className="py-3 text-sm text-muted-foreground text-center">No body content</div>
  }

  const prettyJson = tryParseJson(body)
  const isJson = contentType.includes("json") || prettyJson !== null
  const isForm = contentType.includes("form-data") || contentType.includes("urlencoded")

  const renderRaw = () => (
    <pre
      className={cn(
        "text-xs font-mono p-3 rounded-md bg-muted/50 overflow-auto max-h-[400px]",
        wrap ? "whitespace-pre-wrap break-all" : "whitespace-pre"
      )}
    >
      {body}
    </pre>
  )

  const renderJson = () => (
    <pre
      className={cn(
        "text-xs font-mono p-3 rounded-md bg-muted/50 overflow-auto max-h-[400px]",
        wrap ? "whitespace-pre-wrap break-all" : "whitespace-pre"
      )}
    >
      {prettyJson || body}
    </pre>
  )

  const renderForm = () => {
    try {
      const params = new URLSearchParams(body)
      const entries = Array.from(params.entries())
      return (
        <div className="text-xs font-mono p-3 rounded-md bg-muted/50 overflow-auto max-h-[400px]">
          {entries.map(([key, value], i) => (
            <div key={i} className="flex gap-2 py-0.5">
              <span className="text-muted-foreground">{key}:</span>
              <span className="break-all">{value || <span className="text-muted-foreground">(empty)</span>}</span>
            </div>
          ))}
          {entries.length === 0 && <span className="text-muted-foreground">No form data</span>}
        </div>
      )
    } catch {
      return renderRaw()
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Button size="sm" variant="ghost" onClick={copyBody} className="h-7 text-xs">
          {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setWrap(!wrap)}
          className={cn("h-7 text-xs", wrap && "text-primary")}
        >
          <WrapText className="h-3 w-3" />
          Wrap
        </Button>
      </div>

      {(isJson || isForm) ? (
        <Tabs defaultValue={isJson ? "json" : "form"}>
          <TabsList className="h-7">
            <TabsTrigger value="raw" className="text-xs h-5">Raw</TabsTrigger>
            {isJson && <TabsTrigger value="json" className="text-xs h-5">JSON</TabsTrigger>}
            {isForm && <TabsTrigger value="form" className="text-xs h-5">Form</TabsTrigger>}
          </TabsList>
          <TabsContent value="raw">{renderRaw()}</TabsContent>
          {isJson && <TabsContent value="json">{renderJson()}</TabsContent>}
          {isForm && <TabsContent value="form">{renderForm()}</TabsContent>}
        </Tabs>
      ) : (
        renderRaw()
      )}
    </div>
  )
}
