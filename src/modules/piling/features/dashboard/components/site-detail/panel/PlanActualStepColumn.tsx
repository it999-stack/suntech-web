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
import { CalendarIcon, ChevronDownIcon, MessageSquareTextIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDuration, formatTimeRangeWithDay, minutesBetween } from '@/lib/date'
import type { ChecklistStepRow, MachineDowntimeWindow, NonWorkingWindow } from '../../../types/dashboard.types'
import { stepStatusVisuals } from '../status/stepStatusVisuals'
import { computeActivityDelay, computeStartDelay, formatDelta, rowChainKey, stepWorkStart } from '../lib/timelineMath'

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
  // When provided (built from a whole day's checklist via
  // buildMachineChainPreviousRowMap), delay badges use the true per-machine,
  // cross-pile chain instead of falling back to this pile's own previous
  // row — see "Known gap: per-card badges in the single-pile drawer" in
  // DELAY_CALCULATIONS.md.
  previousRowByStepKey?: Map<string, ChecklistStepRow | null>
}

// Planned is always this fixed blue theme, regardless of a step's real
// status — "planned" isn't a state that varies per step, it's just the
// schedule. Actual keeps using stepStatusVisuals (status-based colors:
// green=completed, amber=delayed, etc.) for its border/dot/pill, but its
// footer stat band stays this same fixed emerald tint either way — the
// footer's own colored delay text (red/green) already carries severity, so
// the band itself is column identity, not another status indicator.
const PLANNED_CARD_THEME = {
  railBorder: 'border-l-blue-500',
  dot: 'bg-blue-600 text-white',
  pill: 'bg-blue-50 text-blue-700',
  footer: 'bg-blue-50/70',
}
const ACTUAL_CARD_THEME = {
  footer: 'bg-emerald-50/70',
}

export function PlanActualStepColumn({
  cells,
  mode,
  column,
  downtimeWindows = [],
  nonWorkingWindows = [],
  planStartTime = null,
  previousRowByStepKey,
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
        // `cells` is always one pile's rows in sequence order, so the previous cell is only
        // this step's actual predecessor when nothing better is available. When the caller
        // supplies previousRowByStepKey (built across every pile for the day), prefer the true
        // per-machine chain — that's the only thing that can correctly anchor a pile's first
        // step, which may chain off a different pile's last step on the same machine.
        const previousRow = previousRowByStepKey
          ? (previousRowByStepKey.get(rowChainKey(row)) ?? null)
          : index > 0
            ? cells[index - 1].row
            : null
        const startDeltaMinutes = mode === 'actual' ? computeStartDelay(row, previousRow, planStartTime) : null
        const activityDeltaMinutes =
          mode === 'actual' ? computeActivityDelay(row, downtimeWindows, nonWorkingWindows, new Date()) : null
        const startDelay = formatDelta(startDeltaMinutes)
        const activityDelay = formatDelta(activityDeltaMinutes)

        // Planned shows the step's planned duration/buffer template. Actual
        // shows how long it really took (actualEnd − actualStart) — never
        // the same planned number twice. Only computed once both actual
        // timestamps exist; a still-open step (start but no end) shows "—"
        // rather than a live-guessed duration.
        const durationMinutes =
          mode === 'planned'
            ? row.durationMinutes
            : row.actualStart && row.actualEnd
              ? minutesBetween(row.actualStart, row.actualEnd)
              : null

        return (
          <Card
            key={row.stepId}
            style={{ gridColumn: column, gridRow }}
            className={cn(
              // self-start: this row's shared grid height is set by whatever
              // sits in it across every column (e.g. a machine-rail image far
              // taller than any step card) — without this, the grid's default
              // stretch would inflate the card to match, leaving a stray gap
              // inside it. Sizing to its own content keeps every card's
              // internal spacing identical regardless of what else is in its row.
              'relative mt-4 gap-0 self-start overflow-hidden rounded-xl border-l-4 py-0 shadow-sm',
              !hasActual && 'opacity-60',
              mode === 'planned' ? PLANNED_CARD_THEME.railBorder : visual.railBorderClassName
            )}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2.5">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold',
                    mode === 'planned' ? PLANNED_CARD_THEME.dot : visual.dotClassName
                  )}
                >
                  {index + 1}
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
                {mode === 'planned' ? (
                  <span className="flex size-5 items-center justify-center rounded-full border border-blue-200 text-blue-500">
                    <ChevronDownIcon className="size-3" />
                  </span>
                ) : (
                  <StatusIcon className={`size-4 ${visual.iconClassName}`} />
                )}
              </div>
            </CardHeader>

            <CardContent className="flex flex-col gap-3 p-4 pt-0">
              <span className="flex items-center gap-1.5 text-sm font-medium break-words text-foreground">
                <CalendarIcon className="size-3.5 shrink-0 text-muted-foreground" />
                {hasActual ? formatTimeRangeWithDay(start, end) : '—'}
              </span>

              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  className={cn(
                    'inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium',
                    mode === 'planned' ? PLANNED_CARD_THEME.pill : visual.pillClassName
                  )}
                >
                  {mode === 'planned' ? 'Scheduled' : !hasActual ? 'Pending' : visual.label}
                </span>
                {startDelay && (
                  <span
                    className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-semibold ${
                      startDeltaMinutes! > 0 ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'
                    }`}
                  >
                    start {startDelay}
                  </span>
                )}
              </div>

              <div
                className={cn(
                  '-mx-4 -mb-4 grid grid-cols-2 gap-x-3 gap-y-2 px-4 py-3.5 text-xs',
                  mode === 'planned' ? PLANNED_CARD_THEME.footer : ACTUAL_CARD_THEME.footer
                )}
              >
                <div>
                  <div className="text-[10px] tracking-wide text-muted-foreground uppercase">
                    {mode === 'planned' ? 'Expected Duration' : 'Actual Duration'}
                  </div>
                  <div className="font-medium text-foreground">{formatDuration(durationMinutes)}</div>
                </div>
                <div>
                  {mode === 'planned' ? (
                    <>
                      <div className="text-[10px] tracking-wide text-muted-foreground uppercase">Buffer</div>
                      <div className="font-medium text-foreground">{formatDuration(row.bufferMinutes)}</div>
                    </>
                  ) : (
                    <>
                      <div className="text-[10px] tracking-wide text-muted-foreground uppercase">Activity Delay</div>
                      <div
                        className={cn(
                          'font-medium',
                          activityDeltaMinutes === null
                            ? 'text-muted-foreground'
                            : activityDeltaMinutes > 0
                              ? 'text-destructive'
                              : activityDeltaMinutes < 0
                                ? 'text-success'
                                : 'text-foreground'
                        )}
                      >
                        {activityDelay ?? (activityDeltaMinutes === 0 ? '0 min' : '—')}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </>
  )
}
