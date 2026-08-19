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
import { Switch } from '@/components/ui/switch'
import { getErrorMessage } from '@/lib/errors'
import { useCreateContractor, useUpdateContractor } from '../hooks/useContractors'
import type { Contractor } from '../types/contractors.types'

interface ContractorFormDialogProps {
  mode: 'create' | 'edit'
  siteId: string
  contractor?: Contractor | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ContractorFormDialog({
  mode,
  siteId,
  contractor,
  open,
  onOpenChange,
}: ContractorFormDialogProps) {
  const [name, setName] = useState(() => (mode === 'edit' && contractor ? contractor.name : ''))
  const [isActive, setIsActive] = useState(() => (mode === 'edit' && contractor ? contractor.isActive : true))

  const createContractor = useCreateContractor()
  const updateContractor = useUpdateContractor()

  async function handleSubmit() {
    try {
      if (mode === 'edit') {
        if (!contractor) return

        await updateContractor.mutateAsync({
          siteId,
          contractorId: contractor.id,
          payload: { name: name.trim(), isActive },
        })

        toast.success('Contractor updated')
      } else {
        await createContractor.mutateAsync({
          siteId,
          payload: { name: name.trim(), isActive },
        })

        toast.success('Contractor created')
      }

      onOpenChange(false)
    } catch (error) {
      toast.error(
        getErrorMessage(error, mode === 'create' ? 'Failed to create contractor' : 'Failed to update contractor')
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[420px] gap-4">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Add Contractor' : 'Edit Contractor'}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contractor-name">Name</Label>
          <Input id="contractor-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="contractor-is-active">Active</Label>
          <Switch id="contractor-is-active" checked={isActive} onCheckedChange={setIsActive} />
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>

          <Button
            onClick={handleSubmit}
            loading={createContractor.isPending || updateContractor.isPending}
            disabled={!name.trim()}
          >
            {mode === 'create' ? 'Create' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
