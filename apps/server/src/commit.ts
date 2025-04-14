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

export function getFilepathsInDirectory(rootDirectory: string, ignorePaths: string[], ignoreRelativeTo: string | undefined): string[] {
  if (ignoreRelativeTo === undefined) {
    ignoreRelativeTo = rootDirectory;
  }

  const filepaths: string[] = []

  const childPaths = fs.readdirSync(rootDirectory);

  for (const childPath of childPaths) {
    const filepath = path.join(rootDirectory, childPath);

    const relativePath = getRelativePath(filepath, ignoreRelativeTo);

    // we don't want to use the absolute filepath
    if (isIgnored(childPath, ignorePaths)) {
      continue;
    }

    if (fs.statSync(filepath).isDirectory() === true) {
      const subpaths = getFilepathsInDirectory(filepath, ignorePaths, ignoreRelativeTo);
      subpaths.map((subpath) => {
        filepaths.push(subpath);
      });
    } else {
      filepaths.push(filepath);
    }
  }

  return filepaths;

}

export function isIgnored(filepath: string, ignorePaths: string[]): boolean {
  // Normalize the filepath to use forward slashes
  const normalizedPath = filepath.replace(/\\/g, '/');
  
  // Track whether the path should be ignored
  let ignored = false;
  
  for (const pattern of ignorePaths) {
    // Skip empty lines and comments
    if (!pattern || pattern.startsWith('#')) {
      continue;
    }
    
    // Check for negation pattern
    const isNegated = pattern.startsWith('!');
    const cleanPattern = isNegated ? pattern.slice(1) : pattern;
    
    // Convert gitignore pattern to regex
    let regexPattern = cleanPattern
      // Escape special regex characters except those used in gitignore
      .replace(/[.+^$|()[\]{}]/g, '\\$&')
      // Convert gitignore ** to regex
      .replace(/\*\*/g, '.*')
      // Convert gitignore * to regex (but not matching /)
      .replace(/\*/g, '[^/]*')
      // Convert gitignore ? to regex (but not matching /)
      .replace(/\?/g, '[^/]');
    
    // Handle directory-only patterns (ending with /)
    if (regexPattern.endsWith('/')) {
      regexPattern = `${regexPattern}.*`;
    }
    
    // Handle patterns with no slashes (match in any directory)
    if (!cleanPattern.includes('/')) {
      regexPattern = `(^|.*/+)${regexPattern}`;
    } else if (cleanPattern.startsWith('/')) {
      // Handle patterns starting with / (anchored to root)
      regexPattern = `^${regexPattern.slice(1)}`;
    }
    
    // Create regex and test the filepath
    const regex = new RegExp(regexPattern);
    const matches = regex.test(normalizedPath);
    
    if (matches) {
      // If it's a negation pattern, mark as not-ignored
      // Otherwise mark as ignored
      ignored = !isNegated;
    }
  }
  
  return ignored;
}

export function getRelativePath(absoluteFilepath: string, relativeDir: string): string {
  // Normalize paths to use forward slashes
  const normalizedAbsolute = absoluteFilepath.replace(/\\/g, '/');
  const normalizedRelative = relativeDir.replace(/\\/g, '/');
  
  // Ensure paths end without trailing slash for consistent comparison
  const absPath = normalizedAbsolute.endsWith('/') 
    ? normalizedAbsolute.slice(0, -1) 
    : normalizedAbsolute;
    
  const relPath = normalizedRelative.endsWith('/') 
    ? normalizedRelative.slice(0, -1) 
    : normalizedRelative;
  
  // Check if the absolute path starts with the relative directory
  if (!absPath.startsWith(relPath)) {
    throw new Error(`Cannot create relative path: ${absoluteFilepath} is not within ${relativeDir}`);
  }
  
  // Extract the relative portion
  let relativePortion = absPath.slice(relPath.length);
  
  // Remove leading slash if present
  if (relativePortion.startsWith('/')) {
    relativePortion = relativePortion.slice(1);
  }
  
  // Return empty string for the directory itself
  return relativePortion || '.';
}
