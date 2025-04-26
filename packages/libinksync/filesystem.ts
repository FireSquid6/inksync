import path from "path";
import fs from "fs";

export interface Filesystem {
  readFrom(filepath: string): Promise<Blob>;
  writeTo(filepath: string, data: string | Blob): Promise<void>;
  remove(filepath: string): Promise<void>;
  exists(filepath: string): Promise<boolean>;
  sizeOf(filepath: string): Promise<number>;  // size in bytes
  listdir(filepath: string, recursive?: boolean): Promise<string[]>;
  isDir(filepath: string): Promise<boolean>;
}


export class DirectoryFilesystem implements Filesystem {
  private root: string;
  constructor(root: string) {
    this.root = root;
    fs.mkdirSync(root, { recursive: true });
  }

  async readFrom(filepath: string): Promise<Blob> {
    const fp = path.join(this.root, filepath);
    const buffer = fs.readFileSync(fp);
    return new Blob([buffer]);
  }

  async writeTo(filepath: string, data: string | Blob): Promise<void> {
    const fp = path.join(this.root, filepath);
    const dir = path.dirname(fp);
    
    fs.mkdirSync(dir, { recursive: true });

    if (typeof data === "string") {
      fs.writeFileSync(fp, data);
    } else {
      const buffer = Buffer.from(await data.arrayBuffer());
      fs.writeFileSync(fp, buffer);
    }
  }

  async remove(filepath: string): Promise<void> {
    const fp = path.join(this.root, filepath);
    fs.rmSync(fp);
  }

  async exists(filepath: string): Promise<boolean> {
    const fp = path.join(this.root, filepath);
    return fs.existsSync(fp);
  }

  async sizeOf(filepath: string): Promise<number> {
    const fp = path.join(this.root, filepath);
    const stats = fs.statSync(fp);
    return stats.size;
  }

  async listdir(filepath: string, recursive: boolean = false): Promise<string[]> {
    const fp = path.join(this.root, filepath);
    const dirs = fs.readdirSync(fp, { recursive: recursive });
    return dirs.map((d) => typeof d === "string" ? d : d.toString());
  }
  async isDir(filepath: string): Promise<boolean> {
    const fp = path.join(this.root, filepath);
    const stats = fs.statSync(fp);
    return stats.isDirectory();
  }
}
