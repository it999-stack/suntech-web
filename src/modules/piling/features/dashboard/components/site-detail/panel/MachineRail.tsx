import { WindIcon } from 'lucide-react'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Image } from '@/components/ui/image'
import { cn } from '@/lib/utils'
import craneImage from '@/assets/images/crane.png'
import rigImage from '@/assets/images/rig.png'
import type { MachineSummary, PilingTrack } from '../../../types/dashboard.types'

export interface MachineCell {
  gridRowStart: number
  gridRowEnd: number // inclusive
  machine: MachineSummary
}

interface MachineRailProps {
  cells: MachineCell[]
  column: number
  // Which side the adjacent Planned/Actual Steps column sits on — the bar
  // and connector hug that edge so the line stays short.
  side: 'left' | 'right'
}

// No COMPRESSOR artwork yet — falls back to the lucide icon for that track.
const machineTypeImage: Partial<Record<PilingTrack, string>> = {
  RIG: rigImage,
  CRANE: craneImage,
}

const machineTheme: Record<
  PilingTrack,
  {
    line: string
    dot: string
    text: string
  }
> = {
  RIG: {
    line: 'border-blue-500',
    dot: 'before:bg-blue-500 after:bg-blue-500',
    text: 'text-blue-500',
  },
  CRANE: {
    line: 'border-orange-500',
    dot: 'before:bg-orange-500 after:bg-orange-500',
    text: 'text-orange-500',
  },
  COMPRESSOR: {
    line: 'border-emerald-500',
    dot: 'before:bg-emerald-500 after:bg-emerald-500',
    text: 'text-emerald-500',
  },
}

function MachineTypeIcon({ type }: { type: PilingTrack }) {
  const image = machineTypeImage[type]
  if (image) {
    return (
      <AspectRatio ratio={1} className="size-32">
        <Image src={image} alt={type} className="object-contain" />
      </AspectRatio>
    )
  }
  return <WindIcon className="size-4 text-muted-foreground" />
}

export function MachineRail({ cells, column, side }: MachineRailProps) {
  const isRight = side === 'right'

  return (
    <>
      {cells.map((cell) => {
        const theme = machineTheme[cell.machine.type]
        return (
          <div
            key={`${cell.machine.id}-${cell.gridRowStart}`}
            style={{ gridColumn: column, gridRow: `${cell.gridRowStart} / ${cell.gridRowEnd + 1}` }}
            className={cn(
              'relative flex flex-col gap-1 text-center',
              isRight
                ? [
                    'items-start',
                    'border-r-2',
                    theme.line,
                    'before:absolute before:-right-[5px] before:top-0 before:size-2 before:rounded-full',
                    'after:absolute after:-right-[5px] after:bottom-0 after:size-2 after:rounded-full',
                    theme.dot,
                  ]
                : [
                    'items-end',
                    'border-l-2',
                    theme.line,
                    'before:absolute before:-left-[5px] before:top-0 before:size-2 before:rounded-full',
                    'after:absolute after:-left-[5px] after:bottom-0 after:size-2 after:rounded-full',
                    theme.dot,
                  ]
            )}
          >
            {/* Sticky within this machine's own row span — pins to the top of the
                scroll viewport while any part of its bar is in view, and scrolls
                away normally once the bar's range has fully passed. The connector
                lives in here too (not as a sibling) so it stays flush against the
                label instead of staying anchored to the bar's original midpoint. */}
            <div className="sticky top-2 z-10 relative flex flex-col items-center justify-center rounded-lg py-6">
              
              <div className="flex flex-col items-center leading-tight gap-1">
                <MachineTypeIcon type={cell.machine.type} />
                <span className={cn('text-lg font-semibold', theme.text)}>
                  {cell.machine.machineNo}
                </span>
              </div>

            </div>
          </div>
        )
      })}
    </>
  )
}
