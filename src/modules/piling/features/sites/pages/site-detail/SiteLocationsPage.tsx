import { useState } from 'react'
import { MapIcon, PencilLine, PlusIcon, Trash2Icon } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { EmptyState } from '@/components/EmptyState'
import { PageLoader } from '@/components/PageLoader'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { LocationFormDialog } from '../../../locations/components/LocationFormDialog'
import { DeleteLocationDialog } from '../../../locations/components/DeleteLocationDialog'
import { useSiteLocations } from '../../../locations/hooks/useLocations'
import type { SiteLocation } from '../../../locations/types/locations.types'

export default function SiteLocationsPage() {
  const { siteId } = useParams<{ siteId: string }>()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [locationToEdit, setLocationToEdit] = useState<SiteLocation | null>(null)
  const [locationToDelete, setLocationToDelete] = useState<SiteLocation | null>(null)

  const locationsQuery = useSiteLocations(siteId)
  const locations = locationsQuery.data ?? []

  return (
    <>
      {locationsQuery.isLoading ? (
        <PageLoader />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Locations</CardTitle>

            <CardAction>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <PlusIcon className="mr-2 h-4 w-4" />
                Create Location
              </Button>
            </CardAction>
          </CardHeader>

          <CardContent>
            {locations.length === 0 ? (
              <EmptyState
                icon={MapIcon}
                title="No locations yet"
                description="Locations added to this site will show up here."
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
                  {locations.map((location) => (
                    <TableRow key={location.id}>
                      <TableCell className="font-medium text-foreground">{location.name}</TableCell>
                      <TableCell className="text-muted-foreground">{location.code ?? '—'}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon-sm" onClick={() => setLocationToEdit(location)}>
                          <PencilLine />
                          <span className="sr-only">Edit {location.name}</span>
                        </Button>

                        <Button variant="ghost" size="icon-sm" onClick={() => setLocationToDelete(location)}>
                          <Trash2Icon className="text-destructive" />
                          <span className="sr-only">Delete {location.name}</span>
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
        <LocationFormDialog
          key={String(createDialogOpen)}
          mode="create"
          siteId={siteId}
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
        />
      )}

      {siteId && (
        <LocationFormDialog
          key={locationToEdit?.id}
          mode="edit"
          siteId={siteId}
          location={locationToEdit}
          open={locationToEdit !== null}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setLocationToEdit(null)
          }}
        />
      )}

      {siteId && (
        <DeleteLocationDialog
          siteId={siteId}
          location={locationToDelete}
          open={locationToDelete !== null}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setLocationToDelete(null)
          }}
        />
      )}
    </>
  )
}
