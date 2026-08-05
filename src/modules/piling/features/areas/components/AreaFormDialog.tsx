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
import { useCreateArea, useUpdateArea } from '../hooks/useAreas'
import type { SiteArea } from '../types/areas.types'

interface AreaFormDialogProps {
  mode: 'create' | 'edit'
  siteId: string
  area?: SiteArea | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AreaFormDialog({ mode, siteId, area, open, onOpenChange }: AreaFormDialogProps) {
  const [name, setName] = useState(() => (mode === 'edit' && area ? area.name : ''))
  const [code, setCode] = useState(() => (mode === 'edit' && area ? area.code ?? '' : ''))

  const createArea = useCreateArea()
  const updateArea = useUpdateArea()

  async function handleSubmit() {
    try {
      if (mode === 'edit') {
        if (!area) return

        await updateArea.mutateAsync({
          siteId,
          areaId: area.id,
          payload: {
            name: name.trim(),
            code: code.trim() || null,
          },
        })

        toast.success('Area updated')
      } else {
        await createArea.mutateAsync({
          siteId,
          payload: {
            name: name.trim(),
            code: code.trim() || null,
          },
        })

        toast.success('Area created')
      }

      onOpenChange(false)
    } catch (error) {
      toast.error(getErrorMessage(error, mode === 'create' ? 'Failed to create area' : 'Failed to update area'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[420px] gap-4">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Create Area' : 'Edit Area'}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="area-name">Name</Label>
          <Input id="area-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="area-code">Code (optional)</Label>
          <Input id="area-code" value={code} onChange={(e) => setCode(e.target.value)} />
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>

          <Button
            onClick={handleSubmit}
            loading={createArea.isPending || updateArea.isPending}
            disabled={!name.trim()}
          >
            {mode === 'create' ? 'Create' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
