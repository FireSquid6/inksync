import fs from "fs";
import path from "path";

export async function newBlob(filepath: string, blobsDirectory: string) {
  const hasher = new Bun.CryptoHasher("sha256");
  const file = Bun.file(filepath);

  if (!file.exists()) {
    throw new Error(`Tried to hash ${filepath} but it does not exist`);
  }
  const compressed = Bun.gzipSync(await file.text());
  hasher.update(compressed);

  const hash = hasher.digest("base64");

  // we need to ensure there is no hash collision
  let collisionIndex = 0;
  let blobPath = path.join(blobsDirectory, `blobs-${collisionIndex}`, hash);
  
  while (!fs.existsSync(blobPath)) {
    collisionIndex += 1;
    blobPath = path.join(blobsDirectory, `blobs-${collisionIndex}`, hash);
  }

  fs.mkdirSync(path.dirname(blobPath), { recursive: true });
  fs.writeFileSync(blobPath, compressed);
}

export async function makeNewTree() {

}



export function hasExistingBlob(filepath: string, blobsDirectory: string) {
  
}
