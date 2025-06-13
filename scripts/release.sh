#!/usr/bin/env bash


VERSION=$1

cd "$(dirname "$0")" || exit 1
cd .. || exit 1

if [ -z "$VERSION" ]; then
  echo "No version. Exiting"
  exit 1
fi


git tag -a "$VERSION" -m "Release version $VERSION"
git push origin tag "$VERSION"

./scripts/build-cli.ts

gh release create "$VERSION" --generate-notes 
gh release upload ./packages/cli/build/*
