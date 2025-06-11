import path from "path";
import fs from "fs";
import ncrypt from "ncrypt-js";

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

// Wraps an existing filesystem to encrypt all reads and decrypts all writes
//
// this should be used on the client in cases where the server is untrustworthy
// (i.e. using google drive as a storage medium)
export class EncryptedFilesystem implements Filesystem {
  private fs: Filesystem;
  private crypt: ncrypt

  constructor(fs: Filesystem, key: string) {
    this.fs = fs;
    this.crypt = new ncrypt(key);
  }

  // encrypt for reads to be sent to the server
  async readFrom(filepath: string): Promise<Blob> {
    // ridiculous async code
    const blob = await this.fs.readFrom(filepath);
    const text = await blob.text();

    const encrypted = this.crypt.encrypt(text);

    return new Blob([encrypted]);
  }
  // decrupt for writes to be put on the user's drive
  async writeTo(filepath: string, data: string | Blob | ArrayBuffer): Promise<void> {
    const text = data.toString();
    const decrypted = this.crypt.decrypt(text);

    if (typeof decrypted !== "string") {
      throw new Error("Got non-string when decrypting text");
    }

    return await this.fs.writeTo(filepath, decrypted);
  }
  remove(filepath: string): Promise<void> {
    return this.fs.remove(filepath);
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
    const fp = path.join(this.root, filepath);
    const stats = fs.statSync(fp);
    if (!fs.existsSync(filepath)) {
      return 0;
    }
    
    if (stats.isDirectory()) {
      const files = fs.readdirSync(filepath);
      let size = 0;

      for (const file of files) {
        size += await this.sizeOf(path.join(filepath, file));
      }
      return size;
    } else {
      return stats.size;
    }
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


