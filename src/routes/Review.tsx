import { useEffect, useState } from 'react'
import { useApp } from '../app/AppContext'
import { PageHeader } from '../components/ui'
import { ReviewDeck } from '../components/ReviewDeck'
import { REVIEW_CAP } from '../config'
import { contentWeek } from '../lib/program'
import { ensureDeck } from '../lib/srs'

// A review outside the guided session (e.g. a spare five minutes on the metro).
export function Review() {
  const { pack, plan, today } = useApp()
  const [ready, setReady] = useState(false)
  useEffect(() => {
    ensureDeck(pack, plan ? contentWeek(plan, today) : 1).then(() => setReady(true))
  }, [pack, plan, today])
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader back="/phrases" title="Review" subtitle="Say each one out loud before you reveal it." />
      {ready && <ReviewDeck cap={REVIEW_CAP.full} />}
    </div>
  )
}
