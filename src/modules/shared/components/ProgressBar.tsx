import { Progress as ProgressPrimitive } from '@base-ui/react/progress'
import { ProgressTrack, ProgressIndicator } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { formatPercent } from '@/lib/number'

interface ProgressBarProps {
  value: number
  size?: 'default' | 'sm'
  label?: string
  showValue?: boolean
  className?: string
  completed?: number
  inProgress?: number
  total?: number
}

export function ProgressBar({
  value,
  size = 'default',
  label,
  showValue = false,
  className,
  completed,
  inProgress,
  total,
}: ProgressBarProps) {
  const hasBreakdown =
    total != null && total > 0 && completed != null && inProgress != null

  const completedPct = hasBreakdown ? (completed! / total!) * 100 : 0
  const inProgressPct = hasBreakdown ? (inProgress! / total!) * 100 : 0
  const notStarted = hasBreakdown ? total! - completed! - inProgress! : 0

  const tooltip = hasBreakdown
    ? `${completed} completed · ${inProgress} in progress · ${notStarted} not started`
    : undefined

  return (
    <ProgressPrimitive.Root value={value} className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-medium tabular-nums text-foreground">{formatPercent(value)}</span>
        </div>
      )}
      <div className="flex items-center gap-2">
        <ProgressTrack className={cn('flex-1', size === 'sm' ? 'h-1.5' : 'h-2.5')} title={tooltip}>
          {hasBreakdown ? (
            <div className="flex h-full w-full">
              <div
                className="h-full bg-success transition-all"
                style={{ width: `${completedPct}%` }}
              />
              <div
                className="h-full bg-warning transition-all"
                style={{ width: `${inProgressPct}%` }}
              />
            </div>
          ) : (
            <ProgressIndicator />
          )}
        </ProgressTrack>
        {showValue && (
          <span className="min-w-[2.5rem] shrink-0 text-left text-xs font-medium tabular-nums text-foreground">
            {formatPercent(value)}
          </span>
        )}
      </div>
    </ProgressPrimitive.Root>
  )
}