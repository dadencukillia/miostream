FROM oven/bun:1.4.4-alpine AS base
WORKDIR /app

FROM base AS install
WORKDIR /temp/prod
COPY package.json bun.lock ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile --production

FROM base AS prerelease
COPY package.json bun.lock ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile
COPY . .
ENV NODE_ENV=production
RUN bun run build

FROM base AS release
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=8080
USER bun

COPY --from=install /temp/prod/node_modules ./node_modules
COPY --from=prerelease /app/dist ./dist
COPY --from=prerelease /app/package.json .

EXPOSE 8080

CMD ["bun", "./dist/server/entry.mjs"]
