import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog'
import { useDeletePile } from '../hooks/usePiles'
import type { SitePileListItem } from '../../sites/types/sites.types'

interface DeletePileDialogProps {
  siteId: string
  pile: SitePileListItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeletePileDialog({ siteId, pile, open, onOpenChange }: DeletePileDialogProps) {
  const deletePile = useDeletePile()

  return (
    <ConfirmDeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete pile?"
      description={
        <>
          This will permanently delete pile <span className="font-medium text-foreground">{pile?.pileIdCode}</span>.
          This action cannot be undone.
        </>
      }
      onConfirm={async () => {
        if (!pile) return
        await deletePile.mutateAsync({ siteId, pileId: pile.id })
      }}
      successMessage="Pile deleted"
      errorMessage="Failed to delete pile"
    />
  )
}
