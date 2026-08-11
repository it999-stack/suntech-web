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
  id: string
  stepName: string
  sequenceOrder: number
  track: PilingTrack
  isSplittable: boolean
  templates: StepDimensionTemplate[]
}

export interface UpsertDurationTemplatePayload {
  dimensionId: string
  stepId: string
  durationMinutes: number
  bufferBeforeMinutes: number
}
