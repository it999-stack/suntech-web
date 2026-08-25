import { ActivityIcon, AlarmClockIcon, CalendarCheckIcon, GaugeIcon, ListChecksIcon } from 'lucide-react'
import { QuickOverviewCard } from '@/modules/shared/components/QuickOverviewCards'
import type { KpiCardVariant } from '@/modules/shared/components/KpiCard'
import { formatPercent0, formatSignedDuration } from './lib/format'
import overviewBg from '@/assets/overview_bg.png'

const DELAY_WARNING_THRESHOLD_MIN = 45

export interface SiteDashboardStatRowData {
  pilesCompleted: number
  pilesTotal: number
  activityDelayMin: number
  startDelayMin: number
  rigUtilizationPct: number | null
  scheduleAdherencePct: number | null
}

interface SiteDashboardStatRowProps {
  stats: SiteDashboardStatRowData
  title: string
  description: string
}

export function SiteDashboardStatRow({ stats, title, description }: SiteDashboardStatRowProps) {
  const utilizationVariant: KpiCardVariant =
    stats.rigUtilizationPct === null ? 'default' : stats.rigUtilizationPct < 70 ? 'warning' : 'success'
  const adherenceVariant: KpiCardVariant =
    stats.scheduleAdherencePct === null ? 'default' : stats.scheduleAdherencePct < 70 ? 'warning' : 'success'
  const activityDelayVariant: KpiCardVariant =
    stats.activityDelayMin > DELAY_WARNING_THRESHOLD_MIN ? 'warning' : 'default'
  const startDelayVariant: KpiCardVariant =
    stats.startDelayMin > DELAY_WARNING_THRESHOLD_MIN ? 'warning' : 'default'

  return (
    <QuickOverviewCard
      title={title}
      description={description}
      backgroundImage={overviewBg}
      items={[
        {
          label: 'Piles Completed',
          value: `${stats.pilesCompleted} / ${stats.pilesTotal}`,
          icon: <ListChecksIcon className="size-4" />,
        },
        {
          label: 'Activity Delay',
          value: formatSignedDuration(stats.activityDelayMin),
          icon: <ActivityIcon className="size-4" />,
          variant: activityDelayVariant,
        },
        {
          label: 'Start Delay',
          value: formatSignedDuration(stats.startDelayMin),
          icon: <AlarmClockIcon className="size-4" />,
          variant: startDelayVariant,
        },
        {
          label: 'Rig Utilization',
          value: formatPercent0(stats.rigUtilizationPct),
          icon: <GaugeIcon className="size-4" />,
          variant: utilizationVariant,
        },
        {
          label: 'Schedule Adherence',
          value: formatPercent0(stats.scheduleAdherencePct),
          icon: <CalendarCheckIcon className="size-4" />,
          variant: adherenceVariant,
        },
      ]}
    />
  )
}
