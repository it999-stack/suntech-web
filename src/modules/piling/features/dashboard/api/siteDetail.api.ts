import { apiClient } from '@/lib/apiClient'
import { addMinutesIso, dateOnly, formatAxisDate, formatHourLabel, hourCeil, hourFloor } from '@/lib/date'
import { byNumber } from '@/lib/sort'
import { groupBy } from '@/lib/collections'
import type {
  ChecklistDetail,
  ChecklistStatus,
  ChecklistStepRow,
  ContractorSummary,
  MachineDowntimeWindow,
  MachineSummary,
  NonWorkingWindow,
  PileLifecycle,
  PileMeasurements,
  PileProgressRow,
  PilingTrack,
  PlanState,
  RangeChartPoint,
  SiteDetail,
  SitePlanVsActualPoint,
  SiteProgressHistory,
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

interface RawDimension {
  dia: number
  depth: number
}

interface RawPileSummary {
  id: string
  pile_id_code: string
  area: string | null
  dimension: RawDimension | null
}

interface RawContractorSummary {
  id: string
  name: string
}

interface RawPileMeasurements {
  egl_m: number | null
  pile_contractor_id: string | null
  pile_contractor: RawContractorSummary | null
  cage_contractor_id: string | null
  cage_contractor: RawContractorSummary | null
  pile_length_m: number | null
  cage_weight_kg: number | null
  ctl_m: number | null
  col_m: number | null
  bore_depth_m: number | null
  hook_length_m: number | null
  fl_m: number | null
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
  measurements: RawPileMeasurements | null
  total_applicable_steps: number | null
  is_plan_complete: boolean | null
}

interface RawDowntimeWindow {
  track: PilingTrack
  start: string
  end: string | null
  machine_id: string | null
  notes: string | null
}

interface RawNonWorkingWindow {
  start: string
  end: string
  label: string
}

interface RawChecklist {
  id: string
  date: string
  status: ChecklistStatus
  plan_start_time: string | null
  checklist_piles: RawChecklistPile[]
  downtime_windows: RawDowntimeWindow[]
  non_working_windows: RawNonWorkingWindow[]
}

interface RawPileProgress {
  id: string
  pile_id_code: string
  area: string | null
  status: PileLifecycle
  completed_steps: number
  total_steps: number
  rig: RawMachineSummary
  crane: RawMachineSummary
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

function mapDowntimeWindow(raw: RawDowntimeWindow): MachineDowntimeWindow {
  return { track: raw.track, start: raw.start, end: raw.end, machineId: raw.machine_id, notes: raw.notes }
}

function mapNonWorkingWindow(raw: RawNonWorkingWindow): NonWorkingWindow {
  return { start: raw.start, end: raw.end, label: raw.label }
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

function mapContractorSummary(raw: RawContractorSummary | null): ContractorSummary | null {
  if (!raw) return null
  return { id: raw.id, name: raw.name }
}

function mapMeasurements(raw: RawPileMeasurements | null): PileMeasurements | null {
  if (!raw) return null
  return {
    eglM: raw.egl_m,
    pileContractorId: raw.pile_contractor_id,
    pileContractor: mapContractorSummary(raw.pile_contractor),
    cageContractorId: raw.cage_contractor_id,
    cageContractor: mapContractorSummary(raw.cage_contractor),
    pileLengthM: raw.pile_length_m,
    cageWeightKg: raw.cage_weight_kg,
    ctlM: raw.ctl_m,
    colM: raw.col_m,
    boreDepthM: raw.bore_depth_m,
    hookLengthM: raw.hook_length_m,
    flM: raw.fl_m,
    plannedQtyM3: raw.planned_qty_m3,
    actualQtyM3: raw.actual_qty_m3,
  }
}

// Shared by the single-day whole-checklist fetch and the range per-pile-steps
// fetch (a list of one RawChecklistPile per day the pile appeared in) — both
// are just "some set of pile-day slices", flattened into one step-per-row.
function buildStepRowsForPileDays(pileDays: RawChecklistPile[], now: Date, options: { dedupeByStepId?: boolean } = {}): ChecklistStepRow[] {
  const rows: ChecklistStepRow[] = []

  for (const pile of pileDays) {
    const actualByStepId = new Map(pile.actual_steps.map((a) => [a.step_id, a]))

    for (const planStep of pile.plan_steps) {
      const actual = actualByStepId.get(planStep.step_id)
      rows.push({
        checklistPileId: pile.id,
        pileId: pile.pile.id,
        pileSeqNo: pile.seq_no,
        pileIdCode: pile.pile.pile_id_code,
        pileStatus: pile.status,
        area: pile.pile.area,
        pileRig: mapMachine(pile.rig),
        pileCrane: mapMachine(pile.crane),
        dimensionDiaMm: pile.pile.dimension?.dia ?? null,
        dimensionDepthM: pile.pile.dimension?.depth ?? null,
        measurements: mapMeasurements(pile.measurements),
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

  if (!options.dedupeByStepId) {
    return rows.sort(byNumber((r) => r.sequenceOrder, (r) => r.pileSeqNo))
  }

  // A resume day replans its boundary step even though that step already had
  // a row the day before (sequence_order >= resume_order, inclusive — see
  // plan_generation_service.py), so the same stepId can appear twice when
  // pileDays spans multiple days of the SAME pile. Keep the later occurrence
  // (pileDays is date-ascending) — it's the more recent/authoritative attempt.
  // Only valid when every entry in pileDays is one pile's day-slices — a
  // whole-checklist day has many different piles legitimately sharing the
  // same catalog stepId, so this must not run there (see buildStepRows).
  const byStepId = new Map(rows.map((row) => [row.stepId, row]))
  return Array.from(byStepId.values()).sort(byNumber((r) => r.sequenceOrder, (r) => r.pileSeqNo))
}

function buildStepRows(raw: RawChecklist, now: Date): ChecklistStepRow[] {
  return buildStepRowsForPileDays(raw.checklist_piles, now)
}

function mapPileProgress(raw: RawPileProgress): PileProgressRow {
  return {
    id: raw.id,
    pileIdCode: raw.pile_id_code,
    area: raw.area,
    status: raw.status,
    completedSteps: raw.completed_steps,
    totalSteps: raw.total_steps,
    rig: mapMachine(raw.rig),
    crane: mapMachine(raw.crane),
  }
}

// A step's `planned_end` is nulled out server-side whenever its natural end
// would run past the plan window (see plan_generation_service.py) — it means
// "still continuing", not "no data". Falling back to `plannedStart` in that
// case would count the step as completing the instant it starts, so derive
// the true projected end from its own duration/buffer instead.
export function resolvePlannedEnd(row: ChecklistStepRow): string | null {
  if (row.plannedEnd) return row.plannedEnd
  if (!row.plannedStart) return null
  return addMinutesIso(row.plannedStart, (row.durationMinutes ?? 0) + (row.bufferMinutes ?? 0))
}

// One point per hour tick across the day's planned working window — feeds the
// site-level plan-vs-actual timeline (cumulative piles completed vs planned).
// A pile's completion event is its final step (max sequenceOrder is unique
// per site's own step order — pil_site_steps — so this is well-defined
// regardless of track; every row here always belongs to one pile/one site).
export function buildSitePlanVsActualTimeline(rows: ChecklistStepRow[], selectedDate: string): SitePlanVsActualPoint[] {
  if (rows.length === 0) return []

  const finalSteps = Array.from(groupBy(rows, (row) => row.checklistPileId).values()).map((pileRows) =>
    pileRows.reduce((a, b) => (b.sequenceOrder > a.sequenceOrder ? b : a))
  )

  const plannedCompletions = finalSteps
    .map(resolvePlannedEnd)
    .filter((iso): iso is string => !!iso)
    .sort()
  const actualCompletions = finalSteps
    .map((row) => row.actualEnd)
    .filter((iso): iso is string => !!iso)
    .sort()

  const allStarts = rows.map((r) => r.plannedStart).filter((iso): iso is string => !!iso)
  const allEnds = [
    ...rows.map(resolvePlannedEnd).filter((iso): iso is string => !!iso),
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

// Slices the site's full (unfiltered) progress history down to the picked
// date range, for the multi-day range chart — same daily-cumulative points
// the dashboard-index SiteProgressChart already renders, just bounded.
export function buildRangeChartPoints(history: SiteProgressHistory | undefined, from: string, to: string): RangeChartPoint[] {
  const points = history?.points ?? []
  return points
    .filter((point) => point.date >= from && point.date <= to)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((point) => ({
      date: point.date,
      label: formatAxisDate(point.date),
      actual: point.actualCumulative,
      planned: point.plannedCumulative,
    }))
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
    planStartTime: data.plan_start_time,
    rows: buildStepRows(data, new Date()),
    downtimeWindows: data.downtime_windows.map(mapDowntimeWindow),
    nonWorkingWindows: data.non_working_windows.map(mapNonWorkingWindow),
  }
}

// Lightweight per-pile summary for every pile active anywhere in [from, to] —
// feeds the range pile table without pulling any step-level timestamps.
async function getPileProgressForRange(siteId: string, from: string, to: string): Promise<PileProgressRow[]> {
  const { data } = await apiClient.get<RawPileProgress[]>(`/piling/sites/${siteId}/piles/progress`, {
    params: { date_from: from, date_to: to },
  })
  return data.map(mapPileProgress)
}

// Full step-level detail for one pile, merged across every day it appeared in
// [from, to] — fetched lazily, one pile at a time (see usePileStepsForRange).
async function getPileStepsForRange(pileId: string, from: string, to: string): Promise<ChecklistStepRow[]> {
  const { data } = await apiClient.get<RawChecklistPile[]>(`/piling/piles/${pileId}/steps`, {
    params: { date_from: from, date_to: to },
  })
  return buildStepRowsForPileDays(data, new Date(), { dedupeByStepId: true })
}

export const siteDetailService = {
  getSite,
  getPlanState,
  getChecklistDetail,
  getPileProgressForRange,
  getPileStepsForRange,
}
