import { useState } from 'react'
import type { ReactNode } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getErrorMessage } from '@/lib/errors'

interface ConfirmDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: ReactNode
  onConfirm: () => Promise<void>
  successMessage: string
  errorMessage: string
  confirmLabel?: string
}

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  successMessage,
  errorMessage,
  confirmLabel = 'Delete',
}: ConfirmDeleteDialogProps) {
  const [isPending, setIsPending] = useState(false)

  async function handleConfirm() {
    setIsPending(true)

    try {
      await onConfirm()
      toast.success(successMessage)
      onOpenChange(false)
    } catch (error) {
      toast.error(getErrorMessage(error, errorMessage))
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[420px] gap-4">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="text-sm text-muted-foreground">{description}</div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>

          <Button variant="destructive" onClick={handleConfirm} loading={isPending}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
