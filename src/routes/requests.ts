import { Hono } from 'hono'
import type { Env, RequestRow, RequestPayload } from '../types'
import { toPayload } from '../types'

const app = new Hono<{ Bindings: Env }>()

app.get('/:endpointId/requests', async (c) => {
  const endpointId = c.req.param('endpointId')
  const page = Math.max(1, parseInt(c.req.query('page') || '1'))
  const perPage = Math.min(100, Math.max(1, parseInt(c.req.query('per_page') || '50')))
  const offset = (page - 1) * perPage

  const [countResult, rows] = await Promise.all([
    c.env.DB.prepare(
      'SELECT COUNT(*) as total FROM requests WHERE endpoint_id = ?'
    ).bind(endpointId).first<{ total: number }>(),
    c.env.DB.prepare(
      'SELECT * FROM requests WHERE endpoint_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
    ).bind(endpointId, perPage, offset).all<RequestRow>(),
  ])

  return c.json({
    items: (rows.results || []).map(toPayload),
    total: countResult?.total || 0,
    page,
    per_page: perPage,
    total_pages: Math.ceil((countResult?.total || 0) / perPage),
  })
})

app.get('/:endpointId/requests/:requestId', async (c) => {
  const requestId = c.req.param('requestId')
  const row = await c.env.DB.prepare(
    'SELECT * FROM requests WHERE id = ?'
  ).bind(requestId).first<RequestRow>()

  if (!row) return c.json({ error: 'not found' }, 404)
  return c.json(toPayload(row))
})

app.patch('/:endpointId/requests/:requestId', async (c) => {
  const requestId = c.req.param('requestId')
  await c.env.DB.prepare(
    'UPDATE requests SET unread = 0 WHERE id = ?'
  ).bind(requestId).run()

  const row = await c.env.DB.prepare(
    'SELECT * FROM requests WHERE id = ?'
  ).bind(requestId).first<RequestRow>()

  if (!row) return c.json({ error: 'not found' }, 404)
  return c.json(toPayload(row))
})

app.delete('/:endpointId/requests', async (c) => {
  const endpointId = c.req.param('endpointId')
  await c.env.DB.prepare(
    'DELETE FROM requests WHERE endpoint_id = ?'
  ).bind(endpointId).run()
  return c.json({ ok: true })
})

app.delete('/:endpointId/requests/:requestId', async (c) => {
  const requestId = c.req.param('requestId')
  const result = await c.env.DB.prepare(
    'DELETE FROM requests WHERE id = ?'
  ).bind(requestId).run()
  return c.json({ ok: true })
})

export default app
