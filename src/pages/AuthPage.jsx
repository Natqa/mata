import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Logo } from '@/components/Logo'
import { useAuth } from '@/context/AuthContext'
import { DEMO_EMAIL, DEMO_PASSWORD, ensureDemoUser } from '@/lib/mock/store'
import { isMockMode } from '@/lib/supabase'

const COPY = {
  login: { title: 'Dobrze Cię widzieć', submit: 'Zaloguj się', busy: 'Logowanie…' },
  signup: { title: 'Rozwiń matę', submit: 'Załóż konto', busy: 'Zakładanie konta…' },
}

const MOODS = ['zmęczenie', 'stres', 'energia', 'sztywny kark', 'bez snu', 'motywacja']

/** Logowanie i rejestracja. mode: 'login' | 'signup' */
export function AuthPage({ mode }) {
  const { signIn, signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const copy = COPY[mode]

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    setNotice(null)
    setBusy(true)
    const { data, error: authError } = mode === 'login' ? await signIn(email, password) : await signUp(email, password)
    setBusy(false)
    if (authError) return setError(authError.message)
    if (mode === 'signup' && !data.session) {
      setNotice('Sprawdź skrzynkę i potwierdź adres email. Potem się zaloguj.')
    }
  }

  async function handleDemo() {
    setError(null)
    setBusy(true)
    await ensureDemoUser()
    const { error: authError } = await signIn(DEMO_EMAIL, DEMO_PASSWORD)
    if (authError) setError(authError.message)
    setBusy(false)
  }

  return (
    <div className="theme-yoga flex min-h-svh gap-6 bg-background p-4 text-foreground sm:p-6 lg:h-svh">
      <div className="flex flex-1 flex-col">
        <Logo to="/login" />
        <div className="flex flex-1 items-center justify-center py-12 lg:justify-start lg:pl-12 xl:pl-[124px]">
          <div className="flex w-full max-w-[472px] flex-col gap-12">
            <h1 className="text-[32px] leading-10 font-medium tracking-[-0.64px] sm:text-[40px] sm:leading-12 sm:tracking-[-0.8px]">
              {copy.title}
            </h1>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="flex gap-1" role="tablist" aria-label="Logowanie lub rejestracja">
                <Button asChild variant="ghost" data-active={mode === 'login'} role="tab" aria-selected={mode === 'login'}>
                  <Link to="/login" replace>Logowanie</Link>
                </Button>
                <Button asChild variant="ghost" data-active={mode === 'signup'} role="tab" aria-selected={mode === 'signup'}>
                  <Link to="/signup" replace>Rejestracja</Link>
                </Button>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required autoComplete="email" placeholder="Wpisz swój email"
                  value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Hasło</Label>
                <Input id="password" type="password" required minLength={6}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  placeholder="Co najmniej 6 znaków" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>

              {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
              {notice && <p role="status" className="rounded-card bg-surface p-4 text-sm leading-5">{notice}</p>}

              <div className="flex flex-wrap gap-2">
                <Button type="submit" size="lg" disabled={busy}>{busy ? copy.busy : copy.submit}</Button>
                {isMockMode && (
                  <Button type="button" variant="secondary" size="lg" disabled={busy} onClick={handleDemo}>
                    Konto demo
                  </Button>
                )}
              </div>
            </form>

            {isMockMode && (
              <p className="-mt-6 rounded-card bg-surface p-4 text-sm leading-5 text-ink-muted">
                <span className="font-medium text-foreground">Tryb mock.</span> Supabase nie jest podłączony,
                więc dane zostają w tej przeglądarce. Załóż konto na dowolny email albo użyj konta demo
                ({DEMO_EMAIL} / {DEMO_PASSWORD}).
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Prawy panel: szara karta jak w Inspiration Board, zamiast zdjęcia "chmurka" nastrojów. */}
      <div className="hidden w-1/2 flex-col justify-between overflow-hidden rounded-card bg-surface p-16 lg:flex xl:p-24">
        <p className="text-sm font-medium text-ink-muted">Mata · joga dobrana do nastroju</p>
        <div className="flex flex-col gap-8">
          <p className="max-w-[440px] text-[40px] leading-12 font-medium tracking-[-0.8px]">
            Napisz, jak się czujesz. AI wybierze trening z Twojego ulubionego kanału.
          </p>
          <div className="flex max-w-[440px] flex-wrap gap-2">
            {MOODS.map((m) => (
              <span key={m} className="rounded-full bg-surface-strong px-4 text-sm leading-10 font-medium">{m}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
