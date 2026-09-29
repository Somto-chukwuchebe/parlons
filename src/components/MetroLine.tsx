import { Check, Flag } from 'lucide-react'
import { cx } from './ui'

// The course drawn as a metro line ("Ligne P"): one station per week, ending at the
// final-stretch terminus. Stations before the current week are "passed".

export interface Station {
  week: number
  title: string
  subtitle?: string
}

type Status = 'passed' | 'current' | 'upcoming'
const statusOf = (week: number, current: number): Status =>
  week < current ? 'passed' : week === current ? 'current' : 'upcoming'

function Node({ status, size }: { status: Status; size: 'sm' | 'lg' }) {
  const dim = size === 'lg' ? 'h-9 w-9' : 'h-5 w-5'
  if (status === 'passed')
    return (
      <span className={cx('grid shrink-0 place-items-center rounded-full bg-accent text-on-accent', dim)}>
        {size === 'lg' && <Check size={18} strokeWidth={3.5} />}
      </span>
    )
  if (status === 'current')
    return (
      <span className={cx('relative grid shrink-0 place-items-center rounded-full border-[5px] border-rouge bg-surface', dim)}>
        <span className="absolute inset-0 -m-[5px] animate-ping rounded-full border-2 border-rouge/40" aria-hidden />
      </span>
    )
  return <span className={cx('block shrink-0 rounded-full border-4 border-line bg-surface', dim)} />
}

/** Vertical line with clickable stations (Course page). */
export function MetroLineVertical({
  stations,
  current,
  selected,
  onSelect,
  terminus,
}: {
  stations: Station[]
  current: number
  selected: number | null
  onSelect: (week: number) => void
  terminus?: string
}) {
  return (
    <ol className="relative" aria-label="Course weeks">
      {/* The track */}
      <span className="absolute top-5 bottom-5 left-[25px] w-2 rounded-full bg-line" aria-hidden />
      <span
        className="absolute top-5 left-[25px] w-2 rounded-full bg-accent"
        style={{ height: `calc(${(Math.min(current, stations.length + 1) - 1) / stations.length} * (100% - 2.5rem))` }}
        aria-hidden
      />
      {stations.map((s) => {
        const status = statusOf(s.week, current)
        const isSel = selected === s.week
        return (
          <li key={s.week} className="relative">
            <button
              onClick={() => onSelect(s.week)}
              aria-current={status === 'current' ? 'step' : undefined}
              aria-pressed={isSel}
              className={cx(
                'flex w-full items-center gap-4 rounded-2xl py-2.5 pr-3 pl-2 text-left transition-colors',
                isSel ? 'bg-accent-soft' : 'hover:bg-sunk',
              )}
            >
              <span className="grid w-9 shrink-0 place-items-center">
                <Node status={status} size="lg" />
              </span>
              <span className="min-w-0">
                <span className={cx('block text-xs font-extrabold uppercase tracking-wider', status === 'current' ? 'text-rouge' : 'text-muted')}>
                  Station {s.week}
                  {status === 'current' && ' · you are here'}
                </span>
                <span className={cx('block font-extrabold leading-snug', status === 'upcoming' && 'text-muted')}>{s.title}</span>
                {s.subtitle && <span className="block text-xs font-semibold text-muted">{s.subtitle}</span>}
              </span>
            </button>
          </li>
        )
      })}
      {terminus && (
        <li className="relative flex items-center gap-4 py-2.5 pl-2">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-navy text-white">
            <Flag size={18} strokeWidth={3} />
          </span>
          <span>
            <span className="block text-xs font-extrabold uppercase tracking-wider text-muted">Terminus</span>
            <span className="block font-extrabold">{terminus}</span>
          </span>
        </li>
      )}
    </ol>
  )
}

/** Compact horizontal line (Today page). */
export function MetroLineCompact({ total, current }: { total: number; current: number }) {
  return (
    <div className="relative flex items-center justify-between" role="img" aria-label={`Week ${current} of ${total}`}>
      <span className="absolute inset-x-2 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-line" aria-hidden />
      <span
        className="absolute left-2 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-accent"
        style={{ width: `calc(${(Math.min(current, total) - 1) / (total - 1)} * (100% - 1rem))` }}
        aria-hidden
      />
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className="relative block">
          <Node status={statusOf(i + 1, current)} size="sm" />
        </span>
      ))}
    </div>
  )
}
