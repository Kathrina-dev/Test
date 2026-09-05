# syntax=docker/dockerfile:1

# ============================================================
# Stage 1 — build the Next.js frontend and compile backend deps
# ============================================================
FROM node:22-alpine AS builder
# better-sqlite3 needs a toolchain to compile its native addon.
RUN apk add --no-cache python3 make g++
WORKDIR /app

# Backend production dependencies (native module compiled here).
COPY backend/package.json backend/package-lock.json ./backend/
# RUN cd backend && npm ci --omit=dev
RUN cd backend && npm_config_build_from_source=false npm ci --omit=dev

# Frontend: install all deps, then build.
COPY my-app/package.json my-app/package-lock.json ./my-app/
RUN cd my-app && npm ci
COPY my-app ./my-app
RUN cd my-app && npm run build

# Frontend production-only dependencies (no native builds needed here).
RUN cd my-app && npm ci --omit=dev

# ============================================================
# Stage 2 — lean runtime image running both services
# ============================================================
FROM node:22-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app

# Backend (source + prebuilt node_modules from the builder).
COPY backend/package.json backend/index.js ./backend/
COPY backend/routes ./backend/routes
COPY backend/controllers ./backend/controllers
COPY --from=builder /app/backend/node_modules ./backend/node_modules

# Frontend (built output + production deps + config + static assets).
COPY my-app/package.json my-app/next.config.ts ./my-app/
COPY --from=builder /app/my-app/node_modules ./my-app/node_modules
COPY --from=builder /app/my-app/.next ./my-app/.next
COPY my-app/public ./my-app/public

COPY start.sh ./start.sh
RUN chmod +x ./start.sh

# Only the frontend port is exposed; it proxies /api to the backend internally.
EXPOSE 3000
CMD ["./start.sh"]
