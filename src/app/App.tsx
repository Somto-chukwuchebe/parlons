import { createHashRouter, Navigate, RouterProvider, useLocation } from 'react-router'
import type { ReactNode } from 'react'
import { AppProvider, useApp } from './AppContext'
import { Layout } from './Layout'
import { Today } from '../routes/Today'
import { Onboarding } from '../routes/Onboarding'
import { Course } from '../routes/Course'
import { Settings } from '../routes/Settings'
import { Install } from '../routes/Install'
import { ErrorPage } from '../routes/ErrorPage'
import { Session } from '../routes/Session'
import { Phrases } from '../routes/Phrases'
import { Review } from '../routes/Review'

// Hash-based URLs (…/#/course) so deep links work on GitHub Pages and offline.

/** Sends first-time users to onboarding. */
function RequireProfile({ children }: { children: ReactNode }) {
  const { profile } = useApp()
  const loc = useLocation()
  if (!profile) return <Navigate to="/welcome" replace state={{ from: loc.pathname }} />
  return <>{children}</>
}

const router = createHashRouter([
  { path: '/welcome', element: <Onboarding />, errorElement: <ErrorPage /> },
  { path: '/install', element: <Install />, errorElement: <ErrorPage /> },
  {
    path: '/session',
    errorElement: <ErrorPage />,
    element: (
      <RequireProfile>
        <Session />
      </RequireProfile>
    ),
  },
  {
    errorElement: <ErrorPage />,
    element: (
      <RequireProfile>
        <Layout />
      </RequireProfile>
    ),
    children: [
      { path: '/', element: <Today /> },
      { path: '/phrases', element: <Phrases /> },
      { path: '/review', element: <Review /> },
      { path: '/course', element: <Course /> },
      { path: '/settings', element: <Settings /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])

export function App() {
  return (
    <AppProvider>
      <RouterProvider router={router} />
    </AppProvider>
  )
}
