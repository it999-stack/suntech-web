export type SiteStatus = 'ON_TRACK' | 'AT_RISK' | 'STALLED'

export interface DashboardOverview {
  totalPiles: number
  completedPiles: number
  inProgressPiles: number
  activeSites: number
  pendingResume: number
  todaysChecklistsSubmitted: number
  todaysChecklistsExpected: number
}

export interface SiteProgress {
  siteId: string
  siteName: string
  totalPiles: number
  completedPiles: number
  inProgressPiles: number
  notStartedPiles: number
  percentComplete: number
  lastChecklistLabel: string
  status: SiteStatus
  targetEndDate: string | null
  createdAt: string | null
}

export interface ProgressHistoryPoint {
  date: string
  actualCumulative: number
  plannedCumulative: number
}

export interface SiteProgressHistory {
  siteId: string
  totalPiles: number
  points: ProgressHistoryPoint[]
}

export interface DashboardData {
  overview: DashboardOverview
  sites: SiteProgress[]
  defaultSiteHistory: SiteProgressHistory | null
}

// ─── Site detail / plan-vs-actual (SiteDetailPage) ────────────────────────────

export type PilingTrack = 'RIG' | 'CRANE' | 'COMPRESSOR'
export type PileLifecycle = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

export interface MachineSummary {
  id: string
  machineNo: string
  type: PilingTrack
}
export type ChecklistStatus = 'DRAFT' | 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED'

// Derived client-side from planned vs actual timestamps — the backend has no
// step-level status column, only whole-checklist (ChecklistStatus) and
// per-pile (PileLifecycle) ones.
export type StepStatus = 'pending' | 'in_progress' | 'completed' | 'delayed'

export interface SiteDetail {
  id: string
  name: string
  location: string | null
  companyName: string
  clientName: string
  targetEndDate: string | null
}

export interface PlanState {
  exists: boolean
  checklistId: string | null
  status: ChecklistStatus | null
}

export interface ContractorSummary {
  id: string
  name: string
}

export interface PileMeasurements {
  eglM: number | null
  pileContractorId: string | null
  pileContractor: ContractorSummary | null
  cageContractorId: string | null
  cageContractor: ContractorSummary | null
  pileLengthM: number | null
  cageWeightKg: number | null
  ctlM: number | null
  colM: number | null
  boreDepthM: number | null
  hookLengthM: number | null
  flM: number | null
  plannedQtyM3: number | null
  actualQtyM3: number | null
}

export interface ChecklistStepRow {
  checklistPileId: string
  pileId: string
  pileSeqNo: number
  pileIdCode: string
  pileStatus: PileLifecycle
  area: string | null
  pileRig: MachineSummary
  pileCrane: MachineSummary
  dimensionDiaMm: number | null
  dimensionDepthM: number | null
  measurements: PileMeasurements | null
  stepId: string
  stepName: string
  track: PilingTrack
  sequenceOrder: number
  plannedStart: string | null
  plannedEnd: string | null
  actualStart: string | null
  actualEnd: string | null
  remarks: string | null
  status: StepStatus
  durationMinutes: number | null
  bufferMinutes: number | null
  plannedMachine: MachineSummary | null
  actualMachine: MachineSummary | null
  totalApplicableSteps: number | null
  isPlanComplete: boolean | null
}

// A closed (or still-open, `end: null`) BREAKDOWN→RESUMED interval for one
// track, paired server-side from raw machine events — see
// downtime_service.compute_downtime_windows() in suntech-core.
export interface MachineDowntimeWindow {
  track: PilingTrack
  start: string
  end: string | null
  machineId: string | null
  notes: string | null
}

// A FIXED-behavior non-working window (shift-change/lunch break) resolved
// onto the checklist's own plan window — see
// non_working_window_service.resolve_non_working_windows() in suntech-core.
// Applies globally, unlike MachineDowntimeWindow (no track scoping).
export interface NonWorkingWindow {
  start: string
  end: string
  label: string
}

export interface ChecklistDetail {
  checklistId: string
  date: string
  status: ChecklistStatus
  planStartTime: string | null
  rows: ChecklistStepRow[]
  downtimeWindows: MachineDowntimeWindow[]
  nonWorkingWindows: NonWorkingWindow[]
}

// Lightweight per-pile row for the Site Detail page's range pile table — sums
// progress across every day the pile appeared within the picked range. No
// per-step timestamps, so unlike StepStatus this can't distinguish "delayed"
// from "in progress"; full step detail is fetched lazily per pile instead.
export interface PileProgressRow {
  id: string
  pileIdCode: string
  area: string | null
  status: PileLifecycle
  completedSteps: number
  totalSteps: number
  rig: MachineSummary
  crane: MachineSummary
}

// One point per hour tick across the selected day's working window — feeds
// the site-level plan-vs-actual timeline chart (cumulative piles completed).
export interface SitePlanVsActualPoint {
  hourLabel: string
  timeIso: string
  plannedCumulative: number | null
  actualCumulative: number | null
}

// One point per day within a picked date range — feeds the site-detail
// multi-day range chart, sourced from the same daily-cumulative history as
// the dashboard-index SiteProgressChart.
export interface RangeChartPoint {
  date: string
  label: string
  actual: number | null
  planned: number | null
}
