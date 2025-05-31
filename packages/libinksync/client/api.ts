// functions in Api should always return an error rather than failing

import type { SuccessfulUpdate } from "../server";
import type { Update } from "../store";

// only returns the happy path!
// throws errors when things g owrong
export interface VaultApi {
  getName(): string;
  ping(): Promise<string>;
  updatesSince(time: number): Promise<Update[]>;
  uploadFile(filepath: string, currentHash: string, file: File | "DELETE"): Promise<SuccessfulUpdate>;
  getFile(filepath: string): Promise<"DELETED" | "NON-EXISTANT" | ArrayBuffer>; 

  // TODO
  getFileStream(filepath: string): Promise<"DELETED" | "NON-EXISTANT" | ReadableStream>;
  getUpdate(filepath: string): Promise<"UNTRACKED" | Update>;
}

