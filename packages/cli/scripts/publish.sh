#!/usr/bin/env bash


cd "$(dirname "$0")" || exit
cd ..

bun run build
npm publish --access public

