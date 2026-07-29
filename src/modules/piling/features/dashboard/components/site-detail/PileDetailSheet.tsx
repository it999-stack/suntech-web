import { useMemo, useState } from "react"
import { ChevronRightIcon, ClockIcon, Info, TimerIcon } from "lucide-react"

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

import type { ChecklistStepRow, MachineDowntimeWindow } from "../../types/dashboard.types"
import { PileTimelinePanel } from "./panel/PileTimelinePanel"
import { StepStatusLegend } from "./status/StepStatusLegend"
import { StatusPill } from "./status/StatusPill"
import { computeDelayTotals, formatDelta } from "./lib/timelineMath"
import { formatM3 } from "@/lib/number"
import { cn } from "@/lib/utils"

interface PileDetailSheetProps {
  rows: ChecklistStepRow[]
  pileIdCode: string
  areaLocation: string | null
  status: ChecklistStepRow["status"]
  selectedDate: string
  open: boolean
  onOpenChange: (open: boolean) => void
  downtimeWindows?: MachineDowntimeWindow[]
  planStartTime?: string | null
}

function SectionTrigger({ title }: { title: string }) {
  return (
    <CollapsibleTrigger className="group/section flex w-full items-center gap-2 rounded-md px-1 py-2 text-left text-sm font-medium hover:bg-muted/50">
      <ChevronRightIcon className="size-4 transition-transform group-data-[state=open]/section:rotate-90" />
      {title}
    </CollapsibleTrigger>
  )
}

// Compact header stat — the same start/activity delay totals previously
// shown at the bottom of the sheet in a full-width card, now a small chip
// next to the pile title so the delay is visible without scrolling.
function DelayChip({
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
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-md px-2.5 py-1.5",
        isLate ? "bg-warning/10" : isEarly ? "bg-success/10" : "bg-muted"
      )}
    >
      <Icon className={cn("size-3.5", isLate ? "text-warning" : isEarly ? "text-success" : "text-muted-foreground")} />
      <div className="flex flex-col leading-none">
        <span className="text-[10px] text-muted-foreground">{label}</span>
        <span
          className={cn(
            "text-xs font-semibold tabular-nums",
            isLate ? "text-warning" : isEarly ? "text-success" : "text-foreground"
          )}
        >
          {formatted ?? (minutes === null ? "—" : "0 min")}
        </span>
      </div>
    </div>
  )
}

export function PileDetailSheet({
  rows,
  pileIdCode,
  areaLocation,
  status,
  selectedDate,
  open,
  onOpenChange,
  downtimeWindows,
  planStartTime,
}: PileDetailSheetProps) {
  const [concreteOpen, setConcreteOpen] = useState(false)

  const concreteUsage = rows[0]?.concreteUsage ?? null
  const delayTotals = useMemo(
    () => computeDelayTotals(rows, downtimeWindows ?? [], planStartTime ?? null, new Date()),
    [rows, downtimeWindows, planStartTime]
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
          max-h-[85vh]
          flex-col
          rounded-t-[10px]
          p-0
        "
      >
        {/* Sticky Header */}
        <DrawerHeader
          className="
            sticky
            top-0
            z-20
            border-b
            bg-muted/30
            px-6
            pt-4
            pb-4
          "
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div>
                <DrawerTitle>{pileIdCode}</DrawerTitle>
                <DrawerDescription>{areaLocation ?? "Unknown Area"}</DrawerDescription>
              </div>
              <StatusPill kind={status} />
            </div>

            <div className="flex items-center gap-2">
              <DelayChip icon={ClockIcon} label="Start Delay" minutes={delayTotals.totalStartDelayMinutes} />
              <DelayChip icon={TimerIcon} label="Activity Delay" minutes={delayTotals.totalActivityDelayMinutes} />

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
              downtimeWindows={downtimeWindows}
              planStartTime={planStartTime}
            />

            <Collapsible
              open={concreteOpen}
              onOpenChange={setConcreteOpen}
              className="rounded-lg border p-3"
            >
              <SectionTrigger title="Concrete Usage" />

              <CollapsibleContent className="pt-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-md border bg-muted/30 p-3">
                    <div className="text-xs text-muted-foreground">Planned</div>
                    <div className="text-sm font-semibold">{formatM3(concreteUsage?.plannedM3 ?? null)}</div>
                  </div>

                  <div className="rounded-md border bg-muted/30 p-3">
                    <div className="text-xs text-muted-foreground">Actual</div>
                    <div className="text-sm font-semibold">{formatM3(concreteUsage?.actualM3 ?? null)}</div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}