/** The Parlons mark (option D4): navy tile, red stem, white speech-bubble "p". */
export function Logo({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" className={className} aria-hidden>
      <rect width="120" height="120" rx="28" fill="#0F2A6B" />
      <g transform="translate(-7.75 -1.25)">
        <rect x="34" y="24" width="13" height="78" rx="6.5" fill="#EF4135" />
        <circle cx="72" cy="50" r="23" fill="none" stroke="#FFFFFF" strokeWidth="13" />
        <path d="M84 68 L100 86 L76 74 Z" fill="#FFFFFF" />
      </g>
    </svg>
  )
}
