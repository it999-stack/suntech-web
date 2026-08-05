import { useState } from 'react'
import { PencilLine, PlusIcon, Trash2Icon, TruckIcon } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { EmptyState } from '@/components/EmptyState'
import { TableSkeleton } from '@/components/skeletons/TableSkeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DeleteMachineDialog } from '../../../machines/components/DeleteMachineDialog'
import { MachineFormDialog } from '../../../machines/components/MachineFormDialog'
import { useSiteMachines } from '../../../machines/hooks/useMachines'
import type { Machine } from '../../../machines/types/machines.types'

const typeVariant = {
  RIG: 'default',
  CRANE: 'secondary',
  COMPRESSOR: 'outline',
} as const

const statusVariant = {
  ACTIVE: 'secondary',
  INACTIVE: 'outline',
  BREAKDOWN: 'destructive',
} as const

export default function SiteMachinesPage() {
  const { siteId } = useParams<{ siteId: string }>()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [machineToEdit, setMachineToEdit] = useState<Machine | null>(null)
  const [machineToDelete, setMachineToDelete] = useState<Machine | null>(null)

  const machinesQuery = useSiteMachines(siteId)
  const machines = machinesQuery.data ?? []

  return (
    <>
      {machinesQuery.isLoading ? (
        <TableSkeleton rows={8} columns={4} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Machines</CardTitle>

            <CardAction>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <PlusIcon className="mr-2 h-4 w-4" />
                Add Machine
              </Button>
            </CardAction>
          </CardHeader>

          <CardContent>
            {machines.length === 0 ? (
              <EmptyState
                icon={TruckIcon}
                title="No machines yet"
                description="Machines added to this site will show up here."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Machine No</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {machines.map((machine) => (
                    <TableRow key={machine.id}>
                      <TableCell className="font-medium text-foreground">{machine.machineNo}</TableCell>
                      <TableCell>
                        <Badge variant={typeVariant[machine.type]}>{machine.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[machine.status]}>{machine.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon-sm" onClick={() => setMachineToEdit(machine)}>
                          <PencilLine />
                          <span className="sr-only">Edit {machine.machineNo}</span>
                        </Button>

                        <Button variant="ghost" size="icon-sm" onClick={() => setMachineToDelete(machine)}>
                          <Trash2Icon className="text-destructive" />
                          <span className="sr-only">Delete {machine.machineNo}</span>
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
        <MachineFormDialog
          key={String(createDialogOpen)}
          mode="create"
          siteId={siteId}
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
        />
      )}

      {siteId && (
        <MachineFormDialog
          key={machineToEdit?.id}
          mode="edit"
          siteId={siteId}
          machine={machineToEdit}
          open={machineToEdit !== null}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setMachineToEdit(null)
          }}
        />
      )}

      {siteId && (
        <DeleteMachineDialog
          siteId={siteId}
          machine={machineToDelete}
          open={machineToDelete !== null}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setMachineToDelete(null)
          }}
        />
      )}
    </>
  )
}
