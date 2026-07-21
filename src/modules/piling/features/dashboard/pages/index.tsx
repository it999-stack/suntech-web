import { AlertTriangleIcon, ClipboardCheckIcon, HardHatIcon, ListChecksIcon } from 'lucide-react'
import { CardSkeleton } from '@/components/skeletons/CardSkeleton'
import { KpiRowSkeleton } from '@/components/skeletons/KpiRowSkeleton'
import { TableSkeleton } from '@/components/skeletons/TableSkeleton'
import { ActivityFeed } from '@/modules/shared/components/ActivityFeed'
import { AlertsPanel } from '@/modules/shared/components/AlertsPanel'
import { SiteProgressChart } from '../components/SiteProgressChart'
import { SiteProgressTable } from '../components/SiteProgressTable'
import { useDashboardActivity, useDashboardAlerts, useDashboardData } from '../hooks/useDashboardQueries'
import { QuickOverviewCard } from '@/modules/shared/components/QuickOverviewCards'

import overviewBg from '@/assets/overview_bg.png'

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
        <QuickOverviewCard
          title="Quick overview"
          description="This is all over site progress today"
          backgroundImage={overviewBg}
          items={[
            {
              value: overview
                ? `${overview.completedPiles} / ${overview.totalPiles}`
                : '—',
              label: 'Total piles progress',
              icon: <ClipboardCheckIcon className="size-4" />,
            },
            {
              value: overview?.activeSites ?? '—',
              label: 'Active sites',
              icon: <HardHatIcon className="size-4" />,
            },
            {
              value: overview?.pendingResume ?? '—',
              label: 'Pending resume',
              icon: <AlertTriangleIcon className="size-4" />,
            },
            {
              value: overview
                ? `${overview.todaysChecklistsSubmitted} / ${overview.todaysChecklistsExpected}`
                : '—',
              label: "Today's checklists",
              icon: <ListChecksIcon className="size-4" />,
            },
          ]}
        />
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
