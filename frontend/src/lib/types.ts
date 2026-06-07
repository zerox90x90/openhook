export interface Endpoint {
  id: string
  default_status: number
  default_content: string
  default_content_type: string
  response_file_name: string
  response_file_type: string
  created_at: string
}

export interface RequestPayload {
  id: string
  endpoint_id: string
  method: string
  url: string
  path: string
  query: Record<string, string>
  headers: Record<string, string>
  body: string
  content_type: string
  ip: string
  country: string
  user_agent: string
  size: number
  unread: boolean
  created_at: string
}

export interface PaginatedRequests {
  items: RequestPayload[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

export const METHOD_COLORS: Record<string, string> = {
  GET: "bg-emerald-500/15 text-emerald-500 border-emerald-500/25",
  POST: "bg-blue-500/15 text-blue-500 border-blue-500/25",
  PUT: "bg-amber-500/15 text-amber-500 border-amber-500/25",
  PATCH: "bg-orange-500/15 text-orange-500 border-orange-500/25",
  DELETE: "bg-red-500/15 text-red-500 border-red-500/25",
  HEAD: "bg-zinc-500/15 text-zinc-400 border-zinc-500/25",
  OPTIONS: "bg-purple-500/15 text-purple-500 border-purple-500/25",
}

export function getMethodColor(method: string): string {
  return METHOD_COLORS[method.toUpperCase()] || "bg-zinc-500/15 text-zinc-400 border-zinc-500/25"
}

export function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr + (dateStr.includes('Z') || dateStr.includes('+') ? '' : 'Z'))
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 5) return "just now"
  if (diffSec < 60) return `${diffSec}s ago`
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHour < 24) return `${diffHour}h ago`
  return `${diffDay}d ago`
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1)
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
}

export function formatLocalDate(dateStr: string): string {
  const date = new Date(dateStr + (dateStr.includes('Z') || dateStr.includes('+') ? '' : 'Z'))
  return date.toLocaleString()
}
