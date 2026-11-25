import { Loader2 } from 'lucide-react'

export function FullPageSpinner() {
  return (
    <div className="flex min-h-svh items-center justify-center" role="status">
      <Loader2 className="size-6 animate-spin text-ink-muted" aria-hidden />
      <span className="sr-only">Loading…</span>
    </div>
  )
}
