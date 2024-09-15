FROM node:20-slim AS base

RUN corepack enable
COPY . /app
WORKDIR /app

RUN pnpm install --frozen-lockfile --production

EXPOSE 3000
ENTRYPOINT [ "pnpm", "start" ]
