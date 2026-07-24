import { MapPinIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EmptyState } from '@/components/EmptyState'
import { ProgressBar } from '@/modules/shared/components/ProgressBar'
import type { StatusVisualBase } from '@/lib/statusVisual'
import type { SiteProgress, SiteStatus } from '../../types/dashboard.types'

interface SiteProgressTableProps {
  sites: SiteProgress[]
}

interface SiteStatusVisual extends StatusVisualBase {
  badgeVariant: 'secondary' | 'outline' | 'destructive'
}

const siteStatusVisuals: Record<SiteStatus, SiteStatusVisual> = {
  ON_TRACK: { label: 'On track', badgeVariant: 'secondary' },
  AT_RISK: { label: 'At risk', badgeVariant: 'outline' },
  STALLED: { label: 'Stalled', badgeVariant: 'destructive' },
}

export function SiteProgressTable({ sites }: SiteProgressTableProps) {
  const navigate = useNavigate()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sites Progress</CardTitle>
      </CardHeader>
      <CardContent>
        {sites.length === 0 ? (
          <EmptyState
            icon={MapPinIcon}
            title="No sites yet"
            description="Sites you're assigned to will show up here once they're added."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Site</TableHead>
                <TableHead>Total Piles</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead>In Progress</TableHead>
                <TableHead>Not Started</TableHead>
                <TableHead>% Complete</TableHead>
                <TableHead>Last Checklist</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sites.map((site) => (
                <TableRow
                  key={site.siteId}
                  className="cursor-pointer"
                  onClick={() => navigate(`/piling/dashboard/sites/${site.siteId}`)}
                >
                  <TableCell className="font-medium text-foreground">{site.siteName}</TableCell>
                  <TableCell>{site.totalPiles}</TableCell>
                  <TableCell>{site.completedPiles}</TableCell>
                  <TableCell>{site.inProgressPiles}</TableCell>
                  <TableCell>{site.notStartedPiles}</TableCell>
                  <TableCell className="min-w-32">
                    <ProgressBar value={site.percentComplete} size="sm" />
                  </TableCell>
                  <TableCell>{site.lastChecklistLabel}</TableCell>
                  <TableCell>
                    <Badge variant={siteStatusVisuals[site.status].badgeVariant}>
                      {siteStatusVisuals[site.status].label}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
