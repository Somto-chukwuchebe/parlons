import { NavLink, Outlet } from 'react-router'
import { UpdatePrompt } from '../components/UpdatePrompt'
import { OfflineBadge } from '../components/OfflineBadge'

const tabs = [
  { to: '/', label: 'Today', icon: '☀︎' },
  { to: '/course', label: 'Course', icon: '☰' },
  { to: '/settings', label: 'Settings', icon: '⚙︎' },
]

export function Layout() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col">
      <main className="pt-safe px-safe flex-1 pb-28">
        <OfflineBadge />
        <Outlet />
      </main>
      <UpdatePrompt />
      <nav
        aria-label="Main"
        className="pb-safe fixed inset-x-0 bottom-0 border-t border-line bg-surface/95 backdrop-blur"
      >
        <ul className="mx-auto flex max-w-xl">
          {tabs.map((t) => (
            <li key={t.to} className="flex-1">
              <NavLink
                to={t.to}
                end={t.to === '/'}
                className={({ isActive }) =>
                  `flex min-h-14 flex-col items-center justify-center text-xs font-medium ${
                    isActive ? 'text-accent' : 'text-muted'
                  }`
                }
              >
                <span aria-hidden className="text-lg leading-none">
                  {t.icon}
                </span>
                {t.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
