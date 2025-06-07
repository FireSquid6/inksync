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
      <p>This page is a work in progress!</p>
      <pre className="rounded-xl bg-base-300 p-4 m-4">
        <p>User: {user.username}</p>
        <p>Role: {user.role}</p>
        <p>Id: {user.id}</p>
      </pre>
    </SidebarLayout>
  )
}
