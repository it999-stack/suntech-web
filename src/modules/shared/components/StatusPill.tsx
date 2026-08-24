import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

// Generic status-pill shell — icon + label in a rounded, colored badge.
// Deliberately carries no domain knowledge of what "status" means; each
// feature keeps its own status→visual map (icon/label/colors) co-located
// with its own enum (see @/lib/statusVisual's StatusVisualBase) and passes
// the resolved visual in here. That keeps this component reusable across
// modules without forcing every domain's statuses into one shared enum.
interface StatusPillProps {
  icon: LucideIcon
  label: string
  className?: string
  iconClassName?: string
}

export function StatusPill({ icon: Icon, label, className, iconClassName }: StatusPillProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
        className
      )}
    >
      <Icon className={cn('size-3.5', iconClassName)} />
      {label}
    </div>
  )
}
