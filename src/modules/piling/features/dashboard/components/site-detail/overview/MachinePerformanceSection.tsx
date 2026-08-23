import { useRef } from 'react'
import { ChevronRightIcon, InfoIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/EmptyState'
import type { MachinePerformance } from '../../../types/dashboard.types'
import { MachinePerformanceCard } from './MachinePerformanceCard'

interface MachinePerformanceSectionProps {
  machines: MachinePerformance[]
}

export function MachinePerformanceSection({ machines }: MachinePerformanceSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-1.5 text-base font-semibold text-foreground">
            Machine Performance
          </h2>
          <p className="text-sm text-muted-foreground">Overview of all rigs and cranes working at site today</p>
        </div>
        {machines.length > 3 && (
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Scroll machines"
            onClick={() => scrollRef.current?.scrollBy({ left: 300, behavior: 'smooth' })}
          >
            <ChevronRightIcon className="size-4" />
          </Button>
        )}
      </div>

      {machines.length === 0 ? (
        <EmptyState
          icon={InfoIcon}
          title="No machines on site"
          description="This site has no rigs or cranes configured."
        />
      ) : (
        // grid-cols-1 caps this row's width to available space (see the same
        // trick, with the full explanation, in MachineActivityTimeline) so a
        // long run of machine cards scrolls within itself instead of
        // widening the page.
        <div className="grid grid-cols-1">
          <div ref={scrollRef} className="flex snap-x gap-4 overflow-x-auto pb-1">
            {machines.map((machine) => (
              <MachinePerformanceCard key={machine.machine.id} machine={machine} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
