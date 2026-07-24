import { apiClient } from '@/lib/apiClient'
import type { ActivityItem } from '@/modules/shared/types/activity.types'
import type { AlertItem } from '@/modules/shared/types/alert.types'
import type {
  DashboardData,
  ProgressHistoryPoint,
  SiteProgress,
  SiteProgressHistory,
  SiteStatus,
} from '../types/dashboard.types'

export interface DashboardService {
  getDashboard(): Promise<DashboardData>
  getSiteProgressHistory(siteId: string): Promise<SiteProgressHistory>
  getAlerts(): Promise<AlertItem[]>
  getRecentActivity(): Promise<ActivityItem[]>
}

// ─── Alerts / Recent Activity — no backend source yet (no alerts, pending-resume,
// or activity-log endpoints exist in suntech-core), so these stay static dummy data
// until that's built. Resolve immediately — no artificial delay, it only hurt LCP.

const MOCK_ALERTS: AlertItem[] = [
  {
    id: 'alert-1',
    title: 'Pile P-104 pending resume',
    description: 'Harbor Bridge Extension — casing step incomplete since yesterday',
    severity: 'warning',
    category: 'pending_resume',
    timestamp: '2h ago',
  },
  {
    id: 'alert-2',
    title: 'Rig breakdown reported',
    description: 'Green Valley Residency — RIG-02 out of service',
    severity: 'critical',
    category: 'machine_breakdown',
    timestamp: '4h ago',
  },
  {
    id: 'alert-3',
    title: 'Drilling step delayed',
    description: 'Metro Line 4 - Sector B — actual start 6h behind plan on P-233',
    severity: 'warning',
    category: 'delayed_step',
    timestamp: '5h ago',
  },
  {
    id: 'alert-4',
    title: 'Concrete usage variance',
    description: 'Riverside Tower — 12% over planned quantity on P-089',
    severity: 'info',
    category: 'concrete_variance',
    timestamp: '1d ago',
  },
  {
    id: 'alert-5',
    title: 'No checklist submitted',
    description: 'Harbor Bridge Extension — no daily checklist for 3 days',
    severity: 'critical',
    category: 'pending_resume',
    timestamp: '1d ago',
  },
]

const MOCK_ACTIVITY: ActivityItem[] = [
  {
    id: 'act-1',
    title: 'Daily checklist submitted',
    description: 'Riverside Tower — Shift A',
    timestamp: '10 min ago',
  },
  {
    id: 'act-2',
    title: 'Pile P-233 marked in progress',
    description: 'Metro Line 4 - Sector B',
    timestamp: '45 min ago',
  },
  {
    id: 'act-3',
    title: 'Machine event logged',
    description: 'Green Valley Residency — RIG-02 breakdown',
    timestamp: '4h ago',
  },
  {
    id: 'act-4',
    title: 'Pile P-071 completed',
    description: 'Coastal Highway Piers',
    timestamp: '6h ago',
  },
  {
    id: 'act-5',
    title: 'Daily checklist submitted',
    description: 'Coastal Highway Piers — Shift B',
    timestamp: '8h ago',
  },
]

// ─── Real data — sourced from the single dashboard-aggregate endpoint ────────
// GET /piling/dashboard returns overview + per-site progress + the default
// (first) site's history in one round trip, so first paint needs only one call.

interface RawSiteProgress {
  site_id: string
  site_name: string
  total_piles: number
  completed_piles: number
  in_progress_piles: number
  not_started_piles: number
  percent_complete: number
  last_checklist_label: string
  status: SiteStatus
  target_end_date: string | null
  created_at: string | null
}

interface RawProgressHistoryPoint {
  date: string
  actual_cumulative: number
  planned_cumulative: number
}

interface RawSiteProgressHistory {
  site_id: string
  total_piles: number
  points: RawProgressHistoryPoint[]
}

interface RawDashboard {
  overview: {
    total_piles: number
    completed_piles: number
    in_progress_piles: number
    active_sites: number
    todays_checklists_submitted: number
    todays_checklists_expected: number
  }
  sites: RawSiteProgress[]
  default_site_history: RawSiteProgressHistory | null
}

function mapSiteProgress(raw: RawSiteProgress): SiteProgress {
  return {
    siteId: raw.site_id,
    siteName: raw.site_name,
    totalPiles: raw.total_piles,
    completedPiles: raw.completed_piles,
    inProgressPiles: raw.in_progress_piles,
    notStartedPiles: raw.not_started_piles,
    percentComplete: raw.percent_complete,
    lastChecklistLabel: raw.last_checklist_label,
    status: raw.status,
    targetEndDate: raw.target_end_date,
    createdAt: raw.created_at,
  }
}

function mapProgressHistoryPoint(raw: RawProgressHistoryPoint): ProgressHistoryPoint {
  return { date: raw.date, actualCumulative: raw.actual_cumulative, plannedCumulative: raw.planned_cumulative }
}

function mapSiteProgressHistory(raw: RawSiteProgressHistory): SiteProgressHistory {
  return {
    siteId: raw.site_id,
    totalPiles: raw.total_piles,
    points: raw.points.map(mapProgressHistoryPoint),
  }
}

async function getDashboard(): Promise<DashboardData> {
  const { data } = await apiClient.get<RawDashboard>('/piling/dashboard')
  const pendingResume = MOCK_ALERTS.filter((a) => a.category === 'pending_resume').length

  return {
    overview: {
      totalPiles: data.overview.total_piles,
      completedPiles: data.overview.completed_piles,
      inProgressPiles: data.overview.in_progress_piles,
      activeSites: data.overview.active_sites,
      // No pending-resume endpoint exists yet — stays a static placeholder count.
      pendingResume,
      todaysChecklistsSubmitted: data.overview.todays_checklists_submitted,
      todaysChecklistsExpected: data.overview.todays_checklists_expected,
    },
    sites: data.sites.map(mapSiteProgress),
    defaultSiteHistory: data.default_site_history ? mapSiteProgressHistory(data.default_site_history) : null,
  }
}

async function getSiteProgressHistory(siteId: string): Promise<SiteProgressHistory> {
  const { data } = await apiClient.get<RawSiteProgressHistory>(`/piling/sites/${siteId}/progress-history`)
  return mapSiteProgressHistory(data)
}

export const httpDashboardService: DashboardService = {
  getDashboard,
  getSiteProgressHistory,
  getAlerts: () => Promise.resolve(MOCK_ALERTS),
  getRecentActivity: () => Promise.resolve(MOCK_ACTIVITY),
}

// Swap this binding to fully mock/fully real as needed — the store and every
// component only depend on the `DashboardService` interface above.
export const dashboardService: DashboardService = httpDashboardService
