import { VaultClient } from "libinksync/client";
import type { SyncResult } from "libinksync/client/results";
import { atom, useAtom, useAtomValue } from "jotai";
import path from "path";
import { randomUUID } from "crypto";
import { MobileFilesystem } from "./filesystem";
import { Directory } from "@capacitor/filesystem";
import { getMobileSqlite } from "./store";
import { atomWithStorage } from "jotai/utils";

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

export function useConnectionMutators(connectionId: string) {
  const [connections, setConnections] = useAtom(connectionsAtom);
  const [isSyncing, setIsSyncing] = useAtom(isSyncingAtom);

  const setIsSyncingFunction = (n: boolean) => {
    console.log("Setting is syncing to", n);
    let newIsSyncing = { ...isSyncing };
    newIsSyncing[connectionId] = n;
    setIsSyncing(newIsSyncing);
  }

  return {
    async syncConnection() {
      const connection = connections.find((c) => c.id === connectionId);
      if (!connection) {
        console.log("connection does not exist");
        return;
      }

      setIsSyncingFunction(true);

      try {
        console.log("Syncing...")
        const newConnection = await syncConnection(connection);
        const newConnections = connections.filter((c) => c.id !== newConnection.id);
        newConnections.push(newConnection);
        setConnections(newConnections);
        console.log("Success!")
      } catch (e) {

      } finally {
        setIsSyncingFunction(false);
      }
    },
    setIsSyncing(n: boolean) {
      setIsSyncingFunction(n);
    },
    deleteConnection() {
      const newConnections = connections.filter((c) => c.id !== connectionId);
      setConnections(newConnections);
    },
    async fetchConnection() {
      const connection = connections.find((c) => c.id === connectionId);
      if (!connection) {
        console.log("connection does not exist");
        return;
      }
      console.log("fetching for connection", connectionId);

      const newConnection = await fetchConnection(connection);
      const newConnections = connections.filter((c) => c.id !== newConnection.id);
      newConnections.push(newConnection);
      setConnections(newConnections);
    }
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

export async function fetchConnection(connection: Connection): Promise<Connection> {
  console.log("in the actual fetchConnecion function now")
  const client = await getClientFromConnection(connection);
  console.log("got client:", client);

  const newConnection = { ...connection };

  const results = await client.status();
  console.log("raw results:");
  console.log(results);

  return newConnection;
}

export async function syncConnections(connection: Connection[]): Promise<Connection[]> {
  return await Promise.all(connection.map(async (c) => await syncConnection(c)));
}

export const connectionsAtom = atomWithStorage<Connection[]>("connections", []);

export const isSyncingAtom = atom<Record<string, boolean>>({});
