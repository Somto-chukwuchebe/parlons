import { Link } from 'react-router'
import { format } from 'date-fns'
import { useApp } from '../app/AppContext'
import { Card, Notice } from '../components/ui'
import { APP_NAME, BACKUP_REMINDER_DAYS, PROGRAM_DAYS } from '../config'
import { contentWeek, fromDayKey, isReviewDay, phaseOn } from '../lib/program'

export function Today() {
  const { pack, plan, today, profile, settings } = useApp()
  if (!plan || !profile) return null
  const phase = phaseOn(plan, today)
  const week = pack.weeks[contentWeek(plan, today) - 1]
  const backupDue =
    !settings.lastBackupAt || Date.now() - settings.lastBackupAt > BACKUP_REMINDER_DAYS * 86_400_000

  return (
    <div className="space-y-4">
      <header>
        <p className="text-sm text-muted">{format(fromDayKey(today), 'EEEE d MMMM')}</p>
        <h1 className="text-2xl font-semibold">
          {phase.kind === 'before' && `${APP_NAME} starts in ${phase.daysUntil} day${phase.daysUntil === 1 ? '' : 's'}`}
          {phase.kind === 'week' && `Week ${phase.week} · Day ${phase.dayOfProgram} of ${PROGRAM_DAYS}`}
          {phase.kind === 'final' && `Final stretch · Day ${phase.dayOfProgram} of ${PROGRAM_DAYS}`}
          {phase.kind === 'after' && 'Programme complete — félicitations !'}
        </h1>
      </header>

      {!profile.seedApprovedAt && (
        <Notice tone="warn">
          Please <Link to="/course" className="font-semibold underline">review and approve the course</Link> first.
        </Notice>
      )}

      {isReviewDay(plan, today) && <Notice>Your weekly review is due today.</Notice>}

      <Card className="space-y-2 border-accent">
        <p className="text-sm font-medium text-accent">
          {phase.kind === 'before' ? 'First up' : 'This week'}: week {week.week}
        </p>
        <h2 className="text-xl font-semibold">{week.theme}</h2>
        <p className="text-sm text-muted">{week.grammar}</p>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {week.canDo.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </Card>

      <Card>
        <p className="text-sm text-muted">
          Daily sessions arrive in the next build. For now you can review the course, set up backups and install the
          app.
        </p>
      </Card>

      {backupDue && (
        <Notice tone="warn">
          {settings.lastBackupAt ? "It's been over a week since your last backup." : "You haven't backed up yet."}{' '}
          <Link to="/settings" className="font-semibold underline">
            Back up now
          </Link>
        </Notice>
      )}
    </div>
  )
}
