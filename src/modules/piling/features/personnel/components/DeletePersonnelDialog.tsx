import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog'
import { useDeletePersonnel } from '../hooks/usePersonnel'
import type { SitePersonnel } from '../types/personnel.types'

interface DeletePersonnelDialogProps {
  siteId: string
  personnel: SitePersonnel | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeletePersonnelDialog({ siteId, personnel, open, onOpenChange }: DeletePersonnelDialogProps) {
  const deletePersonnel = useDeletePersonnel()

  return (
    <ConfirmDeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete personnel?"
      description={
        <>
          This will delete <span className="font-medium text-foreground">{personnel?.name}</span> from this site's
          personnel list. This action cannot be undone.
        </>
      }
      onConfirm={async () => {
        if (!personnel) return
        await deletePersonnel.mutateAsync({ siteId, personnelId: personnel.id })
      }}
      successMessage="Personnel deleted"
      errorMessage="Failed to delete personnel"
    />
  )
}
