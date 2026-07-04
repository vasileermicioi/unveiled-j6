# syntax=docker/dockerfile:1

FROM oven/bun:1 AS builder

WORKDIR /app

COPY package.json bun.lock ./
COPY apps/web/package.json ./apps/web/
COPY packages/config/package.json ./packages/config/

RUN bun install --frozen-lockfile

COPY . .

RUN bun run build

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/apps/web/dist ./dist

EXPOSE 3000

ENV PORT=3000

CMD ["node", "index.js"]
