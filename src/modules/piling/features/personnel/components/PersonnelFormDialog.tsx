import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox'
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
import { useCreatePersonnel, useUpdatePersonnel } from '../hooks/usePersonnel'
import type { SitePersonnel } from '../types/personnel.types'

const DESIGNATION_SUGGESTIONS = [
  'Project Manager',
  'Planning Engineer',
  'Shift Incharge',
  'Engineer',
  'Supervisor',
  'Rig Operator',
  'Crane Operator',
]

interface PersonnelFormDialogProps {
  mode: 'create' | 'edit'
  siteId: string
  personnel?: SitePersonnel | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PersonnelFormDialog({
  mode,
  siteId,
  personnel,
  open,
  onOpenChange,
}: PersonnelFormDialogProps) {
  const [name, setName] = useState(() => (mode === 'edit' && personnel ? personnel.name : ''))
  const [designation, setDesignation] = useState(() =>
    mode === 'edit' && personnel ? personnel.designation : ''
  )
  const [phone, setPhone] = useState(() => (mode === 'edit' && personnel ? personnel.phone ?? '' : ''))
  const [email, setEmail] = useState(() => (mode === 'edit' && personnel ? personnel.email ?? '' : ''))
  const [employeeCode, setEmployeeCode] = useState(() =>
    mode === 'edit' && personnel ? personnel.employeeCode ?? '' : ''
  )
  const [isActive, setIsActive] = useState(() => (mode === 'edit' && personnel ? personnel.isActive : true))

  const createPersonnel = useCreatePersonnel()
  const updatePersonnel = useUpdatePersonnel()

  async function handleSubmit() {
    try {
      if (mode === 'edit') {
        if (!personnel) return

        await updatePersonnel.mutateAsync({
          siteId,
          personnelId: personnel.id,
          payload: {
            name: name.trim(),
            designation: designation.trim(),
            phone: phone.trim() || null,
            email: email.trim() || null,
            employeeCode: employeeCode.trim() || null,
            isActive,
          },
        })

        toast.success('Personnel updated')
      } else {
        await createPersonnel.mutateAsync({
          siteId,
          payload: {
            name: name.trim(),
            designation: designation.trim(),
            phone: phone.trim() || null,
            email: email.trim() || null,
            employeeCode: employeeCode.trim() || null,
            isActive,
          },
        })

        toast.success('Personnel created')
      }

      onOpenChange(false)
    } catch (error) {
      toast.error(
        getErrorMessage(error, mode === 'create' ? 'Failed to create personnel' : 'Failed to update personnel')
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[420px] gap-4">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Create Personnel' : 'Edit Personnel'}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="personnel-name">Name</Label>
          <Input id="personnel-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="personnel-designation">Designation</Label>

          <Combobox
            items={DESIGNATION_SUGGESTIONS}
            inputValue={designation}
            onInputValueChange={(value) => setDesignation(value)}
          >
            <ComboboxInput id="personnel-designation" placeholder="e.g. Supervisor" showClear />

            <ComboboxContent>
              <ComboboxEmpty>No matching designation — your typed value will be used.</ComboboxEmpty>
              <ComboboxList>
                {(item: string) => (
                  <ComboboxItem key={item} value={item}>
                    {item}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="personnel-phone">Phone (optional)</Label>
            <Input id="personnel-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="personnel-email">Email (optional)</Label>
            <Input id="personnel-email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="personnel-employee-code">Employee Code (optional)</Label>
          <Input
            id="personnel-employee-code"
            value={employeeCode}
            onChange={(e) => setEmployeeCode(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="personnel-is-active">Active</Label>
          <Switch id="personnel-is-active" checked={isActive} onCheckedChange={setIsActive} />
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>

          <Button
            onClick={handleSubmit}
            loading={createPersonnel.isPending || updatePersonnel.isPending}
            disabled={!name.trim() || !designation.trim()}
          >
            {mode === 'create' ? 'Create' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
