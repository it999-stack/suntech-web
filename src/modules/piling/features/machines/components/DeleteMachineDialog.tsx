import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog'
import { useDeleteMachine } from '../hooks/useMachines'
import type { Machine } from '../types/machines.types'

interface DeleteMachineDialogProps {
  siteId: string
  machine: Machine | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteMachineDialog({ siteId, machine, open, onOpenChange }: DeleteMachineDialogProps) {
  const deleteMachine = useDeleteMachine()

  return (
    <ConfirmDeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete machine?"
      description={
        <>
          This will delete <span className="font-medium text-foreground">{machine?.machineNo}</span> from this
          site's machines list. This action cannot be undone.
        </>
      }
      onConfirm={async () => {
        if (!machine) return
        await deleteMachine.mutateAsync({ siteId, machineId: machine.id })
      }}
      successMessage="Machine deleted"
      errorMessage="Failed to delete machine"
    />
  )
}
