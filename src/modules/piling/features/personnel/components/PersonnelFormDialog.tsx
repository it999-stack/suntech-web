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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { getErrorMessage } from '@/lib/errors'
import { useCreatePersonnel, useUpdatePersonnel } from '../hooks/usePersonnel'
import { PERSONNEL_DESIGNATIONS } from '../types/personnel.types'
import type { PersonnelDesignation, SitePersonnel } from '../types/personnel.types'

const designationSelectItems = PERSONNEL_DESIGNATIONS.map((d) => ({ value: d.value, label: d.label }))

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
  const [designation, setDesignation] = useState<PersonnelDesignation | ''>(() =>
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
            designation: designation as PersonnelDesignation,
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
            designation: designation as PersonnelDesignation,
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

          <Select
            items={designationSelectItems}
            value={designation}
            onValueChange={(value) => setDesignation((value as PersonnelDesignation) ?? '')}
          >
            <SelectTrigger id="personnel-designation" className="w-full">
              <SelectValue placeholder="Select a designation" />
            </SelectTrigger>

            <SelectContent>
              <SelectGroup>
                {designationSelectItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
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
            disabled={!name.trim() || !designation}
          >
            {mode === 'create' ? 'Create' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
