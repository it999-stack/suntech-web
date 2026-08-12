import { useState } from 'react'
import { PencilLine, PlusIcon, Trash2Icon, UploadIcon, UsersIcon } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { EmptyState } from '@/components/EmptyState'
import { TableSkeleton } from '@/components/skeletons/TableSkeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DeletePersonnelDialog } from '../../../personnel/components/DeletePersonnelDialog'
import { PersonnelFormDialog } from '../../../personnel/components/PersonnelFormDialog'
import { PersonnelImportDialog } from '../../../personnel/components/PersonnelImportDialog'
import { useSitePersonnel } from '../../../personnel/hooks/usePersonnel'
import { personnelDesignationLabel } from '../../../personnel/types/personnel.types'
import type { SitePersonnel } from '../../../personnel/types/personnel.types'

export default function SitePersonnelPage() {
  const { siteId } = useParams<{ siteId: string }>()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [personnelToEdit, setPersonnelToEdit] = useState<SitePersonnel | null>(null)
  const [personnelToDelete, setPersonnelToDelete] = useState<SitePersonnel | null>(null)

  const personnelQuery = useSitePersonnel(siteId)
  const personnel = personnelQuery.data ?? []

  return (
    <>
      {personnelQuery.isLoading ? (
        <TableSkeleton rows={8} columns={6} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Site Personnel</CardTitle>

            <CardAction>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
                  <UploadIcon className="mr-2 h-4 w-4" />
                  Import
                </Button>

                <Button onClick={() => setCreateDialogOpen(true)}>
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Create Personnel
                </Button>
              </div>
            </CardAction>
          </CardHeader>

          <CardContent>
            {personnel.length === 0 ? (
              <EmptyState
                icon={UsersIcon}
                title="No personnel yet"
                description="Personnel added to this site will show up here."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Employee Code</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {personnel.map((person) => (
                    <TableRow key={person.id}>
                      <TableCell className="font-medium text-foreground">{person.name}</TableCell>
                      <TableCell className="text-muted-foreground">{person.employeeCode ?? '—'}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {personnelDesignationLabel(person.designation)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{person.phone ?? '—'}</TableCell>
                      <TableCell>
                        <Badge variant={person.isActive ? 'secondary' : 'outline'}>
                          {person.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon-sm" onClick={() => setPersonnelToEdit(person)}>
                          <PencilLine />
                          <span className="sr-only">Edit {person.name}</span>
                        </Button>

                        <Button variant="ghost" size="icon-sm" onClick={() => setPersonnelToDelete(person)}>
                          <Trash2Icon className="text-destructive" />
                          <span className="sr-only">Delete {person.name}</span>
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
        <PersonnelFormDialog
          key={String(createDialogOpen)}
          mode="create"
          siteId={siteId}
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
        />
      )}

      {siteId && (
        <PersonnelImportDialog siteId={siteId} open={importDialogOpen} onOpenChange={setImportDialogOpen} />
      )}

      {siteId && (
        <PersonnelFormDialog
          key={personnelToEdit?.id}
          mode="edit"
          siteId={siteId}
          personnel={personnelToEdit}
          open={personnelToEdit !== null}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setPersonnelToEdit(null)
          }}
        />
      )}

      {siteId && (
        <DeletePersonnelDialog
          siteId={siteId}
          personnel={personnelToDelete}
          open={personnelToDelete !== null}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setPersonnelToDelete(null)
          }}
        />
      )}
    </>
  )
}
