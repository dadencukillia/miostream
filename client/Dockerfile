FROM oven/bun:1.3.13-alpine AS base
WORKDIR /app

FROM base AS install
RUN mkdir -p /temp/prod
COPY package.json bun.lock /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

FROM base AS prerelease
COPY --from=install /temp/prod/node_modules node_modules
COPY . .

ENV NODE_ENV=production
RUN bun run build

FROM base AS release
COPY --from=prerelease /app/dist ./dist
COPY --from=prerelease /app/package.json .

USER bun
EXPOSE 8080
ENV HOST=0.0.0.0
ENV PORT=8080

CMD [ "bun", "./dist/server/entry.mjs" ]
