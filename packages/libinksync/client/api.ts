
// functions in Api should always return an error rather than failing

import type { Update } from "../store";

// if they fail to communicate with the server
export interface VaultApi {
  ping(): Promise<string | Error>;
  updatesSince(time: number): Promise<Update[] | Error>;
  uploadFile(filepath: string, currentHash: string, file: File | "DELETE"): Promise<Update[] | Error>;
  
  
}
