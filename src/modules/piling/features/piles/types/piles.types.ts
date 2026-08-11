export interface CreatePilePayload {
  pileIdCode: string
  dimensionId: string
  locationId: string
  area: string | null
  notes: string | null
}

export interface PileDetail {
  id: string
  locationId: string
  pileIdCode: string
  area: string | null
  dimensionId: string
  notes: string | null
}

export interface UpdatePilePayload {
  pileIdCode?: string
  locationId?: string
  area?: string | null
  dimensionId?: string
  notes?: string | null
}

export interface PileImportRowResult {
  rowNumber: number
  pileIdCode: string | null
  locationName: string | null
  locationId: string | null
  area: string | null
  dimensionDia: number | null
  dimensionDepth: number | null
  dimensionLabel: string | null
  dimensionId: string | null
  notes: string | null
  status: 'ok' | 'error'
  errors: string[]
}

export interface PileImportPreview {
  total: number
  valid: number
  invalid: number
  rows: PileImportRowResult[]
}

export interface PileImportConfirmResult {
  created: number
  failedRows: PileImportRowResult[]
}
