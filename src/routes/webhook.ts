import { Hono } from 'hono'
import type { Env, EndpointRow } from '../types'
import { captureHeaders, captureQuery, captureBody } from '../lib/capture'
import { nanoid } from 'nanoid/non-secure'

const app = new Hono<{ Bindings: Env }>()

app.all('/:endpointId/:path{.+}', async (c) => {
  const endpointId = c.req.param('endpointId')
  const path = '/' + c.req.param('path')
  return handleWebhook(c, endpointId, path)
})

app.all('/:endpointId', async (c) => {
  return handleWebhook(c, c.req.param('endpointId'), '/')
})

async function handleWebhook(
  c: { env: Env; req: any; json: (body: unknown, status: number) => Response },
  endpointId: string,
  path: string
) {
  const endpoint = await c.env.DB.prepare(
    'SELECT * FROM endpoints WHERE id = ?'
  ).bind(endpointId).first<EndpointRow>()

  if (!endpoint) {
    return c.json({ error: 'endpoint not found' }, 404)
  }

  const raw = c.req.raw as Request
  const requestId = nanoid()
  const body = await captureBody(raw)
  const headers = captureHeaders(raw)
  const url = new URL(raw.url)
  const query = captureQuery(url)

  await c.env.DB.prepare(
    `INSERT INTO requests (id, endpoint_id, method, url, path, query, headers, body, content_type, ip, country, user_agent, size)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    requestId,
    endpointId,
    c.req.method,
    url.origin + url.pathname + url.search,
    path,
    JSON.stringify(query),
    JSON.stringify(headers),
    body,
    raw.headers.get('content-type') || '',
    raw.headers.get('cf-connecting-ip') || '',
    (raw as any).cf?.country || '',
    raw.headers.get('user-agent') || '',
    body.length
  ).run()

  let overrideStatus: number | undefined
  const segments = path.split('/').filter(Boolean)
  if (segments.length === 1 && /^\d{3}$/.test(segments[0])) {
    overrideStatus = parseInt(segments[0], 10)
  }

  if (endpoint.response_file) {
    const binaryString = atob(endpoint.response_file)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return new Response(bytes, {
      status: overrideStatus ?? endpoint.default_status,
      headers: {
        'Content-Type': endpoint.response_file_type || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${endpoint.response_file_name}"`,
      },
    })
  }

  return new Response(endpoint.default_content, {
    status: overrideStatus ?? endpoint.default_status,
    headers: { 'Content-Type': endpoint.default_content_type },
  })
}

export default app
