import { Connection, ConnectionStatus } from "../lib/connection";

export function ConnectionButton({ connection, status }: { connection: Connection, status: ConnectionStatus }) {
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
            <p>Status: {status}</p>
          </div>
        </div>
        <div className="flex flex-row gap-3">
          <button
            className="btn btn-primary btn-outline"
          >
            Details
          </button>
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

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}
