import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const SIX_DAYS_MS = 6 * 24 * 60 * 60 * 1000

interface AuthState {
  token: string | null
  userId: string | null
  twinId: string | null
  twinCreatedAt: number | null   // unix timestamp (ms) when twin was first created
  isAuthenticated: boolean
  login: (token: string, userId: string) => void
  logout: () => void
  setTwinId: (twinId: string) => void
  hasFreshTwin: () => boolean    // true if twin exists AND is < 6 days old
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      userId: null,
      twinId: null,
      twinCreatedAt: null,
      isAuthenticated: false,

      login: (token, userId) =>
        set({ token, userId, isAuthenticated: true }),

      logout: () =>
        set({ token: null, userId: null, twinId: null, twinCreatedAt: null, isAuthenticated: false }),

      setTwinId: (twinId) =>
        set({ twinId, twinCreatedAt: Date.now() }),

      hasFreshTwin: () => {
        const { twinId, twinCreatedAt } = get()
        if (!twinId || !twinCreatedAt) return false
        return Date.now() - twinCreatedAt < SIX_DAYS_MS
      },
    }),
    {
      name: 'darwin-auth-v2', // new key so old stale storage is ignored
    }
  )
)
