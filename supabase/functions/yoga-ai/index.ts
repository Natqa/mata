// Edge Function: yoga-ai
// Wklej cały plik w Supabase Dashboard → Edge Functions → (funkcja "yoga-ai") → Code.
//
// Request: POST { action, ...params }   (tylko dla zalogowanych)
//
//   action: "sync-videos"   { channel }
//     channel: link do kanału (https://www.youtube.com/@nazwa), "@nazwa" albo id "UC…".
//     Pobiera filmy z kanału przez YouTube Data API i zapisuje je w tabeli videos.
//     Pomija Shorts i filmy krótsze niż 3 minuty.
//     → { count, channelTitle }
//
//   action: "recommend"     { mood, maxMinutes? }
//     AI (OpenAI) czyta opis nastroju i listę filmów, wybiera najlepszy trening
//     i dwa zapasowe. Wynik zapisuje się w tabeli sessions jako zalogowana osoba.
//     → { session }
//
// Sekrety (Edge Functions → Secrets):
//   YOUTUBE_API_KEY  wymagany dla sync-videos
//   OPENAI_API_KEY   wymagany dla recommend
//   OPENAI_MODEL     opcjonalny, domyślnie "gpt-6-luna"
// SUPABASE_URL, SUPABASE_ANON_KEY i SUPABASE_SERVICE_ROLE_KEY Supabase dodaje sam.

import { createClient, type SupabaseClient, type User } from 'npm:@supabase/supabase-js@2'

// ================================================================= helpers ==

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function requireEnv(name: string) {
  const value = Deno.env.get(name)
  if (!value) throw new HttpError(500, `Na serwerze brakuje sekretu ${name}.`)
  return value
}

const OPENAI_MODEL = () => Deno.env.get('OPENAI_MODEL') || 'gpt-6-luna'

/** Sprawdza sesję. Zwrócony klient działa jako ta osoba, więc RLS obowiązuje. */
async function getUserClient(req: Request): Promise<{ supabase: SupabaseClient; user: User }> {
  const authHeader = req.headers.get('Authorization') ?? ''
  const token = authHeader.replace(/^Bearer\s+/i, '')
  if (!token) throw new HttpError(401, 'Zaloguj się, żeby korzystać z AI.')

  const supabase = createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_ANON_KEY'), {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) throw new HttpError(401, 'Sesja wygasła. Zaloguj się ponownie.')
  return { supabase, user: data.user }
}

function adminClient() {
  return createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

// ============================================================= sync-videos ==

const YT = 'https://www.googleapis.com/youtube/v3'
const MAX_VIDEOS = 200
const MIN_DURATION_SEC = 180

async function yt(path: string, params: Record<string, string>) {
  const url = new URL(`${YT}/${path}`)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  url.searchParams.set('key', requireEnv('YOUTUBE_API_KEY'))
  const res = await fetch(url)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    console.error('YouTube error', res.status, data)
    throw new HttpError(502, `YouTube: ${data?.error?.message ?? `błąd (${res.status})`}`)
  }
  return data
}

/** "https://www.youtube.com/@nazwa/videos" → { forHandle: "@nazwa" } itd. */
function parseChannel(input: string): Record<string, string> {
  const value = input.trim()
  const id = value.match(/(UC[\w-]{22})/)
  if (id) return { id: id[1] }
  const handle = value.match(/@([\w.\-]+)/)
  if (handle) return { forHandle: `@${handle[1]}` }
  const user = value.match(/youtube\.com\/(?:user|c)\/([\w.\-]+)/)
  if (user) return { forUsername: user[1] }
  if (/^[\w.\-]+$/.test(value)) return { forHandle: `@${value}` }
  throw new HttpError(400, 'Nie rozpoznaję kanału. Wklej link w formie https://www.youtube.com/@nazwa.')
}

/** ISO 8601 "PT1H2M3S" → sekundy */
function parseDuration(iso = '') {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!m) return 0
  return Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0)
}

