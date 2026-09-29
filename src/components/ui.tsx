import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router'
import { useApp } from '../app/AppContext'

// Small shared UI building blocks. Buttons are large (≥48px) for one-handed phone use.

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-on-accent hover:opacity-90',
  secondary: 'bg-surface text-ink border border-line hover:border-accent',
  ghost: 'text-accent hover:bg-accent-soft',
  danger: 'bg-danger-bg text-danger-ink hover:opacity-90',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'md' | 'lg' }) {
  const sizing = size === 'lg' ? 'min-h-14 px-6 text-lg' : 'min-h-12 px-4'
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-medium transition disabled:opacity-40 ${sizing} ${variants[variant]} ${className}`}
      {...props}
    />
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-line bg-surface p-4 ${className}`}>{children}</section>
}

export function PageHeader({ title, back, action }: { title: string; back?: string; action?: ReactNode }) {
  return (
    <header className="mb-4 flex items-center gap-2">
      {back && (
        <Link to={back} className="-ml-2 rounded-lg p-2 text-accent" aria-label="Back">
          <span aria-hidden>←</span>
        </Link>
      )}
      <h1 className="flex-1 text-2xl font-semibold">{title}</h1>
      {action}
    </header>
  )
}

export function Notice({ tone = 'info', children }: { tone?: 'info' | 'warn' | 'danger'; children: ReactNode }) {
  const styles = {
    info: 'bg-accent-soft text-ink',
    warn: 'bg-warn-bg text-warn-ink',
    danger: 'bg-danger-bg text-danger-ink',
  }[tone]
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={`rounded-xl px-4 py-3 text-sm ${styles}`}>
      {children}
    </div>
  )
}

/** Target-language text with pack typography applied. */
export function TL({ children, className = '' }: { children: string; className?: string }) {
  const { lang, t } = useApp()
  return (
    <span lang={lang} className={`tl ${className}`}>
      {t(children)}
    </span>
  )
}

export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  label,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
  label: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1 rounded-xl border border-line bg-surface p-1">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`min-h-11 flex-1 rounded-lg px-3 text-sm font-medium ${
            value === o.value ? 'bg-accent text-on-accent' : 'text-ink hover:bg-accent-soft'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
