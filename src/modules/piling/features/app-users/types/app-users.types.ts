export interface AppUser {
  id: string
  name: string
  email: string
  isActive: boolean
  createdAt: string | null
}

export interface CreateAppUserPayload {
  name: string
  email: string
  password: string
}

export interface UpdateAppUserPayload {
  name?: string
  email?: string
}

export interface UpdateAppUserPasswordPayload {
  password: string
}
