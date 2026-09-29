import { useRouteError } from 'react-router'
import { RotateCcw } from 'lucide-react'
import { Button, Card } from '../components/ui'
import { Logo } from '../components/Logo'

// Shown instead of a blank screen if a page crashes. Data is safe: it lives in IndexedDB.
export function ErrorPage() {
  const error = useRouteError() as Error | undefined
  return (
    <div className="safe-top safe-x mx-auto grid min-h-dvh max-w-lg place-items-center p-6">
      <Card className="space-y-4 text-center">
        <Logo size={56} className="mx-auto" />
        <h1 className="text-2xl font-black">Oops, something went wrong</h1>
        <p className="font-semibold text-muted">
          Your progress and recordings are safe on this device. Reloading usually fixes it.
        </p>
        <Button variant="primary" size="lg" icon={<RotateCcw size={20} />} onClick={() => window.location.reload()}>
          Reload
        </Button>
        {error?.message && (
          <details className="text-left text-xs text-muted">
            <summary className="cursor-pointer font-bold">Technical details</summary>
            <pre className="mt-2 whitespace-pre-wrap">{error.message}</pre>
          </details>
        )}
      </Card>
    </div>
  )
}
