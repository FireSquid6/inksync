import { createFileRoute, Link } from '@tanstack/react-router'
import { useConnections } from '../lib/state'
import { ConnectionCard } from '../components/ConnectionCard'

export const Route = createFileRoute('/')({
  component: ConnectionsListRoute,
})

function ConnectionsListRoute() {
  const { connections } = useConnections()

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Connections</h1>
        <Link
          to="/new"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Add Connection
        </Link>
      </div>

      {connections.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <p>No connections configured</p>
          <Link
            to="/new"
            className="text-blue-500 hover:underline mt-2 inline-block"
          >
            Create your first connection
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {connections.map((connection) => (
            <ConnectionCard key={connection.id} connection={connection} />
          ))}
        </div>
      )}
    </div>
  )
}
