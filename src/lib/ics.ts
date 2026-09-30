import { format } from 'date-fns'
import { fromDayKey, type DayKey } from './program'

// A calendar file (.ics) with one recurring daily study event. Importing it into the
// phone's calendar gives reliable reminders without any server or notifications API.

const pad = (n: number) => String(n).padStart(2, '0')
const escape = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')

/** Fold lines to 75 octets as RFC 5545 asks (simple version: characters). */
const fold = (line: string) => line.match(/.{1,73}/g)!.join('\r\n ')

export function buildIcs(opts: {
  appName: string
  startDate: DayKey
  days: number
  time: string // HH:mm, local "floating" time: follows the phone's time zone
  minutes: number
  url?: string
  now?: Date
}): string {
  const [h, m] = opts.time.split(':').map(Number)
  const start = fromDayKey(opts.startDate)
  const dt = `${format(start, 'yyyyMMdd')}T${pad(h)}${pad(m)}00`
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate(), h, m + opts.minutes)
  const dtEnd = format(end, "yyyyMMdd'T'HHmm'00'")
  const stamp = format(opts.now ?? new Date(), "yyyyMMdd'T'HHmmss")
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//${opts.appName}//Study reminder//EN`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${opts.appName.toLowerCase()}-daily-${opts.startDate}@local`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${dt}`,
    `DTEND:${dtEnd}`,
    `RRULE:FREQ=DAILY;COUNT=${opts.days}`,
    `SUMMARY:${escape(`${opts.appName}: speak ${opts.minutes} min`)}`,
    `DESCRIPTION:${escape(`Today's ${opts.appName} session. Open the app and tap Start session.${opts.url ? `\n${opts.url}` : ''}`)}`,
    ...(opts.url ? [`URL:${opts.url}`] : []),
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escape(`Time for ${opts.appName}`)}`,
    'TRIGGER:PT0M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return lines.map(fold).join('\r\n') + '\r\n'
}
