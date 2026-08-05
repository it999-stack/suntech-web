import { apiClient } from '@/lib/apiClient'
import type {
  PilingTrack,
  SiteStep,
  StepDimensionTemplate,
  UpsertDurationTemplatePayload,
} from '../types/steps.types'

interface RawDimensionSummary {
  id: string
  dia: number
  depth: number
  label: string | null
}

interface RawDurationTemplateNested {
  id: string
  dimension_id: string
  duration_minutes: number
  buffer_before_minutes: number
  planned_concrete_qty_m3: number | null
  dimension: RawDimensionSummary
}

interface RawStepWithTemplates {
  id: string
  step_name: string
  sequence_order: number
  track: PilingTrack
  templates: RawDurationTemplateNested[]
}

function mapTemplate(raw: RawDurationTemplateNested, step: RawStepWithTemplates): StepDimensionTemplate {
  return {
    id: raw.id,
    stepId: step.id,
    stepName: step.step_name,
    dimensionId: raw.dimension_id,
    dimensionLabel: raw.dimension.label,
    dia: raw.dimension.dia,
    depth: raw.dimension.depth,
    durationMinutes: raw.duration_minutes,
    bufferBeforeMinutes: raw.buffer_before_minutes,
  }
}

function mapStep(raw: RawStepWithTemplates): SiteStep {
  return {
    id: raw.id,
    stepName: raw.step_name,
    sequenceOrder: raw.sequence_order,
    track: raw.track,
    templates: raw.templates.map((template) => mapTemplate(template, raw)),
  }
}

async function getStepsForSite(siteId: string): Promise<SiteStep[]> {
  const { data } = await apiClient.get<RawStepWithTemplates[]>(`/piling/sites/${siteId}/steps`)
  return data.map(mapStep)
}

async function createDurationTemplate(siteId: string, payload: UpsertDurationTemplatePayload): Promise<void> {
  await apiClient.post(`/piling/sites/${siteId}/duration-templates`, {
    dimension_id: payload.dimensionId,
    step_id: payload.stepId,
    duration_minutes: payload.durationMinutes,
    buffer_before_minutes: payload.bufferBeforeMinutes,
  })
}

async function updateDurationTemplate(templateId: string, payload: UpsertDurationTemplatePayload): Promise<void> {
  await apiClient.patch(`/piling/duration-templates/${templateId}`, {
    dimension_id: payload.dimensionId,
    step_id: payload.stepId,
    duration_minutes: payload.durationMinutes,
    buffer_before_minutes: payload.bufferBeforeMinutes,
  })
}

export const stepsService = {
  getStepsForSite,
  createDurationTemplate,
  updateDurationTemplate,
}
