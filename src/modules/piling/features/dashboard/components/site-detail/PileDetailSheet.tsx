import { useMemo, useState } from "react"
import type { ReactNode } from "react"
import { ChevronRightIcon, Info, PencilIcon, TimerIcon } from "lucide-react"

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Button } from "@/components/ui/button"

import type { ChecklistStepRow } from "../../types/dashboard.types"
import { PileTimelinePanel } from "./panel/PileTimelinePanel"
import { StepStatusLegend } from "./status/StepStatusLegend"
import { StatusPill } from "./status/StatusPill"
import { computeDelayTotals, formatDelta } from "./lib/timelineMath"
import { formatKg, formatM3, formatMeters } from "@/lib/number"
import { cn } from "@/lib/utils"
import { MeasurementsEditDialog } from "./MeasurementsEditDialog"

interface PileDetailSheetProps {
  rows: ChecklistStepRow[]
  pileId: string
  siteId: string
  pileIdCode: string
  area: string | null
  status: ChecklistStepRow["status"]
  selectedDate: string
  open: boolean
  onOpenChange: (open: boolean) => void
  planStartTime?: string | null
  previousRowByStepKey?: Map<string, ChecklistStepRow | null>
  // Fired after the measurements edit dialog saves successfully — caller
  // invalidates whichever query actually backs `rows` (range-steps query for
  // the range table, whole-checklist query for the single-day table).
  onMeasurementsSaved?: () => void
}

function SectionTrigger({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex w-full items-center justify-between gap-2">
      <CollapsibleTrigger className="group/section flex flex-1 items-center gap-2 rounded-md px-1 py-2 text-left text-sm font-medium hover:bg-muted/50">
        <ChevronRightIcon className="size-4 transition-transform group-data-[state=open]/section:rotate-90" />
        {title}
      </CollapsibleTrigger>
      {action}
    </div>
  )
}

// Only two states: red once actual runs past plan at all, green when on time or early.
function getDelaySeverity(minutes: number | null) {
  if (minutes === null) return "neutral"
  if (minutes > 0) return "critical"
  return "success"
}

const severityPillStyles = {
  critical: "bg-destructive/10 text-destructive",
  success: "bg-success/10 text-success",
  neutral: "bg-muted text-muted-foreground",
} as const

// Compact overall-pile activity delay indicator — sits in the header next to
// the info icon, not as a full-width gauge (see DELAY_CALCULATIONS.md for
// what "activity delay" means; this is computeDelayTotals()'s pile total).
function ActivityDelayPill({ minutes }: { minutes: number | null }) {
  const formatted = formatDelta(minutes)
  const severity = getDelaySeverity(minutes)

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded px-2 py-1 text-xs font-semibold",
        severityPillStyles[severity]
      )}
    >
      <TimerIcon className="size-3.5" />
      Activity Delay {formatted ?? (minutes === null ? "—" : "0 min")}
    </span>
  )
}

