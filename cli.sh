#!/usr/bin/env bash


DIRECTORY="$(dirname "$0")"

bun run "$DIRECTORY/apps/server/src/main.ts" "$@"
