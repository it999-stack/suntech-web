import { apiClient } from '@/lib/apiClient'
import type { CreateDimensionPayload, SiteDimension, UpdateDimensionPayload } from '../types/dimensions.types'

interface RawDimension {
  id: string
  site_id: string
  dia: number
  depth: number
  label: string | null
}

function mapDimension(raw: RawDimension): SiteDimension {
  return {
    id: raw.id,
    dia: raw.dia,
    depth: raw.depth,
    label: raw.label,
  }
}

async function getDimensionsForSite(siteId: string): Promise<SiteDimension[]> {
  const { data } = await apiClient.get<RawDimension[]>(`/piling/sites/${siteId}/dimensions`)
  return data.map(mapDimension)
}

async function createDimension(siteId: string, payload: CreateDimensionPayload): Promise<void> {
  await apiClient.post(`/piling/sites/${siteId}/dimensions`, {
    dia: payload.dia,
    depth: payload.depth,
    label: payload.label,
  })
}

async function updateDimension(dimensionId: string, payload: UpdateDimensionPayload): Promise<void> {
  await apiClient.patch(`/piling/dimensions/${dimensionId}`, {
    dia: payload.dia,
    depth: payload.depth,
    label: payload.label,
  })
}

async function deleteDimension(dimensionId: string): Promise<void> {
  await apiClient.delete(`/piling/dimensions/${dimensionId}`)
}

export const dimensionsService = {
  getDimensionsForSite,
  createDimension,
  updateDimension,
  deleteDimension,
}
