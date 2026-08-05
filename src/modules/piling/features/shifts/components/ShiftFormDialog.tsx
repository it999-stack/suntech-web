import { useState } from 'react'
import { toast } from 'sonner'
import { TimePicker12h } from '@/components/TimePicker12h'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getErrorMessage } from '@/lib/errors'
import { useCreateShift, useUpdateShift } from '../hooks/useShifts'
import type { ShiftType } from '../types/shifts.types'

interface ShiftFormDialogProps {
  mode: 'create' | 'edit'
  siteId: string
  shift?: ShiftType | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ShiftFormDialog({ mode, siteId, shift, open, onOpenChange }: ShiftFormDialogProps) {
  const [name, setName] = useState(() => (mode === 'edit' && shift ? shift.name : ''))
  const [startTime, setStartTime] = useState(() => (mode === 'edit' && shift ? shift.startTime : '09:00'))
  const [endTime, setEndTime] = useState(() => (mode === 'edit' && shift ? shift.endTime : '09:00'))

  const createShift = useCreateShift()
  const updateShift = useUpdateShift()

  async function handleSubmit() {
    try {
      if (mode === 'edit') {
        if (!shift) return

        await updateShift.mutateAsync({
          siteId,
          shiftId: shift.id,
          payload: { name: name.trim(), startTime, endTime },
        })

        toast.success('Shift updated')
      } else {
        await createShift.mutateAsync({
          siteId,
          payload: { name: name.trim(), startTime, endTime },
        })

        toast.success('Shift created')
      }

      onOpenChange(false)
    } catch (error) {
      toast.error(getErrorMessage(error, mode === 'create' ? 'Failed to create shift' : 'Failed to update shift'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[420px] gap-4">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Add Shift' : 'Edit Shift'}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="shift-name">Name</Label>
          <Input id="shift-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Day Shift" />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="shift-start-hour">Start Time</Label>
          <TimePicker12h value={startTime} onChange={setStartTime} idPrefix="shift-start" />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="shift-end-hour">End Time</Label>
          <TimePicker12h value={endTime} onChange={setEndTime} idPrefix="shift-end" />
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>

          <Button
            onClick={handleSubmit}
            loading={createShift.isPending || updateShift.isPending}
            disabled={!name.trim()}
          >
            {mode === 'create' ? 'Create' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
