import { useState, useEffect, useCallback, useRef } from "react"
import type { Endpoint, RequestPayload } from "@/lib/types"
import { api } from "@/lib/api"
import { EndpointHeader } from "@/components/endpoint-header"
import { RequestList } from "@/components/request-list"
import { RequestDetail } from "@/components/request-detail"
import { EmptyState } from "@/components/empty-state"

function App() {
  const [endpoint, setEndpoint] = useState<Endpoint | null>(null)
  const [requests, setRequests] = useState<RequestPayload[]>([])
  const [selectedRequest, setSelectedRequest] = useState<RequestPayload | null>(null)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastEventIdRef = useRef<string>("")

  const cleanupSSE = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
  }, [])

  const createNewEndpoint = useCallback(async () => {
    if (endpoint) {
      try { await api.deleteEndpoint(endpoint.id) } catch {}
    }
    try {
      const ep = await api.createEndpoint()
      setEndpoint(ep)
      setRequests([])
      setSelectedRequest(null)
      setTotal(0)
      lastEventIdRef.current = ""
    } catch (err) {
      console.error("Failed to create endpoint:", err)
    }
  }, [endpoint])

  const fetchRequests = useCallback(async () => {
    if (!endpoint) return
    try {
      const result = await api.getRequests(endpoint.id)
      setRequests(result.items)
      setTotal(result.total)
    } catch (err) {
      console.error("Failed to fetch requests:", err)
    }
  }, [endpoint])

  const connectSSE = useCallback(() => {
    if (!endpoint) return
    cleanupSSE()

    const params = new URLSearchParams()
    if (lastEventIdRef.current) {
      params.set("last_id", lastEventIdRef.current)
    }
    const url = `/api/endpoints/${endpoint.id}/stream?${params.toString()}`
    const es = new EventSource(url)
    eventSourceRef.current = es

    es.addEventListener("request.created", (event) => {
      try {
        const newReq: RequestPayload = JSON.parse(event.data)
        lastEventIdRef.current = newReq.id
        setRequests((prev) => {
          if (prev.some((r) => r.id === newReq.id)) return prev
          setTotal((t) => t + 1)
          return [newReq, ...prev]
        })
      } catch {}
    })

    es.addEventListener("ping", (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.reconnect) {
          es.close()
          reconnectTimerRef.current = setTimeout(connectSSE, 1000)
        }
      } catch {}
    })

    es.onerror = () => {
      es.close()
      reconnectTimerRef.current = setTimeout(connectSSE, 3000)
    }
  }, [endpoint, cleanupSSE])

  useEffect(() => {
    createNewEndpoint().then(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!endpoint) return
    fetchRequests()
    connectSSE()
    return cleanupSSE
  }, [endpoint, fetchRequests, connectSSE, cleanupSSE])

  useEffect(() => {
    if (!endpoint) return
    const interval = setInterval(fetchRequests, 15000)
    return () => clearInterval(interval)
  }, [endpoint, fetchRequests])

  const handleSelectRequest = useCallback(async (req: RequestPayload) => {
    setSelectedRequest({ ...req, unread: false })
    if (req.unread && endpoint) {
      try {
        await api.markRead(endpoint.id, req.id)
        setRequests((prev) =>
          prev.map((r) => (r.id === req.id ? { ...r, unread: false } : r))
        )
      } catch {}
    }
  }, [endpoint])

  const handleClear = useCallback(async () => {
    if (!endpoint) return
    try {
      await api.clearRequests(endpoint.id)
      setRequests([])
      setSelectedRequest(null)
      setTotal(0)
    } catch (err) {
      console.error("Failed to clear requests:", err)
    }
  }, [endpoint])

  const handleDeleteRequest = useCallback(async (requestId: string) => {
    if (!endpoint) return
    try {
      await api.deleteRequest(endpoint.id, requestId)
      setRequests((prev) => prev.filter((r) => r.id !== requestId))
      setTotal((t) => t - 1)
      setSelectedRequest((prev) => (prev?.id === requestId ? null : prev))
    } catch (err) {
      console.error("Failed to delete request:", err)
    }
  }, [endpoint])

  const handleUpdateEndpoint = useCallback(async (data: Partial<Pick<Endpoint, "default_status" | "default_content" | "default_content_type">>) => {
    if (!endpoint) return
    try {
      const updated = await api.updateEndpoint(endpoint.id, data)
      setEndpoint(updated)
    } catch (err) {
      console.error("Failed to update endpoint:", err)
    }
  }, [endpoint])

  const handleUploadFile = useCallback(async (file: File): Promise<Endpoint | null> => {
    if (!endpoint) return null
    try {
      const updated = await api.uploadResponseFile(endpoint.id, file)
      setEndpoint(updated)
      return updated
    } catch (err) {
      console.error("Failed to upload file:", err)
      return null
    }
  }, [endpoint])

  const handleDeleteFile = useCallback(async (): Promise<Endpoint | null> => {
    if (!endpoint) return null
    try {
      const updated = await api.deleteResponseFile(endpoint.id)
      setEndpoint(updated)
      return updated
    } catch (err) {
      console.error("Failed to delete file:", err)
      return null
    }
  }, [endpoint])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <EndpointHeader
        endpoint={endpoint}
        onNew={createNewEndpoint}
        onClear={handleClear}
        onUpdateEndpoint={handleUpdateEndpoint}
        onUploadFile={handleUploadFile}
        onDeleteFile={handleDeleteFile}
      />
      <div className="flex flex-1 overflow-hidden">
        <div className="w-80 shrink-0">
          <RequestList
            requests={requests}
            selectedId={selectedRequest?.id ?? null}
            onSelect={handleSelectRequest}
            total={total}
          />
        </div>
        <div className="flex-1 overflow-hidden">
          {selectedRequest ? (
            <RequestDetail request={selectedRequest} onDelete={handleDeleteRequest} />
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
    </div>
  )
}

export default App
