#!/usr/bin/env bash


DIRECTORY="$(dirname "$0")"

bun run "$DIRECTORY/packages/cli/index.ts" "$@"
