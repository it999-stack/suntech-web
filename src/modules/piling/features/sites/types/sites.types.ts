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
