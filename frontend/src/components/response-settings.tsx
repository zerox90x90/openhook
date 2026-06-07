import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { X, Upload, File, Trash2 } from "lucide-react"
import type { Endpoint } from "@/lib/types"
import { formatBytes } from "@/lib/types"

const STATUS_OPTIONS = [200, 201, 204, 301, 302, 400, 401, 403, 404, 500, 502, 503]

interface ResponseSettingsProps {
  endpoint: Endpoint
  open: boolean
  onClose: () => void
  onSave: (data: Partial<Pick<Endpoint, "default_status" | "default_content" | "default_content_type">>) => void
  onUploadFile: (file: File) => Promise<Endpoint | null>
  onDeleteFile: () => Promise<Endpoint | null>
}

export function ResponseSettings({ endpoint, open, onClose, onSave, onUploadFile, onDeleteFile }: ResponseSettingsProps) {
  const [status, setStatus] = useState(endpoint.default_status)
  const [content, setContent] = useState(endpoint.default_content)
  const [contentType, setContentType] = useState(endpoint.default_content_type)
  const [mode, setMode] = useState<"text" | "file">(endpoint.response_file_name ? "file" : "text")
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setStatus(endpoint.default_status)
    setContent(endpoint.default_content)
    setContentType(endpoint.default_content_type)
    setMode(endpoint.response_file_name ? "file" : "text")
  }, [endpoint])

  const handleFile = useCallback(async (file: File) => {
    setUploading(true)
    try {
      await onUploadFile(file)
    } catch (err) {
      console.error("Upload failed:", err)
    } finally {
      setUploading(false)
    }
  }, [onUploadFile])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOver(false)
  }, [])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleDeleteFile = useCallback(async () => {
    setDeleting(true)
    try {
      await onDeleteFile()
    } catch (err) {
      console.error("Delete failed:", err)
    } finally {
      setDeleting(false)
    }
  }, [onDeleteFile])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh]">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-50 w-full max-w-lg rounded-xl border bg-card p-0 shadow-lg">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-sm font-semibold">Response Settings</h2>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4 p-4 max-h-[65vh] overflow-y-auto">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Status Code</label>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_OPTIONS.map((code) => (
                <button
                  key={code}
                  onClick={() => setStatus(code)}
                  className={`rounded-md border px-2.5 py-1 text-xs font-mono transition-colors ${
                    status === code
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  {code}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-xs text-muted-foreground">Custom:</span>
              <Input
                type="number"
                min={100}
                max={599}
                value={status}
                onChange={(e) => setStatus(parseInt(e.target.value) || 200)}
                className="h-7 w-20 text-xs font-mono"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Response Type</label>
            <div className="flex gap-1.5">
              <button
                onClick={() => setMode("text")}
                className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${
                  mode === "text" ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted"
                }`}
              >
                Text / JSON
              </button>
              <button
                onClick={() => setMode("file")}
                className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${
                  mode === "file" ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted"
                }`}
              >
                File Upload
              </button>
            </div>
          </div>

          {mode === "text" ? (
            <>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Content-Type</label>
                <div className="flex flex-wrap gap-1.5">
                  {["text/plain", "application/json", "text/html", "text/xml", "application/xml"].map((ct) => (
                    <button
                      key={ct}
                      onClick={() => setContentType(ct)}
                      className={`rounded-md border px-2.5 py-1 text-[11px] font-mono transition-colors ${
                        contentType === ct
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      {ct}
                    </button>
                  ))}
                </div>
                <Input
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                  className="h-7 text-xs font-mono"
                  placeholder="custom/content-type"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Response Body</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={5}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                  placeholder="Response body content..."
                />
              </div>
            </>
          ) : (
            <div className="space-y-3">
              {endpoint.response_file_name ? (
                <div className="rounded-lg border bg-muted/30 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <File className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{endpoint.response_file_name}</p>
                      <p className="text-xs text-muted-foreground">{endpoint.response_file_type}</p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={handleDeleteFile}
                      disabled={deleting}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      <Upload className="h-3.5 w-3.5 mr-1.5" />
                      {uploading ? "Uploading..." : "Replace file"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors ${
                    dragOver
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/50 hover:bg-muted/30"
                  }`}
                >
                  <Upload className={`h-8 w-8 mb-3 ${dragOver ? "text-primary" : "text-muted-foreground"}`} />
                  <p className="text-sm font-medium">
                    {uploading ? "Uploading..." : "Drop a file here or click to upload"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Max 1.5 MB</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileInput}
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
          <Button size="sm" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            size="sm"
            onClick={async () => {
              if (mode === "text") {
                await onSave({ default_status: status, default_content: content, default_content_type: contentType })
              } else {
                await onSave({ default_status: status })
              }
              onClose()
            }}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}
