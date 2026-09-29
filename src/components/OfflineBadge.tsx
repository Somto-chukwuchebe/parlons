import { useEffect, useState } from 'react'

export function useOnline() {
  const [online, setOnline] = useState(() => navigator.onLine)
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])
  return online
}

export function OfflineBadge() {
  const online = useOnline()
  if (online) return null
  return (
    <p role="status" className="mb-3 rounded-full bg-accent-soft px-3 py-1 text-center text-xs text-ink">
      Offline — everything still works except speech recognition and AI.
    </p>
  )
}
