import {
  ArrowDownIcon,
  ArrowUpIcon,
  CalendarIcon,
  CircleCheckIcon,
  ClockIcon,
  FlagIcon,
  TimerIcon,
  TrendingUpIcon,
  TriangleAlertIcon,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDuration, formatDurationLong, formatTime, minutesBetween } from '@/lib/date'
import { formatPercent } from '@/lib/number'
import { byNumber } from '@/lib/sort'
import { cn } from '@/lib/utils'
import { ACTUAL_COLOR, PLANNED_COLOR } from '../../../lib/chartColors'
import type { ChecklistStepRow } from '../../../types/dashboard.types'

interface PileTimelineFooterStatsProps {
  rows: ChecklistStepRow[]
}

// Single-ratio meter (steps completed / total) — a lighter step of the same
function ProgressRing({ percent }: { percent: number }) {
  const radius = 80
  const halfCircumference = Math.PI * radius
  const clamped = Math.min(100, Math.max(0, percent))
  const offset = halfCircumference * (1 - clamped / 100)
  const isComplete = clamped >= 100

  return (
    <div className="relative flex flex-col items-center" style={{ width: '200px' }}>
      <svg
        viewBox="0 0 200 110"
        preserveAspectRatio="xMidYMid meet"
        style={{ width: '100%', aspectRatio: '200 / 110', display: 'block' }}
      >
        <path
          d={`M 20 100 A ${radius} ${radius} 0 0 1 180 100`}
          fill="none"
          strokeWidth="14"
          strokeLinecap="round"
          className="stroke-muted"
        />
        <path
          d={`M 20 100 A ${radius} ${radius} 0 0 1 180 100`}
          fill="none"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={halfCircumference}
          strokeDashoffset={offset}
          className={cn(
            'transition-[stroke-dashoffset] duration-500',
            isComplete ? 'stroke-success' : 'stroke-primary'
          )}
        />
      </svg>

      <div className="absolute top-0 flex w-full justify-between px-3 text-[10px] text-muted-foreground">
        <span>0%</span>
        <span>100%</span>
      </div>

      <div className="-mt-10 flex flex-col items-center gap-0.5">
        <span className="text-2xl font-bold tabular-nums text-foreground">{formatPercent(clamped)}</span>
        <span className="text-[11px] text-muted-foreground">{isComplete ? 'Completed' : 'In progress'}</span>
      </div>
    </div>
  )
}

function DurationRow({
  icon: Icon,
  label,
  minutes,
  percent,
  color,
}: {
  icon: typeof CalendarIcon
  label: string
  minutes: number
  percent: number
  color: string
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex size-9 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: `color-mix(in oklab, ${color} 14%, transparent)` }}
      >
        <Icon className="size-4" style={{ color }} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-lg font-semibold text-foreground">{formatDurationLong(minutes)}</div>
      </div>
      <div className="flex w-24 shrink-0 flex-col items-end gap-1.5">
        <span className="text-xs font-medium tabular-nums text-muted-foreground">{formatPercent(percent)}</span>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full transition-[width]"
            style={{ width: `${Math.min(100, percent)}%`, backgroundColor: color }}
          />
        </div>
      </div>
    </div>
  )
}

