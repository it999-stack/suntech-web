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

export interface ChecklistStepRow {
  checklistPileId: string
  pileSeqNo: number
  pileIdCode: string
  pileStatus: PileLifecycle
  stepId: string
  stepName: string
  track: PilingTrack
  sequenceOrder: number
  plannedStart: string | null
  plannedEnd: string | null
  actualStart: string | null
  actualEnd: string | null
  status: StepStatus
}

export interface ChecklistDetail {
  checklistId: string
  date: string
  status: ChecklistStatus
  rows: ChecklistStepRow[]
}

// One bar-pair per step (aggregated across every pile in the checklist) —
// feeds the plan-vs-actual chart.
export interface StepDurationPoint {
  stepName: string
  sequenceOrder: number
  plannedMinutes: number
  actualMinutes: number
}
