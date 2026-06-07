export type Env = {
  DB: D1Database
  __STATIC_CONTENT: KVNamespace
}

export interface EndpointRow {
  id: string
  default_status: number
  default_content: string
  default_content_type: string
  response_file: string
  response_file_name: string
  response_file_type: string
  created_at: string
}

export interface RequestRow {
  id: string
  endpoint_id: string
  method: string
  url: string
  path: string
  query: string
  headers: string
  body: string
  content_type: string
  ip: string
  country: string
  user_agent: string
  size: number
  unread: number
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

export function toPayload(row: RequestRow): RequestPayload {
  return {
    id: row.id,
    endpoint_id: row.endpoint_id,
    method: row.method,
    url: row.url,
    path: row.path,
    query: JSON.parse(row.query || '{}'),
    headers: JSON.parse(row.headers || '{}'),
    body: row.body,
    content_type: row.content_type,
    ip: row.ip,
    country: row.country,
    user_agent: row.user_agent,
    size: row.size,
    unread: row.unread === 1,
    created_at: row.created_at,
  }
}
