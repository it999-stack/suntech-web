import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Image } from '@/components/ui/image'
import { ProgressBar } from '@/modules/shared/components/ProgressBar'
import { StatusPill } from '@/modules/shared/components/StatusPill'
import { cn } from '@/lib/utils'
import { formatTime } from '@/lib/date'
import rigImage from '@/assets/images/rig.png'
import craneImage from '@/assets/images/crane.png'
import type { MachinePerformance } from '../../../types/dashboard.types'
import { formatPercent0, formatSignedDuration, machineStatusVisuals } from './lib/format'

interface MachinePerformanceCardProps {
  machine: MachinePerformance
}

export function MachinePerformanceCard({ machine }: MachinePerformanceCardProps) {
  const status = machineStatusVisuals[machine.status]
  const isCrane = machine.machine.type === 'CRANE'
  const progressPct = machine.pilesTotal > 0 ? (machine.pilesCompleted / machine.pilesTotal) * 100 : 0
  const stepTimeDelta =
    machine.stepTimeActualMin !== null && machine.stepTimePlannedMin !== null
      ? Math.round(machine.stepTimeActualMin - machine.stepTimePlannedMin)
      : null

  return (
    <Card
      id={`machine-card-${machine.machine.id}`}
      className="w-72 shrink-0 scroll-mx-4 snap-start transition-shadow"
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <span className="font-semibold text-foreground">{machine.machine.machineNo}</span>
        <StatusPill icon={status.icon} label={status.label} className={status.bgClassName} iconClassName={status.iconClassName} />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <AspectRatio ratio={1} className="size-14 shrink-0">
            <Image src={isCrane ? craneImage : rigImage} alt={isCrane ? 'Crane' : 'Rig'} className="object-contain" />
          </AspectRatio>
          <div className="flex-1">
            <div className="text-lg font-semibold tabular-nums text-foreground">
              {machine.pilesCompleted} / {machine.pilesTotal}{' '}
              <span className="text-sm font-normal text-muted-foreground">piles</span>
            </div>
            <ProgressBar value={progressPct} size="sm" className="mt-1.5" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <div className="text-muted-foreground">Current Pile</div>
            <div className="font-medium text-foreground">{machine.currentPileIdCode ?? '—'}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Step</div>
            <div className="font-medium text-foreground">{machine.currentStepName ?? '—'}</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 border-t border-border pt-3 text-xs">
          <div>
            <div className="text-muted-foreground">Step Time</div>
            <div className="font-semibold tabular-nums text-foreground">
              {machine.stepTimeActualMin !== null ? Math.round(machine.stepTimeActualMin) + 'm' : '—'}
            </div>
            {stepTimeDelta !== null && (
              <div className={cn('tabular-nums', stepTimeDelta > 0 ? 'text-destructive' : 'text-success')}>
                {formatSignedDuration(stepTimeDelta)}
              </div>
            )}
          </div>
          <div>
            <div className="text-muted-foreground">Utilization</div>
            <div className="font-semibold tabular-nums text-foreground">{formatPercent0(machine.utilizationPct)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Activity Delay</div>
            <div
              className={cn(
                'font-semibold tabular-nums',
                machine.activityDelayMin > 0 ? 'text-destructive' : 'text-success'
              )}
            >
              {formatSignedDuration(machine.activityDelayMin)}
            </div>
          </div>
        </div>

        {machine.nextPileIdCode && (
          <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-2.5 py-1.5 text-xs">
            <span className="text-muted-foreground">
              Next: <span className="font-medium text-foreground">{machine.nextPileIdCode}</span> (
              {machine.nextStepName})
            </span>
            <span className="shrink-0 text-muted-foreground">
              Est. {machine.nextEstStart ? formatTime(machine.nextEstStart) : '—'}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