export function PileTimelineFooterStats({ rows }: PileTimelineFooterStatsProps) {
  const now = new Date()

  // "Planned" is the whole pile's total plan. "Actual elapsed" is the real
  // work done so far — full duration for completed steps, live now-minus-start
  // credit for whichever step is currently running. Whether that's "ahead" or
  // "behind" schedule is judged against "expected elapsed by now": the plan's
  // own window overlap with everything up to now (same now-vs-plannedStart/End
  // signal deriveStepStatus already uses to mark a step "delayed"), not
  // against the total plan — comparing total plan to partial actual always
  // reads as falsely "ahead" early in a pile, since most steps haven't
  // reached their window yet.
  const planMinutes = rows.reduce((sum, row) => sum + minutesBetween(row.plannedStart, row.plannedEnd), 0)

  const actualElapsedMinutes = rows.reduce((sum, row) => {
    if (row.actualEnd) return sum + minutesBetween(row.actualStart, row.actualEnd)
    if (row.actualStart) return sum + Math.max(0, (now.getTime() - new Date(row.actualStart).getTime()) / 60_000)
    return sum
  }, 0)

  const expectedElapsedMinutes = rows.reduce((sum, row) => {
    if (!row.plannedStart) return sum
    const start = new Date(row.plannedStart).getTime()
    const end = new Date(row.plannedEnd ?? row.plannedStart).getTime()
    return sum + Math.max(0, Math.min(now.getTime(), end) - start) / 60_000
  }, 0)

  const scheduleDeltaMinutes = actualElapsedMinutes - expectedElapsedMinutes
  const isAhead = scheduleDeltaMinutes > 0
  const isBehind = scheduleDeltaMinutes < 0

  const completedCount = rows.filter((row) => row.status === 'completed').length
  const progress = rows.length ? (completedCount / rows.length) * 100 : 0
  const nextStep = [...rows].sort(byNumber((row) => row.sequenceOrder)).find((row) => row.status === 'pending')

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
      <Card size="sm">
        <CardHeader className="gap-1.5 pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ClockIcon className="size-4 text-muted-foreground" />
              Plan vs Actual
            </CardTitle>
          </div>
          {scheduleDeltaMinutes !== 0 && (
            <span
              className={cn(
                'flex w-fit items-center gap-1 text-sm font-medium',
                isBehind ? 'text-warning' : 'text-success'
              )}
            >
              {isBehind ? <ArrowDownIcon className="size-3.5" /> : <ArrowUpIcon className="size-3.5" />}
              {formatDuration(Math.abs(scheduleDeltaMinutes))} {isBehind ? 'behind' : 'ahead'}
            </span>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-4 pt-1">
          <DurationRow icon={CalendarIcon} label="Planned" minutes={planMinutes} percent={100} color={PLANNED_COLOR} />
          <DurationRow
            icon={TimerIcon}
            label="Actual"
            minutes={actualElapsedMinutes}
            percent={planMinutes ? (actualElapsedMinutes / planMinutes) * 100 : 0}
            color={ACTUAL_COLOR}
          />
          {isBehind ? (
            <div className="flex items-center gap-2 rounded-md bg-warning/10 px-3.5 py-2.5 text-sm font-medium text-warning">
              <TriangleAlertIcon className="size-4 shrink-0" />
              {formatDurationLong(Math.abs(scheduleDeltaMinutes))} behind schedule
            </div>
          ) : isAhead ? (
            <div className="flex items-center gap-2 rounded-md bg-success/10 px-3.5 py-2.5 text-sm font-medium text-success">
              <ArrowUpIcon className="size-4 shrink-0" />
              {formatDurationLong(Math.abs(scheduleDeltaMinutes))} ahead of schedule
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-md bg-success/10 px-3.5 py-2.5 text-sm font-medium text-success">
              <CircleCheckIcon className="size-4 shrink-0" />
              Right on schedule
            </div>
          )}
        </CardContent>
      </Card>

      <Card size="sm" className="bg-info/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUpIcon className="size-4 text-muted-foreground" />
            Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center gap-3">
          <ProgressRing percent={progress} />
          <div className="flex items-center gap-1.5 rounded-full bg-muted px-3 mt-[0px] text-xs font-medium text-muted-foreground">
            <CircleCheckIcon className="size-3.5" />
            {completedCount} of {rows.length} steps completed
          </div>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlagIcon className="size-4 text-muted-foreground" />
            Next Step
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col items-center justify-center gap-3 py-2 text-center">
          {nextStep ? (
            <>
              <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                <span className="text-lg font-bold text-primary">{nextStep.sequenceOrder}</span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-base font-semibold text-foreground">{nextStep.stepName}</div>
                <div className="flex items-center justify-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                  <ClockIcon className="size-3.5" />
                  ETA: {formatTime(nextStep.plannedStart)}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex size-12 items-center justify-center rounded-full bg-success/10">
                <CircleCheckIcon className="size-6 text-success" />
              </div>
              <div className="text-base font-semibold text-foreground">All steps complete</div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
