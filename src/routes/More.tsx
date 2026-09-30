import type { CSSProperties } from 'react'
import { Link } from 'react-router'
import { CalendarCheck, ChevronRight, Download, Info, Settings, TrainFront, Trophy } from 'lucide-react'
import { PageHeader } from '../components/ui'
import { APP_NAME } from '../config'

// Phone-only menu for everything that doesn't fit in the bottom tab bar.
const LINKS = [
  { to: '/course', icon: TrainFront, title: 'Course', text: 'The 12-week line: lessons, phrases, prompts' },
  { to: '/weekly-review', icon: CalendarCheck, title: 'Weekly review', text: 'Sunday check-in, goals and next week’s focus' },
  { to: '/fluency-check', icon: Trophy, title: 'Final fluency check', text: 'The week-12 recorded self-test' },
  { to: '/settings', icon: Settings, title: 'Settings', text: 'Theme, backups, reminders, storage' },
  { to: '/install', icon: Download, title: `Install ${APP_NAME}`, text: 'Home screen, offline' },
  { to: '/about', icon: Info, title: 'About and credits', text: 'Audio licences and thanks' },
]

export function More() {
  return (
    <div>
      <PageHeader title="More" />
      <ul className="space-y-3">
        {LINKS.map(({ to, icon: Icon, title, text }) => (
          <li key={to}>
            <Link to={to} className="press flex items-center gap-4 rounded-3xl border-2 border-line bg-surface p-4" style={{ '--lip': 'var(--line)' } as CSSProperties}>
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-accent-soft text-accent">
                <Icon size={24} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-black">{title}</span>
                <span className="block text-sm font-semibold text-muted">{text}</span>
              </span>
              <ChevronRight className="text-muted" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
