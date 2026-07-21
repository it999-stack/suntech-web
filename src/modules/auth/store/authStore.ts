import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi } from '../api/auth.api'
import type { AuthUser } from '../types/auth.types'

interface AuthState {
  token: string | null
  user: AuthUser | null
  isAuthenticated: boolean
  isRestoring: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  restoreSession: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isRestoring: false,
      login: async (email, password) => {
        const { access_token, user } = await authApi.login(email, password)
        set({ token: access_token, user, isAuthenticated: true })
      },
      logout: () => {
        set({ token: null, user: null, isAuthenticated: false })
      },
      restoreSession: async () => {
        const { token } = get()
        if (!token) return
        set({ isRestoring: true })
        try {
          const user = await authApi.getMe()
          set({ user, isAuthenticated: true })
        } catch {
          set({ token: null, user: null, isAuthenticated: false })
        } finally {
          set({ isRestoring: false })
        }
      },
    }),
    {
      name: 'suntech-auth',
      partialize: (state) => ({ token: state.token }),
    }
  )
)