export function PileDetailSheet({
  rows,
  pileId,
  siteId,
  pileIdCode,
  area,
  status,
  selectedDate,
  open,
  onOpenChange,
  planStartTime,
  previousRowByStepKey,
  onMeasurementsSaved,
}: PileDetailSheetProps) {
  const [measurementsOpen, setMeasurementsOpen] = useState(false)
  const [editMeasurementsOpen, setEditMeasurementsOpen] = useState(false)

  const measurements = rows[0]?.measurements ?? null
  const delayTotals = useMemo(
    () => computeDelayTotals(rows, planStartTime ?? null, new Date()),
    [rows, planStartTime]
  )

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      showSwipeHandle
      swipeDirection="down"
    >
      <DrawerContent
        className="
          flex
          max-h-[90vh]
          flex-col
          rounded-t-[10px]
          p-0
        "
      >
        {/* Sticky Header */}
        <DrawerHeader className="sticky top-0 z-20 border-b bg-muted/30 px-6 pt-4 pb-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="rounded-md bg-foreground px-2 py-1 font-mono text-xs font-semibold tracking-wide text-background">
                {pileIdCode}
              </span>
              <div>
                <DrawerTitle className="sr-only">{pileIdCode}</DrawerTitle>
                <DrawerDescription className="text-sm">{area ?? "Unknown Area"}</DrawerDescription>
              </div>
              <StatusPill kind={status} />
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <ActivityDelayPill minutes={delayTotals.totalActivityDelayMinutes} />

              <HoverCard>
                <HoverCardTrigger
                  render={
                    <button
                      type="button"
                      aria-label="Status legend"
                      className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  }
                >
                  <Info className="size-4 cursor-pointer" />
                </HoverCardTrigger>
                <HoverCardContent side="bottom" align="end" className="w-auto">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Status Legend</p>
                  <StepStatusLegend />
                </HoverCardContent>
              </HoverCard>
            </div>
          </div>
        </DrawerHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto px-6 py-5">
          <div className="space-y-4">
            <PileTimelinePanel
              rows={rows}
              selectedDate={selectedDate}
              planStartTime={planStartTime}
              previousRowByStepKey={previousRowByStepKey}
            />

            <Collapsible
              open={measurementsOpen}
              onOpenChange={setMeasurementsOpen}
              className="rounded-lg border p-3"
            >
              <SectionTrigger
                title="Measurements"
                action={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Edit measurements"
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditMeasurementsOpen(true)
                    }}
                  >
                    <PencilIcon className="size-4" />
                  </Button>
                }
              />

              <CollapsibleContent className="pt-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-md border bg-muted/30 p-3">
                    <div className="text-xs text-muted-foreground">Existing Ground Level</div>
                    <div className="text-sm font-semibold">{formatMeters(measurements?.eglM ?? null)}</div>
                  </div>

                  <div className="rounded-md border bg-muted/30 p-3">
                    <div className="text-xs text-muted-foreground">Pile Length</div>
                    <div className="text-sm font-semibold">{formatMeters(measurements?.pileLengthM ?? null)}</div>
                  </div>

                  <div className="rounded-md border bg-muted/30 p-3">
                    <div className="text-xs text-muted-foreground">Cage Weight</div>
                    <div className="text-sm font-semibold">{formatKg(measurements?.cageWeightKg ?? null)}</div>
                  </div>

                  <div className="rounded-md border bg-muted/30 p-3">
                    <div className="text-xs text-muted-foreground">Pile Contractor</div>
                    <div className="text-sm font-semibold">{measurements?.pileContractor?.name ?? "—"}</div>
                  </div>

                  <div className="rounded-md border bg-muted/30 p-3">
                    <div className="text-xs text-muted-foreground">Cage Contractor</div>
                    <div className="text-sm font-semibold">{measurements?.cageContractor?.name ?? "—"}</div>
                  </div>

                  <div className="rounded-md border bg-muted/30 p-3">
                    <div className="text-xs text-muted-foreground">Casing Top Level</div>
                    <div className="text-sm font-semibold">{formatMeters(measurements?.ctlM ?? null)}</div>
                  </div>

                  <div className="rounded-md border bg-muted/30 p-3">
                    <div className="text-xs text-muted-foreground">Cut Off Level</div>
                    <div className="text-sm font-semibold">{formatMeters(measurements?.colM ?? null)}</div>
                  </div>

                  <div className="rounded-md border bg-muted/30 p-3">
                    <div className="text-xs text-muted-foreground">Bore Depth</div>
                    <div className="text-sm font-semibold">{formatMeters(measurements?.boreDepthM ?? null)}</div>
                  </div>

                  <div className="rounded-md border bg-muted/30 p-3">
                    <div className="text-xs text-muted-foreground">Hook Length</div>
                    <div className="text-sm font-semibold">{formatMeters(measurements?.hookLengthM ?? null)}</div>
                  </div>

                  <div className="rounded-md border bg-muted/30 p-3">
                    <div className="text-xs text-muted-foreground">Founding Level</div>
                    <div className="text-sm font-semibold">{formatMeters(measurements?.flM ?? null)}</div>
                  </div>

                  <div className="rounded-md border bg-muted/30 p-3">
                    <div className="text-xs text-muted-foreground">Planned Concrete Qty</div>
                    <div className="text-sm font-semibold">{formatM3(measurements?.plannedQtyM3 ?? null)}</div>
                  </div>

                  <div className="rounded-md border bg-muted/30 p-3">
                    <div className="text-xs text-muted-foreground">Actual Concrete Qty</div>
                    <div className="text-sm font-semibold">{formatM3(measurements?.actualQtyM3 ?? null)}</div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      </DrawerContent>

      <MeasurementsEditDialog
        pileId={pileId}
        siteId={siteId}
        measurements={measurements}
        open={editMeasurementsOpen}
        onOpenChange={setEditMeasurementsOpen}
        onSaved={onMeasurementsSaved}
      />
    </Drawer>
  )
}