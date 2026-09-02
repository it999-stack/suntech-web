import { apiClient } from '@/lib/apiClient'
import type { AuthUser, LoginResponse } from '../types/auth.types'

export const authApi = {
  login: (email: string, password: string) =>
    apiClient
      .post<LoginResponse>('/auth/login', { email, password }, { headers: { 'X-Client': 'web' } })
      .then((r) => r.data),
  getMe: () => apiClient.get<AuthUser>('/auth/me').then((r) => r.data),
}
