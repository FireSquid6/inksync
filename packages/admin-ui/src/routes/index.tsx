import { SidebarLayout } from '@/components/layout'
import { createFileRoute } from '@tanstack/react-router'
export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  return (
    <SidebarLayout>
      <p>Hello, world!</p>
    </SidebarLayout>
  )
}
