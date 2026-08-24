import { cn } from '@/lib/utils'
import { StatusPill as SharedStatusPill } from '@/modules/shared/components/StatusPill'
import { stepStatusVisuals, type TimelineNodeKind } from './stepStatusVisuals'

interface StatusPillProps {
  kind: TimelineNodeKind
  className?: string
}

export function StatusPill({ kind, className }: StatusPillProps) {
  const visual = stepStatusVisuals[kind]
  return (
    <SharedStatusPill
      icon={visual.icon}
      label={visual.label}
      className={cn(visual.bgClassName, className)}
      iconClassName={visual.iconClassName}
    />
  )
}
