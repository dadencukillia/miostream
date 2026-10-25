FROM oven/bun:1.3.13-alpine AS base
WORKDIR /app

FROM base AS install
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

FROM base AS release
COPY --from=install /app/node_modules ./node_modules
COPY package.json ./
COPY src/ ./src/
COPY db/migrations ./db/migrations/

USER bun
EXPOSE 8080

ENTRYPOINT ["bun", "serve"]
