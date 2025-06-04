export function wrapError(message: string, error: unknown): Error {
  return new Error(`${message}: ${error}`)

}
