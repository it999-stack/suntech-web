import { apiClient } from '@/lib/apiClient'
import type {
  CreatePilePayload,
  PileDetail,
  PileImportConfirmResult,
  PileImportPreview,
  PileImportRowResult,
  UpdatePilePayload,
} from '../types/piles.types'

interface RawPileOut {
  id: string
  site_id: string
  location_id: string
  pile_id_code: string
  area: string | null
  dimension_id: string
  notes: string | null
}

function mapPileDetail(raw: RawPileOut): PileDetail {
  return {
    id: raw.id,
    locationId: raw.location_id,
    pileIdCode: raw.pile_id_code,
    area: raw.area,
    dimensionId: raw.dimension_id,
    notes: raw.notes,
  }
}

async function createPile(siteId: string, payload: CreatePilePayload): Promise<void> {
  await apiClient.post(`/piling/sites/${siteId}/piles`, {
    pile_id_code: payload.pileIdCode,
    dimension_id: payload.dimensionId,
    location_id: payload.locationId,
    area: payload.area,
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
    location_id: payload.locationId,
    area: payload.area,
    notes: payload.notes,
  })
}

async function deletePile(pileId: string): Promise<void> {
  await apiClient.delete(`/piling/piles/${pileId}`)
}

async function getAreaSuggestions(siteId: string): Promise<string[]> {
  const { data } = await apiClient.get<string[]>(`/piling/sites/${siteId}/piles/areas`)
  return data
}

interface RawPileImportRowResult {
  row_number: number
  pile_id_code: string | null
  location_name: string | null
  location_id: string | null
  area: string | null
  dimension_dia: number | null
  dimension_depth: number | null
  dimension_label: string | null
  dimension_id: string | null
  notes: string | null
  status: 'ok' | 'error'
  errors: string[]
}

function mapImportRow(raw: RawPileImportRowResult): PileImportRowResult {
  return {
    rowNumber: raw.row_number,
    pileIdCode: raw.pile_id_code,
    locationName: raw.location_name,
    locationId: raw.location_id,
    area: raw.area,
    dimensionDia: raw.dimension_dia,
    dimensionDepth: raw.dimension_depth,
    dimensionLabel: raw.dimension_label,
    dimensionId: raw.dimension_id,
    notes: raw.notes,
    status: raw.status,
    errors: raw.errors,
  }
}

async function previewPileImport(siteId: string, file: File): Promise<PileImportPreview> {
  const formData = new FormData()
  formData.append('file', file)

  const { data } = await apiClient.post<{
    total: number
    valid: number
    invalid: number
    rows: RawPileImportRowResult[]
  }>(`/piling/sites/${siteId}/piles/import/preview`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

  return { total: data.total, valid: data.valid, invalid: data.invalid, rows: data.rows.map(mapImportRow) }
}

async function confirmPileImport(siteId: string, rows: PileImportRowResult[]): Promise<PileImportConfirmResult> {
  const { data } = await apiClient.post<{ created: number; failed_rows: RawPileImportRowResult[] }>(
    `/piling/sites/${siteId}/piles/import/confirm`,
    {
      rows: rows.map((row) => ({
        row_number: row.rowNumber,
        pile_id_code: row.pileIdCode,
        location_id: row.locationId,
        area: row.area,
        dimension_id: row.dimensionId,
        notes: row.notes,
      })),
    }
  )

  return { created: data.created, failedRows: data.failed_rows.map(mapImportRow) }
}

async function downloadPileImportTemplate(siteId: string): Promise<void> {
  const { data } = await apiClient.get(`/piling/sites/${siteId}/piles/import/template`, {
    responseType: 'blob',
  })
  const url = URL.createObjectURL(data)
  const link = document.createElement('a')
  link.href = url
  link.download = 'pile_import_template.xlsx'
  link.click()
  URL.revokeObjectURL(url)
}

export const pilesService = {
  createPile,
  getPileById,
  updatePile,
  deletePile,
  getAreaSuggestions,
  previewPileImport,
  confirmPileImport,
  downloadPileImportTemplate,
}
