import {
  forwardRef,
  useId,
  type ButtonHTMLAttributes,
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { Link } from 'react-router'
import { ArrowLeft, Flame } from 'lucide-react'
import { useApp } from '../app/AppContext'

// Shared building blocks. Touch targets are ≥44px; primary actions are "pressable"
// game-style buttons with a solid lip (see .press in index.css).

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'rouge' | 'good'
type Size = 'sm' | 'md' | 'lg' | 'xl'

const darker = (v: string) => `color-mix(in oklab, var(${v}) 62%, black)`

const variants: Record<Variant, { cls: string; lip?: string }> = {
  primary: { cls: 'bg-accent text-on-accent', lip: darker('--accent') },
  rouge: { cls: 'bg-rouge text-white dark:text-[#2a0906]', lip: darker('--rouge') },
  good: { cls: 'bg-good text-white dark:text-[#06240f]', lip: darker('--good') },
  secondary: { cls: 'bg-surface text-ink border-2 border-line', lip: 'var(--line)' },
  ghost: { cls: 'text-accent hover:bg-accent-soft' },
  danger: { cls: 'bg-danger-bg text-danger-ink border-2 border-transparent' },
}

const sizes: Record<Size, string> = {
  sm: 'min-h-10 text-sm rounded-xl',
  md: 'min-h-12 rounded-2xl',
  lg: 'min-h-14 text-lg rounded-2xl',
  xl: 'min-h-16 text-xl rounded-3xl',
}
const padding: Record<Size, string> = { sm: 'px-3', md: 'px-5', lg: 'px-6', xl: 'px-8' }
const square: Record<Size, string> = { sm: 'w-10', md: 'w-12', lg: 'w-14', xl: 'w-16' }

/** Pass `iconOnly` for square icon buttons; a `px-…` in className replaces the default padding. */
export function buttonClasses(variant: Variant = 'secondary', size: Size = 'md', className?: string, iconOnly = false) {
  const customPadding = /(^|\s)(sm:)?px-/.test(className ?? '')
  return cx(
    'inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-extrabold tracking-tight disabled:pointer-events-none disabled:opacity-45',
    variant !== 'ghost' && 'press',
    sizes[size],
    iconOnly ? `${square[size]} shrink-0` : !customPadding && padding[size],
    variants[variant].cls,
    className,
  )
}

const lipStyle = (variant: Variant): CSSProperties | undefined =>
  variants[variant].lip ? ({ '--lip': variants[variant].lip } as CSSProperties) : undefined

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; icon?: ReactNode }
>(function Button({ variant = 'secondary', size = 'md', icon, className, children, type = 'button', style, ...rest }, ref) {
  return (
    <button ref={ref} type={type} className={buttonClasses(variant, size, className, !children)} style={{ ...lipStyle(variant), ...style }} {...rest}>
      {icon}
      {children}
    </button>
  )
})

export function LinkButton({
  to,
  variant = 'secondary',
  size = 'md',
  icon,
  className,
  children,
}: {
  to: string
  variant?: Variant
  size?: Size
  icon?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <Link to={to} className={buttonClasses(variant, size, className)} style={lipStyle(variant)}>
      {icon}
      {children}
    </Link>
  )
}

export function Card({
  children,
  className,
  as: As = 'section',
}: {
  children: ReactNode
  className?: string
  as?: 'section' | 'div' | 'article' | 'li'
}) {
  // A background passed in className replaces the default surface colour.
  const hasBg = /(^|\s)bg-/.test(className ?? '')
  return <As className={cx('rounded-3xl border-2 border-line p-5', !hasBg && 'bg-surface', className)}>{children}</As>
}

export function PageHeader({
  title,
  subtitle,
  back,
  actions,
}: {
  title: ReactNode
  subtitle?: ReactNode
  back?: string
  actions?: ReactNode
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="flex min-w-0 items-start gap-2">
        {back && (
          <Link to={back} className="-ml-2 mt-0.5 rounded-xl p-2 text-accent hover:bg-accent-soft sm:mt-1.5" aria-label="Back">
            <ArrowLeft size={24} />
          </Link>
        )}
        <div className="min-w-0">
          <h1 className="text-3xl font-black leading-tight sm:text-4xl">{title}</h1>
          {subtitle && <p className="mt-1 font-semibold text-muted">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  )
}

export function SectionTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h2 className={cx('mb-3 text-xl font-extrabold', className)}>{children}</h2>
}

/** Small uppercase label above a group of content. */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cx('text-xs font-extrabold uppercase tracking-[0.12em] text-muted', className)}>{children}</p>
}

export function Notice({ tone = 'info', children, icon }: { tone?: 'info' | 'warn' | 'danger' | 'good'; children: ReactNode; icon?: ReactNode }) {
  const styles = {
    info: 'bg-accent-soft text-ink',
    warn: 'bg-warn-bg text-warn-ink',
    danger: 'bg-danger-bg text-danger-ink',
    good: 'bg-good-soft text-ink',
  }[tone]
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={cx('flex items-start gap-3 rounded-2xl px-4 py-3 text-sm font-semibold', styles)}>
      {icon && <span className="mt-0.5 shrink-0">{icon}</span>}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}

