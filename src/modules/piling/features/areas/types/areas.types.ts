export interface SiteArea {
  id: string
  name: string
  code: string | null
}

export interface CreateAreaPayload {
  name: string
  code: string | null
}

export interface UpdateAreaPayload {
  name?: string
  code?: string | null
}
