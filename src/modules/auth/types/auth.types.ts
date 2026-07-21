export interface AuthUser {
  id: string
  name: string
  email: string
  role: string | null
  modules: string[]
  siteId?: string | null
  siteName?: string | null
}

export interface LoginResponse {
  access_token: string
  user: AuthUser
}
