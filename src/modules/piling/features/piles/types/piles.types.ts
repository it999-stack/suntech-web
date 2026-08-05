export interface CreatePilePayload {
  pileIdCode: string
  dimensionId: string
  areaId: string | null
  areaLocation: string | null
  notes: string | null
}

export interface PileDetail {
  id: string
  areaId: string | null
  pileIdCode: string
  areaLocation: string | null
  dimensionId: string
  notes: string | null
}

export interface UpdatePilePayload {
  pileIdCode?: string
  areaId?: string | null
  areaLocation?: string | null
  dimensionId?: string
  notes?: string | null
}
