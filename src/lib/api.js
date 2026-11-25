// Wybiera źródło danych: Supabase albo tryb mock (gdy brak kluczy w .env.local).

import * as mock from '@/lib/api.mock'
import * as real from '@/lib/api.supabase'
import { isMockMode } from '@/lib/supabase'

const api = isMockMode ? mock : real

export const {
  listVideos,
  syncVideos,
  listSessions,
  getSession,
  setSessionDone,
  rateSession,
  deleteSession,
  recommend,
} = api
