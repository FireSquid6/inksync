import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/$connection')({
  component: RouteComponent,
})

function RouteComponent() {
  const { connection } = Route.useParams();

  return <div>Hello "{connection}"</div>
}
