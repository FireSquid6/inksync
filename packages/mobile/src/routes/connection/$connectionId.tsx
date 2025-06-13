import { createFileRoute, Link } from '@tanstack/react-router'
import { useSyncableConnection } from '../../lib/state'
import { ConnectionDetail } from '../../components/ConnectionDetail'

export const Route = createFileRoute('/connection/$connectionId')({
  component: ConnectionDetailRoute,
})

function ConnectionDetailRoute() {
  const { connectionId } = Route.useParams()
  const syncableConnection = useSyncableConnection(connectionId)

  if (!syncableConnection.connection) {
    return (
      <div className="p-4">
        <div className="text-center text-gray-500 py-8">
          <p>Connection not found</p>
          <Link
            to="/"
            className="text-blue-500 hover:underline mt-2 inline-block"
          >
            Back to connections
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <Link
          to="/"
          className="text-blue-500 hover:underline"
        >
          ← Back to connections
        </Link>
      </div>
      <ConnectionDetail syncableConnection={syncableConnection} />
    </div>
  )
}
