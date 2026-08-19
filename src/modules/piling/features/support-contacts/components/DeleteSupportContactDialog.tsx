import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog'
import { useDeleteSupportContact } from '../hooks/useSupportContacts'
import type { SupportContact } from '../types/support-contacts.types'

interface DeleteSupportContactDialogProps {
  siteId: string
  contact: SupportContact | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteSupportContactDialog({ siteId, contact, open, onOpenChange }: DeleteSupportContactDialogProps) {
  const deleteSupportContact = useDeleteSupportContact()

  return (
    <ConfirmDeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Remove support contact?"
      description={
        <>
          <span className="font-medium text-foreground">{contact?.name}</span> will no longer show up as a Help
          & Support contact on this site. This does not remove them as an app user, personnel, or coordinator.
        </>
      }
      onConfirm={async () => {
        if (!contact) return
        await deleteSupportContact.mutateAsync({ siteId, contactId: contact.id })
      }}
      successMessage="Support contact removed"
      errorMessage="Failed to remove support contact"
      confirmLabel="Remove"
    />
  )
}