async function syncVideos(body: Record<string, unknown>) {
  const channelInput = String(body.channel ?? '')
  if (!channelInput.trim()) throw new HttpError(400, 'Podaj link do kanału.')

  const channels = await yt('channels', { part: 'snippet,contentDetails', ...parseChannel(channelInput) })
  const channel = channels.items?.[0]
  if (!channel) throw new HttpError(404, 'Nie znalazłam takiego kanału na YouTube.')
  const uploads = channel.contentDetails.relatedPlaylists.uploads

  // Id filmów z playlisty "uploads" (po 50 na stronę).
  const ids: string[] = []
  let pageToken = ''
  do {
    const page = await yt('playlistItems', {
      part: 'contentDetails',
      playlistId: uploads,
      maxResults: '50',
      ...(pageToken ? { pageToken } : {}),
    })
    for (const item of page.items ?? []) ids.push(item.contentDetails.videoId)
    pageToken = page.nextPageToken ?? ''
  } while (pageToken && ids.length < MAX_VIDEOS)

  // Szczegóły: tytuł, opis, długość.
  const rows = []
  for (let i = 0; i < ids.length; i += 50) {
    const details = await yt('videos', { part: 'snippet,contentDetails', id: ids.slice(i, i + 50).join(',') })
    for (const v of details.items ?? []) {
      const duration = parseDuration(v.contentDetails?.duration)
      if (duration < MIN_DURATION_SEC) continue // Shorts, zapowiedzi, transmisje w przyszłości
      const thumbs = v.snippet.thumbnails ?? {}
      rows.push({
        id: v.id,
        channel_id: channel.id,
        channel_title: channel.snippet.title,
        title: v.snippet.title,
        description: (v.snippet.description ?? '').slice(0, 2000),
        duration_sec: duration,
        thumbnail_url: (thumbs.maxres ?? thumbs.high ?? thumbs.medium ?? thumbs.default)?.url ?? null,
        published_at: v.snippet.publishedAt,
        synced_at: new Date().toISOString(),
      })
    }
  }

  const { error } = await adminClient().from('videos').upsert(rows, { onConflict: 'id' })
  if (error) throw new HttpError(500, `Zapis filmów nie powiódł się: ${error.message}`)

  return { count: rows.length, channelTitle: channel.snippet.title }
}

// =============================================================== recommend ==

const PROMPT_VIDEOS = 300

const RECOMMEND_INSTRUCTIONS = `Jesteś ciepłą, rzeczową instruktorką jogi.
Dostajesz opis samopoczucia osoby i listę filmów z kilku polskich kanałów YouTube z jogą.
Wybierz JEDEN film, który najlepiej pasuje do jej nastroju, ciała i dostępnego czasu,
oraz dokładnie DWA inne filmy jako alternatywy (różne od głównego).
Jeśli to możliwe, weź alternatywy z innych kanałów niż główny film, żeby był wybór prowadzącej.

Zasady:
- Wybieraj tylko id z listy. Nie wymyślaj filmów.
- Jeśli podano limit minut, nie przekraczaj go (chyba że żaden film nie pasuje).
- Zmęczenie, stres, ból, słaby sen → łagodna, relaksująca, regenerująca praktyka.
- Dużo energii, motywacja, chęć wysiłku → dynamiczna praktyka, flow, siła.
- Konkretne dolegliwości (kark, plecy, biodra) → film na tę część ciała, jeśli jest.
- Zdrowie: przy ostrym bólu, urazie lub ciąży zaznacz w uzasadnieniu, by słuchać ciała i skonsultować się z lekarzem.

Oceny poprzednich treningów (jeśli są):
- Wysoko ocenione (4–5) mówią, jaki styl, prowadząca i długość tej osobie odpowiadają. Szukaj podobnych.
- Nisko ocenione (1–2) omijaj, chyba że nic innego nie pasuje. Przeczytaj notatki: mówią, co było nie tak.
- Ulubiony film możesz polecić ponownie, ale zwykle wybieraj coś nowego w podobnym stylu.
- Jeśli ocena wpłynęła na wybór, wspomnij o tym krótko w uzasadnieniu.

Uzasadnienia pisz po polsku, w drugiej osobie, 1–2 krótkie zdania, bez markdown.
Gdy możesz, unikaj form zależnych od płci.`

const RECOMMEND_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['video_id', 'reason', 'alternatives'],
  properties: {
    video_id: { type: 'string' },
    reason: { type: 'string' },
    alternatives: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['video_id', 'reason'],
        properties: { video_id: { type: 'string' }, reason: { type: 'string' } },
      },
    },
  },
}

