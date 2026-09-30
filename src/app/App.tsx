import { createHashRouter, Navigate, RouterProvider, useLocation } from 'react-router'
import { lazy, Suspense, type ReactNode } from 'react'
import { AppProvider, useApp } from './AppContext'
import { UpdatePrompt } from '../components/UpdatePrompt'
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
import { Speak } from '../routes/Speak'
import { Shadowing } from '../routes/Shadowing'
import { ThenAndNow } from '../routes/ThenAndNow'
import { About } from '../routes/About'
import { Conversations } from '../routes/Conversations'
import { Mistakes } from '../routes/Mistakes'
import { RolePlay } from '../routes/RolePlay'
import { WeeklyReview } from '../routes/WeeklyReview'
import { FluencyCheck } from '../routes/FluencyCheck'
import { More } from '../routes/More'

// The dashboard pulls in the charting library; load it only when opened.
const Progress = lazy(() => import('../routes/Progress'))

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
      { path: '/speak', element: <Speak /> },
      { path: '/shadowing', element: <Shadowing /> },
      { path: '/then-and-now', element: <ThenAndNow /> },
      { path: '/about', element: <About /> },
      { path: '/conversations', element: <Conversations /> },
      { path: '/mistakes', element: <Mistakes /> },
      { path: '/roleplay', element: <RolePlay /> },
      {
        path: '/progress',
        element: (
          <Suspense fallback={<p className="py-10 text-center font-bold text-muted">Loading your progress…</p>}>
            <Progress />
          </Suspense>
        ),
      },
      { path: '/weekly-review', element: <WeeklyReview /> },
      { path: '/fluency-check', element: <FluencyCheck /> },
      { path: '/more', element: <More /> },
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
      <UpdatePrompt />
    </AppProvider>
  )
}
