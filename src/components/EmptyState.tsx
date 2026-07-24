import type { LucideIcon } from 'lucide-react'
import { InboxIcon, Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  className?: string
  loading?: boolean
}

export function EmptyState({
  icon: Icon = InboxIcon,
  title,
  description,
  action,
  className,
  loading = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[50vh] flex-col items-center justify-center px-6 text-center",
        className
      )}
    >
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border bg-muted/50">
        {loading ? (
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        ) : (
          <Icon className="h-8 w-8 text-muted-foreground" />
        )}
      </div>

      <h2 className="text-lg font-semibold">{title}</h2>

      {description && (
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {description}
        </p>
      )}

      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}