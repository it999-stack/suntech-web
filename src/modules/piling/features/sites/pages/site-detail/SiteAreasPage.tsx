import { useState } from 'react'
import { MapIcon, PencilLine, PlusIcon, Trash2Icon } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { EmptyState } from '@/components/EmptyState'
import { TableSkeleton } from '@/components/skeletons/TableSkeleton'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AreaFormDialog } from '../../../areas/components/AreaFormDialog'
import { DeleteAreaDialog } from '../../../areas/components/DeleteAreaDialog'
import { useSiteAreas } from '../../../areas/hooks/useAreas'
import type { SiteArea } from '../../../areas/types/areas.types'

export default function SiteAreasPage() {
  const { siteId } = useParams<{ siteId: string }>()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [areaToEdit, setAreaToEdit] = useState<SiteArea | null>(null)
  const [areaToDelete, setAreaToDelete] = useState<SiteArea | null>(null)

  const areasQuery = useSiteAreas(siteId)
  const areas = areasQuery.data ?? []

  return (
    <>
      {areasQuery.isLoading ? (
        <TableSkeleton rows={8} columns={3} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Areas</CardTitle>

            <CardAction>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <PlusIcon className="mr-2 h-4 w-4" />
                Create Area
              </Button>
            </CardAction>
          </CardHeader>

          <CardContent>
            {areas.length === 0 ? (
              <EmptyState
                icon={MapIcon}
                title="No areas yet"
                description="Areas added to this site will show up here."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {areas.map((area) => (
                    <TableRow key={area.id}>
                      <TableCell className="font-medium text-foreground">{area.name}</TableCell>
                      <TableCell className="text-muted-foreground">{area.code ?? '—'}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon-sm" onClick={() => setAreaToEdit(area)}>
                          <PencilLine />
                          <span className="sr-only">Edit {area.name}</span>
                        </Button>

                        <Button variant="ghost" size="icon-sm" onClick={() => setAreaToDelete(area)}>
                          <Trash2Icon className="text-destructive" />
                          <span className="sr-only">Delete {area.name}</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {siteId && (
        <AreaFormDialog
          key={String(createDialogOpen)}
          mode="create"
          siteId={siteId}
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
        />
      )}

      {siteId && (
        <AreaFormDialog
          key={areaToEdit?.id}
          mode="edit"
          siteId={siteId}
          area={areaToEdit}
          open={areaToEdit !== null}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setAreaToEdit(null)
          }}
        />
      )}

      {siteId && (
        <DeleteAreaDialog
          siteId={siteId}
          area={areaToDelete}
          open={areaToDelete !== null}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setAreaToDelete(null)
          }}
        />
      )}
    </>
  )
}
