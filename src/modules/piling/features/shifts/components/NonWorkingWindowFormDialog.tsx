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
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getErrorMessage } from '@/lib/errors'
import { useCreateNonWorkingWindow, useUpdateNonWorkingWindow } from '../hooks/useShifts'
import type { NonWorkingWindow, ShiftType, WindowBehavior } from '../types/shifts.types'

const behaviorItems: { value: WindowBehavior; label: string }[] = [
  { value: 'FIXED', label: 'Fixed' },
  { value: 'AFTER_CURRENT_STEP', label: 'After Current Step' },
]

interface NonWorkingWindowFormDialogProps {
  mode: 'create' | 'edit'
  siteId: string
  shifts: ShiftType[]
  window?: NonWorkingWindow | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NonWorkingWindowFormDialog({
  mode,
  siteId,
  shifts,
  window: editingWindow,
  open,
  onOpenChange,
}: NonWorkingWindowFormDialogProps) {
  const [shiftTypeId, setShiftTypeId] = useState(() =>
    mode === 'edit' && editingWindow ? editingWindow.shiftTypeId : (shifts[0]?.id ?? '')
  )
  const [label, setLabel] = useState(() => (mode === 'edit' && editingWindow ? editingWindow.label : ''))
  const [startTime, setStartTime] = useState(() =>
    mode === 'edit' && editingWindow ? editingWindow.startTime : '09:00'
  )
  const [endTime, setEndTime] = useState(() =>
    mode === 'edit' && editingWindow ? editingWindow.endTime : '09:00'
  )
  const [behavior, setBehavior] = useState<WindowBehavior>(() =>
    mode === 'edit' && editingWindow ? editingWindow.behavior : 'FIXED'
  )

  const createWindow = useCreateNonWorkingWindow()
  const updateWindow = useUpdateNonWorkingWindow()

  async function handleSubmit() {
    try {
      if (mode === 'edit') {
        if (!editingWindow) return

        await updateWindow.mutateAsync({
          siteId,
          windowId: editingWindow.id,
          payload: { label: label.trim(), startTime, endTime, behavior },
        })

        toast.success('Non-working window updated')
      } else {
        if (!shiftTypeId) return

        await createWindow.mutateAsync({
          siteId,
          payload: { shiftTypeId, label: label.trim(), startTime, endTime, behavior },
        })

        toast.success('Non-working window created')
      }

      onOpenChange(false)
    } catch (error) {
      toast.error(
        getErrorMessage(error, mode === 'create' ? 'Failed to create window' : 'Failed to update window')
      )
    }
  }

  const isValid = label.trim() && (mode === 'edit' || shiftTypeId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[420px] gap-4">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Add Non-Working Window' : 'Edit Non-Working Window'}</DialogTitle>
        </DialogHeader>

        {mode === 'create' && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="window-shift">Shift</Label>
            <Select
              value={shiftTypeId}
              onValueChange={(value) => setShiftTypeId(value ?? '')}
              items={shifts.map((shift) => ({ value: shift.id, label: shift.name }))}
            >
              <SelectTrigger id="window-shift" className="w-full">
                <SelectValue placeholder="Select shift" />
              </SelectTrigger>

              <SelectContent>
                <SelectGroup>
                  {shifts.map((shift) => (
                    <SelectItem key={shift.id} value={shift.id}>
                      {shift.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="window-label">Label</Label>
          <Input id="window-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Lunch Break" />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="window-start-hour">Start Time</Label>
          <TimePicker12h value={startTime} onChange={setStartTime} idPrefix="window-start" />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="window-end-hour">End Time</Label>
          <TimePicker12h value={endTime} onChange={setEndTime} idPrefix="window-end" />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="window-behavior">Behavior</Label>
          <Select
            value={behavior}
            onValueChange={(value) => setBehavior(value as WindowBehavior)}
            items={behaviorItems}
          >
            <SelectTrigger id="window-behavior" className="w-full">
              <SelectValue placeholder="Select behavior" />
            </SelectTrigger>

            <SelectContent>
              <SelectGroup>
                {behaviorItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>

          <Button
            onClick={handleSubmit}
            loading={createWindow.isPending || updateWindow.isPending}
            disabled={!isValid}
          >
            {mode === 'create' ? 'Create' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
