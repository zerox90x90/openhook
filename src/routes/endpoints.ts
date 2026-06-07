import { Hono } from 'hono'
import type { Env, EndpointRow } from '../types'
import { nanoid } from 'nanoid/non-secure'

const app = new Hono<{ Bindings: Env }>()

const FIELDS = 'id, default_status, default_content, default_content_type, response_file_name, response_file_type, created_at'

app.post('/', async (c) => {
  const id = nanoid(21)
  await c.env.DB.prepare(
    'INSERT INTO endpoints (id) VALUES (?)'
  ).bind(id).run()

  const row = await c.env.DB.prepare(
    `SELECT ${FIELDS} FROM endpoints WHERE id = ?`
  ).bind(id).first()

  return c.json(row, 201)
})

app.get('/:id', async (c) => {
  const id = c.req.param('id')
  const row = await c.env.DB.prepare(
    `SELECT ${FIELDS} FROM endpoints WHERE id = ?`
  ).bind(id).first()

  if (!row) return c.json({ error: 'not found' }, 404)
  return c.json(row)
})

app.patch('/:id', async (c) => {
  const id = c.req.param('id')
  const existing = await c.env.DB.prepare(
    `SELECT * FROM endpoints WHERE id = ?`
  ).bind(id).first<EndpointRow>()

  if (!existing) return c.json({ error: 'not found' }, 404)

  const body = await c.req.json<{
    default_status?: number
    default_content?: string
    default_content_type?: string
  }>()

  const status = body.default_status ?? existing.default_status
  const content = body.default_content ?? existing.default_content
  const contentType = body.default_content_type ?? existing.default_content_type

  await c.env.DB.prepare(
    'UPDATE endpoints SET default_status = ?, default_content = ?, default_content_type = ?, response_file = \'\', response_file_name = \'\', response_file_type = \'\' WHERE id = ?'
  ).bind(status, content, contentType, id).run()

  const updated = await c.env.DB.prepare(
    `SELECT ${FIELDS} FROM endpoints WHERE id = ?`
  ).bind(id).first()

  return c.json(updated)
})

app.post('/:id/file', async (c) => {
  const id = c.req.param('id')
  const existing = await c.env.DB.prepare(
    'SELECT id FROM endpoints WHERE id = ?'
  ).bind(id).first()

  if (!existing) return c.json({ error: 'not found' }, 404)

  const formData = await c.req.formData()
  const file = formData.get('file') as File | null

  if (!file) return c.json({ error: 'no file provided' }, 400)

  const MAX_FILE_SIZE = 1_500_000
  const arrayBuffer = await file.arrayBuffer()
  if (arrayBuffer.byteLength > MAX_FILE_SIZE) {
    return c.json({ error: 'file too large (max 1.5MB)' }, 400)
  }

  const bytes = new Uint8Array(arrayBuffer)
  let binary = ''
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize) as unknown as number[])
  }
  const base64 = btoa(binary)

  await c.env.DB.prepare(
    'UPDATE endpoints SET response_file = ?, response_file_name = ?, response_file_type = ?, default_content = \'\' WHERE id = ?'
  ).bind(base64, file.name, file.type, id).run()

  const updated = await c.env.DB.prepare(
    `SELECT ${FIELDS} FROM endpoints WHERE id = ?`
  ).bind(id).first()

  return c.json(updated)
})

app.delete('/:id/file', async (c) => {
  const id = c.req.param('id')
  const existing = await c.env.DB.prepare(
    'SELECT id FROM endpoints WHERE id = ?'
  ).bind(id).first()

  if (!existing) return c.json({ error: 'not found' }, 404)

  await c.env.DB.prepare(
    'UPDATE endpoints SET response_file = \'\', response_file_name = \'\', response_file_type = \'\' WHERE id = ?'
  ).bind(id).run()

  const updated = await c.env.DB.prepare(
    `SELECT ${FIELDS} FROM endpoints WHERE id = ?`
  ).bind(id).first()

  return c.json(updated)
})

app.delete('/:id', async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM requests WHERE endpoint_id = ?').bind(id).run()
  await c.env.DB.prepare('DELETE FROM endpoints WHERE id = ?').bind(id).run()
  return c.json({ ok: true })
})

export default app
