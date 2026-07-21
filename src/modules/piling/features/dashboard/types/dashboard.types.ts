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
