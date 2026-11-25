import { Clock, PlayCircle } from 'lucide-react'
import { isMockVideo, minutes } from '@/lib/format'
import { cn } from '@/lib/utils'

/** Miniatura filmu. W trybie mock (brak prawdziwych miniatur) szary kafel z ikoną. */
export function VideoThumb({ video, className }) {
  return (
    <div className={cn('relative aspect-video overflow-hidden rounded-lg bg-surface-strong', className)}>
      {video?.thumbnail_url ? (
        <img src={video.thumbnail_url} alt="" loading="lazy" className="size-full object-cover" />
      ) : (
        <div className="flex size-full items-center justify-center text-icon">
          <PlayCircle className="size-10" strokeWidth={1.5} />
        </div>
      )}
      {video?.duration_sec ? (
        <span className="absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-full bg-black/75 px-2 text-xs leading-6 font-medium text-white">
          <Clock className="size-3" aria-hidden />
          {minutes(video.duration_sec)}
        </span>
      ) : null}
    </div>
  )
}

/** Odtwarzacz YouTube (wersja bez ciasteczek). W trybie mock zamiast filmu jest kafel. */
export function VideoPlayer({ video }) {
  if (!video) return null
  if (isMockVideo(video.id)) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-lg bg-surface-strong p-6 text-center text-ink-muted">
        <PlayCircle className="size-12" strokeWidth={1.5} aria-hidden />
        <p className="text-sm font-medium">Film przykładowy (tryb mock)</p>
        <p className="text-xs">Po podłączeniu Supabase tu będzie prawdziwy film z YouTube.</p>
      </div>
    )
  }
  return (
    <iframe
      key={video.id}
      src={`https://www.youtube-nocookie.com/embed/${video.id}?rel=0`}
      title={video.title}
      className="aspect-video w-full rounded-lg bg-black"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
      allowFullScreen
    />
  )
}
