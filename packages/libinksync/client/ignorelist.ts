import fs from "fs";
import { INKSYNC_DIRECTORY_NAME } from "../constants";
import path from "path";

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

export function getIgnorePaths(ignoreFilename: string): string[] {
  const ignorePaths: string[] = [];
  if (fs.existsSync(ignoreFilename)) {
    const lines = fs.readFileSync(ignoreFilename).toString().split("\n");


    for (const line of lines) {
      if (line.startsWith("#")) {
        continue;
      }

      ignorePaths.push(line);
    }
  }

  if (ignorePaths.find((v) => v === ".conflict") === undefined) {
    ignorePaths.push(".conflict");
  }

  if (ignorePaths.find((v) => v === INKSYNC_DIRECTORY_NAME) === undefined) {
    ignorePaths.push(INKSYNC_DIRECTORY_NAME);
  }


  return ignorePaths;
}


export function readDirectoryRecursively(
  directoryPath: string,
  ignorePaths: string[],
  rootDir: string = directoryPath,
  relativeBase: string = ''
): string[] {
  // Get the relative path from the root directory
  const relativePath = relativeBase || '.';
  
  // Check if the directory itself is ignored
  if (isIgnored(relativePath, ignorePaths)) {
    return [];
  }

  const result: string[] = [];
  
  try {
    // Read the directory contents
    const entries = fs.readdirSync(directoryPath);
    
    // Process each entry in the directory
    for (const entry of entries) {
      const entryPath = path.join(directoryPath, entry);
      const relativeEntryPath = path.join(relativeBase, entry);
      
      // Skip if the entry is ignored (using relative path)
      if (isIgnored(relativeEntryPath, ignorePaths)) {
        continue;
      }
      
      const stats = fs.statSync(entryPath);
      
      if (stats.isDirectory()) {
        // Recursively process subdirectories
        const subDirFiles = readDirectoryRecursively(entryPath, ignorePaths, rootDir, relativeEntryPath);
        result.push(...subDirFiles);
      } else if (stats.isFile()) {
        // Add file to result
        result.push(entryPath);
      }
      // Ignore symlinks and other special files
    }
  } catch (error) {
    console.error(`Error reading directory ${directoryPath}:`, error);
  }
  
  return result;
}

