#!/usr/bin/env bash

VERSION=$1
IMAGE_NAME=firesquid/inksync:"$VERSION"

if [ -z "$1" ]; then
  echo "No version provided."
  exit 1
fi

echo "Buidling the image:"
docker build -t "$IMAGE_NAME" .

echo "Pusing the image:"
docker push "$IMAGE_NAME"

