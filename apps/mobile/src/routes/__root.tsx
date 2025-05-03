import * as React from 'react'
import { Outlet, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <React.Fragment>
      <main className="mx-auto bg-base-300 min-h-screen">
        <Outlet />
      </main>
      <TanStackRouterDevtools />
    </React.Fragment>
  )
}
