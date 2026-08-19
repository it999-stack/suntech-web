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
import { getErrorMessage } from '@/lib/errors'
import { useUpdateSupportContact } from '../hooks/useSupportContacts'
import type { SupportContact } from '../types/support-contacts.types'

interface EditSupportContactPhoneDialogProps {
  siteId: string
  contact: SupportContact | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditSupportContactPhoneDialog({
  siteId,
  contact,
  open,
  onOpenChange,
}: EditSupportContactPhoneDialogProps) {
  const [phone, setPhone] = useState(() => contact?.phone ?? '')

  const updateSupportContact = useUpdateSupportContact()

  async function handleSubmit() {
    if (!contact) return
    try {
      await updateSupportContact.mutateAsync({
        siteId,
        contactId: contact.id,
        payload: { phone: phone.trim() },
      })
      toast.success('Phone number updated')
      onOpenChange(false)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to update phone number'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[420px] gap-4">
        <DialogHeader>
          <DialogTitle>Edit phone number</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="support-contact-edit-phone">{contact?.name}</Label>
          <Input id="support-contact-edit-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>

          <Button onClick={handleSubmit} loading={updateSupportContact.isPending} disabled={!phone.trim()}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
