import { MapPinIcon, PencilLine, PlusIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import type { SiteListItem } from '../types/sites.types'

interface SitesTableProps {
  sites: SiteListItem[]
  onEdit: (site: SiteListItem) => void
  onCreate: () => void
}

export function SitesTable({ sites, onEdit, onCreate }: SitesTableProps) {
  const navigate = useNavigate()
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sites</CardTitle>

        <CardAction>
          <Button onClick={onCreate}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Create Site
          </Button>
        </CardAction>
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
                <TableHead>Client</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Piles</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sites.map((site) => (
                <TableRow
                  key={site.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/piling/sites/${site.id}`)}
                >
                  <TableCell className="text-foreground">{site.clientName}</TableCell>
                  <TableCell className="font-medium text-foreground">{site.name}</TableCell>
                  <TableCell className="text-muted-foreground">{site.location ?? '—'}</TableCell>
                  <TableCell className="tabular-nums">
                    {site.completedPiles} / {site.totalPiles}
                  </TableCell>
                  <TableCell className="min-w-32">
                    <ProgressBar value={site.percentComplete} size="sm" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation()
                        onEdit(site)
                      }}
                    >
                      <PencilLine />
                      <span className="sr-only">Edit {site.name}</span>
                    </Button>
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
