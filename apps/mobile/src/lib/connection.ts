import { VaultClient, type SyncResult } from "libinksync";
import { atom, useAtom, useAtomValue } from "jotai";
import path from "path";
import { randomUUID } from "crypto";
import { MobileFilesystem } from "./filesystem";
import { Directory } from "@capacitor/filesystem";
import { getMobileSqlite } from "./store";
import { atomWithStorage } from "jotai/utils";
import { promises } from "dns";

export interface Connection {
  id: string,
  vaultName: string,
  syncDirectory: string,
  address: string,
  lastSync?: {
    results: [string, SyncResult][],
    overall: "good" | "bad",
    time: Date,
  },
  status: ConnectionStatus,
}

export type ConnectionStatus = "synced" | "conflict" | "error" | "behind";

export function getConnectionWithId(id: string, connections: Connection[], syncing: Record<string, boolean>): [Connection | null, boolean] {
  const connection = connections.find((c) => c.id === id);

  let isSyncing = false;

  if (connection !== undefined) {
    isSyncing = syncing[connection.id] ?? false;
  }

  return [connection ?? null, isSyncing];
}

export function useConnectionWithId(id: string) {
  const connections = useAtomValue(connectionsAtom);
  const isSyncing = useAtomValue(isSyncingAtom);

  const connection = getConnectionWithId(id, connections, isSyncing);
  return connection;
}


export function useSyncAll(): () => Promise<void> {
  const [connections, setConnections] = useAtom(connectionsAtom);
  const [isSyncing, setIsSyncing] = useAtom(isSyncingAtom);

  const setSyncing = (connectionId: string, n: boolean) => {
    let newIsSyncing = { ...isSyncing };
    newIsSyncing[connectionId] = n;
    setIsSyncing(newIsSyncing);
  }

  return async () => {
    await Promise.all(connections.map(async (connection) => {
      setSyncing(connection.id, true);

      const newConnection = await syncConnection(connection);

      const newConnections = connections.filter((c) => c.id !== newConnection.id);
      newConnections.push(newConnection);
      setConnections(newConnections);

      setSyncing(connection.id, false);
    }));
  }
}

export function makeConnection(address: string, vaultName: string, directoryName: string): Connection {
  const directory = path.join("inksync-vaults", directoryName);
  const id = randomUUID()

  return {
    id,
    vaultName,
    syncDirectory: directory,
    address,
    status: "behind",
  }
}

export async function getClientFromConnection(connection: Connection): Promise<VaultClient> {
  const fs = new MobileFilesystem(connection.syncDirectory, Directory.Documents);
  const store = await getMobileSqlite(connection.address, connection.vaultName);
  return new VaultClient(connection.address, store, fs, connection.vaultName);
}

export function useSyncConnection(connectionId: string): () => Promise<void> {
  const [connections, setConnections] = useAtom(connectionsAtom);

  return async () => {
    const connection = connections.find((c) => c.id === connectionId);
    if (!connection) {
      return;
    }

    const newConnection = await syncConnection(connection);

    const newConnections = connections.filter((c) => c.id !== newConnection.id);
    newConnections.push(newConnection);
    setConnections(newConnections);
  }
}

export function useSetIsSyncing(connectionId: string): (b: boolean) => void {
  const [isSyncing, setIsSyncing] = useAtom(isSyncingAtom);

  return (n: boolean) => {
    let newIsSyncing = { ...isSyncing };
    newIsSyncing[connectionId] = n;
    setIsSyncing(newIsSyncing);
  }
}

export async function syncConnection(connection: Connection): Promise<Connection> {
  const client = await getClientFromConnection(connection);

  const newConnection = { ...connection };

  const results = await client.syncAll();
  let overall: "good" | "bad" = "good";
  let time = new Date();

  for (const [_, result] of results) {
    if (result.domain === "bad") {
      overall = "bad";
    }
  }

  newConnection.lastSync = {
    time,
    overall,
    results,
  }

  return newConnection;
}

export async function syncConnections(connection: Connection[]): Promise<Connection[]> {
  return await Promise.all(connection.map(async (c) => await syncConnection(c)));
}

export const connectionsAtom = atomWithStorage<Connection[]>("connections", []);

export const isSyncingAtom = atom<Record<string, boolean>>({});
