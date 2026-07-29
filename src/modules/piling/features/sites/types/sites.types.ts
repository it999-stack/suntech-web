export interface SiteListItem {
  id: string
  name: string
  location: string | null
  clientId: string
  clientName: string
  totalPiles: number
  completedPiles: number
  percentComplete: number
}

export interface UpdateSitePayload {
  name?: string
  location?: string | null
}

// ─── Site piles index (Site Detail page) ───────────────────────────────────

export type PileListStatus = 'PENDING' | 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'

export interface SitePileListItem {
  id: string
  pileIdCode: string
  areaLocation: string | null
  status: PileListStatus
}

export interface SitePilePage {
  items: SitePileListItem[]
  total: number
  page: number
  limit: number
}

export interface SitePileListParams {
  page: number
  limit: number
  search: string
}
