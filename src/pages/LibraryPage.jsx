import { Loader2, Plus, RefreshCw } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { PageShell } from '@/components/AppHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { VideoThumb } from '@/components/Video'
import { listVideos, syncVideos } from '@/lib/api'
import { DEFAULT_CHANNELS, channelLabel } from '@/lib/channels'
import { isMockVideo, youtubeUrl } from '@/lib/format'

/** Filmy z kanałów, z których AI wybiera trening. Tu też pobiera się je z YouTube. */
export function LibraryPage() {
  const [videos, setVideos] = useState(null)
  const [progress, setProgress] = useState(null) // np. "@bognayoga (2/3)"
  const [extra, setExtra] = useState('')
  const [channelFilter, setChannelFilter] = useState('all')

  useEffect(() => {
    listVideos()
      .then(setVideos)
      .catch((err) => {
        toast.error(err.message)
        setVideos([])
      })
  }, [])

  /** Pobiera kanały po kolei. Błąd jednego kanału nie zatrzymuje pozostałych. */
  async function sync(channels) {
    let total = 0
    const failed = []
    for (const [i, channel] of channels.entries()) {
      setProgress(`${channelLabel(channel)} (${i + 1}/${channels.length})`)
      try {
        const { count } = await syncVideos(channel)
        total += count
      } catch (err) {
        failed.push(channelLabel(channel))
        toast.error(`${channelLabel(channel)}: ${err.message}`)
      }
    }
    setProgress(null)
    if (total) toast(`Pobrano ${total} filmów.`)
    if (failed.length < channels.length) setVideos(await listVideos())
    return failed.length === 0
  }

  async function handleExtra(event) {
    event.preventDefault()
    if (await sync([extra.trim()])) setExtra('')
  }

  const channelTitles = useMemo(() => {
    const counts = new Map()
    for (const v of videos ?? []) counts.set(v.channel_title, (counts.get(v.channel_title) ?? 0) + 1)
    return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [videos])

  const shown = channelFilter === 'all' ? videos : videos?.filter((v) => v.channel_title === channelFilter)
  const busy = Boolean(progress)

  return (
    <PageShell>
      <div className="flex flex-col gap-2">
        <h1 className="text-[32px] leading-10 font-medium tracking-[-0.64px]">Biblioteka</h1>
        <p className="text-sm text-ink-muted">
          {videos?.length ? `${videos.length} filmów z ${channelTitles.length} kanałów. ` : ''}
          AI wybiera trening tylko z tych filmów.
        </p>
      </div>

      <section className="flex flex-col gap-4 rounded-card bg-surface p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          {DEFAULT_CHANNELS.map((c) => (
            <a key={c} href={c} target="_blank" rel="noreferrer"
              className="rounded-full bg-background px-4 text-sm leading-10 font-medium outline-none hover:bg-surface-strong focus-visible:ring-3 focus-visible:ring-ring/50">
              {channelLabel(c)}
            </a>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="lg" disabled={busy} onClick={() => sync(DEFAULT_CHANNELS)}>
            {busy ? <Loader2 className="animate-spin" /> : <RefreshCw />}
            {busy ? `Pobieranie: ${progress}` : videos?.length ? 'Odśwież filmy ze wszystkich kanałów' : 'Pobierz filmy ze wszystkich kanałów'}
          </Button>
        </div>
        <form onSubmit={handleExtra} className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            aria-label="Link do innego kanału YouTube"
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
            required
            placeholder="Dodaj inny kanał: https://www.youtube.com/@nazwa"
            className="bg-background"
          />
          <Button type="submit" variant="ghost" disabled={busy} className="shrink-0">
            <Plus />
            Dodaj kanał
          </Button>
        </form>
      </section>

      {channelTitles.length > 1 && (
        <div className="flex flex-wrap gap-1" role="tablist" aria-label="Filtr kanału">
          {[['all', videos.length], ...channelTitles].map(([title, count]) => (
            <Button key={title} variant="ghost" role="tab" aria-selected={channelFilter === title}
              data-active={channelFilter === title} onClick={() => setChannelFilter(title)}>
              {title === 'all' ? 'Wszystkie' : title}
              <span className="text-ink-muted">{count}</span>
            </Button>
          ))}
        </div>
      )}

      {!videos ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="aspect-video rounded-card" />)}
        </div>
      ) : videos.length === 0 ? (
        <p className="text-sm text-ink-muted">Brak filmów. Kliknij „Pobierz filmy ze wszystkich kanałów”.</p>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((v) => {
            const inner = (
              <>
                <VideoThumb video={v} />
                <span className="flex flex-col gap-0.5">
                  <span className="line-clamp-2 text-sm leading-5 font-medium">{v.title}</span>
                  <span className="text-xs text-ink-muted">{v.channel_title}</span>
                </span>
              </>
            )
            return (
              <li key={v.id} className="rounded-card bg-surface p-3">
                {isMockVideo(v.id) ? (
                  <div className="flex flex-col gap-3">{inner}</div>
                ) : (
                  <a href={youtubeUrl(v.id)} target="_blank" rel="noreferrer" className="flex flex-col gap-3 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                    {inner}
                  </a>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </PageShell>
  )
}
