import { Outlet, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { ErrorsDisplay } from '@/components/errors-display'

export const Route = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <ErrorsDisplay />
      <TanStackRouterDevtools position="bottom-right" />
    </>
  ),
})
