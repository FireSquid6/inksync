import { SyncResult } from "libinksync";
import { Connection, ConnectionStatus } from "../lib/connection";
import { CgPushUp, CgPushDown, CgCheck, CgFileRemove } from "react-icons/cg";
import { TbDeviceIpadCancel } from "react-icons/tb";
import { LuServerOff } from "react-icons/lu";
import { Link } from "@tanstack/react-router";

export function ConnectionButton({ connection }: { connection: Connection }) {
  // TODO - change color for status
  return (
    <div className="bg-base-100 rounded-lg shadow-sm mb-3 p-4">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-lg font-semibold">{connection.vaultName}</h2>
          <div className="text-sm text-gray-400">
            <p>Directory: {connection.syncDirectory}</p>
            <p>Address: {connection.address}</p>
            <p>Last sync: {formatDate(connection.lastSync.time)}</p>
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
            className="btn btn-primary"
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
    connected: "badge-success",
    disconnected: "badge-error",
    syncing: "badge-warning",
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
