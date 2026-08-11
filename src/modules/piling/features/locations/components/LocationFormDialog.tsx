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
import { useCreateLocation, useUpdateLocation } from '../hooks/useLocations'
import type { SiteLocation } from '../types/locations.types'

interface LocationFormDialogProps {
  mode: 'create' | 'edit'
  siteId: string
  location?: SiteLocation | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LocationFormDialog({ mode, siteId, location, open, onOpenChange }: LocationFormDialogProps) {
  const [name, setName] = useState(() => (mode === 'edit' && location ? location.name : ''))
  const [code, setCode] = useState(() => (mode === 'edit' && location ? location.code ?? '' : ''))

  const createLocation = useCreateLocation()
  const updateLocation = useUpdateLocation()

  async function handleSubmit() {
    try {
      if (mode === 'edit') {
        if (!location) return

        await updateLocation.mutateAsync({
          siteId,
          locationId: location.id,
          payload: {
            name: name.trim(),
            code: code.trim() || null,
          },
        })

        toast.success('Location updated')
      } else {
        await createLocation.mutateAsync({
          siteId,
          payload: {
            name: name.trim(),
            code: code.trim() || null,
          },
        })

        toast.success('Location created')
      }

      onOpenChange(false)
    } catch (error) {
      toast.error(
        getErrorMessage(error, mode === 'create' ? 'Failed to create location' : 'Failed to update location'),
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[420px] gap-4">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Create Location' : 'Edit Location'}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="location-name">Name</Label>
          <Input id="location-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="location-code">Code (optional)</Label>
          <Input id="location-code" value={code} onChange={(e) => setCode(e.target.value)} />
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>

          <Button
            onClick={handleSubmit}
            loading={createLocation.isPending || updateLocation.isPending}
            disabled={!name.trim()}
          >
            {mode === 'create' ? 'Create' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
