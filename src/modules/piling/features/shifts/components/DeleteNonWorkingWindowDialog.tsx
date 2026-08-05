import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog'
import { useDeleteNonWorkingWindow } from '../hooks/useShifts'
import type { NonWorkingWindow } from '../types/shifts.types'

interface DeleteNonWorkingWindowDialogProps {
  siteId: string
  window: NonWorkingWindow | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteNonWorkingWindowDialog({
  siteId,
  window: targetWindow,
  open,
  onOpenChange,
}: DeleteNonWorkingWindowDialogProps) {
  const deleteWindow = useDeleteNonWorkingWindow()

  return (
    <ConfirmDeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete non-working window?"
      description={
        <>
          This will delete <span className="font-medium text-foreground">{targetWindow?.label}</span>. This
          action cannot be undone.
        </>
      }
      onConfirm={async () => {
        if (!targetWindow) return
        await deleteWindow.mutateAsync({ siteId, windowId: targetWindow.id })
      }}
      successMessage="Non-working window deleted"
      errorMessage="Failed to delete window"
    />
  )
}
