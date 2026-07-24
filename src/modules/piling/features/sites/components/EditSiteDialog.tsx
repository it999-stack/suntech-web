import { useEffect, useState } from 'react'
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
import { useUpdateClient } from '@/modules/piling/features/clients/hooks/useClients'
import { useUpdateSite } from '../hooks/useSites'
import type { SiteListItem } from '../types/sites.types'

interface EditSiteDialogProps {
  site: SiteListItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditSiteDialog({ site, open, onOpenChange }: EditSiteDialogProps) {
  const [clientName, setClientName] = useState('')
  const [siteName, setSiteName] = useState('')

  const updateSite = useUpdateSite()
  const updateClient = useUpdateClient()
  const saving = updateSite.isPending || updateClient.isPending

  useEffect(() => {
    if (open && site) {
      setClientName(site.clientName)
      setSiteName(site.name)
    }
  }, [open, site])

  async function handleSave() {
    if (!site) return

    try {
      if (clientName.trim() && clientName !== site.clientName) {
        await updateClient.mutateAsync({ clientId: site.clientId, name: clientName.trim() })
      }
      if (siteName.trim() && siteName !== site.name) {
        await updateSite.mutateAsync({ siteId: site.id, payload: { name: siteName.trim() } })
      }
      toast.success('Site updated')
      onOpenChange(false)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to update site'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[360px] gap-4">
        <DialogHeader>
          <DialogTitle>Edit site</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-site-client-name">Client name</Label>
            <Input
              id="edit-site-client-name"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-site-name">Site name</Label>
            <Input id="edit-site-name" value={siteName} onChange={(e) => setSiteName(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button onClick={handleSave} loading={saving} disabled={!clientName.trim() || !siteName.trim()}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
