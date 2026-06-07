#!/usr/bin/env bash
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo "${CYAN}"
echo "  ___                    ____ _               _ "
echo " / _ \ _ __   ___ _ __ / ___| |__   ___  ___| | __"
echo "| | | | '_ \ / _ \ '_ \ |   | '_ \ / _ \/ __| |/ /"
echo "| |_| | |_) |  __/ | | | |___| | | |  __/ (__|   < "
echo " \___/| .__/ \___|_| |_|\____|_| |_|\___|\___|_|\_\ "
echo "      |_|                                            "
echo "${NC}"
echo "${GREEN}OpenHook - One-Click Cloudflare Deploy${NC}"
echo ""

command -v npx >/dev/null 2>&1 || { echo "${RED}Error: npx is required. Install Node.js first.${NC}"; exit 1; }

echo "${YELLOW}[1/5] Creating D1 database...${NC}"
DB_OUTPUT=$(npx wrangler d1 create openhook-db 2>&1) || true
DB_ID=$(echo "$DB_OUTPUT" | grep -oE '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' | head -1)

if [ -z "$DB_ID" ]; then
  echo "${RED}Failed to create D1 database. Output:${NC}"
  echo "$DB_OUTPUT"
  exit 1
fi
echo "${GREEN}  Created database: $DB_ID${NC}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "${YELLOW}[2/5] Updating wrangler.toml with database ID...${NC}"
if [[ "$OSTYPE" == "darwin"* ]]; then
  sed -i '' "s/{{D1_DATABASE_ID}}/$DB_ID/g" "$SCRIPT_DIR/wrangler.toml"
else
  sed -i "s/{{D1_DATABASE_ID}}/$DB_ID/g" "$SCRIPT_DIR/wrangler.toml"
fi
echo "${GREEN}  Done${NC}"

echo "${YELLOW}[3/5] Installing dependencies...${NC}"
npm install --prefix "$SCRIPT_DIR" 2>&1 | tail -1
echo "${GREEN}  Done${NC}"

echo "${YELLOW}[4/5] Building frontend...${NC}"
npx vite build --config "$SCRIPT_DIR/frontend/vite.config.ts" 2>&1 | tail -1
echo "${GREEN}  Done${NC}"

echo "${YELLOW}[5/5] Creating tables and deploying...${NC}"
npx wrangler d1 execute openhook-db --remote --command="CREATE TABLE IF NOT EXISTS endpoints (id TEXT PRIMARY KEY, default_status INTEGER NOT NULL DEFAULT 200, default_content TEXT NOT NULL DEFAULT 'OK', default_content_type TEXT NOT NULL DEFAULT 'text/plain', response_file TEXT DEFAULT '', response_file_name TEXT DEFAULT '', response_file_type TEXT DEFAULT '', created_at TEXT NOT NULL DEFAULT (datetime('now')));" 2>&1 | tail -1

npx wrangler d1 execute openhook-db --remote --command="CREATE TABLE IF NOT EXISTS requests (id TEXT PRIMARY KEY, endpoint_id TEXT NOT NULL, method TEXT NOT NULL, url TEXT NOT NULL, path TEXT NOT NULL DEFAULT '/', query TEXT NOT NULL DEFAULT '{}', headers TEXT NOT NULL DEFAULT '{}', body TEXT NOT NULL DEFAULT '', content_type TEXT NOT NULL DEFAULT '', ip TEXT NOT NULL DEFAULT '', country TEXT NOT NULL DEFAULT '', user_agent TEXT NOT NULL DEFAULT '', size INTEGER NOT NULL DEFAULT 0, unread INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT (datetime('now')), FOREIGN KEY (endpoint_id) REFERENCES endpoints(id) ON DELETE CASCADE);" 2>&1 | tail -1

npx wrangler d1 execute openhook-db --remote --command="CREATE INDEX IF NOT EXISTS idx_requests_endpoint_created ON requests(endpoint_id, created_at DESC);" 2>&1 | tail -1

npx wrangler d1 execute openhook-db --remote --command="CREATE INDEX IF NOT EXISTS idx_requests_unread ON requests(endpoint_id, unread);" 2>&1 | tail -1

DEPLOY_OUTPUT=$(npx wrangler publish 2>&1) || true
DEPLOY_URL=$(echo "$DEPLOY_OUTPUT" | grep -oE 'https://[a-z0-9-]+\.[a-z0-9-]+\.workers\.dev' | head -1)

echo ""
if [ -n "$DEPLOY_URL" ]; then
  echo "${GREEN}========================================${NC}"
  echo "${GREEN}  Deployed successfully!${NC}"
  echo "${GREEN}  URL: $DEPLOY_URL${NC}"
  echo "${GREEN}========================================${NC}"
else
  echo "${YELLOW}Deploy output:${NC}"
  echo "$DEPLOY_OUTPUT"
fi
