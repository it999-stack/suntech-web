export interface SiteLocation {
  id: string
  name: string
  code: string | null
}

export interface CreateLocationPayload {
  name: string
  code: string | null
}

export interface UpdateLocationPayload {
  name?: string
  code?: string | null
}
