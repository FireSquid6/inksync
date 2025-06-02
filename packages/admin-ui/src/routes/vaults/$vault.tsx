import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/vaults/$vault')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/vaults/$vault"!</div>
}
