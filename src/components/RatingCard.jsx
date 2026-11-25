import { Loader2, Pencil } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { RATING_LABELS, StarRating } from '@/components/StarRating'
import { rateSession } from '@/lib/api'

/**
 * "Jak było?" pod filmem. Ocena dotyczy filmu, który jest teraz włączony
 * (wybór AI albo alternatywa). AI bierze oceny pod uwagę przy kolejnych doborach.
 */
export function RatingCard({ session, video, onSaved }) {
  const rated = Boolean(session.rating)
  const [editing, setEditing] = useState(!rated)
  const [rating, setRating] = useState(session.rating ?? 0)
  const [note, setNote] = useState(session.rating_note ?? '')
  const [busy, setBusy] = useState(false)

  const ratedOtherVideo = rated && session.rated_video_id && session.rated_video_id !== video.id

  async function handleSave(event) {
    event.preventDefault()
    if (!rating) return
    setBusy(true)
    try {
      const saved = await rateSession(session.id, {
        rating,
        note: note.trim(),
        videoId: video.id,
        doneAt: session.done_at,
      })
      onSaved(saved)
      setEditing(false)
      toast('Dzięki! AI weźmie to pod uwagę następnym razem.')
    } catch (err) {
      toast.error(err.message)
    }
    setBusy(false)
  }

  if (!editing) {
    return (
      <section className="flex flex-col gap-3 rounded-card bg-surface p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium tracking-wide text-ink-muted uppercase">Twoja ocena</span>
            <div className="flex items-center gap-2">
              <StarRating value={session.rating} />
              <span className="text-sm font-medium">{RATING_LABELS[session.rating]}</span>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
            <Pencil />
            Zmień
          </Button>
        </div>
        {session.rating_note && <p className="text-sm leading-5">„{session.rating_note}”</p>}
        {ratedOtherVideo && (
          <p className="text-xs text-ink-muted">Ocena dotyczy innego filmu z tej sesji.</p>
        )}
      </section>
    )
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-4 rounded-card bg-surface p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg leading-6 font-medium">Jak było?</h2>
        <p className="text-sm text-ink-muted">Oceniasz film: {video.title}</p>
      </div>
      <StarRating value={rating} onChange={setRating} />
      <Textarea
        aria-label="Notatka do oceny (opcjonalnie)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={500}
        placeholder="Opcjonalnie: jak się czujesz po treningu? Co było za łatwe albo za trudne?"
        className="min-h-[80px] bg-background"
      />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={!rating || busy}>
          {busy && <Loader2 className="animate-spin" />}
          Zapisz ocenę
        </Button>
        {rated && (
          <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
            Anuluj
          </Button>
        )}
      </div>
    </form>
  )
}
