import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog'
import { useDeleteShift } from '../hooks/useShifts'
import type { ShiftType } from '../types/shifts.types'

interface DeleteShiftDialogProps {
  siteId: string
  shift: ShiftType | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteShiftDialog({ siteId, shift, open, onOpenChange }: DeleteShiftDialogProps) {
  const deleteShift = useDeleteShift()

  return (
    <ConfirmDeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete shift?"
      description={
        <>
          This will delete <span className="font-medium text-foreground">{shift?.name}</span> from this site's
          shifts. This action cannot be undone.
        </>
      }
      onConfirm={async () => {
        if (!shift) return
        await deleteShift.mutateAsync({ siteId, shiftId: shift.id })
      }}
      successMessage="Shift deleted"
      errorMessage="Failed to delete shift"
    />
  )
}
