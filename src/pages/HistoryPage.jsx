import { Check, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { PageShell } from '@/components/AppHeader'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { StarRating } from '@/components/StarRating'
import { VideoThumb } from '@/components/Video'
import { deleteSession, listSessions } from '@/lib/api'
import { dateLabel } from '@/lib/format'

export function HistoryPage() {
  const [sessions, setSessions] = useState(null)

  useEffect(() => {
    listSessions()
      .then(setSessions)
      .catch((err) => {
        toast.error(err.message)
        setSessions([])
      })
  }, [])

  async function handleDelete(id) {
    try {
      await deleteSession(id)
      setSessions((list) => list.filter((s) => s.id !== id))
      toast('Usunięto z historii.')
    } catch (err) {
      toast.error(err.message)
    }
  }

  const doneCount = sessions?.filter((s) => s.done_at).length ?? 0
  const ratings = sessions?.filter((s) => s.rating).map((s) => s.rating) ?? []
  const average = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1).replace('.', ',') : null

  return (
    <PageShell>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-[32px] leading-10 font-medium tracking-[-0.64px]">Historia</h1>
        {sessions?.length ? (
          <p className="text-sm text-ink-muted">
            Dobrane: {sessions.length} · zrobione: {doneCount}
            {average ? ` · średnia ocena: ${average}/5` : ''}
          </p>
        ) : null}
      </div>

      {!sessions ? (
        <div className="grid gap-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-[112px] rounded-card" />)}
        </div>
      ) : sessions.length === 0 ? (
        <div className="flex flex-col items-start gap-4 rounded-card bg-surface p-8">
          <p className="text-sm text-ink-muted">Nie masz jeszcze żadnych treningów.</p>
          <Button asChild>
            <Link to="/">Dobierz pierwszy</Link>
          </Button>
        </div>
      ) : (
        <ul className="grid gap-3">
          {sessions.map((s) => (
            <li key={s.id} className="group relative grid grid-cols-[120px_1fr] items-center gap-4 rounded-card bg-surface p-3 sm:grid-cols-[176px_1fr_auto] sm:p-4">
              <VideoThumb video={s.video} />
              <Link to={`/s/${s.id}`} className="flex min-w-0 flex-col gap-1 outline-none after:absolute after:inset-0 after:rounded-card focus-visible:after:ring-3 focus-visible:after:ring-ring/50">
                <span className="line-clamp-2 text-sm leading-5 font-medium sm:text-base sm:leading-6">
                  {s.video?.title ?? 'Film usunięty z biblioteki'}
                </span>
                <span className="line-clamp-1 text-sm text-ink-muted">„{s.mood}”</span>
                <span className="text-xs text-ink-muted">{dateLabel(s.created_at)}</span>
              </Link>
              <div className="relative z-10 col-span-2 flex items-center justify-end gap-2 sm:col-span-1">
                {s.rating ? <StarRating value={s.rating} size="sm" /> : null}
                {s.done_at && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-black px-3 text-xs leading-7 font-medium text-white">
                    <Check className="size-3.5" aria-hidden />
                    Zrobione
                  </span>
                )}
                <Button variant="ghost" size="icon-sm" aria-label="Usuń z historii" onClick={() => handleDelete(s.id)}>
                  <Trash2 />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  )
}
