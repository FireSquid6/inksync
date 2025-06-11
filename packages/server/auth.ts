
// this is deliberately a little slow. Is plenty fast for normal use, but will be too
// slow for someone trying to brute force a key
//
// did the math and assuming a key that's 32 chars long using lower, upper and numbers, and
// 1,000,000 requests per second (overestimate), it will take ~7e+32 years, which is about
// double the lifespan of the universe
export async function hasKey(key: string, keyfilePath: string): Promise<boolean> {
  const file = Bun.file(keyfilePath);

  if (!await file.exists()) {
    console.log("Keyfile path was not found! If you can't connect because of error: unauthorized, this is the reason!");
    return false;
  }

  const lines = (await file.text()).split(/\r?\n/);

  for (const line of lines) {
    if (line.startsWith("#")) {
      continue;
    }

    if (line === key) {
      return true;
    }
  }

  return false;
}
