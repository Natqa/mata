// Atrapa metod supabase.auth, z których korzysta aplikacja (te same kształty odpowiedzi).

import { DEMO_EMAIL, delay, ensureDemoUser, hashPassword, insertUser, readDb, updateDb } from '@/lib/mock/store'

const SESSION_KEY = 'mata:mock-session:v1'
const listeners = new Set()

function readSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const session = JSON.parse(raw)
    return readDb().users.some((u) => u.id === session.user.id) ? session : null
  } catch {
    return null
  }
}

function writeSession(session) {
  try {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    else localStorage.removeItem(SESSION_KEY)
  } catch {
    // nic
  }
  listeners.forEach((cb) => cb(session ? 'SIGNED_IN' : 'SIGNED_OUT', session))
}

const sessionFor = (user) => ({
  access_token: 'mock-token',
  user: { id: user.id, email: user.email, created_at: user.created_at },
})

const authError = (message) => ({ data: { user: null, session: null }, error: { message } })

export function currentUserId() {
  const id = readSession()?.user.id
  if (!id) throw new Error('Wylogowano. Zaloguj się ponownie.')
  return id
}

export const mockAuth = {
  async getSession() {
    return { data: { session: readSession() }, error: null }
  },

  onAuthStateChange(callback) {
    listeners.add(callback)
    return { data: { subscription: { unsubscribe: () => listeners.delete(callback) } } }
  },

  async signInWithPassword({ email, password }) {
    await delay()
    const cleanEmail = email.trim().toLowerCase()
    if (cleanEmail === DEMO_EMAIL) await ensureDemoUser()
    const user = readDb().users.find((u) => u.email === cleanEmail)
    if (!user || user.password_hash !== (await hashPassword(password))) {
      return authError('Nieprawidłowy email lub hasło.')
    }
    const session = sessionFor(user)
    writeSession(session)
    return { data: { user: session.user, session }, error: null }
  },

  async signUp({ email, password }) {
    await delay()
    const cleanEmail = email.trim().toLowerCase()
    if (password.length < 6) return authError('Hasło musi mieć co najmniej 6 znaków.')
    if (readDb().users.some((u) => u.email === cleanEmail)) return authError('Takie konto już istnieje.')
    const passwordHash = await hashPassword(password)
    const user = updateDb((db) => insertUser(db, { email: cleanEmail, passwordHash }))
    const session = sessionFor(user)
    writeSession(session)
    return { data: { user: session.user, session }, error: null }
  },

  async signOut() {
    writeSession(null)
    return { error: null }
  },
}
