export interface Pushed {
  domain: "good";
  type: "pushed";
}

export interface Pulled {
  domain: "good";
  type: "pulled";
}

export interface Conflict {
  domain: "good"
  type: "conflict";
  conflictFile: string;
}

export interface BadSync {
  domain: "bad"
  type: "bad-sync";
}

export interface ServerError {
  domain: "bad"
  type: "server-error";
  error: unknown;
}

export interface ClientError {
  domain: "bad"
  type: "client-error";
  error: unknown;
}

export interface InSync {
  domain: "good"
  type: "in-sync";
}

export type SyncResult = 
  | Pushed
  | Pulled
  | Conflict
  | BadSync
  | ServerError
  | ClientError
  | InSync
