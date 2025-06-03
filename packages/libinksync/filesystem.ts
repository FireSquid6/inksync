import path from "path";
import fs from "fs";
export interface Filesystem {
  readFrom(filepath: string): Promise<Blob>;
  writeTo(filepath: string, data: string | Blob | ArrayBuffer): Promise<void>;
  remove(filepath: string): Promise<void>;
  exists(filepath: string): Promise<boolean>;
  sizeOf(filepath: string): Promise<number>;  // size in bytes
  listdir(filepath: string, recursive?: boolean): Promise<string[]>;
  isDir(filepath: string): Promise<boolean>;
  copyTo(src: string, dest: string): Promise<void>;
  mkdir(dirpath: string): Promise<void>;

  // return the filepath given by the server
  // uploadFile(filepath: string): Promise<string>;
  // downloadFile(url: string, filepath: string): Promise<string>;
}

// all reads and writes are encrypted
// this should ONLY be used on the client. Server should just read from a directory
//
// Does NOT encrypt filepath names. Just their contents.
//
// This encrypts the files on the server, NOT the client. 
// TODO!
export class EncryptedFilesystem implements Filesystem {
  private key: string;
  private fs: DirectoryFilesystem;

  constructor(root: string, key: string) {
    this.key = key;
    this.fs = new DirectoryFilesystem(root);
  }

  // encrypt for reads to be sent to the server
  async readFrom(filepath: string): Promise<Blob> {

  }
  // decrupt for writes to be put on the user's drive
  async writeTo(filepath: string, data: string | Blob | ArrayBuffer): Promise<void> {

  }
  async remove(filepath: string): Promise<void> {

  }
  exists(filepath: string): Promise<boolean> {
    return this.fs.exists(filepath);
  }
  sizeOf(filepath: string): Promise<number> {
    return this.fs.sizeOf(filepath);
  }
  listdir(filepath: string, recursive?: boolean): Promise<string[]> {
    return this.fs.listdir(filepath, recursive);
  }
  isDir(filepath: string): Promise<boolean> {
    return this.fs.isDir(filepath)
  }
  copyTo(src: string, dest: string): Promise<void> {
    return this.fs.copyTo(src, dest);
  }
  mkdir(dirpath: string): Promise<void> {
    return this.fs.mkdir(dirpath);
  }
}

export class DirectoryFilesystem implements Filesystem {
  private root: string;
  constructor(root: string) {
    this.root = root;
    fs.mkdirSync(root, { recursive: true });
  }

  async mkdir(dirpath: string) {
    fs.mkdirSync(dirpath, { recursive: true });
  }

  async readFrom(filepath: string): Promise<Blob> {
    const fp = path.join(this.root, filepath);
    const buffer = fs.readFileSync(fp);
    return new Blob([buffer]);
  }

  async writeTo(filepath: string, data: string | Blob | ArrayBuffer): Promise<void> {
    const fp = path.join(this.root, filepath);
    const dir = path.dirname(fp);

    fs.mkdirSync(dir, { recursive: true });

    if (data instanceof ArrayBuffer) {
      const buffer = Buffer.from(data);
      fs.writeFileSync(fp, buffer);
      return;
    }

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
    if (!fs.existsSync(filepath)) {
      return 0;
    }
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

  async copyTo(src: string, dest: string): Promise<void> {
    const srcFp = path.join(this.root, src);
    const destFp = path.join(this.root, dest);

    fs.cpSync(srcFp, destFp);
  }
}


