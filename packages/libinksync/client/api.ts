// functions in Api should always return an error rather than failing

import type { SuccessfulUpdate, Vault } from "../vault";
import type { Update } from "../store";

// only returns the happy path!
// throws errors when things g owrong
export interface VaultApi {
  getName(): string;
  getAddress(): string;
  ping(): Promise<string>;
  updatesSince(time: number): Promise<Update[]>;
  uploadFile(filepath: string, currentHash: string, file: File | "DELETE"): Promise<SuccessfulUpdate>;
  getFile(filepath: string): Promise<"DELETED" | "NON-EXISTANT" | ArrayBuffer>; 
  getUpdate(filepath: string): Promise<"UNTRACKED" | Update>;

  // TODO
  getFileStream(filepath: string): Promise<"DELETED" | "NON-EXISTANT" | ReadableStream>;
}


export function directApi(vault: Vault): VaultApi {
  return {
    getName() {
      return vault.getName();
    },
    getAddress() {
      return "local";
    },
    async ping() {
      return "pong!";
    },
    async updatesSince(time: number) {
     return await vault.getUpdatesSince(time);
    },
    async uploadFile(filepath: string, currentHash: string, file: File | "DELETE"): Promise<SuccessfulUpdate> {
      const result = await vault.pushUpdate(file, filepath, currentHash);

      if (result.type === "failure") {
        throw new Error(`Failed to upload file: ${result.reason}`);
      }

      return result;
    },
    async getUpdate(filepath: string): Promise<"UNTRACKED" | Update> {
      return await vault.getUpdateFor(filepath) ?? "UNTRACKED";
    },
    async getFileStream() {
      throw new Error("Not implemented");
    },
    async getFile(filepath: string) {
      const file = await vault.getCurrent(filepath);

      if (typeof file === "string") {
        return file;
      }

      return file.arrayBuffer();
    },
  }
}
