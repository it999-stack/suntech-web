import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { MessageSquareTextIcon } from 'lucide-react'
import { formatDuration, formatTimeRange } from '@/lib/date'
import type { ChecklistStepRow, MachineDowntimeWindow, NonWorkingWindow } from '../../../types/dashboard.types'
import { stepStatusVisuals } from '../status/stepStatusVisuals'
import { computeActivityDelay, computeStartDelay, formatDelta, stepWorkStart } from '../lib/timelineMath'

export interface StepCell {
  gridRow: number
  row: ChecklistStepRow
}

interface PlanActualStepColumnProps {
  cells: StepCell[]
  mode: 'planned' | 'actual'
  column: number
  downtimeWindows?: MachineDowntimeWindow[]
  nonWorkingWindows?: NonWorkingWindow[]
  planStartTime?: string | null
}

export function PlanActualStepColumn({
  cells,
  mode,
  column,
  downtimeWindows = [],
  nonWorkingWindows = [],
  planStartTime = null,
}: PlanActualStepColumnProps) {
  return (
    <>
      {cells.map(({ gridRow, row }, index) => {
        const hasActual = mode === 'actual' ? !!row.actualStart : true
        const visual = stepStatusVisuals[row.status]
        const StatusIcon = visual.icon
        const start = mode === 'planned' ? stepWorkStart(row) : row.actualStart
        const end = mode === 'planned' ? row.plannedEnd : row.actualEnd

        // Delay only makes sense on the actual column — planned has nothing to compare against.
        // `cells` is always one pile's rows in sequence order, so the previous cell is this
        // step's actual predecessor.
        const previousRow = index > 0 ? cells[index - 1].row : null
        const startDeltaMinutes = mode === 'actual' ? computeStartDelay(row, previousRow, planStartTime) : null
        const activityDeltaMinutes =
          mode === 'actual' ? computeActivityDelay(row, downtimeWindows, nonWorkingWindows, new Date()) : null
        const startDelay = formatDelta(startDeltaMinutes)
        const activityDelay = formatDelta(activityDeltaMinutes)

        return (
          <Card
            key={row.stepId}
            style={{ gridColumn: column, gridRow }}
            className={[
              "relative overflow-hidden border-l-4 pl-0",
              !hasActual && "opacity-60",
              visual.railBorderClassName,
            ].filter(Boolean).join(" ")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-2">
              <div className="flex items-center gap-2">
                <span className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${visual.dotClassName}`}>
                  {row.sequenceOrder}
                </span>
                <CardTitle className="text-sm font-medium">{row.stepName}</CardTitle>
              </div>

              <div className="flex items-center gap-1.5">
                {row.remarks && (
                  <Popover>
                    <PopoverTrigger
                      render={
                        <button
                          type="button"
                          aria-label="View remarks"
                          className="rounded-sm text-muted-foreground/70 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      }
                    >
                      <MessageSquareTextIcon className="size-3.5" />
                    </PopoverTrigger>
                    <PopoverContent side="top" align="end" className="w-64 text-sm">
                      <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide mb-1">
                        Remarks
                      </p>
                      <p className="text-foreground">{row.remarks}</p>
                    </PopoverContent>
                  </Popover>
                )}
                <StatusIcon className={`size-4 ${visual.iconClassName}`} />
              </div>
            </CardHeader>

            <CardContent className="space-y-1.5 p-3 pt-0">
              <div className="flex items-baseline justify-between">
                <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                  {hasActual ? formatTimeRange(start, end) : '—'}
                  {startDelay && (
                    <span
                      className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-semibold ${
                        startDeltaMinutes! > 0 ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'
                      }`}
                    >
                      start {startDelay}
                    </span>
                  )}
                </span>
                <span className={`text-[11px] font-medium ${visual.iconClassName}`}>
                  {mode === 'actual' && !hasActual ? 'Pending' : visual.label}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  {formatDuration(row.durationMinutes)}
                  {activityDelay && (
                    <span
                      className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-semibold ${
                        activityDeltaMinutes! > 0 ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'
                      }`}
                    >
                      activity {activityDelay}
                    </span>
                  )}
                </span>
                <span>Buffer: {formatDuration(row.bufferMinutes)}</span>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </>
  )
}