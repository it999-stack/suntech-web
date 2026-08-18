import { apiClient } from '@/lib/apiClient'
import type {
  AddSiteStepPayload,
  CatalogStep,
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

interface RawSiteStepWithTemplates {
  id: string
  step_id: string
  step_name: string
  sequence_order: number
  track: PilingTrack
  is_splittable: boolean
  templates: RawDurationTemplateNested[]
}

interface RawSiteStepSummary {
  id: string
  step_id: string
  step_name: string
  sequence_order: number
  track: PilingTrack
  is_splittable: boolean
}

interface RawCatalogStep {
  id: string
  step_name: string
  track: PilingTrack
}

function mapTemplate(raw: RawDurationTemplateNested, step: RawSiteStepWithTemplates): StepDimensionTemplate {
  return {
    id: raw.id,
    stepId: step.step_id,
    stepName: step.step_name,
    dimensionId: raw.dimension_id,
    dimensionLabel: raw.dimension.label,
    dia: raw.dimension.dia,
    depth: raw.dimension.depth,
    durationMinutes: raw.duration_minutes,
    bufferBeforeMinutes: raw.buffer_before_minutes,
  }
}

function mapStep(raw: RawSiteStepWithTemplates): SiteStep {
  return {
    id: raw.id,
    stepId: raw.step_id,
    stepName: raw.step_name,
    sequenceOrder: raw.sequence_order,
    track: raw.track,
    isSplittable: raw.is_splittable,
    templates: raw.templates.map((template) => mapTemplate(template, raw)),
  }
}

function mapSummary(raw: RawSiteStepSummary): SiteStep {
  return {
    id: raw.id,
    stepId: raw.step_id,
    stepName: raw.step_name,
    sequenceOrder: raw.sequence_order,
    track: raw.track,
    isSplittable: raw.is_splittable,
    templates: [],
  }
}

function mapCatalogStep(raw: RawCatalogStep): CatalogStep {
  return { id: raw.id, stepName: raw.step_name, track: raw.track }
}

async function getStepsForSite(siteId: string): Promise<SiteStep[]> {
  const { data } = await apiClient.get<RawSiteStepWithTemplates[]>(`/piling/sites/${siteId}/steps`)
  return data.map(mapStep)
}

async function getCatalogStepsForSite(siteId: string): Promise<CatalogStep[]> {
  const { data } = await apiClient.get<RawCatalogStep[]>(`/piling/sites/${siteId}/steps/catalog`)
  return data.map(mapCatalogStep)
}

async function addSiteStep(siteId: string, payload: AddSiteStepPayload): Promise<SiteStep> {
  const { data } = await apiClient.post<RawSiteStepWithTemplates>(`/piling/sites/${siteId}/steps`, {
    step_id: payload.stepId,
    is_splittable: payload.isSplittable ?? true,
    insert_after_site_step_id: payload.insertAfterSiteStepId ?? null,
  })
  return mapStep(data)
}

async function removeSiteStep(siteId: string, siteStepId: string): Promise<void> {
  await apiClient.delete(`/piling/sites/${siteId}/steps/${siteStepId}`)
}

async function reorderSiteSteps(siteId: string, orderedSiteStepIds: string[]): Promise<SiteStep[]> {
  const { data } = await apiClient.post<RawSiteStepSummary[]>(`/piling/sites/${siteId}/steps/reorder`, {
    ordered_site_step_ids: orderedSiteStepIds,
  })
  return data.map(mapSummary)
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

async function updateStep(siteId: string, siteStepId: string, isSplittable: boolean): Promise<void> {
  await apiClient.patch(`/piling/sites/${siteId}/steps/${siteStepId}`, { is_splittable: isSplittable })
}

export const stepsService = {
  getStepsForSite,
  getCatalogStepsForSite,
  addSiteStep,
  removeSiteStep,
  reorderSiteSteps,
  createDurationTemplate,
  updateDurationTemplate,
  updateStep,
}
