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

export interface CreateSitePayload {
  companyId: string
  name: string
  location: string | null
  targetEndDate: string | null
}

export interface UpdateSitePayload {
  clientId?: string
  name?: string
  location?: string | null
}

// ─── Site piles index (Site Detail page) ───────────────────────────────────

export type PileListStatus = 'PENDING' | 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'

export interface SitePileListItem {
  id: string
  pileIdCode: string
  area: string | null
  locationName: string | null
  dimensionDia: number
  dimensionDepth: number
  dimensionLabel: string | null
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
