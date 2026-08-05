import { useState } from 'react'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getErrorMessage } from '@/lib/errors'
import { useCreateMachine, useUpdateMachine } from '../hooks/useMachines'
import type { Machine, MachineStatus, MachineType } from '../types/machines.types'

const typeItems: { value: MachineType; label: string }[] = [
  { value: 'RIG', label: 'Rig' },
  { value: 'CRANE', label: 'Crane' },
  { value: 'COMPRESSOR', label: 'Compressor' },
]

const statusItems: { value: MachineStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'BREAKDOWN', label: 'Breakdown' },
]

interface MachineFormDialogProps {
  mode: 'create' | 'edit'
  siteId: string
  machine?: Machine | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MachineFormDialog({ mode, siteId, machine, open, onOpenChange }: MachineFormDialogProps) {
  const [machineNo, setMachineNo] = useState(() => (mode === 'edit' && machine ? machine.machineNo : ''))
  const [type, setType] = useState<MachineType>(() => (mode === 'edit' && machine ? machine.type : 'RIG'))
  const [status, setStatus] = useState<MachineStatus>(() =>
    mode === 'edit' && machine ? machine.status : 'ACTIVE'
  )

  const createMachine = useCreateMachine()
  const updateMachine = useUpdateMachine()

  async function handleSubmit() {
    try {
      if (mode === 'edit') {
        if (!machine) return

        await updateMachine.mutateAsync({
          siteId,
          machineId: machine.id,
          payload: { machineNo: machineNo.trim(), type, status },
        })

        toast.success('Machine updated')
      } else {
        await createMachine.mutateAsync({
          siteId,
          payload: { machineNo: machineNo.trim(), type, status },
        })

        toast.success('Machine created')
      }

      onOpenChange(false)
    } catch (error) {
      toast.error(
        getErrorMessage(error, mode === 'create' ? 'Failed to create machine' : 'Failed to update machine')
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[420px] gap-4">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Add Machine' : 'Edit Machine'}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="machine-no">Machine No</Label>
          <Input id="machine-no" value={machineNo} onChange={(e) => setMachineNo(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="machine-type">Type</Label>
            <Select value={type} onValueChange={(value) => setType(value as MachineType)} items={typeItems}>
              <SelectTrigger id="machine-type" className="w-full">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>

              <SelectContent>
                <SelectGroup>
                  {typeItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="machine-status">Status</Label>
            <Select
              value={status}
              onValueChange={(value) => setStatus(value as MachineStatus)}
              items={statusItems}
            >
              <SelectTrigger id="machine-status" className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>

              <SelectContent>
                <SelectGroup>
                  {statusItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>

          <Button
            onClick={handleSubmit}
            loading={createMachine.isPending || updateMachine.isPending}
            disabled={!machineNo.trim()}
          >
            {mode === 'create' ? 'Create' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
