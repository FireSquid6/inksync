import { createFileRoute, notFound } from '@tanstack/react-router'
import { StatusBadge, SyncResultItem, formatDate } from "../components/connection";
import { useConnectionWithId, useSetIsSyncing, useSyncConnection } from '../lib/connection';
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/$connection")({
  component: RouteComponent,
})

function RouteComponent() {
  const { connection: connectionId } = Route.useParams();

  const [connection, isSyncing] = useConnectionWithId(connectionId);
  const syncConnection = useSyncConnection(connectionId);
  const setIsSyncing = useSetIsSyncing(connectionId);

  if (connection === null) {
    return notFound();
  }

  const handleSync = async () => {
    setIsSyncing(true);
    await syncConnection();
    setIsSyncing(false);
  }

  const handleDelete = () => {
    console.log("Deleting...");
  }

  return (
    <div className="container">
      <div className="flex items-center p-4 bg-base-200 rounded-lg mb-4">
        <Link to="/" className="btn btn-ghost btn-sm mr-2">
          ← Back
        </Link>
        <h1 className="text-xl font-bold flex-1">
          {connection.vaultName}
        </h1>
        <StatusBadge status={connection.status} />
      </div>
      <div className="p-4">
        <div className="bg-base-100 p-4 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Connection Details</h2>

          <div className="mb-4">
            <div className="grid grid-cols-2 gap-y-2">
              <span className="font-medium">Vault Name:</span>
              <span>{connection.vaultName}</span>

              <span className="font-medium">Directory:</span>
              <span>{connection.syncDirectory}</span>

              <span className="font-medium">Address:</span>
              <span>{connection.address}</span>

              <span className="font-medium">Last Sync:</span>
              <span>{!connection.lastSync ? "Unsynced" : formatDate(connection.lastSync.time)}</span>

              <span className="font-medium">Status:</span>
              <span><StatusBadge status={connection.status} /></span>

              <span className="font-medium">Sync Result:</span>
              {!connection.lastSync ? (<span>No syncs.</span>) : (
                <span className={
                  connection.lastSync.overall === 'good' ? 'text-success' : 'text-error'
                }>
                  {connection.lastSync.overall === 'good' ? 'Success' : 'Failed'}
                </span>

              )}
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <button
              className="btn btn-primary flex-1"
              onClick={handleSync}
              disabled={isSyncing}
            >
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </button>
            <button
              className="btn btn-outline btn-error"
              onClick={handleDelete}
            >
              Delete
            </button>
          </div>
        </div>
        <div className="bg-base-100 p-4 rounded-lg shadow-sm mt-8">
          <h2 className="text-lg font-semibold mb-4">Sync Logs</h2>

          {connection.lastSync === undefined ? (
            <p>No syncs yet</p>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <div className={connection.lastSync.overall === 'good' ? 'text-success' : 'text-error'}>
                  <span className="font-medium">Last Sync: </span>
                  {connection.lastSync.overall === 'good' ? 'Successful' : 'Failed'}
                </div>
                <span className="text-sm opacity-70">
                  {formatDate(connection.lastSync.time)}
                </span>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {connection.lastSync.results.map(([filepath, result], i) => (
                  <SyncResultItem key={i} result={result} filepath={filepath} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
