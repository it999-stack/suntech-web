import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog'
import { useDeleteContractor } from '../hooks/useContractors'
import type { Contractor } from '../types/contractors.types'

interface DeleteContractorDialogProps {
  siteId: string
  contractor: Contractor | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteContractorDialog({ siteId, contractor, open, onOpenChange }: DeleteContractorDialogProps) {
  const deleteContractor = useDeleteContractor()

  return (
    <ConfirmDeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete contractor?"
      description={
        <>
          This will delete <span className="font-medium text-foreground">{contractor?.name}</span> from this
          site's contractors list. This action cannot be undone.
        </>
      }
      onConfirm={async () => {
        if (!contractor) return
        await deleteContractor.mutateAsync({ siteId, contractorId: contractor.id })
      }}
      successMessage="Contractor deleted"
      errorMessage="Failed to delete contractor"
    />
  )
}
