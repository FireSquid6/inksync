import { atom, useAtom, useAtomValue } from "jotai";
import { clientFromConnection, fillConnection, type Connection, type ConnectionStatus, type PartialConnection } from "./connection";

export const connectionsAtom = atom<Connection[]>([]);
export const statusAtom = atom<ConnectionStatus[]>([]);

export function useConnections() {
  const [connections, setConnections] = useAtom(connectionsAtom);
  const [statuses, setStatuses] = useAtom(statusAtom);

  const addConnection = (connection: PartialConnection) => {
    const full = fillConnection(connection)
    setConnections([...connections, full]);
    setStatuses([...statuses, { id: full.id, currentlySyncing: false, syncs: [] }]);
  }
  const removeConnection = (id: string) => {
    setConnections(connections.filter((c) => c.id !== id));
    setStatuses(statuses.filter((s) => s.id !== id));
  }

  return {
    connections,
    addConnection,
    removeConnection,
  }
}

export type ConnectionStatusHook =
  | {
    status: ConnectionStatus;
    connection: Connection;
    sync: () => void;
  }
  | {
    status: null,
    connection: null;
    sync: () => void;
  }

export function useStatus(id: string) {
  const [statuses, setStatuses] = useAtom(statusAtom);

  const status = statuses.find((s) => s.id === id);
  return {
    setStatus(status: ConnectionStatus) {
      setStatuses([...statuses.filter((s) => s.id !== id), status])
    },
    status: status ?? null,
  }
}

export function useSyncableConnection(id: string): ConnectionStatusHook {
  const connection = useAtomValue(connectionsAtom).find((c) => c.id === id);
  const { status, setStatus } = useStatus(id);

  if (!connection || !status) {
    return {
      status: null,
      connection: null,
      sync: () => { },
    }
  }

  const sync = async () => {
    setStatus({ ...status, currentlySyncing: true });
    const syncs = [...status.syncs];
    const client = await clientFromConnection(connection);

    const results = await client.syncAll();
    const type = results.find(([_, r]) => r.domain === "bad") === undefined ? "good" : "bad";
    

    syncs.push({
      results,
      time: Date.now(),
      type,
    });

    setStatus({
      id,
      currentlySyncing: false,
      syncs,
    });
  }

  return {
    status,
    connection,
    sync,
  }
}
