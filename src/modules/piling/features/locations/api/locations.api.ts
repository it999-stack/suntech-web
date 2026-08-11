import { apiClient } from '@/lib/apiClient'
import type { CreateLocationPayload, SiteLocation, UpdateLocationPayload } from '../types/locations.types'

interface RawLocationOut {
  id: string | null
  site_id: string
  name: string
  code: string | null
  sort_order: number
}

interface RawLocationsWithDeletions {
  locations: RawLocationOut[]
  deleted_pile_ids: string[]
}

function mapLocation(raw: RawLocationOut): SiteLocation {
  return {
    id: raw.id as string,
    name: raw.name,
    code: raw.code,
  }
}

async function getLocationsForSite(siteId: string): Promise<SiteLocation[]> {
  const { data } = await apiClient.get<RawLocationsWithDeletions>(`/piling/sites/${siteId}/locations`)
  return data.locations.filter((location) => location.id !== null).map(mapLocation)
}

async function createLocation(siteId: string, payload: CreateLocationPayload): Promise<void> {
  await apiClient.post(`/piling/sites/${siteId}/locations`, {
    name: payload.name,
    code: payload.code,
  })
}

async function updateLocation(locationId: string, payload: UpdateLocationPayload): Promise<void> {
  await apiClient.patch(`/piling/locations/${locationId}`, {
    name: payload.name,
    code: payload.code,
  })
}

async function deleteLocation(locationId: string): Promise<void> {
  await apiClient.delete(`/piling/locations/${locationId}`)
}

export const locationsService = {
  getLocationsForSite,
  createLocation,
  updateLocation,
  deleteLocation,
}
