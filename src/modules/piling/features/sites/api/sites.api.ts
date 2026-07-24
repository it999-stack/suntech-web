import { apiClient } from '@/lib/apiClient'
import type { SiteListItem, UpdateSitePayload } from '../types/sites.types'

interface RawSiteListItem {
  id: string
  name: string
  location: string | null
  client: { id: string; name: string }
  total_piles: number
  completed_piles: number
  percent_complete: number
}

function mapSiteListItem(raw: RawSiteListItem): SiteListItem {
  return {
    id: raw.id,
    name: raw.name,
    location: raw.location,
    clientId: raw.client.id,
    clientName: raw.client.name,
    totalPiles: raw.total_piles,
    completedPiles: raw.completed_piles,
    percentComplete: raw.percent_complete,
  }
}

async function getSites(): Promise<SiteListItem[]> {
  const { data } = await apiClient.get<RawSiteListItem[]>('/piling/sites')
  return data.map(mapSiteListItem)
}

async function updateSite(siteId: string, payload: UpdateSitePayload): Promise<void> {
  await apiClient.patch(`/piling/sites/${siteId}`, payload)
}

export const sitesService = {
  getSites,
  updateSite,
}
