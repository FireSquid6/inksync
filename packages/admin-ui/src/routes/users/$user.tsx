import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/users/$user')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/users/$user"!</div>
}
