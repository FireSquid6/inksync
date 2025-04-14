import fs from "fs";
import path from "path";

export async function getBlobPath(filepath: string, blobsDirectory: string): Promise<string> {
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
  
  while (fs.existsSync(blobPath)) {
    const text = fs.readFileSync(blobPath);

    // we already have this file compressed. Don't need to keep looking
    if (text === compressed) {
      return blobPath;
    }

    collisionIndex += 1;
    blobPath = path.join(blobsDirectory, `blobs-${collisionIndex}`, hash);
  }

  fs.mkdirSync(path.dirname(blobPath), { recursive: true });
  fs.writeFileSync(blobPath, compressed);

  return blobPath;
}

interface TreeNode {
  filepath: string;
  blobPath: string;
}

export async function makeNewTree(filepaths: string[], blobsDirectory: string): Promise<TreeNode[]> {
  return Promise.all(filepaths.map(async (filepath): Promise<TreeNode> => {
    return {
      filepath,
      blobPath: await getBlobPath(filepath, blobsDirectory),
    }
  }));
}

