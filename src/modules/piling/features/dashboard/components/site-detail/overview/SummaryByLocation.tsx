import { PlusIcon } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ProgressBar } from '@/modules/shared/components/ProgressBar'
import type { AreaSummary } from '../../../types/dashboard.types'

interface SummaryByLocationProps {
  locations: AreaSummary[]
}

export function SummaryByLocation({ locations }: SummaryByLocationProps) {
  if (locations.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-base font-semibold text-foreground">Summary by Location</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {locations.map((location) => (
          <Card key={location.area}>
            <CardHeader>
              <span className="text-sm font-medium text-foreground">{location.area}</span>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <div className="text-lg font-semibold tabular-nums text-foreground">
                {location.pilesCompleted} / {location.pilesTotal}{' '}
                <span className="text-sm font-normal text-muted-foreground">piles</span>
              </div>
              <ProgressBar value={location.percentComplete} size="sm" />
              <div className="text-xs text-muted-foreground">
                {location.pilesTotal - location.pilesCompleted > 0
                  ? `${location.pilesTotal - location.pilesCompleted} remaining`
                  : 'Completed'}
              </div>
            </CardContent>
          </Card>
        ))}
        <Card className="flex items-center justify-center border-dashed">
          <CardContent className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
            <PlusIcon className="size-5" />
            <span className="text-xs">Add Location</span>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
