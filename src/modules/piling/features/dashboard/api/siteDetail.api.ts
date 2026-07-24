import { apiClient } from '@/lib/apiClient'
import { dateOnly, formatHourLabel, hourCeil, hourFloor } from '@/lib/date'
import { byNumber } from '@/lib/sort'
import { groupBy } from '@/lib/collections'
import type {
  ChecklistDetail,
  ChecklistStatus,
  ChecklistStepRow,
  ConcreteUsage,
  MachineSummary,
  PileLifecycle,
  PilingTrack,
  PlanState,
  SiteDetail,
  SitePlanVsActualPoint,
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

interface RawMachineSummary {
  id: string
  machine_no: string
  type: PilingTrack
}

interface RawPlanStep {
  step_id: string
  planned_start: string
  planned_end: string | null
  duration_minutes: number | null
  buffer_minutes: number | null
  assigned_machine: RawMachineSummary | null
  step: RawStepSummary
}

interface RawActualStep {
  step_id: string
  actual_start: string | null
  actual_end: string | null
  remarks: string | null
  step: RawStepSummary
}

interface RawPileSummary {
  pile_id_code: string
  area_location: string | null
}

interface RawConcreteUsage {
  id: string
  planned_qty_m3: number | null
  actual_qty_m3: number | null
}

interface RawChecklistPile {
  id: string
  seq_no: number
  status: PileLifecycle
  pile: RawPileSummary
  rig: RawMachineSummary
  crane: RawMachineSummary
  plan_steps: RawPlanStep[]
  actual_steps: RawActualStep[]
  concrete_usage: RawConcreteUsage | null
  total_applicable_steps: number | null
  is_plan_complete: boolean | null
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

function mapMachine(raw: RawMachineSummary): MachineSummary {
  return { id: raw.id, machineNo: raw.machine_no, type: raw.type }
}

// Actual-machine tracking doesn't exist per-step (PileActualStep has no
// machine column) — approximate using the pile-level rig/crane assignment,
// matched by the step's own track. COMPRESSOR-track steps have no pile-level
// compressor assignment, so they render no actual machine.
function resolveActualMachine(pile: RawChecklistPile, track: PilingTrack): MachineSummary | null {
  if (track === 'RIG') return mapMachine(pile.rig)
  if (track === 'CRANE') return mapMachine(pile.crane)
  return null
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

function mapConcreteUsage(raw: RawConcreteUsage | null): ConcreteUsage | null {
  if (!raw) return null
  return { plannedM3: raw.planned_qty_m3, actualM3: raw.actual_qty_m3 }
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
        areaLocation: pile.pile.area_location,
        pileRig: mapMachine(pile.rig),
        pileCrane: mapMachine(pile.crane),
        concreteUsage: mapConcreteUsage(pile.concrete_usage),
        stepId: planStep.step_id,
        stepName: planStep.step.step_name,
        track: planStep.step.track,
        sequenceOrder: planStep.step.sequence_order,
        plannedStart: planStep.planned_start,
        plannedEnd: planStep.planned_end,
        actualStart: actual?.actual_start ?? null,
        actualEnd: actual?.actual_end ?? null,
        remarks: actual?.remarks ?? null,
        status: deriveStepStatus(planStep.planned_start, planStep.planned_end, actual?.actual_start ?? null, actual?.actual_end ?? null, now),
        durationMinutes: planStep.duration_minutes,
        bufferMinutes: planStep.buffer_minutes,
        plannedMachine: planStep.assigned_machine ? mapMachine(planStep.assigned_machine) : null,
        actualMachine: resolveActualMachine(pile, planStep.step.track),
        totalApplicableSteps: pile.total_applicable_steps ?? null,
        isPlanComplete: pile.is_plan_complete ?? null,
      })
    }
  }

  return rows.sort(byNumber((r) => r.sequenceOrder, (r) => r.pileSeqNo))
}

// One point per hour tick across the day's planned working window — feeds the
// site-level plan-vs-actual timeline (cumulative piles completed vs planned).
// A pile's completion event is its final step (max sequenceOrder is globally
// unique per PilingStep, so this is well-defined regardless of track).
export function buildSitePlanVsActualTimeline(rows: ChecklistStepRow[], selectedDate: string): SitePlanVsActualPoint[] {
  if (rows.length === 0) return []

  const finalSteps = Array.from(groupBy(rows, (row) => row.checklistPileId).values()).map((pileRows) =>
    pileRows.reduce((a, b) => (b.sequenceOrder > a.sequenceOrder ? b : a))
  )

  const plannedCompletions = finalSteps
    .map((row) => row.plannedEnd ?? row.plannedStart)
    .filter((iso): iso is string => !!iso)
    .sort()
  const actualCompletions = finalSteps
    .map((row) => row.actualEnd)
    .filter((iso): iso is string => !!iso)
    .sort()

  const allStarts = rows.map((r) => r.plannedStart).filter((iso): iso is string => !!iso)
  const allEnds = [
    ...rows.map((r) => r.plannedEnd).filter((iso): iso is string => !!iso),
    ...rows.map((r) => r.actualEnd).filter((iso): iso is string => !!iso),
  ]
  if (allStarts.length === 0 || allEnds.length === 0) return []

  const rangeStart = hourFloor(new Date(allStarts.reduce((a, b) => (a < b ? a : b))))
  const rangeEnd = hourCeil(new Date(allEnds.reduce((a, b) => (a > b ? a : b))))

  const now = new Date()
  const isToday = selectedDate === dateOnly(now)

  let plannedIdx = 0
  let actualIdx = 0
  const points: SitePlanVsActualPoint[] = []

  for (const tick = new Date(rangeStart); tick <= rangeEnd; tick.setHours(tick.getHours() + 1)) {
    while (plannedIdx < plannedCompletions.length && new Date(plannedCompletions[plannedIdx]) <= tick) plannedIdx++
    while (actualIdx < actualCompletions.length && new Date(actualCompletions[actualIdx]) <= tick) actualIdx++

    const beyondNow = isToday && tick.getTime() > now.getTime()
    points.push({
      hourLabel: formatHourLabel(tick),
      timeIso: tick.toISOString(),
      plannedCumulative: plannedIdx,
      actualCumulative: beyondNow ? null : actualIdx,
    })
  }

  return points
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
