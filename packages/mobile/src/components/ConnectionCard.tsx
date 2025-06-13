import { Link } from '@tanstack/react-router'
import type { Connection } from '../lib/connection'
import { useStatus } from '../lib/state'

interface ConnectionCardProps {
  connection: Connection
}

export function ConnectionCard({ connection }: ConnectionCardProps) {
  const { status } = useStatus(connection.id)

  if (status === null) {
    throw new Error("Tried to render a null status");
  }

  return (
    <Link
      to="/connections/$connectionId"
      params={{ connectionId: connection.id }}
      className="block"
    >
      <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">{connection.name}</h3>
            <p className="text-gray-600">{connection.address}</p>
          </div>
          <div className="flex items-center space-x-2">
            {status?.currentlySyncing && (
              <span className="text-blue-500 text-sm">Syncing...</span>
            )}
            <div className={`w-3 h-3 rounded-full ${
              status?.currentlySyncing 
                ? 'bg-blue-500' 
                : status?.syncs.length === 0 
                  ? 'bg-gray-400'
                  : status.syncs[status.syncs.length - 1]?.type === 'good'
                    ? 'bg-green-500'
                    : 'bg-red-500'
            }`} />
          </div>
        </div>
        {status && status.syncs.length > 0 && (
          <div className="mt-2 text-sm text-gray-500">
            Last sync: {new Date(status.syncs[status.syncs.length - 1].time).toLocaleString()}
          </div>
        )}
      </div>
    </Link>
  )
}
