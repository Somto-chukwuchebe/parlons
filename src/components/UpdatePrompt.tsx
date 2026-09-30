import { RefreshCw } from 'lucide-react'
import { dismissOfflineReady, installUpdate, usePwa } from '../lib/pwa'
import { Button } from './ui'

// Banner when a new version has downloaded (also available any time in Settings → App version).
export function UpdatePrompt() {
  const { needRefresh, offlineReady } = usePwa()
  if (!needRefresh && !offlineReady) return null
  return (
    <div role="status" className="pop-in fixed inset-x-3 bottom-24 z-40 mx-auto flex max-w-lg items-center gap-3 rounded-2xl border-2 border-accent bg-surface p-3 shadow-lg md:bottom-6">
      <p className="flex-1 text-sm font-bold">{needRefresh ? 'A new version of Parlons is ready.' : 'Parlons is ready to work offline.'}</p>
      {needRefresh ? (
        <Button variant="primary" size="sm" icon={<RefreshCw size={16} />} onClick={installUpdate}>
          Update now
        </Button>
      ) : (
        <Button variant="ghost" size="sm" onClick={dismissOfflineReady}>
          OK
        </Button>
      )}
    </div>
  )
}
