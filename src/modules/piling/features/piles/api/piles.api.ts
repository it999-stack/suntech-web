import { apiClient } from '@/lib/apiClient'
import type { CreatePilePayload, PileDetail, UpdatePilePayload } from '../types/piles.types'

interface RawPileOut {
  id: string
  site_id: string
  area_id: string | null
  pile_id_code: string
  area_location: string | null
  dimension_id: string
  notes: string | null
}

function mapPileDetail(raw: RawPileOut): PileDetail {
  return {
    id: raw.id,
    areaId: raw.area_id,
    pileIdCode: raw.pile_id_code,
    areaLocation: raw.area_location,
    dimensionId: raw.dimension_id,
    notes: raw.notes,
  }
}

async function createPile(siteId: string, payload: CreatePilePayload): Promise<void> {
  await apiClient.post(`/piling/sites/${siteId}/piles`, {
    pile_id_code: payload.pileIdCode,
    dimension_id: payload.dimensionId,
    area_id: payload.areaId,
    area_location: payload.areaLocation,
    notes: payload.notes,
  })
}

async function getPileById(pileId: string): Promise<PileDetail> {
  const { data } = await apiClient.get<RawPileOut>(`/piling/piles/${pileId}`)
  return mapPileDetail(data)
}

async function updatePile(pileId: string, payload: UpdatePilePayload): Promise<void> {
  await apiClient.patch(`/piling/piles/${pileId}`, {
    pile_id_code: payload.pileIdCode,
    dimension_id: payload.dimensionId,
    area_id: payload.areaId,
    area_location: payload.areaLocation,
    notes: payload.notes,
  })
}

async function deletePile(pileId: string): Promise<void> {
  await apiClient.delete(`/piling/piles/${pileId}`)
}

async function getAreaLocationSuggestions(siteId: string): Promise<string[]> {
  const { data } = await apiClient.get<string[]>(`/piling/sites/${siteId}/piles/area-locations`)
  return data
}

export const pilesService = {
  createPile,
  getPileById,
  updatePile,
  deletePile,
  getAreaLocationSuggestions,
}
