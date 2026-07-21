import type { ReactNode } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export type KpiCardVariant = 'default' | 'warning' | 'success'

interface KpiCardProps {
  label: string
  value: string | number
  icon?: ReactNode
  variant?: KpiCardVariant
  trend?: string
}

const variantIconStyles: Record<KpiCardVariant, string> = {
  default: 'text-primary bg-primary/10',
  warning: 'text-warning bg-warning/10',
  success: 'text-success bg-success/10',
}

export function KpiCard({ label, value, icon, variant = 'default', trend }: KpiCardProps) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        {icon && (
          <span
            className={cn(
              'flex size-8 items-center justify-center rounded-full',
              variantIconStyles[variant]
            )}
          >
            {icon}
          </span>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold text-foreground">{value}</div>
        {trend && <p className="mt-1 text-xs text-muted-foreground">{trend}</p>}
      </CardContent>
    </Card>
  )
}
