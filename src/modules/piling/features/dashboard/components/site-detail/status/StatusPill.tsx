import { cn } from '@/lib/utils'
import { stepStatusVisuals, type TimelineNodeKind } from './stepStatusVisuals'

interface StatusPillProps {
  kind: TimelineNodeKind
  className?: string
}

export function StatusPill({ kind, className }: StatusPillProps) {
  const visual = stepStatusVisuals[kind]
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
        visual.bgClassName,
        className
      )}
    >
      <visual.icon className={cn('size-3.5', visual.iconClassName)} />
      {visual.label}
    </div>
  )
}
