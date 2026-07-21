import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ActivityItem } from '@/modules/shared/types/activity.types'

interface ActivityFeedProps {
  title?: string
  items: ActivityItem[]
  emptyMessage?: string
}

export function ActivityFeed({
  title = 'Recent Activity',
  items,
  emptyMessage = 'No recent activity',
}: ActivityFeedProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          <ol className="relative flex flex-col gap-4 border-l border-border/60 pl-4">
            {items.map((item) => (
              <li key={item.id} className="relative">
                <span className="absolute -left-[1.35rem] top-1 size-2 rounded-full bg-primary" />
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-foreground">{item.title}</span>
                  <span className="text-xs text-muted-foreground">{item.timestamp}</span>
                </div>
                {item.description && (
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                )}
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}
