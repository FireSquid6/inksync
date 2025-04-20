export function compressFile(content: string): string {
  const data = Bun.gzipSync(content).toString();
  const b64 = atob(data);
  return b64;
}

export function decompressFile(base64: string): string {
  const data = btoa(base64);
  const decompressed = Bun.gunzipSync(data).toString();
  return decompressed;
}
