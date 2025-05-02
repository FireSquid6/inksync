import type { SyncResult } from "libinksync";
import { atom, useAtomValue } from "jotai";

export interface Connection {
  id: number,
  vaultName: string,
  syncDirectory: string,
  address: string,
  lastSync: {
    results: SyncResult[],
    overall: "good" | "bad",
    time: Date,
  },
  status: ConnectionStatus,
}

export interface ConnectionSyncResult {
  timeStarted: Date,
  syncResults: SyncResult[],
  overall: "good" | "bad",
}
export type ConnectionStatus = "syncing" | "connected" | "disconnected";


export function useConnectionWithId(id: number): Connection | null {
  const connections = useAtomValue(connectionsAtom);
  const connection = connections.find((c) => c.id === id);

  return connection ?? null;
}


export const connectionsAtom = atom<Connection[]>([
  {
    id: 1,
    vaultName: 'default',
    syncDirectory: '/Documents',
    address: 'localhost:1235',
    status: "syncing",
    lastSync: {
      time: new Date("2025-05-02T08:15:00"),
      overall: "good",
      results: [],
    },
  },
  {
    id: 2,
    vaultName: 'notes',
    syncDirectory: '/Home/Notes',
    address: 'myvault.example.com',
    status: "connected",
    lastSync: {
      time: new Date('2025-05-02T08:15:00'),
      overall: "bad",
      results: [],
    },
  },
  {
    id: 3,
    vaultName: 'work',
    syncDirectory: '/Work',
    address: '192.168.1.10:8080',
    status: "connected",
    lastSync: {
      time: new Date('2025-04-30T16:45:00'),
      overall: "bad",
      results: [],
    },
  },
])
