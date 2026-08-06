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
import { useCreateClient, useUpdateClient } from '../hooks/useClients'
import type { ClientListItem } from '../types/clients.types'

interface ClientFormDialogProps {
  mode: 'create' | 'edit'
  client?: ClientListItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ClientFormDialog({ mode, client, open, onOpenChange }: ClientFormDialogProps) {
  const [name, setName] = useState(() => (mode === 'edit' && client ? client.name : ''))

  const createClient = useCreateClient()
  const updateClient = useUpdateClient()

  async function handleSubmit() {
    try {
      if (mode === 'edit') {
        if (!client) return

        await updateClient.mutateAsync({ clientId: client.id, name: name.trim() })
        toast.success('Client updated')
      } else {
        await createClient.mutateAsync({ name: name.trim() })
        toast.success('Client created')
      }

      onOpenChange(false)
    } catch (error) {
      toast.error(
        getErrorMessage(error, mode === 'create' ? 'Failed to create client' : 'Failed to update client')
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[420px] gap-4">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Create Client' : 'Edit Client'}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="client-name">Client Name</Label>
          <Input id="client-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>

          <Button
            onClick={handleSubmit}
            loading={createClient.isPending || updateClient.isPending}
            disabled={!name.trim()}
          >
            {mode === 'create' ? 'Create' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
