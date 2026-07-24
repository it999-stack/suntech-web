import { useState } from "react"
import { ChevronRightIcon } from "lucide-react"

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

import type { ChecklistStepRow } from "../../types/dashboard.types"
import { PileTimelinePanel } from "./panel/PileTimelinePanel"
import { StepStatusLegend } from "./status/StepStatusLegend"
import { StatusPill } from "./status/StatusPill"
import { formatM3 } from "@/lib/number"

interface PileDetailSheetProps {
  rows: ChecklistStepRow[]
  pileIdCode: string
  areaLocation: string | null
  status: ChecklistStepRow["status"]
  selectedDate: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

function SectionTrigger({ title }: { title: string }) {
  return (
    <CollapsibleTrigger className="group/section flex w-full items-center gap-2 rounded-md px-1 py-2 text-left text-sm font-medium hover:bg-muted/50">
      <ChevronRightIcon className="size-4 transition-transform group-data-[state=open]/section:rotate-90" />
      {title}
    </CollapsibleTrigger>
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
}: PileDetailSheetProps) {
  const [concreteOpen, setConcreteOpen] = useState(false)

  const concreteUsage = rows[0]?.concreteUsage ?? null

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

            <StepStatusLegend />
          </div>
        </DrawerHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto px-6 py-5">
          <div className="space-y-4">
            <PileTimelinePanel rows={rows} selectedDate={selectedDate} />

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