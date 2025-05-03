import { createFileRoute } from '@tanstack/react-router'
import { AddConnectionModal, ConnectionButton } from '../components/connection';
import { useAtomValue } from 'jotai';
import { connectionsAtom } from '../lib/connection';
import { useState } from 'react';

export const Route = createFileRoute('/')({
  component: RouteComponent,
})

function TopSection() {
  const [open, setOpen] = useState<boolean>(false);

  return (
    <div className="flex justify-between items-center p-4 bg-base-100 mb-4">
      <h1 className="text-4xl font-bold">Inksync</h1>
      <div className="flex gap-2">
        <button
          className="btn btn-primary"
          onClick={() => setOpen(true)}
        >
          Add New
        </button>
        <button
          className="btn btn-accent"
        >
          Sync All
        </button>
      </div>
      <AddConnectionModal isOpen={open} onClose={() => setOpen(false)} />
    </div>
  );

}

function RouteComponent() {
  const connections = useAtomValue(connectionsAtom)

  return (
    <div>
      <TopSection />
      <div className="p-4">
        {connections.map((c) => <ConnectionButton connection={c} />)}
      </div>
    </div>
  )
}
