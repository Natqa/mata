import { Star } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export const RATING_LABELS = ['', 'Nie dla mnie', 'Słabo', 'Okej', 'Dobrze', 'Idealnie']

/** Pięć gwiazdek. Bez onChange tylko pokazuje ocenę. */
export function StarRating({ value = 0, onChange, size = 'md', className }) {
  const [hover, setHover] = useState(0)
  const shown = hover || value
  const icon = size === 'sm' ? 'size-3.5' : 'size-7'

  if (!onChange) {
    return (
      <span className={cn('inline-flex items-center gap-0.5', className)} aria-label={`Ocena ${value} na 5`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Star key={n} aria-hidden className={cn(icon, n <= value ? 'fill-current text-foreground' : 'text-icon')} />
        ))}
      </span>
    )
  }

  return (
    <div className={cn('inline-flex items-center gap-1', className)} role="radiogroup" aria-label="Ocena treningu"
      onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} — ${RATING_LABELS[n]}`}
          onMouseEnter={() => setHover(n)}
          onFocus={() => setHover(n)}
          onBlur={() => setHover(0)}
          onClick={() => onChange(n)}
          className="rounded-full p-1 outline-none transition-transform hover:scale-110 focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Star className={cn(icon, n <= shown ? 'fill-current text-foreground' : 'text-icon')} strokeWidth={1.5} />
        </button>
      ))}
      <span className="ml-2 min-w-[96px] text-sm font-medium text-ink-muted">{RATING_LABELS[shown]}</span>
    </div>
  )
}
