import { AlertTriangleIcon, ClipboardCheckIcon, HardHatIcon, ListChecksIcon } from 'lucide-react'
import { CardSkeleton } from '@/components/skeletons/CardSkeleton'
import { KpiRowSkeleton } from '@/components/skeletons/KpiRowSkeleton'
import { TableSkeleton } from '@/components/skeletons/TableSkeleton'
import { ActivityFeed } from '@/modules/shared/components/ActivityFeed'
import { AlertsPanel } from '@/modules/shared/components/AlertsPanel'
import { KpiCard } from '@/modules/shared/components/KpiCard'
import { SiteProgressChart } from '../components/SiteProgressChart'
import { SiteProgressTable } from '../components/SiteProgressTable'
import { useDashboardActivity, useDashboardAlerts, useDashboardData } from '../hooks/useDashboardQueries'

export default function PilingDashboardPage() {
  const dashboardQuery = useDashboardData()
  const alertsQuery = useDashboardAlerts()
  const activityQuery = useDashboardActivity()

  const overview = dashboardQuery.data?.overview
  const sites = dashboardQuery.data?.sites ?? []

  return (
    <div className="flex flex-col gap-6">
      {dashboardQuery.isLoading ? (
        <KpiRowSkeleton />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Total Piles Progress"
            value={overview ? `${overview.completedPiles} / ${overview.totalPiles}` : '—'}
            icon={<HardHatIcon className="size-4" />}
          />
          <KpiCard
            label="Active Sites"
            value={overview?.activeSites ?? '—'}
            icon={<ListChecksIcon className="size-4" />}
          />
          <KpiCard
            label="Pending Resume"
            value={overview?.pendingResume ?? '—'}
            icon={<AlertTriangleIcon className="size-4" />}
            variant="warning"
          />
          <KpiCard
            label="Today's Checklists"
            value={
              overview
                ? `${overview.todaysChecklistsSubmitted} / ${overview.todaysChecklistsExpected}`
                : '—'
            }
            icon={<ClipboardCheckIcon className="size-4" />}
            variant="success"
          />
        </div>
      )}

      {dashboardQuery.isLoading ? (
        <CardSkeleton lines={6} />
      ) : (
        <SiteProgressChart sites={sites} defaultSiteHistory={dashboardQuery.data?.defaultSiteHistory} />
      )}

      {dashboardQuery.isLoading ? (
        <TableSkeleton rows={5} columns={8} />
      ) : (
        <SiteProgressTable sites={sites} />
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        {alertsQuery.isLoading ? (
          <CardSkeleton lines={4} />
        ) : (
          <AlertsPanel
            title="Critical Alerts"
            items={alertsQuery.data ?? []}
            emptyMessage="No active alerts"
          />
        )}
        {activityQuery.isLoading ? (
          <CardSkeleton lines={4} />
        ) : (
          <ActivityFeed items={activityQuery.data ?? []} />
        )}
      </div>
    </div>
  )
}
