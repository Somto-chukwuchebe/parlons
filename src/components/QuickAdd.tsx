import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Plus, X } from 'lucide-react'
import { useApp } from '../app/AppContext'
import { addCard } from '../lib/srs'
import { contentWeek } from '../lib/program'
import { storageErrorMessage } from '../lib/storage'
import { Button, Card, Notice, TextInput } from './ui'

// Add a phrase card from anywhere. Learner-made cards are introduced before seed cards.

export function QuickAddDialog({ onClose }: { onClose: () => void }) {
  const { lang, pack, plan, today } = useApp()
  const [target, setTarget] = useState('')
  const [en, setEn] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [added, setAdded] = useState(0)
  const first = useRef<HTMLInputElement>(null)

  useEffect(() => {
    first.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function save(e: FormEvent) {
    e.preventDefault()
    if (!target.trim() || !en.trim()) return
    try {
      await addCard({ lang, target, en, note, source: 'user', week: plan ? contentWeek(plan, today) : undefined })
      setAdded((n) => n + 1)
      setTarget('')
      setEn('')
      setNote('')
      first.current?.focus()
    } catch (err) {
      setError(storageErrorMessage(err))
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/40 p-3 sm:place-items-center" role="dialog" aria-modal aria-labelledby="qa-title" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <Card className="pop-in w-full max-w-lg" as="div">
        <form onSubmit={save} className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 id="qa-title" className="text-2xl font-black">
              Add a phrase
            </h2>
            <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close" icon={<X size={22} />} />
          </div>
          <TextInput ref={first} label={pack.name} placeholder="A full sentence works best" value={target} onChange={(e) => setTarget(e.target.value)} lang={lang} required />
          <TextInput label="English" value={en} onChange={(e) => setEn(e.target.value)} required />
          <TextInput label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
          {added > 0 && (
            <Notice tone="good">
              {added} phrase{added === 1 ? '' : 's'} added. {added === 1 ? 'It' : 'They'}'ll come up first in your next review.
            </Notice>
          )}
          {error && <Notice tone="danger">{error}</Notice>}
          <div className="flex gap-2">
            <Button type="submit" variant="primary" size="lg" className="flex-1" icon={<Plus size={20} />} disabled={!target.trim() || !en.trim()}>
              Add phrase
            </Button>
            <Button size="lg" onClick={onClose}>
              Done
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
