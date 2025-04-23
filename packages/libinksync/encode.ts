
export function encodeFilepath(fp: string) {
  return btoa(fp);
}

export function decodeFilepath(fp: string) {
  return atob(fp);
}
