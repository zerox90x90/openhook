import type { Endpoint, PaginatedRequests, RequestPayload } from "./types"

const BASE = ""

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const { headers: customHeaders, ...rest } = options || {}
  const res = await fetch(`${BASE}${path}`, {
    ...rest,
    headers: { "Content-Type": "application/json", ...customHeaders },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "request failed" }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  createEndpoint: () =>
    apiFetch<Endpoint>("/api/endpoints", { method: "POST" }),

  getEndpoint: (id: string) =>
    apiFetch<Endpoint>(`/api/endpoints/${id}`),

  updateEndpoint: (id: string, data: Partial<Pick<Endpoint, "default_status" | "default_content" | "default_content_type">>) =>
    apiFetch<Endpoint>(`/api/endpoints/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  uploadResponseFile: async (id: string, file: File) => {
    const formData = new FormData()
    formData.append("file", file)
    const res = await fetch(`/api/endpoints/${id}/file`, { method: "POST", body: formData })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "upload failed" }))
      throw new Error(err.error || `HTTP ${res.status}`)
    }
    return res.json() as Promise<Endpoint>
  },

  deleteResponseFile: (id: string) =>
    apiFetch<Endpoint>(`/api/endpoints/${id}/file`, { method: "DELETE" }),

  deleteEndpoint: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/endpoints/${id}`, { method: "DELETE" }),

  getRequests: (endpointId: string, page = 1, perPage = 50) =>
    apiFetch<PaginatedRequests>(`/api/endpoints/${endpointId}/requests?page=${page}&per_page=${perPage}`),

  getRequest: (endpointId: string, requestId: string) =>
    apiFetch<RequestPayload>(`/api/endpoints/${endpointId}/requests/${requestId}`),

  markRead: (endpointId: string, requestId: string) =>
    apiFetch<RequestPayload>(`/api/endpoints/${endpointId}/requests/${requestId}`, { method: "PATCH" }),

  clearRequests: (endpointId: string) =>
    apiFetch<{ ok: boolean }>(`/api/endpoints/${endpointId}/requests`, { method: "DELETE" }),

  deleteRequest: (endpointId: string, requestId: string) =>
    apiFetch<{ ok: boolean }>(`/api/endpoints/${endpointId}/requests/${requestId}`, { method: "DELETE" }),
}
