# =============================================================================
# Stage 1: Build
# =============================================================================
FROM oven/bun:1.3.8-alpine AS builder

WORKDIR /build

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

RUN bun run build

# =============================================================================
# Stage 2: Runtime
# =============================================================================
FROM node:22-alpine AS runner

RUN apk add --no-cache mysql-client

WORKDIR /app

# App dist + node_modules (needed for seed.mjs's mysql2 import)
COPY --from=builder /build/dist ./dist
COPY --from=builder /build/node_modules ./node_modules

# SQL schema + seed script
COPY deploy/init.sql /app/init.sql
COPY deploy/seed.mjs /app/seed.mjs

COPY deploy/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 4323

ENTRYPOINT ["/entrypoint.sh"]
