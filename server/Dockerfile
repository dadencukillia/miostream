FROM oven/bun:1.3.13-alpine AS base
WORKDIR /app

FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lock /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

RUN mkdir -p /temp/prod
COPY package.json bun.lock /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

FROM base AS release
COPY --from=install /temp/prod/node_modules ./node_modules
COPY package.json ./
COPY src/ ./src/

USER bun
EXPOSE 8080

ENTRYPOINT [ "bun", "serve" ]

