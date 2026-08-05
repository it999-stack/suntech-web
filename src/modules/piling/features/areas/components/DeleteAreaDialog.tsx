import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog'
import { useDeleteArea } from '../hooks/useAreas'
import type { SiteArea } from '../types/areas.types'

interface DeleteAreaDialogProps {
  siteId: string
  area: SiteArea | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteAreaDialog({ siteId, area, open, onOpenChange }: DeleteAreaDialogProps) {
  const deleteArea = useDeleteArea()

  return (
    <ConfirmDeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete area?"
      description={
        <>
          This will delete area <span className="font-medium text-foreground">{area?.name}</span>. Piles currently
          assigned to it will become unassigned. This action cannot be undone.
        </>
      }
      onConfirm={async () => {
        if (!area) return
        await deleteArea.mutateAsync({ siteId, areaId: area.id })
      }}
      successMessage="Area deleted"
      errorMessage="Failed to delete area"
    />
  )
}
