import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { streamSSE } from 'hono/streaming'
import type { Env, RequestRow } from './types'
import { toPayload } from './types'
import endpoints from './routes/endpoints'
import requests from './routes/requests'
import webhook from './routes/webhook'

const app = new Hono<{ Bindings: Env }>()

app.use('*', logger())

app.use('/api/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
  maxAge: 86400,
}))

app.get('/api/endpoints/:endpointId/stream', async (c) => {
  const endpointId = c.req.param('endpointId')
  let lastSeenId = c.req.query('last_id') || c.req.header('Last-Event-ID') || ''
  let queryCount = 0

  return streamSSE(c, async (stream) => {
    while (!stream.aborted && queryCount < 40) {
      const result = await c.env.DB.prepare(
        'SELECT * FROM requests WHERE endpoint_id = ? AND (? = \'\' OR id > ?) ORDER BY created_at ASC LIMIT 20'
      ).bind(endpointId, lastSeenId, lastSeenId).all<RequestRow>()

      queryCount++

      for (const row of result.results) {
        if (stream.aborted) return
        const payload = toPayload(row)
        await stream.writeSSE({
          event: 'request.created',
          data: JSON.stringify(payload),
          id: row.id,
        })
        lastSeenId = row.id
      }

      await stream.sleep(3000)
    }

    if (!stream.aborted) {
      await stream.writeSSE({
        event: 'ping',
        data: JSON.stringify({ reconnect: true }),
      })
    }
  }, async (err) => {
    console.error('SSE error:', err)
  })
})

const routes = app
  .route('/api/endpoints', endpoints)
  .route('/api/endpoints', requests)
  .route('/hooks', webhook)

app.onError((err, c) => {
  console.error('Unhandled error:', err)
  return c.json({ error: 'internal server error' }, 500)
})

const assetCache: Record<string, string> = {}

async function resolveAssetKey(kv: KVNamespace, key: string): Promise<string> {
  if (assetCache[key]) return assetCache[key]

  const manifest: Record<string, string> | undefined = (globalThis as any).__STATIC_CONTENT_MANIFEST
  if (manifest && manifest[key]) {
    assetCache[key] = manifest[key]
    return manifest[key]
  }

  const prefix = key === 'index.html' ? 'index.' : key.replace(/\.([^.]+)$/, '.$1')
  if (!assetCache['index.html']) {
    const list = await kv.list()
    for (const k of list.keys) {
      if (k.name.startsWith('index.') && k.name.endsWith('.html')) {
        assetCache['index.html'] = k.name
      }
      const base = k.name.replace(/\.[a-f0-9]+\./, '.')
      assetCache[base] = k.name
    }
  }

  return assetCache[key] || key
}

app.notFound(async (c) => {
  try {
    const url = new URL(c.req.url)
    const key = url.pathname.slice(1) || 'index.html'
    const assetKey = await resolveAssetKey(c.env.__STATIC_CONTENT, key)
    const value = await c.env.__STATIC_CONTENT.get(assetKey, { type: 'arrayBuffer' })

    if (!value) {
      const fallback = await resolveAssetKey(c.env.__STATIC_CONTENT, 'index.html')
      const html = await c.env.__STATIC_CONTENT.get(fallback, { type: 'arrayBuffer' })
      if (html) return new Response(html, { headers: { 'Content-Type': 'text/html' } })
      return c.json({ error: 'not found' }, 404)
    }

    const ext = key.split('.').pop() || ''
    const types: Record<string, string> = {
      html: 'text/html', js: 'application/javascript', css: 'text/css',
      json: 'application/json', png: 'image/png', svg: 'image/svg+xml',
      ico: 'image/x-icon', woff2: 'font/woff2', woff: 'font/woff',
    }
    return new Response(value, {
      headers: { 'Content-Type': types[ext] || 'application/octet-stream' },
    })
  } catch (e) {
    return c.json({ error: 'not found', detail: String(e) }, 404)
  }
})

export default app
export type AppType = typeof routes
