import { useConnections, type ConnectionStatusHook } from '../lib/state'
import { SyncStatus } from './SyncStatus'

interface ConnectionDetailProps {
  syncableConnection: ConnectionStatusHook
}

export function ConnectionDetail({ syncableConnection }: ConnectionDetailProps) {
  const { removeConnection } = useConnections()
  const { connection, status, sync } = syncableConnection

  if (!connection || !status) {
    return <div>Connection not available</div>
  }

  const handleSync = async () => {
    await sync()
  }

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete the connection "${connection.name}"?`)) {
      removeConnection(connection.id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-4">{connection.name}</h1>
        
        <div className="grid grid-cols-1 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Server Address</label>
            <p className="text-gray-900">{connection.address}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Connection ID</label>
            <p className="text-gray-500 text-sm font-mono">{connection.id}</p>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleSync}
            disabled={status.currentlySyncing}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status.currentlySyncing ? 'Syncing...' : 'Sync Now'}
          </button>
          
          <button
            onClick={handleDelete}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Delete Connection
          </button>
        </div>
      </div>

      <SyncStatus status={status} />
    </div>
  )
}