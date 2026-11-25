// Auth client used by AuthContext: supabase.auth, or the mock in mock mode.

import { mockAuth } from '@/lib/mock/auth'
import { isMockMode, supabase } from '@/lib/supabase'

export const auth = isMockMode ? mockAuth : supabase.auth
