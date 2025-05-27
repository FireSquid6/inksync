import type { Update } from "../store";
import { DELETED_HASH } from "../constants";

export interface SuccessfulUpdate {
  type: "success";
  time: number;
  newHash: string;
}

export interface FailedUpdate {
  type: "failure";
  reason: "Non-matching hash";
}

export type UpdateResult = SuccessfulUpdate | FailedUpdate

export interface Vault {
  pushUpdate(fileContents: Blob | "DELETE", filepath: string, currentHash: string): Promise<UpdateResult>;
  getCurrent(filepath: string): Promise<"DELETED" | "NON-EXISTANT" | Blob>;
  getUpdateFor(filepath: string): Promise<Update | null>;
  getUpdatesSince(time: number): Promise<Update[]>; 
  getName(): string;
  isAuthorized(token: string): Promise<boolean>;
}


export function hashBlob(blob: Blob | "DELETE"): string {
  if (blob === "DELETE") {
    return DELETED_HASH;
  }
  const hash = new Bun.CryptoHasher("sha256");
  hash.update(blob);
  return hash.digest("base64url");
}
