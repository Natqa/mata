import { Loader2, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { PageShell } from '@/components/AppHeader'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { listVideos, recommend } from '@/lib/api'

const MOOD_CHIPS = [
  'Jestem zmęczona',
  'Czuję stres',
  'Mam dużo energii',
  'Boli mnie kark',
  'Sztywne plecy',
  'Nie mogę zasnąć',
  'Chcę się zmęczyć',
]

const TIME_OPTIONS = [
  { value: 15, label: 'do 15 min' },
  { value: 30, label: 'do 30 min' },
  { value: 45, label: 'do 45 min' },
  { value: 0, label: 'bez limitu' },
]

export function HomePage() {
  const navigate = useNavigate()
  const [mood, setMood] = useState('')
  const [maxMinutes, setMaxMinutes] = useState(30)
  const [busy, setBusy] = useState(false)
  const [videoCount, setVideoCount] = useState(null)

  useEffect(() => {
    listVideos()
      .then((v) => setVideoCount(v.length))
      .catch((err) => toast.error(err.message))
  }, [])

  function addChip(text) {
    setMood((m) => (m.trim() ? `${m.trim().replace(/[.,]$/, '')}, ${text.toLowerCase()}` : text))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!mood.trim()) return
    setBusy(true)
    try {
      const session = await recommend({ mood: mood.trim(), maxMinutes })
      navigate(`/s/${session.id}`)
    } catch (err) {
      toast.error(err.message)
      setBusy(false)
    }
  }

  const emptyLibrary = videoCount === 0

  return (
    <PageShell>
      <section className="mx-auto flex w-full max-w-[720px] flex-col gap-8 pt-6 sm:pt-12">
        <h1 className="text-[32px] leading-10 font-medium tracking-[-0.64px] sm:text-[48px] sm:leading-14 sm:tracking-[-0.96px]">
          Jak się dziś czujesz?
        </h1>

        {emptyLibrary && (
          <p className="rounded-card bg-surface p-4 text-sm leading-5">
            Biblioteka filmów jest pusta.{' '}
            <Link to="/biblioteka" className="font-medium underline underline-offset-4">Pobierz filmy z kanału</Link>, a potem wróć tutaj.
          </p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <Textarea
              aria-label="Opis nastroju"
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              maxLength={1000}
              placeholder="Np. cały dzień przy komputerze, sztywny kark, trochę nerwów. Chcę się rozluźnić przed snem."
              className="min-h-[140px] text-base leading-6"
            />
            <div className="flex flex-wrap gap-2">
              {MOOD_CHIPS.map((chip) => (
                <Button key={chip} type="button" variant="secondary" size="sm" onClick={() => addChip(chip)}>
                  {chip}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-sm font-medium">Ile masz czasu?</span>
            <div className="flex flex-wrap gap-1" role="radiogroup" aria-label="Czas">
              {TIME_OPTIONS.map((t) => (
                <Button
                  key={t.value}
                  type="button"
                  variant="ghost"
                  role="radio"
                  aria-checked={maxMinutes === t.value}
                  data-active={maxMinutes === t.value}
                  onClick={() => setMaxMinutes(t.value)}
                >
                  {t.label}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Button type="submit" size="lg" disabled={busy || !mood.trim() || emptyLibrary}>
              {busy ? <Loader2 className="animate-spin" /> : <Sparkles />}
              {busy ? 'AI dobiera trening…' : 'Dobierz trening'}
            </Button>
          </div>
        </form>
      </section>
    </PageShell>
  )
}
