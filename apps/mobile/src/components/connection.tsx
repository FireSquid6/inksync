import { Connection } from "../lib/connection";

export function ConnectionButton({ connection }: { connection: Connection }) {
  return (
    <div className="bg-base-100 rounded-lg shadow-sm mb-3 p-4">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-lg font-semibold">{connection.vaultName}</h2>
          <div className="text-sm text-gray-400">
            <p>Directory: {connection.syncDirectory}</p>
            <p>Address: {connection.address}</p>
            <p>Last sync: {formatDate(connection.lastSync)}</p>
          </div>
        </div>
        <button
          className="btn btn-primary btn-outline"
        >
          View Details
        </button>
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
