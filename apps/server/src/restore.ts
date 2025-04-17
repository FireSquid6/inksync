import path from "path";
import fs from "fs";
import { treeSchema, type Tree, type TreeNode } from ".";
import { getTreeFilename } from "./commit";
import { BLOBS_DIRECTORY_NAME, DELETED_BLOB_PATH, INKSYNC_DIRECTORY_NAME, TREES_DIRECTORY_NAME } from "./constants";

export function restoreTreeIndex(index: number, rootDirectory: string) {
  const treeDirectory = path.join(rootDirectory, INKSYNC_DIRECTORY_NAME, TREES_DIRECTORY_NAME);

  const tree = readTree(treeDirectory, index);

  if (tree === null) {
    throw new Error(`Tree of index ${index} does not exist.`);
  }

  restoreTree(rootDirectory, tree);
   
}


export function readTree(treeDirectory: string, index: number): Tree | null {
  const filename = getTreeFilename(index);
  const filepath = path.join(treeDirectory, filename);

  if (!fs.existsSync(filepath)) {
    return null;
  }
  
  return treeSchema.parse(fs.readFileSync(filepath).toString());
}

export function restoreTree(rootDirectory: string, tree: Tree): void {
  for (const node of tree.nodes) {
    restoreNode(rootDirectory, node);
  }
}


// TODO - only overwrite the file if it needs to be
// Probably need to keep track of some sort of head pointer
export async function restoreNode(rootDirectory: string, node: TreeNode) {
  const fullPath = path.join(rootDirectory, node.filepath);
  if (node.blobPath === DELETED_BLOB_PATH) {
    if (fs.existsSync(fullPath)) {
      fs.rmSync(fullPath);
    }

    return;
  }

  const blobPath = path.join(rootDirectory, INKSYNC_DIRECTORY_NAME, BLOBS_DIRECTORY_NAME, node.blobPath);
  const blobFile = Bun.file(blobPath);
  const uncompressed = Bun.gunzipSync(await blobFile.text());
  
  fs.writeFileSync(fullPath, uncompressed);
}
