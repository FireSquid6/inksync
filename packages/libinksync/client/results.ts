export interface Success {
  type: "success";
  filepath: string;
}

export interface Conflict {
  type: "conflict";
  filepath: string;
  conflictFilepath: string;
}

export interface Outdated {
  type: "outdated";
  filepath: string;
}

export interface ServerError {
  type: "server-error";
  error: unknown;
}

export interface Unauthenticated {
  type: "unauthenticated";
}

export interface ClientError {
  type: "client-error";
  error: unknown;
}

export interface InSync {
  type: "in-sync"
}

export type SyncResult = 
  | Success
  | Conflict
  | Outdated
  | ServerError
  | Unauthenticated
  | ClientError
  | InSync
