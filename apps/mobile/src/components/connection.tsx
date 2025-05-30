import { type SyncResult } from "libinksync/client/results";
import { connectionsAtom, useConnectionMutators, type Connection, type ConnectionStatus } from "../lib/connection";
import { CgPushUp, CgPushDown, CgCheck, CgFileRemove } from "react-icons/cg";
import { TbDeviceIpadCancel } from "react-icons/tb";
import { LuServerOff } from "react-icons/lu";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { TextInput } from "./form";
import { useAtom } from "jotai";
import { v4 as uuid } from "uuid";

export function AddConnectionForm() {
  const [vaultName, setVaultName] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [directoryName, setDirectoryName] = useState<string>("");
  const [connections, setConnections] = useAtom(connectionsAtom);

  return (
      <div className="flex flex-col p-4">
        <div className="flex flex-row">
          <h2 className="text-2xl font-bold w-full">Add New Connection</h2>
        </div>
        <form className="py-4 mx-auto">
          <TextInput label="Address" state={address} onChange={setAddress} />
          <TextInput label="Vault Name" state={vaultName} onChange={setVaultName} />
          <TextInput label="Directory Name" state={directoryName} onChange={setDirectoryName} />
          <div className="flex flex-row w-full">
            <button 
              type="button"
              onClick={() => {
              const newConnections: Connection[] = [...connections, {
                id: uuid(),
                address,
                vaultName,
                syncDirectory: directoryName,
                status: "behind",
              }];
              setConnections(newConnections);
            }} className="btn btn-primary mt-16 ml-auto mr-4">Submit</button>
            <button 
              type="button"
              onClick={() => {
              setVaultName("");
              setAddress("");
              setDirectoryName("");
            }} className="btn mt-16 mr-auto ml-4">Reset</button>
          </div>
        </form>
      </div>
  )

}

export function ConnectionButton({ connection }: { connection: Connection }) {
  const { syncConnection, fetchConnection } = useConnectionMutators(connection.id);

  const onFetch = async () => {
    console.log("Fetch pressed")
    await fetchConnection();

  }
  const onSync = async () => {
    await syncConnection();
  }

  return (
    <div className="bg-base-100 rounded-lg shadow-sm mb-3 p-4">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-lg font-semibold">{connection.vaultName}</h2>
          <div className="text-sm text-gray-400">
            <p>Directory: {connection.syncDirectory}</p>
            <p>Address: {connection.address}</p>
            <p>Last sync: {!connection.lastSync ? "Unsynced" : formatDate(connection.lastSync.time)}</p>
            <p>Status: {connection.status}</p>
          </div>
        </div>
        <div className="flex flex-row gap-3">
          <Link
            to="/$connection"
            params={{
              connection: connection.id.toString(),
            }}
            className="btn btn-primary btn-outline"
          >
            Details
          </Link>
          <button
            className="btn btn-primary btn-outline"
            onClick={onFetch}
          >
            Fetch
          </button>
          <button
            className="btn btn-primary"
            onClick={onSync}
          >
            Sync
          </button>
        </div>
      </div>
    </div>
  )
}
export function StatusBadge({ status }: { status: ConnectionStatus }) {
  const classes: Record<ConnectionStatus, string> = {
    synced: "badge-success",
    error: "badge-error",
    conflict: "badge-warning",
    behind: "badge-warning",
  }

  return (
    <span className={`badge ${classes[status]}`}>
      {status}
    </span>
  );
}


export function SyncResultItem({ result, filepath }: { result: SyncResult, filepath: string }) {
  const syncResultMap: Record<string, React.ReactNode> = {
    "pushed": <CgPushUp />,
    "pulled": <CgPushDown />,
    "in-sync": <CgCheck />,
    "client-error": <TbDeviceIpadCancel />,
    "server-error": <LuServerOff />,
    "conflict": <CgFileRemove />
  }

  return (
    <p>
      <span>
        {syncResultMap[result.type]}
      </span>
      <span>
        {result.type}
      </span>
      <span>
        {filepath}
      </span>

    </p>
  )
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}
