import type { ConnectionStatus } from '../lib/connection'

interface SyncStatusProps {
  status: ConnectionStatus
}

export function SyncStatus({ status }: SyncStatusProps) {
  return (
    <div className="bg-white border rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Sync Status</h2>
      
      {status.currentlySyncing && (
        <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
            <span className="text-blue-700">Currently syncing...</span>
          </div>
        </div>
      )}

      {status.syncs.length === 0 ? (
        <div className="text-gray-500 text-center py-4">
          No sync history available
        </div>
      ) : (
        <div className="space-y-3">
          <h3 className="font-medium">Recent Syncs</h3>
          {status.syncs.slice(-5).reverse().map((sync) => (
            <div key={sync.time} className={`p-3 rounded border ${
              sync.type === 'good' 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex justify-between items-start mb-2">
                <span className={`text-sm font-medium ${
                  sync.type === 'good' ? 'text-green-700' : 'text-red-700'
                }`}>
                  {sync.type === 'good' ? '✓ Success' : '✗ Issues Found'}
                </span>
                <span className="text-sm text-gray-500">
                  {new Date(sync.time).toLocaleString()}
                </span>
              </div>
              
              {sync.results.length > 0 && (
                <details className="text-sm">
                  <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                    {sync.results.length} file(s) processed
                  </summary>
                  <div className="mt-2 space-y-1">
                    {sync.results.map(([path, result], resultIndex) => (
                      <div key={resultIndex} className="pl-4 border-l-2 border-gray-200">
                        <div className="font-mono text-xs">{path}</div>
                        <div className={`text-xs ${
                          result.domain === 'good' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {result.domain === "good" ? "Success" : "Failure"}
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
