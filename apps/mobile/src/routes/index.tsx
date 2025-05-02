import { createFileRoute } from '@tanstack/react-router'
import { usePromise } from '../lib/async';
import { getAllConnections } from '../lib/connection';
import { ConnectionButton } from '../components/connection';

export const Route = createFileRoute('/')({
  component: RouteComponent,
})

function TopSection() {
  return (
    <div className="flex justify-between items-center p-4 bg-base-100 mb-4">
      <h1 className="text-4xl font-bold">Inksync</h1>
      <div className="flex gap-2">
        <button
          className="btn btn-primary"
        >
          Add New
        </button>
        <button
          className="btn btn-accent"
        >
          Sync All
        </button>
      </div>
    </div>
  );

}

function RouteComponent() {
  const [loading, connections] = usePromise(getAllConnections());

  return (
    <div className="max-w-lg mx-auto bg-base-300 min-h-screen">
      <TopSection />
      <div className="p-4">
        {loading ? <p>Loading...</p> : connections.map((c) => <ConnectionButton connection={c} status={"syncing"} />)}
      </div>
    </div>
  )
}
