export interface SiteDimension {
  id: string
  dia: number
  depth: number
  label: string | null
}

export interface CreateDimensionPayload {
  dia: number
  depth: number
  label: string | null
}

export interface UpdateDimensionPayload {
  dia?: number
  depth?: number
  label?: string | null
}
