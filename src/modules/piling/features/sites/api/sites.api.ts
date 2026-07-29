import { apiClient } from '@/lib/apiClient'
import type {
  SiteListItem,
  SitePileListItem,
  SitePileListParams,
  SitePilePage,
  UpdateSitePayload,
} from '../types/sites.types'

interface RawSiteListItem {
  id: string
  name: string
  location: string | null
  client: { id: string; name: string }
  total_piles: number
  completed_piles: number
  percent_complete: number
}

interface RawSite {
  id: string
  name: string
  location: string | null
}

interface RawSitePileListItem {
  id: string
  pile_id_code: string
  area_location: string | null
  status: SitePileListItem['status']
}

interface RawSitePilePage {
  items: RawSitePileListItem[]
  total: number
  page: number
  limit: number
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

function mapSitePileListItem(raw: RawSitePileListItem): SitePileListItem {
  return {
    id: raw.id,
    pileIdCode: raw.pile_id_code,
    areaLocation: raw.area_location,
    status: raw.status,
  }
}

async function getSites(): Promise<SiteListItem[]> {
  const { data } = await apiClient.get<RawSiteListItem[]>('/piling/sites')
  return data.map(mapSiteListItem)
}

async function getSiteById(siteId: string): Promise<{ id: string; name: string; location: string | null }> {
  const { data } = await apiClient.get<RawSite>(`/piling/sites/${siteId}`)
  return { id: data.id, name: data.name, location: data.location }
}

async function getSitePiles(siteId: string, params: SitePileListParams): Promise<SitePilePage> {
  const { data } = await apiClient.get<RawSitePilePage>(`/piling/sites/${siteId}/piles`, {
    params: {
      page: params.page,
      limit: params.limit,
      search: params.search || undefined,
    },
  })
  return {
    items: data.items.map(mapSitePileListItem),
    total: data.total,
    page: data.page,
    limit: data.limit,
  }
}

async function updateSite(siteId: string, payload: UpdateSitePayload): Promise<void> {
  await apiClient.patch(`/piling/sites/${siteId}`, payload)
}

export const sitesService = {
  getSites,
  getSiteById,
  getSitePiles,
  updateSite,
}