async function openaiJson(input: string) {
  const res = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${requireEnv('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENAI_MODEL(),
      instructions: RECOMMEND_INSTRUCTIONS,
      input,
      text: { format: { type: 'json_schema', name: 'recommendation', strict: true, schema: RECOMMEND_SCHEMA } },
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    console.error('OpenAI error', res.status, data)
    throw new HttpError(502, `OpenAI: ${data?.error?.message ?? `błąd (${res.status})`}`)
  }
  const text = (data.output ?? [])
    .filter((item: { type: string }) => item.type === 'message')
    .flatMap((item: { content?: { type: string; text?: string }[] }) => item.content ?? [])
    .filter((p: { type: string }) => p.type === 'output_text')
    .map((p: { text: string }) => p.text)
    .join('')
  try {
    return JSON.parse(text)
  } catch {
    throw new HttpError(502, 'AI zwróciło nieczytelną odpowiedź. Spróbuj jeszcze raz.')
  }
}

type VideoRow = { id: string; title: string; channel_title: string | null }

/**
 * Ostatnie oceny tej osoby (RLS: tylko jej sesje), jako tekst do promptu.
 * Gdy migracja 002_ratings.sql nie jest uruchomiona, zwraca pusty tekst.
 */
async function ratingHistory(supabase: SupabaseClient, videos: VideoRow[]) {
  const { data, error } = await supabase
    .from('sessions')
    .select('rating, rating_note, rated_video_id, video_id, mood')
    .not('rating', 'is', null)
    .order('rated_at', { ascending: false })
    .limit(30)
  if (error) {
    console.warn('Ratings not loaded:', error.message)
    return ''
  }
  const byId = new Map(videos.map((v) => [v.id, v]))
  return (data ?? [])
    .map((s) => {
      const v = byId.get(s.rated_video_id ?? s.video_id)
      if (!v) return null
      const note = s.rating_note ? ` — notatka: "${s.rating_note.slice(0, 200)}"` : ''
      return `- ${s.rating}/5 | ${v.id} | ${v.channel_title} | ${v.title} | nastrój wtedy: "${s.mood.slice(0, 120)}"${note}`
    })
    .filter(Boolean)
    .join('\n')
}

async function recommend(body: Record<string, unknown>, supabase: SupabaseClient) {
  const mood = String(body.mood ?? '').trim().slice(0, 1000)
  if (!mood) throw new HttpError(400, 'Napisz, jak się dziś czujesz.')
  const maxMinutes = Number(body.maxMinutes) > 0 ? Math.round(Number(body.maxMinutes)) : null

  const { data: all, error } = await supabase
    .from('videos')
    .select('id, title, description, duration_sec, channel_title')
    .order('published_at', { ascending: false })
    .limit(MAX_VIDEOS * 5)
  if (error) throw new HttpError(500, error.message)
  if (!all?.length) throw new HttpError(409, 'Biblioteka jest pusta. Najpierw pobierz filmy z kanałów.')

  // Kilka kanałów to setki filmów. Najpierw odcinamy za długie (z 2 min zapasu),
  // potem bierzemy najnowsze, żeby lista zmieściła się w zapytaniu do AI.
  const fitting = maxMinutes ? all.filter((v) => (v.duration_sec ?? 0) <= (maxMinutes + 2) * 60) : all
  const videos = (fitting.length >= 3 ? fitting : all).slice(0, PROMPT_VIDEOS)

  const list = videos
    .map((v) => {
      const min = Math.round((v.duration_sec ?? 0) / 60)
      const desc = (v.description ?? '').replace(/\s+/g, ' ').slice(0, 160)
      return `${v.id} | ${min} min | ${v.channel_title} | ${v.title} | ${desc}`
    })
    .join('\n')

  const ratings = await ratingHistory(supabase, all)

  const input = `Samopoczucie: ${mood}
Limit czasu: ${maxMinutes ? `${maxMinutes} min` : 'brak'}

Oceny poprzednich treningów tej osoby (1–5):
${ratings || 'brak ocen'}

Filmy (id | długość | kanał | tytuł | opis):
${list}`

  const result = await openaiJson(input)
  const known = new Set(videos.map((v) => v.id))
  if (!known.has(result.video_id)) throw new HttpError(502, 'AI wybrało film spoza biblioteki. Spróbuj jeszcze raz.')
  const alternatives = (result.alternatives ?? [])
    .filter((a: { video_id: string }) => known.has(a.video_id) && a.video_id !== result.video_id)
    .slice(0, 2)

  const { data: session, error: insertError } = await supabase
    .from('sessions')
    .insert({
      mood,
      max_minutes: maxMinutes,
      video_id: result.video_id,
      reason: result.reason,
      alternatives,
      model: OPENAI_MODEL(),
    })
    .select()
    .single()
  if (insertError) throw new HttpError(500, insertError.message)

  return { session }
}

// ================================================================== router ==

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    if (req.method !== 'POST') throw new HttpError(405, 'Użyj POST.')
    const { supabase } = await getUserClient(req)
    const body = await req.json().catch(() => ({}))

    switch (body.action) {
      case 'sync-videos':
        return json(await syncVideos(body))
      case 'recommend':
        return json(await recommend(body, supabase))
      default:
        throw new HttpError(400, `Nieznana akcja: ${body.action}`)
    }
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500
    const message = err instanceof Error ? err.message : 'Nieznany błąd.'
    if (status >= 500) console.error(err)
    return json({ error: message }, status)
  }
})
