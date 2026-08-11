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

import type { ChecklistStepRow, MachineDowntimeWindow, NonWorkingWindow } from "../../types/dashboard.types"
import { PileTimelinePanel } from "./panel/PileTimelinePanel"
import { StepStatusLegend } from "./status/StepStatusLegend"
import { StatusPill } from "./status/StatusPill"
import { computeDelayTotals, formatDelta } from "./lib/timelineMath"
import { formatM3 } from "@/lib/number"
import { cn } from "@/lib/utils"

interface PileDetailSheetProps {
  rows: ChecklistStepRow[]
  pileIdCode: string
  area: string | null
  status: ChecklistStepRow["status"]
  selectedDate: string
  open: boolean
  onOpenChange: (open: boolean) => void
  downtimeWindows?: MachineDowntimeWindow[]
  nonWorkingWindows?: NonWorkingWindow[]
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

// Only two states: red once actual runs past plan at all, green when on time or early.
function getDelaySeverity(minutes: number | null) {
  if (minutes === null) return "neutral"
  if (minutes > 0) return "critical"
  return "success"
}

const severityStyles = {
  critical: { text: "text-destructive", bar: "bg-destructive", track: "bg-destructive/15" },
  success: { text: "text-success", bar: "bg-success", track: "bg-success/15" },
  neutral: { text: "text-muted-foreground", bar: "bg-muted-foreground", track: "bg-muted" },
} as const

function DelayGauge({
  icon: Icon,
  label,
  minutes,
  maxScale = 180, // minutes at which the bar reads "full" — tune to your typical range
}: {
  icon: typeof ClockIcon
  label: string
  minutes: number | null
  maxScale?: number
}) {
  const formatted = formatDelta(minutes)
  const severity = getDelaySeverity(minutes)
  const styles = severityStyles[severity]
  const fillPct = minutes === null ? 0 : Math.min(100, (Math.abs(minutes) / maxScale) * 100)

  return (
    <div className="flex-1 px-4 first:pl-0 last:pr-0 not-first:border-l">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          <Icon className="size-3.5" />
          {label}
        </span>
        <span className={cn("text-lg font-semibold tabular-nums", styles.text)}>
          {formatted ?? (minutes === null ? "—" : "0 min")}
        </span>
      </div>
      <div className={cn("h-1 w-full rounded-full", styles.track)}>
        <div
          className={cn("h-full rounded-full transition-all", styles.bar)}
          style={{ width: `${fillPct}%` }}
        />
      </div>
    </div>
  )
}

export function PileDetailSheet({
  rows,
  pileIdCode,
  area,
  status,
  selectedDate,
  open,
  onOpenChange,
  downtimeWindows,
  nonWorkingWindows,
  planStartTime,
}: PileDetailSheetProps) {
  const [concreteOpen, setConcreteOpen] = useState(false)

  const concreteUsage = rows[0]?.concreteUsage ?? null
  const delayTotals = useMemo(
    () => computeDelayTotals(rows, downtimeWindows ?? [], nonWorkingWindows ?? [], planStartTime ?? null, new Date()),
    [rows, downtimeWindows, nonWorkingWindows, planStartTime]
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

          {/* Bottom row: full-width delay gauges */}
          <div className="mt-3 flex items-stretch rounded-md border bg-background/60 px-4 py-3">
            <DelayGauge icon={ClockIcon} label="Start Delay" minutes={delayTotals.totalStartDelayMinutes} />
            <DelayGauge icon={TimerIcon} label="Activity Delay" minutes={delayTotals.totalActivityDelayMinutes} />
          </div>
        </DrawerHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto px-6 py-5">
          <div className="space-y-4">
            <PileTimelinePanel
              rows={rows}
              selectedDate={selectedDate}
              downtimeWindows={downtimeWindows}
              nonWorkingWindows={nonWorkingWindows}
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