# OpenHook

A free, open-source [webhook.site](https://webhook.site) clone built on Cloudflare Workers. Inspect any HTTP request in real-time — headers, body, query params, and more.

## Features

- **Instant webhook URLs** — create an endpoint, get a unique URL
- **Real-time inspection** — requests appear live via SSE
- **Request details** — method, headers, query params, body (raw/JSON/form-data)
- **Custom responses** — set status code, content type, response body
- **File responses** — upload a file to serve as the response
- **Status code override** — append `/201`, `/404`, etc. to the webhook URL
- **Single request delete** — remove individual requests or clear all
- **SPA with dark mode** — responsive two-panel layout with shadcn/ui

## Stack

- **Runtime:** Cloudflare Workers (Hono)
- **Frontend:** React + Vite + shadcn/ui + Tailwind CSS v4
- **Database:** Cloudflare D1 (SQLite, free tier)
- **Static assets:** Workers Sites (KV-backed)

## One-Click Deploy

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/zerox90x90/openhook)

This will fork the repo and deploy it to your Cloudflare account automatically.

## Manual Setup

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) (`npm install -g wrangler`)
- Cloudflare account (`wrangler login`)

### Steps

```bash
# Clone
git clone https://github.com/zerox90x90/openhook.git
cd openhook

# Install dependencies
npm install

# Create D1 database
wrangler d1 create openhook-db
# Copy the database_id from the output

# Update wrangler.toml — replace {{D1_DATABASE_ID}} with your database ID

# Create tables (run each command separately)
wrangler d1 execute openhook-db --remote --command="CREATE TABLE IF NOT EXISTS endpoints (id TEXT PRIMARY KEY, default_status INTEGER NOT NULL DEFAULT 200, default_content TEXT NOT NULL DEFAULT 'OK', default_content_type TEXT NOT NULL DEFAULT 'text/plain', response_file TEXT DEFAULT '', response_file_name TEXT DEFAULT '', response_file_type TEXT DEFAULT '', created_at TEXT NOT NULL DEFAULT (datetime('now')));"

wrangler d1 execute openhook-db --remote --command="CREATE TABLE IF NOT EXISTS requests (id TEXT PRIMARY KEY, endpoint_id TEXT NOT NULL, method TEXT NOT NULL, url TEXT NOT NULL, path TEXT NOT NULL DEFAULT '/', query TEXT NOT NULL DEFAULT '{}', headers TEXT NOT NULL DEFAULT '{}', body TEXT NOT NULL DEFAULT '', content_type TEXT NOT NULL DEFAULT '', ip TEXT NOT NULL DEFAULT '', country TEXT NOT NULL DEFAULT '', user_agent TEXT NOT NULL DEFAULT '', size INTEGER NOT NULL DEFAULT 0, unread INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT (datetime('now')), FOREIGN KEY (endpoint_id) REFERENCES endpoints(id) ON DELETE CASCADE);"

wrangler d1 execute openhook-db --remote --command="CREATE INDEX IF NOT EXISTS idx_requests_endpoint_created ON requests(endpoint_id, created_at DESC);"

wrangler d1 execute openhook-db --remote --command="CREATE INDEX IF NOT EXISTS idx_requests_unread ON requests(endpoint_id, unread);"

# Build frontend
npx vite build --config frontend/vite.config.ts

# Deploy
wrangler publish
```

### Or use the deploy script

```bash
./deploy.sh
```

This handles database creation, table setup, build, and deploy in one step.

## Usage

1. Open your deployed URL
2. A webhook endpoint is created automatically
3. Copy the URL from the header bar
4. Send any HTTP request to `https://your-worker.workers.dev/hooks/{endpoint-id}`
5. Watch requests appear in real-time
6. Click a request to inspect headers, body, query params
7. Use **Response Settings** to customize what the webhook returns
8. Append a status code to the URL for quick overrides: `/hooks/{id}/201`

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/endpoints` | Create endpoint |
| GET | `/api/endpoints/:id` | Get endpoint |
| PATCH | `/api/endpoints/:id` | Update response settings |
| DELETE | `/api/endpoints/:id` | Delete endpoint |
| POST | `/api/endpoints/:id/file` | Upload response file |
| DELETE | `/api/endpoints/:id/file` | Remove response file |
| GET | `/api/endpoints/:id/requests` | List requests (paginated) |
| GET | `/api/endpoints/:id/requests/:rid` | Get single request |
| PATCH | `/api/endpoints/:id/requests/:rid` | Mark request as read |
| DELETE | `/api/endpoints/:id/requests/:rid` | Delete single request |
| DELETE | `/api/endpoints/:id/requests` | Clear all requests |
| GET | `/api/endpoints/:id/stream` | SSE stream for real-time |
| ANY | `/hooks/:id[/:path]` | Webhook receiver |

## Local Development

```bash
npm run dev
```

This starts Vite on `:5173` (with API proxy) and Wrangler on `:8787`.

## License

MIT
