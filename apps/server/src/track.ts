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



export function pushUpdate(rootDirectory: string, relativePath: string, newContent: string) {
  const filepath = path.join(rootDirectory, relativePath);

  updateTrackerfile(rootDirectory, [relativePath]);
  fs.writeFileSync(filepath, newContent);
}

// TOOD - use an sqlite database for the trackerfile
function updateTrackerfile(rootDirectory: string, relativePaths: string[]) {
  const fp = getTrackerfilepath(rootDirectory);
  const tf = getTrackerfile(rootDirectory);

  for (const p of relativePaths) {
    const i = tf.findIndex((v) => v.filepath === p);

    if (i === -1) {
      tf.push({
        filepath: p,
        lastUpdated: Date.now(),
      });
    }

    tf[i].lastUpdated = Date.now();
  }

}

export function getTrackerfile(rootDirectory: string): Trackerfile {
  const fp = getTrackerfilepath(rootDirectory);
  const contents = JSON.parse(fs.readFileSync(fp).toString());

  const trackerfile = trackerFileSchema.parse(contents);
  return trackerfile;
}

function getTrackerfilepath(rootDirectory: string) {
  const filepath = path.join(rootDirectory, INKSYNC_DIRECTORY_NAME, TRACKERFILE_NAME);
  const directory = path.dirname(filepath)

  fs.mkdirSync(directory, { recursive: true });

  return filepath
}