/** Target-language text with the pack's typography and language tag. */
export function TL({ children, className }: { children: string; className?: string }) {
  const { lang, t } = useApp()
  return (
    <span lang={lang} className={cx('tl', className)}>
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
  options: { value: T; label: ReactNode }[]
  onChange: (v: T) => void
  label: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1 rounded-2xl bg-sunk p-1">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cx(
            'min-h-11 flex-1 rounded-xl px-3 text-sm font-extrabold transition-colors',
            value === o.value ? 'bg-surface text-accent shadow-sm' : 'text-muted hover:text-ink',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

// Form fields ---------------------------------------------------------------

const fieldBase =
  'w-full min-h-12 rounded-2xl border-2 border-line bg-surface px-4 font-semibold text-ink placeholder:text-muted/70 focus:border-accent focus:outline-none'

export function Field({ label, hint, children, htmlFor }: { label: ReactNode; hint?: ReactNode; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-extrabold">
        {label}
      </label>
      {children}
      {hint && <p className="text-sm text-muted">{hint}</p>}
    </div>
  )
}

export function TextInput({ label, hint, className, ...rest }: ComponentProps<'input'> & { label: ReactNode; hint?: ReactNode }) {
  const id = useId()
  return (
    <Field label={label} hint={hint} htmlFor={id}>
      <input id={id} className={cx(fieldBase, className)} {...rest} />
    </Field>
  )
}

export function TextArea({ label, hint, className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: ReactNode; hint?: ReactNode }) {
  const id = useId()
  return (
    <Field label={label} hint={hint} htmlFor={id}>
      <textarea id={id} className={cx(fieldBase, 'py-3 leading-relaxed', className)} {...rest} />
    </Field>
  )
}

export function Select({ label, hint, className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & { label: ReactNode; hint?: ReactNode }) {
  const id = useId()
  return (
    <Field label={label} hint={hint} htmlFor={id}>
      <select id={id} className={cx(fieldBase, className)} {...rest}>
        {children}
      </select>
    </Field>
  )
}

export function Toggle({ label, hint, checked, onChange }: { label: ReactNode; hint?: ReactNode; checked: boolean; onChange: (v: boolean) => void }) {
  const id = useId()
  return (
    <div className="flex min-h-12 items-center justify-between gap-4">
      <label htmlFor={id} className="min-w-0">
        <span className="block font-bold">{label}</span>
        {hint && <span className="block text-sm text-muted">{hint}</span>}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cx('relative h-8 w-14 shrink-0 rounded-full transition-colors', checked ? 'bg-accent' : 'bg-line')}
      >
        <span className={cx('absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all', checked ? 'left-7' : 'left-1')} />
      </button>
    </div>
  )
}

// Game-feel pieces ----------------------------------------------------------

/** Circular progress, e.g. minutes today vs. daily target. */
export function ProgressRing({
  value,
  max,
  size = 120,
  stroke = 12,
  color = 'var(--accent)',
  children,
  label,
}: {
  value: number
  max: number
  size?: number
  stroke?: number
  color?: string
  children?: ReactNode
  label: string
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(1, max ? value / max : 0))
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }} role="img" aria-label={label}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--sunk)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: 'stroke-dashoffset 600ms ease' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  )
}

/** Streak count with a flame. Grey when the streak is zero. */
export function StreakBadge({ days, size = 'md' }: { days: number; size?: 'md' | 'lg' }) {
  const on = days > 0
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full font-black',
        size === 'lg' ? 'px-4 py-2 text-xl' : 'px-3 py-1.5 text-base',
        on ? 'bg-rouge-soft text-rouge' : 'bg-sunk text-muted',
      )}
      aria-label={`${days}-day streak`}
    >
      <Flame size={size === 'lg' ? 26 : 20} className={on ? 'flicker' : ''} fill={on ? 'currentColor' : 'none'} aria-hidden />
      {days}
    </span>
  )
}

export function StatPill({ icon, value, label, tone = 'accent' }: { icon: ReactNode; value: ReactNode; label: string; tone?: 'accent' | 'gold' | 'good' | 'rouge' }) {
  const tones = {
    accent: 'bg-accent-soft text-accent',
    gold: 'bg-gold-soft text-gold-ink',
    good: 'bg-good-soft text-good',
    rouge: 'bg-rouge-soft text-rouge',
  }[tone]
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-surface p-3 ring-2 ring-line">
      <span className={cx('grid h-11 w-11 shrink-0 place-items-center rounded-xl', tones)} aria-hidden>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xl font-black leading-none">{value}</p>
        <p className="mt-1 truncate text-xs font-bold text-muted">{label}</p>
      </div>
    </div>
  )
}
