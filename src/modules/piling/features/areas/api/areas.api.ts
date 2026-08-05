import { apiClient } from '@/lib/apiClient'
import type { CreateAreaPayload, SiteArea, UpdateAreaPayload } from '../types/areas.types'

interface RawAreaOut {
  id: string | null
  site_id: string
  name: string
  code: string | null
  sort_order: number
}

interface RawAreasWithDeletions {
  areas: RawAreaOut[]
  deleted_pile_ids: string[]
}

function mapArea(raw: RawAreaOut): SiteArea {
  return {
    id: raw.id as string,
    name: raw.name,
    code: raw.code,
  }
}

async function getAreasForSite(siteId: string): Promise<SiteArea[]> {
  const { data } = await apiClient.get<RawAreasWithDeletions>(`/piling/sites/${siteId}/areas`)
  return data.areas.filter((area) => area.id !== null).map(mapArea)
}

async function createArea(siteId: string, payload: CreateAreaPayload): Promise<void> {
  await apiClient.post(`/piling/sites/${siteId}/areas`, {
    name: payload.name,
    code: payload.code,
  })
}

async function updateArea(areaId: string, payload: UpdateAreaPayload): Promise<void> {
  await apiClient.patch(`/piling/areas/${areaId}`, {
    name: payload.name,
    code: payload.code,
  })
}

async function deleteArea(areaId: string): Promise<void> {
  await apiClient.delete(`/piling/areas/${areaId}`)
}

export const areasService = {
  getAreasForSite,
  createArea,
  updateArea,
  deleteArea,
}
