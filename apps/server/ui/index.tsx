import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
// import { RouterProvider } from '@tanstack/react-router'
import "./index.css";


// declare module '@tanstack/react-router' {
//   interface Register {
//     router: typeof router
//   }
// }

const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <p>Hello, world!</p>
    </StrictMode>,
  )
}
