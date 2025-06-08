import fs from "fs";

export function encodeFilepath(fp: string) {
  return btoa(fp);
}

export function decodeFilepath(fp: string) {
  return atob(fp);
}

export async function streamToString(stream: fs.ReadStream) {
  const chunks = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString("utf-8");
}
