import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ConnectionForm } from '../components/ConnectionForm'

export const Route = createFileRoute('/new')({
  component: NewConnectionRoute,
})

function NewConnectionRoute() {
  const navigate = useNavigate()

  const handleConnectionCreated = () => {
    navigate({ to: "/" })
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Add New Connection</h1>
      <ConnectionForm onSuccess={handleConnectionCreated} />
    </div>
  )
}
