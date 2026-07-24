import { ClockIcon } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ConnectorLine } from '@/modules/shared/components/ConnectorLine'
import { HorizontalConnector } from '@/modules/shared/components/HorizontalConnector'
import { formatTime } from '@/lib/date'
import { stepStatusVisuals } from '../status/stepStatusVisuals'
import type { TimelineNode } from '../lib/timelineMath'

export interface TimelineCell {
  gridRow: number
  node: TimelineNode
}

interface StepTimelineRailProps {
  cells: TimelineCell[]
  currentContentRow: number | null
  nowLabel: string | null
  column: number
}

export function StepTimelineRail({ cells, currentContentRow, nowLabel, column }: StepTimelineRailProps) {
  let stepCounter = 0

  return (
    <>
      <div
        style={{ gridColumn: column, gridRow: 1 }}
        className="flex items-center justify-center gap-1.5 pb-2 text-center text-xs font-semibold tracking-wide text-muted-foreground uppercase"
      >
        <ClockIcon className="size-3.5" />
        Timeline
      </div>

      {cells.map(({ gridRow, node }, index) => {
        const visual = stepStatusVisuals[node.kind]
        const isBuffer = node.kind === 'buffer'
        if (!isBuffer) stepCounter += 1

        const isPast = currentContentRow !== null && node.contentRow <= currentContentRow
        const nextNode = cells[index + 1]?.node
        const belowPast = currentContentRow !== null && !!nextNode && nextNode.contentRow <= currentContentRow
        const isCurrent = currentContentRow !== null && node.contentRow === currentContentRow

        return (
          <div key={node.key} style={{ gridColumn: column, gridRow }} className="relative flex flex-col items-center">
            <ConnectorLine solid={isPast} invisible={index === 0} className={`${visual.railClassName}`}  />

            <span className="mt-1 mb-1.5 text-[10px] font-medium whitespace-nowrap text-muted-foreground">
              {formatTime(node.atIso)}
            </span>

            <div className="relative flex shrink-0 items-center justify-center">
              {!isBuffer && (
                <>
                  <HorizontalConnector side="left" className={`${visual.railClassName}`} />
                  <HorizontalConnector side="right" className={`${visual.railClassName}`} />
                </>
              )}

              <div
                className={`relative z-10 flex shrink-0 items-center justify-center rounded-full border-2 bg-background font-semibold ${visual.railClassName} ${
                  isCurrent ? 'size-7 text-xs ring-4 ring-primary/15' : 'size-6 text-[11px]'
                }`}
              >
                {isBuffer ? <visual.icon className="size-3.5" /> : stepCounter}
              </div>
            </div>

            <div className="relative mt-1.5 flex flex-1 flex-col items-center">
              <ConnectorLine solid={belowPast} invisible={index === cells.length - 1} className={`${visual.railClassName}`} />
              {isCurrent && nowLabel && (
                <Tooltip>
                  <TooltipTrigger className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-default">
                    <span className="relative flex size-2.5">
                      <span className="absolute inset-0 rounded-full bg-blue-500 opacity-75 animate-ping" />
                      <span className="relative size-2.5 rounded-full bg-blue-600 ring-2 ring-background" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="right">{nowLabel}</TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        )
      })}
    </>
  )
}