import { apiClient } from '@/lib/apiClient'
import type {
  ChecklistDetail,
  ChecklistStatus,
  ChecklistStepRow,
  PileLifecycle,
  PilingTrack,
  PlanState,
  SiteDetail,
  StepDurationPoint,
  StepStatus,
} from '../types/dashboard.types'

interface RawCompany {
  id: string
  name: string
}

interface RawSite {
  id: string
  name: string
  location: string | null
  target_end_date: string | null
  company: RawCompany
  client: RawCompany
}

interface RawPlanState {
  exists: boolean
  checklist_id: string | null
  status: ChecklistStatus | null
}

interface RawStepSummary {
  id: string
  step_name: string
  sequence_order: number
  track: PilingTrack
}

interface RawPlanStep {
  step_id: string
  planned_start: string
  planned_end: string | null
  step: RawStepSummary
}

interface RawActualStep {
  step_id: string
  actual_start: string | null
  actual_end: string | null
  step: RawStepSummary
}

interface RawPileSummary {
  pile_id_code: string
}

interface RawChecklistPile {
  id: string
  seq_no: number
  status: PileLifecycle
  pile: RawPileSummary
  plan_steps: RawPlanStep[]
  actual_steps: RawActualStep[]
}

interface RawChecklist {
  id: string
  date: string
  status: ChecklistStatus
  checklist_piles: RawChecklistPile[]
}

function mapSite(raw: RawSite): SiteDetail {
  return {
    id: raw.id,
    name: raw.name,
    location: raw.location,
    companyName: raw.company.name,
    clientName: raw.client.name,
    targetEndDate: raw.target_end_date,
  }
}

// A step is "delayed" once its planned window has passed without the
// corresponding actual timestamp being recorded yet — for a past date this
// naturally covers every step that was simply never done.
function deriveStepStatus(
  plannedStart: string,
  plannedEnd: string | null,
  actualStart: string | null,
  actualEnd: string | null,
  now: Date
): StepStatus {
  if (actualEnd) return 'completed'
  if (actualStart) return now > new Date(plannedEnd ?? plannedStart) ? 'delayed' : 'in_progress'
  return now > new Date(plannedStart) ? 'delayed' : 'pending'
}

function buildStepRows(raw: RawChecklist, now: Date): ChecklistStepRow[] {
  const rows: ChecklistStepRow[] = []

  for (const pile of raw.checklist_piles) {
    const actualByStepId = new Map(pile.actual_steps.map((a) => [a.step_id, a]))

    for (const planStep of pile.plan_steps) {
      const actual = actualByStepId.get(planStep.step_id)
      rows.push({
        checklistPileId: pile.id,
        pileSeqNo: pile.seq_no,
        pileIdCode: pile.pile.pile_id_code,
        pileStatus: pile.status,
        stepId: planStep.step_id,
        stepName: planStep.step.step_name,
        track: planStep.step.track,
        sequenceOrder: planStep.step.sequence_order,
        plannedStart: planStep.planned_start,
        plannedEnd: planStep.planned_end,
        actualStart: actual?.actual_start ?? null,
        actualEnd: actual?.actual_end ?? null,
        status: deriveStepStatus(planStep.planned_start, planStep.planned_end, actual?.actual_start ?? null, actual?.actual_end ?? null, now),
      })
    }
  }

  return rows.sort((a, b) => a.sequenceOrder - b.sequenceOrder || a.pileSeqNo - b.pileSeqNo)
}

function minutesBetween(start: string | null, end: string | null): number {
  if (!start || !end) return 0
  return Math.max(0, (new Date(end).getTime() - new Date(start).getTime()) / 60_000)
}

// Aggregates every pile's time for a step into one planned/actual pair — feeds
// the plan-vs-actual chart (one bar-pair per step, not per pile).
export function buildStepDurationPoints(rows: ChecklistStepRow[]): StepDurationPoint[] {
  const byStep = new Map<string, StepDurationPoint>()

  for (const row of rows) {
    const existing = byStep.get(row.stepName) ?? {
      stepName: row.stepName,
      sequenceOrder: row.sequenceOrder,
      plannedMinutes: 0,
      actualMinutes: 0,
    }
    existing.plannedMinutes += minutesBetween(row.plannedStart, row.plannedEnd)
    existing.actualMinutes += minutesBetween(row.actualStart, row.actualEnd)
    byStep.set(row.stepName, existing)
  }

  return Array.from(byStep.values()).sort((a, b) => a.sequenceOrder - b.sequenceOrder)
}

async function getSite(siteId: string): Promise<SiteDetail> {
  const { data } = await apiClient.get<RawSite>(`/piling/sites/${siteId}`)
  return mapSite(data)
}

async function getPlanState(siteId: string, date: string): Promise<PlanState> {
  const { data } = await apiClient.get<RawPlanState>(`/piling/sites/${siteId}/plans/state`, { params: { date } })
  return { exists: data.exists, checklistId: data.checklist_id, status: data.status }
}

async function getChecklistDetail(checklistId: string): Promise<ChecklistDetail> {
  const { data } = await apiClient.get<RawChecklist>(`/piling/checklists/${checklistId}`)
  return {
    checklistId: data.id,
    date: data.date,
    status: data.status,
    rows: buildStepRows(data, new Date()),
  }
}

export const siteDetailService = {
  getSite,
  getPlanState,
  getChecklistDetail,
}
