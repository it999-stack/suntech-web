import { AlertOctagonIcon, AlertTriangleIcon, InfoIcon, type LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { AlertItem, AlertSeverity } from '@/modules/shared/types/alert.types'

interface AlertsPanelProps {
  title: string
  items: AlertItem[]
  emptyMessage?: string
}

interface AlertSeverityVisual {
  icon: LucideIcon
  iconClassName: string
  badgeVariant: 'secondary' | 'outline' | 'destructive'
}

const alertSeverityVisuals: Record<AlertSeverity, AlertSeverityVisual> = {
  info: { icon: InfoIcon, iconClassName: 'text-info', badgeVariant: 'secondary' },
  warning: { icon: AlertTriangleIcon, iconClassName: 'text-warning', badgeVariant: 'outline' },
  critical: { icon: AlertOctagonIcon, iconClassName: 'text-destructive', badgeVariant: 'destructive' },
}

export function AlertsPanel({ title, items, emptyMessage = 'No alerts' }: AlertsPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {items.length === 0 && <p className="text-sm text-muted-foreground">{emptyMessage}</p>}
        {items.map((item) => {
          const visual = alertSeverityVisuals[item.severity]
          const Icon = visual.icon
          return (
            <div
              key={item.id}
              className="flex items-start gap-3 rounded-lg border border-border/60 bg-background/40 p-3"
            >
              <Icon className={cn('mt-0.5 size-4 shrink-0', visual.iconClassName)} />
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-foreground">{item.title}</span>
                  <Badge variant={visual.badgeVariant}>{item.severity}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
