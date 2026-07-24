import { CircleAlertIcon, CircleCheckIcon, CircleDashedIcon, HourglassIcon, LoaderCircleIcon, type LucideIcon } from 'lucide-react'
import type { StatusVisualBase } from '@/lib/statusVisual'
import type { StepStatus } from '../../types/dashboard.types'

export type TimelineNodeKind = StepStatus | 'buffer'

interface StatusVisual extends StatusVisualBase {
  icon: LucideIcon
  railBorderClassName: string
  dotClassName: string
  bgClassName: string
  pillClassName: string
  railClassName: string
  iconClassName: string
  cardClassName: string
}

export const stepStatusVisuals: Record<TimelineNodeKind, StatusVisual> = {
  pending: {
    label: 'Not Started',
    icon: CircleDashedIcon,
    railBorderClassName: 'border-l-transparent',
    dotClassName: 'border-muted-foreground/50 bg-background text-muted-foreground',
    bgClassName: 'bg-slate-50 border-slate-200 text-slate-500',
    pillClassName: 'bg-muted text-muted-foreground',
    railClassName: 'border-muted-foreground/40 bg-background text-muted-foreground',
    iconClassName: 'text-muted-foreground',
    cardClassName: '',
  },
  in_progress: {
    label: 'In Progress',
    icon: LoaderCircleIcon,
    railBorderClassName: 'border-l-blue-500',
    dotClassName: 'border-info bg-info text-info-foreground',
    bgClassName: 'bg-blue-50 border-blue-200 text-blue-700',
    pillClassName: 'bg-info/10 text-info',
    railClassName: 'border-info bg-background text-info',
    iconClassName: 'text-info',
    cardClassName: 'border-blue-500 shadow-sm shadow-blue-100',
  },
  completed: {
    label: 'Completed',
    icon: CircleCheckIcon,
    railBorderClassName: 'border-l-emerald-500',
    dotClassName: 'border-success bg-success text-success-foreground',
    bgClassName: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    pillClassName: 'bg-success/10 text-success',
    railClassName: 'border-success bg-background text-success',
    iconClassName: 'text-success',
    cardClassName: 'border-emerald-500 shadow-md shadow-emerald-200 ring-1 ring-emerald-200',
  },
  delayed: {
    label: 'Delayed',
    icon: CircleAlertIcon,
    railBorderClassName: 'border-l-amber-500',
    dotClassName: 'border-warning bg-warning text-warning-foreground',
    bgClassName: 'bg-amber-50 border-amber-200 text-amber-800',
    pillClassName: 'bg-warning/10 text-warning',
    railClassName: 'border-warning bg-background text-warning',
    iconClassName: 'text-warning',
    cardClassName: 'border-amber-300 shadow-md shadow-amber-100 ring-1 ring-amber-100',
  },
  buffer: {
    label: 'Waiting / Buffer',
    icon: HourglassIcon,
    railBorderClassName: 'border-l-violet-500',
    dotClassName: 'border-waiting bg-waiting text-waiting-foreground',
    bgClassName: 'bg-violet-50 border-violet-200 text-violet-700',
    pillClassName: 'bg-waiting/10 text-waiting',
    railClassName: 'border-waiting bg-background text-waiting',
    iconClassName: 'text-waiting',
    cardClassName: 'border-violet-200 shadow-sm shadow-violet-100',
  },
}