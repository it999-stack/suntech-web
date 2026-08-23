export type SiteStatus = 'ON_TRACK' | 'AT_RISK' | 'STALLED'

export interface DashboardOverview {
  totalPiles: number
  completedPiles: number
  inProgressPiles: number
  activeSites: number
  pendingResume: number
  todaysChecklistsSubmitted: number
  todaysChecklistsExpected: number
  // ─── Date-range-scoped KPIs (dashboard-index calendar filter) ────────────
  targetPlannedPiles: number
  targetCompletedPiles: number
  activeRigs: number
  totalRigs: number
  checklistsSubmitted: number
  checklistsExpected: number
}

export interface SiteProgress {
  siteId: string
  siteName: string
  clientName: string
  totalPiles: number
  completedPiles: number
  inProgressPiles: number
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
// multi-day range chart (SiteProgressRangeChart), sourced from the same
// daily-cumulative history endpoint used by the dashboard index page.
export interface RangeChartPoint {
  date: string
  label: string
  actual: number | null
  planned: number | null
}

// ─── Site Dashboard Overview (redesigned single-day Site Detail page) ─────────

// Mirrors core.models.piling.PilingMachineStatus — kept separate from
// machines/types/machines.types.ts's MachineStatus (which is missing IDLE)
// rather than widening that shared type for a use case it doesn't need yet.
export type MachineActivityStatus = 'ACTIVE' | 'INACTIVE' | 'BREAKDOWN' | 'IDLE'

export interface MachinePerformance {
  machine: MachineSummary
  status: MachineActivityStatus
  pilesCompleted: number
  pilesTotal: number
  currentPileIdCode: string | null
  currentStepName: string | null
  cycleTimeActualMin: number | null
  cycleTimeTargetMin: number | null
  utilizationPct: number | null
  delayMin: number
  startDelayMin: number
  activityDelayMin: number
  scheduleAdherencePct: number | null
  onTimeCount: number
  delayedCount: number
  nextPileIdCode: string | null
  nextStepName: string | null
  nextEstStart: string | null
}

export interface AreaSummary {
  area: string
  pilesCompleted: number
  pilesTotal: number
  percentComplete: number
}

// A lightweight per-pile rollup for the Piles Overview table — not per-step
// detail. Opening a row still lazily fetches full ChecklistStepRow[] via
// usePileStepsForRange, same as the range table already does.
export interface PileOverviewRow {
  checklistPileId: string
  pileId: string
  pileIdCode: string
  area: string | null
  rig: MachineSummary
  crane: MachineSummary | null
  completedSteps: number
  totalSteps: number
  status: StepStatus
  delayMin: number
}

export type AttentionAlertSeverity = 'info' | 'warning' | 'critical'
export type AttentionAlertTargetType = 'machine' | 'pile'

export interface AttentionAlert {
  id: string
  severity: AttentionAlertSeverity
  title: string
  description: string
  targetType: AttentionAlertTargetType
  targetId: string | null
}

export interface SiteDashboardStats {
  pilesCompleted: number
  pilesTotal: number
  pilesCompletedDelta: number | null
  rigUtilizationPct: number | null
  rigUtilizationDeltaPct: number | null
  scheduleAdherencePct: number | null
  onTimeCount: number
  delayedCount: number
  totalDelayMin: number
  startDelayMin: number
  activityDelayMin: number
}

export interface SiteDashboardOverview {
  date: string
  checklistExists: boolean
  lastUpdated: string
  stats: SiteDashboardStats
  machines: MachinePerformance[]
  areas: AreaSummary[]
  piles: PileOverviewRow[]
  alerts: AttentionAlert[]
}

// ─── Machine Activity Timeline — own endpoint, lighter than the overview ──────

export interface MachineTimelineBlock {
  checklistPileId: string
  pileIdCode: string
  stepName: string
  track: PilingTrack
  plannedStart: string
  plannedEnd: string | null
  actualStart: string | null
  actualEnd: string | null
}

export interface MachineTimeline {
  machine: MachineSummary
  blocks: MachineTimelineBlock[]
}

export interface MachineTimelineResponse {
  // The checklist's declared shift start (e.g. 8 AM) — the Gantt axis
  // anchors here so time before a machine's first step still renders as
  // Idle. Null only when no checklist exists for the date.
  planStartTime: string | null
  machines: MachineTimeline[]
}
