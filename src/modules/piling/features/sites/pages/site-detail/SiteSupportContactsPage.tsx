import { useState } from 'react'
import { PencilLine, PhoneIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { EmptyState } from '@/components/EmptyState'
import { PageLoader } from '@/components/PageLoader'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getErrorMessage } from '@/lib/errors'
import { AddSupportContactDialog } from '../../../support-contacts/components/AddSupportContactDialog'
import { DeleteSupportContactDialog } from '../../../support-contacts/components/DeleteSupportContactDialog'
import { EditSupportContactPhoneDialog } from '../../../support-contacts/components/EditSupportContactPhoneDialog'
import { useSiteSupportContacts, useUpdateSupportContact } from '../../../support-contacts/hooks/useSupportContacts'
import { SUPPORT_CONTACT_SOURCE_LABELS } from '../../../support-contacts/types/support-contacts.types'
import type { SupportContact } from '../../../support-contacts/types/support-contacts.types'

export default function SiteSupportContactsPage() {
  const { siteId } = useParams<{ siteId: string }>()
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [contactToEdit, setContactToEdit] = useState<SupportContact | null>(null)
  const [contactToDelete, setContactToDelete] = useState<SupportContact | null>(null)

  const contactsQuery = useSiteSupportContacts(siteId)
  const contacts = contactsQuery.data ?? []

  const toggleActive = useUpdateSupportContact()

  async function handleToggleActive(contact: SupportContact, isActive: boolean) {
    if (!siteId) return
    try {
      await toggleActive.mutateAsync({ siteId, contactId: contact.id, payload: { isActive } })
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to update status'))
    }
  }

  return (
    <>
      {contactsQuery.isLoading ? (
        <PageLoader />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Help & Support</CardTitle>

            <CardAction>
              <Button onClick={() => setAddDialogOpen(true)}>
                <PlusIcon className="mr-2 h-4 w-4" />
                Add Contact
              </Button>
            </CardAction>
          </CardHeader>

          <CardContent>
            {contacts.length === 0 ? (
              <EmptyState
                icon={PhoneIcon}
                title="No support contacts yet"
                description="Pick app users, site personnel, or site coordinators to show up as Help & Support contacts in the mobile app."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell className="font-medium text-foreground">{contact.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {SUPPORT_CONTACT_SOURCE_LABELS[contact.source]}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{contact.phone}</TableCell>
                      <TableCell>
                        <Switch
                          checked={contact.isActive}
                          onCheckedChange={(checked) => handleToggleActive(contact, checked)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon-sm" onClick={() => setContactToEdit(contact)}>
                          <PencilLine />
                          <span className="sr-only">Edit phone for {contact.name}</span>
                        </Button>

                        <Button variant="ghost" size="icon-sm" onClick={() => setContactToDelete(contact)}>
                          <Trash2Icon className="text-destructive" />
                          <span className="sr-only">Remove {contact.name}</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {siteId && (
        <AddSupportContactDialog
          key={String(addDialogOpen)}
          siteId={siteId}
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
        />
      )}

      {siteId && (
        <EditSupportContactPhoneDialog
          key={contactToEdit?.id}
          siteId={siteId}
          contact={contactToEdit}
          open={contactToEdit !== null}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setContactToEdit(null)
          }}
        />
      )}

      {siteId && (
        <DeleteSupportContactDialog
          siteId={siteId}
          contact={contactToDelete}
          open={contactToDelete !== null}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setContactToDelete(null)
          }}
        />
      )}
    </>
  )
}
