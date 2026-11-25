import { Check, ExternalLink, RotateCcw, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { PageShell } from '@/components/AppHeader'
import { FullPageSpinner } from '@/components/FullPageSpinner'
import { RatingCard } from '@/components/RatingCard'
import { Button } from '@/components/ui/button'
import { VideoPlayer, VideoThumb } from '@/components/Video'
import { getSession, setSessionDone } from '@/lib/api'
import { dateLabel, isMockVideo, minutes, youtubeUrl } from '@/lib/format'
import { cn } from '@/lib/utils'

/** Wynik doboru: główny film, uzasadnienie AI i dwie alternatywy do przełączenia. */
export function SessionPage() {
  const { id } = useParams()
  const [session, setSession] = useState(null)
  const [error, setError] = useState(null)
  const [activeId, setActiveId] = useState(null)

  useEffect(() => {
    getSession(id)
      .then((s) => {
        setSession(s)
        // Po ocenie wracamy do filmu, który był oceniony.
        setActiveId(s.rated_video_id ?? s.video_id)
      })
      .catch((err) => setError(err.message))
  }, [id])

  if (error) {
    return (
      <PageShell>
        <p className="text-sm text-destructive">{error}</p>
      </PageShell>
    )
  }
  if (!session) return <FullPageSpinner />

  const options = [
    { video: session.video, reason: session.reason, main: true },
    ...session.alternatives.map((a) => ({ video: a.video, reason: a.reason, main: false })),
  ].filter((o) => o.video)
  const active = options.find((o) => o.video.id === activeId) ?? options[0]
  const done = Boolean(session.done_at)

  async function toggleDone() {
    const next = !done
    try {
      await setSessionDone(session.id, next)
      setSession((s) => ({ ...s, done_at: next ? new Date().toISOString() : null }))
      toast(next ? 'Brawo! Trening zapisany jako zrobiony.' : 'Odznaczono.')
    } catch (err) {
      toast.error(err.message)
    }
  }

  if (!active) {
    return (
      <PageShell>
        <p className="text-sm text-ink-muted">Film z tej sesji nie jest już w bibliotece.</p>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="flex min-w-0 flex-col gap-6">
          <VideoPlayer video={active.video} />
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl leading-8 font-medium tracking-[-0.48px]">{active.video.title}</h1>
            <p className="text-sm text-ink-muted">
              {minutes(active.video.duration_sec)} · {active.video.channel_title}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={toggleDone} variant={done ? 'secondary' : 'default'}>
              <Check />
              {done ? 'Zrobione' : 'Oznacz jako zrobione'}
            </Button>
            {!isMockVideo(active.video.id) && (
              <Button asChild variant="secondary">
                <a href={youtubeUrl(active.video.id)} target="_blank" rel="noreferrer">
                  <ExternalLink />
                  Otwórz na YouTube
                </a>
              </Button>
            )}
            <Button asChild variant="ghost">
              <Link to="/">
                <RotateCcw />
                Dobierz jeszcze raz
              </Link>
            </Button>
          </div>
          <RatingCard
            key={session.rated_at ?? 'new'}
            session={session}
            video={active.video}
            onSaved={(saved) => setSession((s) => ({ ...s, ...saved }))}
          />
        </section>

        <aside className="flex flex-col gap-4 self-start rounded-card bg-surface p-6">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium tracking-wide text-ink-muted uppercase">Twój nastrój</span>
            <p className="text-sm leading-5 font-medium">„{session.mood}”</p>
            <p className="text-xs text-ink-muted">
              {dateLabel(session.created_at)}
              {session.max_minutes ? ` · do ${session.max_minutes} min` : ''}
            </p>
          </div>

          <div className="flex flex-col gap-2 rounded-lg bg-background p-4">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted">
              <Sparkles className="size-3.5" aria-hidden />
              {active.main ? 'Dlaczego ten film' : 'Alternatywa'}
            </span>
            <p className="text-sm leading-5">{active.reason}</p>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium tracking-wide text-ink-muted uppercase">Propozycje</span>
            {options.map((o) => (
              <button
                key={o.video.id}
                type="button"
                onClick={() => setActiveId(o.video.id)}
                aria-pressed={o.video.id === active.video.id}
                className={cn(
                  'grid grid-cols-[112px_1fr] items-center gap-3 rounded-lg p-2 text-left transition-colors outline-none hover:bg-surface-strong focus-visible:ring-3 focus-visible:ring-ring/50',
                  o.video.id === active.video.id && 'bg-surface-strong',
                )}
              >
                <VideoThumb video={o.video} />
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="line-clamp-2 text-sm leading-5 font-medium">{o.video.title}</span>
                  <span className="text-xs text-ink-muted">{o.main ? 'Wybór AI' : 'Alternatywa'}</span>
                </span>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </PageShell>
  )
}
