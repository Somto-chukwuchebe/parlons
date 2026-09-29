import { useEffect, useState } from 'react'
import { Button } from './ui'

// Shows a banner when a new version of the app has been downloaded in the background.
export function UpdatePrompt() {
  const [update, setUpdate] = useState<null | (() => void)>(null)
  const [offlineReady, setOfflineReady] = useState(false)

  useEffect(() => {
    if (import.meta.env.DEV || !('serviceWorker' in navigator)) return
    import('virtual:pwa-register').then(({ registerSW }) => {
      const updateSW = registerSW({
        onNeedRefresh: () => setUpdate(() => () => updateSW(true)),
        onOfflineReady: () => setOfflineReady(true),
      })
    })
  }, [])

  if (!update && !offlineReady) return null
  return (
    <div role="status" className="fixed inset-x-3 bottom-24 z-20 mx-auto flex max-w-lg items-center gap-3 rounded-2xl border border-line bg-surface p-3 shadow-lg">
      <p className="flex-1 text-sm">
        {update ? 'A new version is ready.' : 'Ready to work offline.'}
      </p>
      {update ? (
        <Button onClick={update}>Update</Button>
      ) : (
        <Button variant="ghost" onClick={() => setOfflineReady(false)}>
          OK
        </Button>
      )}
    </div>
  )
}
