import { useState } from 'react'
import { ClipboardCheckIcon, DrillIcon, ListChecksIcon, TargetIcon } from 'lucide-react'
import { CardSkeleton } from '@/components/skeletons/CardSkeleton'
import { KpiRowSkeleton } from '@/components/skeletons/KpiRowSkeleton'
import { TableSkeleton } from '@/components/skeletons/TableSkeleton'
import { DateRangePicker } from '@/components/DateRangePicker'
import { ActivityFeed } from '@/modules/shared/components/ActivityFeed'
import { AlertsPanel } from '@/modules/shared/components/AlertsPanel'
import { SiteProgressTable } from '../components/index/SiteProgressTable'
import { useDashboardActivity, useDashboardAlerts, useDashboardData } from '../hooks/useDashboardQueries'
import { QuickOverviewCard } from '@/modules/shared/components/QuickOverviewCards'
import { today } from '@/lib/date'

import overviewBg from '@/assets/overview_bg.png'

export default function PilingDashboardPage() {
  const [range, setRange] = useState<{ from: string; to: string }>({ from: today(), to: today() })

  const dashboardQuery = useDashboardData(range.from, range.to)
  const alertsQuery = useDashboardAlerts()
  const activityQuery = useDashboardActivity()

  const overview = dashboardQuery.data?.overview
  const sites = dashboardQuery.data?.sites ?? []

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <DateRangePicker from={range.from} to={range.to} onChange={setRange} />
      </div>

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
              value: overview
                ? `${overview.targetCompletedPiles} / ${overview.targetPlannedPiles}`
                : '—',
              label: "Today's target",
              icon: <TargetIcon className="size-4" />,
            },
            {
              value: overview
                ? `${overview.activeRigs} / ${overview.totalRigs}`
                : '—',
              label: 'Active rigs',
              icon: <DrillIcon className="size-4" />,
            },
            {
              value: overview
                ? `${overview.checklistsSubmitted} / ${overview.checklistsExpected}`
                : '—',
              label: "Today's checklists",
              icon: <ListChecksIcon className="size-4" />,
            },
          ]}
        />
      )}

      {dashboardQuery.isLoading ? (
        <TableSkeleton rows={5} columns={8} />
      ) : (
        <SiteProgressTable sites={sites} />
      )}

      <div className="grid gap-4 xl:grid-cols-2 hidden">
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
