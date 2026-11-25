// Tryb mock: to samo API co api.supabase.js, ale na localStorage.
// "AI" w trybie mock to proste dopasowanie słów kluczowych.

import { DEFAULT_CHANNELS, channelLabel } from '@/lib/channels'
import { currentUserId } from '@/lib/mock/auth'
import { SAMPLE_VIDEOS, delay, readDb, updateDb } from '@/lib/mock/store'

const withVideo = (db, s) => ({
  ...s,
  video: db.videos.find((v) => v.id === s.video_id) ?? null,
  alternatives: s.alternatives.map((a) => ({ ...a, video: db.videos.find((v) => v.id === a.video_id) ?? null })),
})

export async function listVideos() {
  await delay(150)
  return [...readDb().videos].sort((a, b) => b.published_at.localeCompare(a.published_at))
}

/** Mock: każdy kanał z listy dostaje swoją część przykładowych filmów. */
export async function syncVideos(channel) {
  await delay(500)
  const index = Math.max(0, DEFAULT_CHANNELS.findIndex((c) => channelLabel(c) === channelLabel(channel)))
  const channelTitle = `${channelLabel(channel).slice(1)} (przykład)`
  const rows = SAMPLE_VIDEOS.filter((v) => v.channel_index === index).map((v) => {
    const row = { ...v, channel_title: channelTitle }
    delete row.channel_index
    return row
  })
  updateDb((db) => {
    const ids = new Set(rows.map((r) => r.id))
    db.videos = [...db.videos.filter((v) => !ids.has(v.id)), ...rows]
  })
  return { count: rows.length, channelTitle }
}

export async function listSessions() {
  await delay(150)
  const userId = currentUserId()
  const db = readDb()
  return db.sessions
    .filter((s) => s.user_id === userId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((s) => withVideo(db, s))
}

export async function getSession(id) {
  await delay(100)
  const userId = currentUserId()
  const db = readDb()
  const s = db.sessions.find((x) => x.id === id && x.user_id === userId)
  if (!s) throw new Error('Nie znaleziono tej sesji.')
  return withVideo(db, s)
}

export async function setSessionDone(id, done) {
  const userId = currentUserId()
  updateDb((db) => {
    const s = db.sessions.find((x) => x.id === id && x.user_id === userId)
    if (s) s.done_at = done ? new Date().toISOString() : null
  })
}

export async function rateSession(id, { rating, note, videoId, doneAt }) {
  await delay(200)
  const userId = currentUserId()
  const now = new Date().toISOString()
  return updateDb((db) => {
    const s = db.sessions.find((x) => x.id === id && x.user_id === userId)
    if (!s) throw new Error('Nie znaleziono tej sesji.')
    Object.assign(s, { rating, rating_note: note || null, rated_video_id: videoId, rated_at: now, done_at: doneAt ?? now })
    const { rating_note, rated_video_id, rated_at, done_at } = s
    return { rating: s.rating, rating_note, rated_video_id, rated_at, done_at }
  })
}

export async function deleteSession(id) {
  const userId = currentUserId()
  updateDb((db) => {
    db.sessions = db.sessions.filter((x) => !(x.id === id && x.user_id === userId))
  })
}

const KEYWORDS = [
  [/stres|nerw|napię|niepok|spię|lęk/i, /stres|napięci|wycisz|rozluź/i],
  [/zmęcz|senn|bez sił|wyczerp|słab/i, /łagodn|regenera|yin|rozluź|spok/i],
  [/sen|zasn|wieczór|wieczor|bezsen/i, /snem|wieczor|zasn/i],
  [/energ|motyw|siła|silna|silny|wysił|dynam/i, /energi|dynamicz|siła|siłę|flow/i],
  [/kark|szyj|ramion|bark/i, /kark|ramion|bark/i],
  [/plecy|kręgosł|lędźw|krzyż/i, /kręgosłup|plecy|lędźw/i],
  [/biodr|pośladk/i, /biodr/i],
  [/rano|poranek|budz/i, /poran|start dnia|budz/i],
]

export async function recommend({ mood, maxMinutes }) {
  await delay(1200)
  const userId = currentUserId()
  const db = readDb()
  if (!db.videos.length) throw new Error('Biblioteka jest pusta. Najpierw pobierz filmy z kanału.')

  const fits = db.videos.filter((v) => !maxMinutes || v.duration_sec / 60 <= maxMinutes)
  const pool = fits.length ? fits : db.videos
  const scored = pool
    .map((v) => {
      const text = `${v.title} ${v.description}`
      const score = KEYWORDS.reduce((sum, [moodRe, videoRe]) => sum + (moodRe.test(mood) && videoRe.test(text) ? 1 : 0), 0)
      return { v, score }
    })
    .sort((a, b) => b.score - a.score || a.v.duration_sec - b.v.duration_sec)

  const [best, ...rest] = scored
  const reasonFor = (v, main) =>
    main
      ? `Tryb mock: „${v.title}” najlepiej pasuje słowami do Twojego opisu. Z prawdziwym AI dostaniesz tu osobiste uzasadnienie.`
      : `Zapasowa propozycja (${Math.round(v.duration_sec / 60)} min).`

  const session = {
    id: crypto.randomUUID(),
    user_id: userId,
    mood,
    max_minutes: maxMinutes || null,
    video_id: best.v.id,
    reason: reasonFor(best.v, true),
    alternatives: rest.slice(0, 2).map(({ v }) => ({ video_id: v.id, reason: reasonFor(v, false) })),
    model: 'mock',
    done_at: null,
    created_at: new Date().toISOString(),
  }
  updateDb((d) => d.sessions.push(session))
  return session
}
