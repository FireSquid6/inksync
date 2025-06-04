import { SidebarLayout } from '@/components/layout'
import { getProtected } from '@/lib/state'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  loader: () => {
    return { ...getProtected() };
  },
  component: App,
})

function App() {
  const { user } = Route.useLoaderData();

  return (
    <SidebarLayout>
      <p>Hello, world!</p>
      <p>Auth information:</p>
      <p>{user.username}</p>
      <p>{user.role}</p>
      <p>{user.id}</p>
    </SidebarLayout>
  )
}
