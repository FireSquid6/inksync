import path from "path";
import fs from "fs";
import { INKSYNC_DIRECTORY_NAME, TABLE_NAME, TRACKERFILE_NAME } from "./constants";
import { trackerFileSchema, type Trackerfile } from ".";
import { Database } from "bun:sqlite";

// TODO - use compressed files and don't load the whole thing into memory?
export interface Tracker {
  getPathsUpdatedSince(time: number): Promise<string[]>;
  pushUpdate(filepath: string, contents: string): Promise<void>;
  getCurrentContent(filepath: string): Promise<string | null>;
}

// only used for the start. Forces you to actually
// make a new tracker for the server to use 
export function failingTracker(): Tracker {
  return {
    getPathsUpdatedSince(_: number): Promise<string[]> {
      throw new Error("Forgot to assign tracker");
    },
    pushUpdate(_1: string, _2: string): Promise<void> {
      throw new Error("Forgot to assign tracker");
    },
    getCurrentContent(_: string): Promise<string | null> {
      throw new Error("Forgot to assign tracker");
    },
  }
}


export function getDirectoryTracker(rootDirectory: string): Tracker {
  const filepath = getTrackerfilepath(rootDirectory);
  const db = new Database(filepath)


  db.query(`CREATE TABLE IF NOT EXISTS ${TABLE_NAME}(filepath TEXT PRIMARY KEY, last_updated DATETIME default current_timestamp);`).run()

  db.query(`INSERT INTO ${TABLE_NAME} (filepath, last_updated) VALUES ('hello.txt', 100)`).run();
  db.query(`INSERT INTO ${TABLE_NAME} (filepath, last_updated) VALUES ('goodbye.txt', 100)`).run();

  return {
    async getPathsUpdatedSince(time: number) {
      const result = db.query(`SELECT filepath, last_updated FROM ${TABLE_NAME} WHERE last_updated > ${time}`).all();

      const trackerfile = trackerFileSchema.parse(result);
      return trackerfile.map((t) => t.filepath);
    },
    async pushUpdate(relativePath: string, contents: string): Promise<void> {
      const filepath = path.join(rootDirectory, relativePath);
      const dirname = path.dirname(filepath);

      const time = Date.now();

      const result = db.query(`
        INSERT OR REPLACE INTO ${TABLE_NAME} (filepath, last_updated)
        VALUES (?, ?)
      `).run(relativePath, time);

      if (result.changes !== 1) {
        throw new Error(`Tried to push update for ${relativePath} but made ${result.changes} to the database`);
      }

      fs.mkdirSync(dirname, { recursive: true });
      fs.writeFileSync(filepath, contents);
    },
    async getCurrentContent(relativePath: string): Promise<string | null> {
      const filepath = path.join(rootDirectory, relativePath);
      if (fs.existsSync(filepath)) {
        const contents = fs.readFileSync(filepath).toString();

        return contents;
      }

      return null;
    },
  }
}


function getTrackerfilepath(rootDirectory: string) {
  const filepath = path.join(rootDirectory, INKSYNC_DIRECTORY_NAME, TRACKERFILE_NAME);
  const directory = path.dirname(filepath)

  fs.mkdirSync(directory, { recursive: true });

  return filepath
}
