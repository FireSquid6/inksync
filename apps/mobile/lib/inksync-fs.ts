import { type Filesystem as InksyncFilesystem } from "libinksync";
import * as Filesystem from "expo-file-system";


// export class ExpoDirectory implements InksyncFilesystem {
//   constructor() {
//
//   }
//
//   async readFrom(filepath: string): Promise<Blob> {
//
//   }
//   async writeTo(filepath: string, data: string | Blob | ArrayBuffer): Promise<void> {
//
//   }
//   async remove(filepath: string): Promise<void> {
//
//   }
//   async exists(filepath: string): Promise<boolean> {}
//   async sizeOf(filepath: string): Promise<number>;  // size in byte {}
//   async listdir(filepath: string, recursive?: boolean): Promise<string[]> {}
//   async isDir(filepath: string): Promise<boolean> {}
//   async copyTo(src: string, dest: string): Promise<void> {}
//   async mkdir(dirpath: string): Promise<void> {}
// }
