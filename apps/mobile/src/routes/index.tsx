import { createFileRoute } from '@tanstack/react-router'
import { AddConnectionForm, ConnectionButton } from '../components/connection';
import { useAtomValue } from 'jotai';
import { connectionsAtom, useSyncAll } from '../lib/connection';

export const Route = createFileRoute('/')({
  component: RouteComponent,
})

function TopSection() {
  const syncAll = useSyncAll();

  return (
    <div className="flex justify-between items-center p-4 bg-base-100 mb-4">
      <h1 className="text-4xl font-bold">Inksync</h1>
      <div className="flex gap-2">
        <button
          className="btn btn-accent"
          onClick={syncAll}
        >
          Sync All
        </button>
      </div>
    </div>
  );

}

function RouteComponent() {
  const connections = useAtomValue(connectionsAtom)

  return (
    <div>
      <TopSection />
      <AddConnectionForm />
      <div className="p-4">
        <h2 className="text-2xl font-bold w-full mb-8 mt-4">Current Connections</h2>
        {connections.map((c, i) => <ConnectionButton connection={c} key={i} />)}
      </div>
    </div>
  )
}
