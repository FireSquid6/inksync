import { type Filesystem as InksyncFilesystem } from "libinksync";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import path from "path";

export class MobileFilesystem implements InksyncFilesystem {
  private rootPath: string;
  private dir: Directory;


  constructor(rootPath: string, directory: Directory) {
    this.rootPath = rootPath;
    this.dir = directory;
  }
  async readFrom(filepath: string): Promise<Blob> {
    const fp = path.join(this.rootPath, filepath);
    const { data } = await Filesystem.readFile({
      path: fp,
      directory: this.dir,
    });

    if (typeof data === "string") {
      const blob = new Blob([data]);
      return blob;
    } else {
      return data;
    }
  }
  async writeTo(filepath: string, data: string | Blob | ArrayBuffer): Promise<void> {
    const fp = path.join(this.rootPath, filepath);
    const stringData = data.toString();
    console.log("Writing:");
    console.log(stringData);

    await Filesystem.writeFile({
      path: fp,
      directory: this.dir,
      data: stringData,
      recursive: true,
      encoding: Encoding.UTF8,
    });
  }
  async remove(filepath: string): Promise<void> {
    const fp = path.join(this.rootPath, filepath);

    await Filesystem.deleteFile({
      path: fp,
      directory: this.dir,
    })
  }
  async exists(filepath: string): Promise<boolean> {
    const fp = path.join(this.rootPath, filepath);

    try {
      // think this is how it works?
      // TODO - test this
      await Filesystem.stat({
        directory: this.dir,
        path: fp,
      });
      return true;
    } catch (e) {
      return false;
    }
  }
  async sizeOf(filepath: string): Promise<number> {
    const fp = path.join(this.rootPath, filepath);

    const res = await Filesystem.stat({
      directory: this.dir,
      path: fp,
    });

    return res.size;
  } 
  async listdir(filepath: string, recursive?: boolean): Promise<string[]> {
    if (recursive === true) {
      throw new Error("mobile filesystem does not support recursive searching");
    }
    const fp = path.join(this.rootPath, filepath);
    const { files } = await Filesystem.readdir({
      path: fp,
      directory: this.dir,
    })

    return files.map((f) => f.name);
  }
  async isDir(filepath: string): Promise<boolean> {
    const fp = path.join(this.rootPath, filepath);

    const res = await Filesystem.stat({
      directory: this.dir,
      path: fp,
    });

    return res.type === "directory";
  }
  async copyTo(src: string, dest: string): Promise<void> {
    const srcFp = path.join(this.rootPath, src);
    const destPath = path.join(this.rootPath, dest);

    await Filesystem.copy({
      from: srcFp,
      to: destPath,
      directory: this.dir,
    })

  }
  async mkdir(dirpath: string): Promise<void> {
    const fp = path.join(this.rootPath, dirpath);

    await Filesystem.mkdir({
      directory: this.dir,
      path: fp,
      recursive: true,
    });
  }

}
