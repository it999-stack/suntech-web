import { CircleCheckIcon, CircleDashedIcon, ClockIcon, LoaderCircleIcon, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PileListStatus } from '../types/sites.types'

interface PileStatusVisual {
  label: string
  icon: LucideIcon
  className: string
}

const pileStatusVisuals: Record<PileListStatus, PileStatusVisual> = {
  PENDING: {
    label: 'Pending',
    icon: ClockIcon,
    className: 'bg-muted text-muted-foreground',
  },
  NOT_STARTED: {
    label: 'Not started',
    icon: CircleDashedIcon,
    className: 'bg-slate-50 border-slate-200 text-slate-500',
  },
  IN_PROGRESS: {
    label: 'In progress',
    icon: LoaderCircleIcon,
    className: 'bg-blue-50 border-blue-200 text-blue-700',
  },
  COMPLETED: {
    label: 'Completed',
    icon: CircleCheckIcon,
    className: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  },
}

interface PileStatusBadgeProps {
  status: PileListStatus
  className?: string
}

export function PileStatusBadge({ status, className }: PileStatusBadgeProps) {
  const visual = pileStatusVisuals[status]
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
        visual.className,
        className
      )}
    >
      <visual.icon className="size-3.5" />
      {visual.label}
    </div>
  )
}
