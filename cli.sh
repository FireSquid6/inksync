#!/usr/bin/env bash


DIRECTORY="$(dirname "$0")"
echo $DIRECTORY

bun run "$DIRECTORY/apps/server/src/index.ts" "$@"
