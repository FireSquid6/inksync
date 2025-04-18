
const validTokens = ["token1", "token2"];

export function tokenIsValid(token: string): boolean {
  return validTokens.find((t) => t === token) !== undefined;
}
