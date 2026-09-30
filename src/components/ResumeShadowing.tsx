import { useEffect, useState, type CSSProperties } from 'react'
import { Link } from 'react-router'
import { formatDistanceToNowStrict } from 'date-fns'
import { ChevronRight, Waves } from 'lucide-react'
import { useApp } from '../app/AppContext'
import { getLastShadow, onLastShadowChange, resumeUrl, type LastShadow } from '../lib/lastShadow'
import { TL } from './ui'

/** "Resume shadowing" shortcut to the last clip you practised. Hidden until there is one. */
export function ResumeShadowing() {
  const { lang } = useApp()
  const [last, setLast] = useState<LastShadow | null>(() => getLastShadow(lang))
  useEffect(() => onLastShadowChange(() => setLast(getLastShadow(lang))), [lang])
  if (!last) return null
  return (
    <Link
      to={resumeUrl(last)}
      className="press flex items-center gap-3 rounded-3xl border-2 border-line bg-surface p-4"
      style={{ '--lip': 'var(--line)' } as CSSProperties}
    >
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-good-soft text-good">
        <Waves size={24} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-extrabold tracking-wider text-muted uppercase">
          Resume shadowing · week {last.week} · {formatDistanceToNowStrict(last.at, { addSuffix: true })}
        </span>
        <TL className="block truncate font-black">{last.text || 'Your clip'}</TL>
      </span>
      <ChevronRight className="text-muted" />
    </Link>
  )
}
