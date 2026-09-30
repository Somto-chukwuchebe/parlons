import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router'
import { CalendarCheck, ChartLine, Download, House, Layers, Menu, Mic, Plus, Settings, TrainFront, Trophy } from 'lucide-react'
import { QuickAddDialog } from '../components/QuickAdd'
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

const main: Item[] = [
  { to: '/', label: 'Today', icon: <House size={24} strokeWidth={2.4} /> },
  { to: '/phrases', label: 'Phrases', icon: <Layers size={24} strokeWidth={2.4} /> },
  { to: '/speak', label: 'Speak', icon: <Mic size={24} strokeWidth={2.4} /> },
  { to: '/progress', label: 'Progress', icon: <ChartLine size={24} strokeWidth={2.4} /> },
]
// Sidebar shows everything; on phones these live behind "More".
const extra: Item[] = [
  { to: '/course', label: 'Course', icon: <TrainFront size={24} strokeWidth={2.4} /> },
  { to: '/weekly-review', label: 'Weekly review', icon: <CalendarCheck size={24} strokeWidth={2.4} /> },
  { to: '/fluency-check', label: 'Fluency check', icon: <Trophy size={24} strokeWidth={2.4} /> },
  { to: '/settings', label: 'Settings', icon: <Settings size={24} strokeWidth={2.4} /> },
]
const MORE_PATHS = ['/more', '/course', '/weekly-review', '/fluency-check', '/settings', '/install', '/about']

export function Layout() {
  const { pathname } = useLocation()
  const { pack } = useApp()
  const [adding, setAdding] = useState(false)
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
          {main.map((i) => (
            <li key={i.to}>
              <SideLink {...i} />
            </li>
          ))}
          <li className="my-2 border-t-2 border-line" aria-hidden />
          {extra.map((i) => (
            <li key={i.to}>
              <SideLink {...i} />
            </li>
          ))}
        </ul>
        <div className="px-4 pt-6">
          <button
            onClick={() => setAdding(true)}
            className="press flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-line bg-surface font-extrabold"
            style={{ '--lip': 'var(--line)' } as CSSProperties}
          >
            <Plus size={20} strokeWidth={2.6} /> Add a phrase
          </button>
        </div>
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

      {/* Quick add (phones) */}
      <button
        onClick={() => setAdding(true)}
        aria-label="Add a phrase"
        className="press fixed right-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-30 grid h-14 w-14 place-items-center rounded-2xl bg-accent text-on-accent md:hidden"
        style={{ '--lip': 'color-mix(in oklab, var(--accent) 62%, black)' } as CSSProperties}
      >
        <Plus size={28} strokeWidth={2.8} />
      </button>
      {adding && <QuickAddDialog onClose={() => setAdding(false)} />}

      {/* Bottom tab bar: phones */}
      <nav aria-label="Main" className="safe-bottom safe-x fixed inset-x-0 bottom-0 z-40 border-t-2 border-line bg-surface/95 backdrop-blur md:hidden">
        <ul className="grid grid-cols-5">
          {[...main, { to: '/more', label: 'More', icon: <Menu size={24} strokeWidth={2.4} /> }].map((i) => (
            <li key={i.to}>
              <NavLink
                to={i.to}
                end={i.to === '/'}
                className={({ isActive }) =>
                  cx(
                    'flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-extrabold',
                    isActive || (i.to === '/more' && MORE_PATHS.some((p) => pathname.startsWith(p))) ? 'text-accent' : 'text-muted',
                  )
                }
              >
                {({ isActive: active }) => {
                  const isActive = active || (i.to === '/more' && MORE_PATHS.some((p) => pathname.startsWith(p)))
                  return (
                  <>
                    <span className={cx('grid h-8 w-12 place-items-center rounded-full transition-colors', isActive && 'bg-accent-soft')}>
                      {i.icon}
                    </span>
                    {i.label}
                  </>
                  )
                }}
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
