import { AlertOctagonIcon, AlertTriangleIcon, InfoIcon, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { EmptyState } from '@/components/EmptyState'
import { cn } from '@/lib/utils'
import type { AttentionAlert, AttentionAlertSeverity } from '../../../types/dashboard.types'

interface AttentionRequiredPanelProps {
  alerts: AttentionAlert[]
  onView: (alert: AttentionAlert) => void
}

const severityVisuals: Record<AttentionAlertSeverity, { icon: LucideIcon; className: string; barClassName: string }> = {
  critical: { icon: AlertOctagonIcon, className: 'text-destructive', barClassName: 'bg-destructive' },
  warning: { icon: AlertTriangleIcon, className: 'text-warning', barClassName: 'bg-warning' },
  info: { icon: InfoIcon, className: 'text-info', barClassName: 'bg-info' },
}

export function AttentionRequiredPanel({ alerts, onView }: AttentionRequiredPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Attention Required</CardTitle>
        <CardDescription>Piles or rigs that need immediate attention</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {alerts.length === 0 ? (
          <EmptyState icon={InfoIcon} title="All clear" description="Nothing needs attention right now." />
        ) : (
          alerts.map((alert) => {
            const visual = severityVisuals[alert.severity]
            const Icon = visual.icon
            return (
              <div key={alert.id} className="flex items-center gap-3 overflow-hidden rounded-lg border border-border/60">
                <div className={cn('h-full w-1 self-stretch', visual.barClassName)} />
                <Icon className={cn('size-4 shrink-0', visual.className)} />
                <div className="flex-1 py-2">
                  <div className="text-sm font-medium text-foreground">{alert.title}</div>
                  <div className="text-xs text-muted-foreground">{alert.description}</div>
                </div>
                {alert.targetId && (
                  <Button variant="outline" size="sm" className="mr-2 shrink-0" onClick={() => onView(alert)}>
                    View
                  </Button>
                )}
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
