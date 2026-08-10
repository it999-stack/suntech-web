import { ClockIcon, TimerIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { formatDelta } from './lib/timelineMath'

interface DelaySummaryCardProps {
  title: string
  totalStartDelayMinutes: number | null
  totalActivityDelayMinutes: number | null
  size?: 'default' | 'sm'
}

function DelayStat({
  icon: Icon,
  label,
  minutes,
}: {
  icon: typeof ClockIcon
  label: string
  minutes: number | null
}) {
  const formatted = formatDelta(minutes)
  const isLate = minutes !== null && minutes > 0
  const isEarly = minutes !== null && minutes < 0

  return (
    <div className="flex flex-1 items-center gap-3">
      <div
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-lg',
          isLate ? 'bg-destructive/10' : isEarly ? 'bg-success/10' : 'bg-muted'
        )}
      >
        <Icon className={cn('size-4', isLate ? 'text-destructive' : isEarly ? 'text-success' : 'text-muted-foreground')} />
      </div>
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div
          className={cn(
            'text-lg font-semibold tabular-nums',
            isLate ? 'text-destructive' : isEarly ? 'text-success' : 'text-foreground'
          )}
        >
          {formatted ?? (minutes === null ? '—' : '0 min')}
        </div>
      </div>
    </div>
  )
}

// Pile-level and site-level aggregate of the same start/activity delay
// formulas used per-step in PlanActualStepColumn — see computeDelayTotals().
export function DelaySummaryCard({ title, totalStartDelayMinutes, totalActivityDelayMinutes, size }: DelaySummaryCardProps) {
  return (
    <Card size={size}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClockIcon className="size-4 text-muted-foreground" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:gap-8">
        <DelayStat icon={ClockIcon} label="Total Start Delay" minutes={totalStartDelayMinutes} />
        <DelayStat icon={TimerIcon} label="Total Activity Delay" minutes={totalActivityDelayMinutes} />
      </CardContent>
    </Card>
  )
}
