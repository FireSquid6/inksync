# use the official Bun image
# see all versions at https://hub.docker.com/r/oven/bun/tags
FROM oven/bun:1 AS base

# setup app
RUN mkdir -p /codebase
COPY . /codebase
WORKDIR /codebase
RUN bun install --frozen-lockfile

EXPOSE 3120/tcp
ENTRYPOINT ["bun", "run", "packages/server/main.ts"]
