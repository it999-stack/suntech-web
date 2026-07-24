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
import type { ChecklistStepRow } from '../../types/dashboard.types'
import { stepStatusVisuals } from '../status/stepStatusVisuals'
import { computeStepDelay, formatDelta } from '../lib/timelineMath'

export interface StepCell {
  gridRow: number
  row: ChecklistStepRow
}

interface PlanActualStepColumnProps {
  cells: StepCell[]
  mode: 'planned' | 'actual'
  column: number
}

export function PlanActualStepColumn({ cells, mode, column }: PlanActualStepColumnProps) {
  return (
    <>
      {cells.map(({ gridRow, row }) => {
        const hasActual = mode === 'actual' ? !!row.actualStart : true
        const visual = stepStatusVisuals[row.status]
        const StatusIcon = visual.icon
        const start = mode === 'planned' ? row.plannedStart : row.actualStart
        const end = mode === 'planned' ? row.plannedEnd : row.actualEnd

        // Delay only makes sense on the actual column — planned has nothing to compare against.
        const { startDeltaMinutes, endDeltaMinutes } =
          mode === 'actual' ? computeStepDelay(row) : { startDeltaMinutes: null, endDeltaMinutes: null }
        const startDelay = formatDelta(startDeltaMinutes)
        const endDelay = formatDelta(endDeltaMinutes)

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
                      className={`text-[10px] font-semibold ${
                        startDeltaMinutes! > 0 ? 'text-amber-600' : 'text-emerald-600'
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
                  {endDelay && (
                    <span
                      className={`text-[10px] font-semibold ${
                        endDeltaMinutes! > 0 ? 'text-amber-600' : 'text-emerald-600'
                      }`}
                    >
                      end {endDelay}
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