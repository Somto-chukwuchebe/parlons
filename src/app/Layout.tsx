import { useEffect, type ReactNode } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router'
import { Download, House, Settings, TrainFront } from 'lucide-react'
import { UpdatePrompt } from '../components/UpdatePrompt'
import { OfflineBadge } from '../components/OfflineBadge'
import { Logo } from '../components/Logo'
import { cx } from '../components/ui'
import { APP_NAME } from '../config'
import { useApp } from './AppContext'

interface Item {
  to: string
  label: string
  icon: ReactNode
}

const items: Item[] = [
  { to: '/', label: 'Today', icon: <House size={24} strokeWidth={2.4} /> },
  { to: '/course', label: 'Course', icon: <TrainFront size={24} strokeWidth={2.4} /> },
  { to: '/settings', label: 'Settings', icon: <Settings size={24} strokeWidth={2.4} /> },
]

export function Layout() {
  const { pathname } = useLocation()
  const { pack } = useApp()
  // Each page opens at the top.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="min-h-dvh md:flex">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-xl focus:bg-surface focus:px-3 focus:py-2"
      >
        Skip to content
      </a>

      {/* Sidebar: tablets and laptops */}
      <nav aria-label="Main" className="safe-top sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r-2 border-line bg-surface md:flex">
        <div className="flex items-center gap-3 px-6 pt-7 pb-8">
          <Logo size={42} />
          <div>
            <p className="text-2xl font-black leading-none tracking-tight">{APP_NAME}</p>
            <p className="mt-1 text-xs font-bold text-muted">{pack.name}</p>
          </div>
        </div>
        <ul className="flex flex-col gap-1.5 px-4">
          {items.map((i) => (
            <li key={i.to}>
              <SideLink {...i} />
            </li>
          ))}
        </ul>
        <div className="mt-auto px-4 pb-6">
          <SideLink to="/install" label="Install app" icon={<Download size={22} strokeWidth={2.4} />} />
        </div>
      </nav>

      <div className="safe-top safe-x min-w-0 flex-1">
        <main id="main" className="mx-auto w-full max-w-6xl px-4 pt-5 pb-32 sm:px-6 md:px-10 md:pt-10 md:pb-16">
          <OfflineBadge />
          <Outlet />
        </main>
      </div>

      <UpdatePrompt />

      {/* Bottom tab bar: phones */}
      <nav aria-label="Main" className="safe-bottom safe-x fixed inset-x-0 bottom-0 z-40 border-t-2 border-line bg-surface/95 backdrop-blur md:hidden">
        <ul className="grid grid-cols-3">
          {items.map((i) => (
            <li key={i.to}>
              <NavLink
                to={i.to}
                end={i.to === '/'}
                className={({ isActive }) =>
                  cx('flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-extrabold', isActive ? 'text-accent' : 'text-muted')
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={cx('grid h-8 w-14 place-items-center rounded-full transition-colors', isActive && 'bg-accent-soft')}>
                      {i.icon}
                    </span>
                    {i.label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}

function SideLink({ to, label, icon }: Item) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        cx(
          'flex min-h-12 items-center gap-3 rounded-2xl px-4 text-[15px] font-extrabold transition-colors',
          isActive ? 'bg-accent-soft text-accent ring-2 ring-accent/30' : 'text-muted hover:bg-sunk hover:text-ink',
        )
      }
    >
      {icon}
      {label}
    </NavLink>
  )
}
