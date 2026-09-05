#!/bin/sh
set -e

# Backend (internal, port 8080) — the Next.js server proxies /api/* to it.
node /app/backend/index.js &
BACKEND_PID=$!

# Frontend (exposed, port 3000).
cd /app/my-app
node_modules/.bin/next start -p 3000 &
FRONTEND_PID=$!

term() {
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
}
trap term TERM INT

# If either service exits, tear the whole container down so the orchestrator
# can restart it cleanly.
while kill -0 "$BACKEND_PID" 2>/dev/null && kill -0 "$FRONTEND_PID" 2>/dev/null; do
  sleep 2
done
term
exit 1
