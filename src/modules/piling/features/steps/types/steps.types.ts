export type PilingTrack = 'RIG' | 'CRANE' | 'COMPRESSOR'

export interface StepDimensionTemplate {
  id: string
  stepId: string
  stepName: string
  dimensionId: string
  dimensionLabel: string | null
  dia: number
  depth: number
  durationMinutes: number
  bufferBeforeMinutes: number
}

export interface SiteStep {
  id: string // pil_site_steps id
  stepId: string // catalog pil_steps id
  stepName: string
  sequenceOrder: number
  track: PilingTrack
  isSplittable: boolean
  templates: StepDimensionTemplate[]
}

export interface CatalogStep {
  id: string
  stepName: string
  track: PilingTrack
}

export interface UpsertDurationTemplatePayload {
  dimensionId: string
  stepId: string
  durationMinutes: number
  bufferBeforeMinutes: number
}

export interface AddSiteStepPayload {
  stepId: string
  isSplittable?: boolean
  insertAfterSiteStepId?: string
}
