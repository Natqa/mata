// Tryb mock: dane w localStorage tej przeglądarki. Te same reguły co w Supabase:
// filmy są wspólne, sesje każda osoba widzi tylko swoje.

const DB_KEY = 'mata:mock-db:v1'

export const DEMO_EMAIL = 'demo@example.com'
export const DEMO_PASSWORD = 'demo1234'

export const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms))

function emptyDb() {
  return { users: [], videos: [], sessions: [] }
}

export function readDb() {
  try {
    const raw = localStorage.getItem(DB_KEY)
    return raw ? { ...emptyDb(), ...JSON.parse(raw) } : emptyDb()
  } catch {
    return emptyDb()
  }
}

export function updateDb(fn) {
  const db = readDb()
  const result = fn(db)
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db))
  } catch {
    // Brak dostępu do localStorage: zmiany znikną po odświeżeniu.
  }
  return result
}

export async function hashPassword(password) {
  const bytes = new TextEncoder().encode(`mata:${password}`)
  const hash = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function insertUser(db, { email, passwordHash }) {
  const user = { id: crypto.randomUUID(), email, password_hash: passwordHash, created_at: new Date().toISOString() }
  db.users.push(user)
  return user
}

export async function ensureDemoUser() {
  const db = readDb()
  if (db.users.some((u) => u.email === DEMO_EMAIL)) return
  const passwordHash = await hashPassword(DEMO_PASSWORD)
  updateDb((d) => insertUser(d, { email: DEMO_EMAIL, passwordHash }))
}

export function resetMockData() {
  try {
    localStorage.removeItem(DB_KEY)
  } catch {
    // nic
  }
}

// Przykładowa biblioteka do trybu mock (to nie są prawdziwe filmy).
export const SAMPLE_VIDEOS = [
  ['Joga na stres i napięcie — 20 min', 'Spokojna praktyka z długimi wydechami. Rozluźnia barki i kark, wycisza głowę.', 20],
  ['Poranna joga na energię', 'Dynamiczne powitania słońca, które budzą całe ciało. Dobre na start dnia.', 15],
  ['Joga na zdrowy kręgosłup', 'Mobilizacja kręgosłupa, skręty i łagodne wygięcia. Dla osób, które dużo siedzą.', 25],
  ['Wieczorna joga przed snem', 'Bardzo łagodna praktyka na macie i w leżeniu. Pomaga zasnąć.', 12],
  ['Joga na siłę i stabilność — 40 min flow', 'Wymagający flow z pozycjami stojącymi, deską i balansami.', 40],
  ['Joga na biodra i dolne plecy', 'Otwieranie bioder, rozciąganie pośladków i lędźwi.', 30],
  ['Joga na kark i ramiona przy biurku', 'Krótka sesja na rozluźnienie karku, ramion i nadgarstków.', 10],
  ['Yin joga — głębokie rozluźnienie', 'Długie utrzymywanie pozycji, oddech i spokój. Regeneracja po trudnym dniu.', 45],
].map(([title, description, minutes], i) => ({
  id: `mock-${i + 1}`,
  // Rozdzielone po kolei między kanały z src/lib/channels.js (indeks 0, 1, 2).
  channel_index: i % 3,
  channel_id: `mock-channel-${i % 3}`,
  channel_title: null,
  title,
  description,
  duration_sec: minutes * 60,
  thumbnail_url: null,
  published_at: new Date(Date.now() - i * 86400000 * 7).toISOString(),
  synced_at: new Date().toISOString(),
}))
