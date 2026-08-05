import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog'
import { useDeleteDimension } from '../hooks/useDimensions'
import type { SiteDimension } from '../types/dimensions.types'

interface DeleteDimensionDialogProps {
  siteId: string
  dimension: SiteDimension | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteDimensionDialog({ siteId, dimension, open, onOpenChange }: DeleteDimensionDialogProps) {
  const deleteDimension = useDeleteDimension()

  const label = dimension?.label?.trim() ? dimension.label : `${dimension?.dia}mm × ${dimension?.depth}m`

  return (
    <ConfirmDeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete dimension?"
      description={
        <>
          This will delete dimension <span className="font-medium text-foreground">{label}</span>. Piles already
          using it keep their current dimension unchanged — it will just no longer be offered when creating or
          editing piles.
        </>
      }
      onConfirm={async () => {
        if (!dimension) return
        await deleteDimension.mutateAsync({ siteId, dimensionId: dimension.id })
      }}
      successMessage="Dimension deleted"
      errorMessage="Failed to delete dimension"
    />
  )
}
