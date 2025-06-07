# use the official Bun image
# see all versions at https://hub.docker.com/r/oven/bun/tags
FROM oven/bun:1 AS base

# setup app
RUN mkdir -p /codebase
COPY . /codebase
WORKDIR /codebase
RUN bun install --frozen-lockfile

USER bun
EXPOSE 3000/tcp

# run app
ENTRYPOINT ["bun", "run", "apps/server/main.ts"]
