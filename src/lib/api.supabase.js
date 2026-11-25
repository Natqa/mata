// Dane z Supabase. Czytanie i zapis idą jako zalogowana osoba, więc RLS obowiązuje.
// Pobieranie filmów i sugestia AI idą przez Edge Function "yoga-ai",
// żeby klucze YouTube i OpenAI nigdy nie trafiły do przeglądarki.

import { FunctionsFetchError, FunctionsHttpError, FunctionsRelayError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

const FUNCTION_NAME = 'yoga-ai'
// sessions ma dwa klucze do videos (video_id i rated_video_id), więc trzeba wskazać, który.
const SESSION_SELECT = '*, video:videos!sessions_video_id_fkey(*)'

function check({ data, error }) {
  if (error) throw new Error(error.message)
  return data
}

async function invoke(action, params) {
  const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, { body: { action, ...params } })
  if (!error) return data

  if (error instanceof FunctionsHttpError) {
    const status = error.context?.status
    const payload = await error.context?.json?.().catch(() => null)
    if (payload?.error) throw new Error(payload.error)
    if (status === 404) throw new Error(`Funkcja "${FUNCTION_NAME}" nie jest jeszcze wdrożona.`)
    if (status === 401) throw new Error('Sesja wygasła. Zaloguj się ponownie.')
    throw new Error(`Błąd serwera (${status}). Spróbuj jeszcze raz.`)
  }
  if (error instanceof FunctionsRelayError || error instanceof FunctionsFetchError) {
    throw new Error(`Nie mogę połączyć się z Edge Function "${FUNCTION_NAME}". Sprawdź, czy jest wdrożona pod tą nazwą.`)
  }
  throw error
}

/** Dokleja filmy do alternatyw (to jsonb, więc Supabase nie zrobi joina). */
async function attachAlternatives(sessions) {
  const ids = [...new Set(sessions.flatMap((s) => (s.alternatives ?? []).map((a) => a.video_id)))]
  if (!ids.length) return sessions
  const videos = check(await supabase.from('videos').select('*').in('id', ids))
  const byId = new Map(videos.map((v) => [v.id, v]))
  return sessions.map((s) => ({
    ...s,
    alternatives: (s.alternatives ?? []).map((a) => ({ ...a, video: byId.get(a.video_id) ?? null })),
  }))
}

export async function listVideos() {
  return check(await supabase.from('videos').select('*').order('published_at', { ascending: false }))
}

export function syncVideos(channel) {
  return invoke('sync-videos', { channel })
}

export async function listSessions() {
  const rows = check(await supabase.from('sessions').select(SESSION_SELECT).order('created_at', { ascending: false }))
  return attachAlternatives(rows)
}

export async function getSession(id) {
  const row = check(await supabase.from('sessions').select(SESSION_SELECT).eq('id', id).maybeSingle())
  if (!row) throw new Error('Nie znaleziono tej sesji.')
  const [withAlts] = await attachAlternatives([row])
  return withAlts
}

export async function setSessionDone(id, done) {
  check(await supabase.from('sessions').update({ done_at: done ? new Date().toISOString() : null }).eq('id', id))
}

/** Zapisuje ocenę 1–5 i notatkę. Oceniony trening jest też oznaczany jako zrobiony. */
export async function rateSession(id, { rating, note, videoId, doneAt }) {
  const now = new Date().toISOString()
  return check(
    await supabase
      .from('sessions')
      .update({ rating, rating_note: note || null, rated_video_id: videoId, rated_at: now, done_at: doneAt ?? now })
      .eq('id', id)
      .select('rating, rating_note, rated_video_id, rated_at, done_at')
      .single(),
  )
}

export async function deleteSession(id) {
  check(await supabase.from('sessions').delete().eq('id', id))
}

export async function recommend({ mood, maxMinutes }) {
  const { session } = await invoke('recommend', { mood, maxMinutes })
  return session
}
