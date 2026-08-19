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
import { getErrorMessage } from '@/lib/errors'
import { useCreateSupportContact, useSupportContactCandidates } from '../hooks/useSupportContacts'
import { SUPPORT_CONTACT_SOURCE_LABELS } from '../types/support-contacts.types'

interface AddSupportContactDialogProps {
  siteId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddSupportContactDialog({ siteId, open, onOpenChange }: AddSupportContactDialogProps) {
  const [personId, setPersonId] = useState('')
  const [phone, setPhone] = useState('')

  const candidatesQuery = useSupportContactCandidates(siteId, open)
  const candidates = candidatesQuery.data ?? []
  const candidateItems = candidates.map((c) => ({
    value: c.personId,
    label: `${c.name} • ${SUPPORT_CONTACT_SOURCE_LABELS[c.source]}`,
  }))

  const createSupportContact = useCreateSupportContact()

  async function handleSubmit() {
    try {
      await createSupportContact.mutateAsync({ siteId, payload: { personId, phone: phone.trim() } })
      toast.success('Support contact added')
      onOpenChange(false)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to add support contact'))
    }
  }

  const isValid = personId && phone.trim()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[420px] gap-4">
        <DialogHeader>
          <DialogTitle>Add Support Contact</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="support-contact-person">Person</Label>

          <Select items={candidateItems} value={personId} onValueChange={(value) => setPersonId(value ?? '')}>
            <SelectTrigger id="support-contact-person" className="w-full">
              <SelectValue
                placeholder={candidatesQuery.isLoading ? 'Loading...' : 'Select an app user, personnel, or coordinator'}
              />
            </SelectTrigger>

            <SelectContent>
              <SelectGroup>
                {candidateItems.length === 0 && !candidatesQuery.isLoading ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    Everyone eligible is already a support contact.
                  </div>
                ) : (
                  candidateItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))
                )}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="support-contact-phone">Phone number</Label>
          <Input id="support-contact-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>

          <Button onClick={handleSubmit} loading={createSupportContact.isPending} disabled={!isValid}>
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
