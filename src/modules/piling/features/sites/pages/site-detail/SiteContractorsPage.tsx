import { useState } from 'react'
import { HardHatIcon, PencilLine, PlusIcon, Trash2Icon } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { EmptyState } from '@/components/EmptyState'
import { PageLoader } from '@/components/PageLoader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DeleteContractorDialog } from '../../../contractors/components/DeleteContractorDialog'
import { ContractorFormDialog } from '../../../contractors/components/ContractorFormDialog'
import { useSiteContractors } from '../../../contractors/hooks/useContractors'
import type { Contractor } from '../../../contractors/types/contractors.types'

export default function SiteContractorsPage() {
  const { siteId } = useParams<{ siteId: string }>()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [contractorToEdit, setContractorToEdit] = useState<Contractor | null>(null)
  const [contractorToDelete, setContractorToDelete] = useState<Contractor | null>(null)

  const contractorsQuery = useSiteContractors(siteId)
  const contractors = contractorsQuery.data ?? []

  return (
    <>
      {contractorsQuery.isLoading ? (
        <PageLoader />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Contractors</CardTitle>

            <CardAction>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <PlusIcon className="mr-2 h-4 w-4" />
                Add Contractor
              </Button>
            </CardAction>
          </CardHeader>

          <CardContent>
            {contractors.length === 0 ? (
              <EmptyState
                icon={HardHatIcon}
                title="No contractors yet"
                description="Contractors added to this site will show up here."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contractors.map((contractor) => (
                    <TableRow key={contractor.id}>
                      <TableCell className="font-medium text-foreground">{contractor.name}</TableCell>
                      <TableCell>
                        <Badge variant={contractor.isActive ? 'secondary' : 'outline'}>
                          {contractor.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon-sm" onClick={() => setContractorToEdit(contractor)}>
                          <PencilLine />
                          <span className="sr-only">Edit {contractor.name}</span>
                        </Button>

                        <Button variant="ghost" size="icon-sm" onClick={() => setContractorToDelete(contractor)}>
                          <Trash2Icon className="text-destructive" />
                          <span className="sr-only">Delete {contractor.name}</span>
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
        <ContractorFormDialog
          key={String(createDialogOpen)}
          mode="create"
          siteId={siteId}
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
        />
      )}

      {siteId && (
        <ContractorFormDialog
          key={contractorToEdit?.id}
          mode="edit"
          siteId={siteId}
          contractor={contractorToEdit}
          open={contractorToEdit !== null}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setContractorToEdit(null)
          }}
        />
      )}

      {siteId && (
        <DeleteContractorDialog
          siteId={siteId}
          contractor={contractorToDelete}
          open={contractorToDelete !== null}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setContractorToDelete(null)
          }}
        />
      )}
    </>
  )
}
