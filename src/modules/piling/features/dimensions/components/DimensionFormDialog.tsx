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
import { useCreateDimension, useUpdateDimension } from '../hooks/useDimensions'
import type { SiteDimension } from '../types/dimensions.types'

interface DimensionFormDialogProps {
  mode: 'create' | 'edit'
  siteId: string
  dimension?: SiteDimension | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DimensionFormDialog({
  mode,
  siteId,
  dimension,
  open,
  onOpenChange,
}: DimensionFormDialogProps) {
  const [label, setLabel] = useState(() => (mode === 'edit' && dimension ? dimension.label ?? '' : ''))
  const [dia, setDia] = useState(() => (mode === 'edit' && dimension ? String(dimension.dia) : ''))
  const [depth, setDepth] = useState(() => (mode === 'edit' && dimension ? String(dimension.depth) : ''))

  const createDimension = useCreateDimension()
  const updateDimension = useUpdateDimension()

  async function handleSubmit() {
    const diaValue = Number(dia)
    const depthValue = Number(depth)

    try {
      if (mode === 'edit') {
        if (!dimension) return

        await updateDimension.mutateAsync({
          siteId,
          dimensionId: dimension.id,
          payload: {
            dia: diaValue,
            depth: depthValue,
            label: label.trim() || null,
          },
        })

        toast.success('Dimension updated')
      } else {
        await createDimension.mutateAsync({
          siteId,
          payload: {
            dia: diaValue,
            depth: depthValue,
            label: label.trim() || null,
          },
        })

        toast.success('Dimension created')
      }

      onOpenChange(false)
    } catch (error) {
      toast.error(getErrorMessage(error, mode === 'create' ? 'Failed to create dimension' : 'Failed to update dimension'))
    }
  }

  const diaValue = Number(dia)
  const depthValue = Number(depth)
  const isValid = dia.trim() !== '' && depth.trim() !== '' && diaValue > 0 && depthValue > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[420px] gap-4">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Create Dimension' : 'Edit Dimension'}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dimension-dia">Dia (mm)</Label>
            <Input
              id="dimension-dia"
              type="number"
              min={1}
              value={dia}
              onChange={(e) => setDia(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dimension-depth">Depth (m)</Label>
            <Input
              id="dimension-depth"
              type="number"
              min={1}
              value={depth}
              onChange={(e) => setDepth(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="dimension-label">Label (optional)</Label>
          <Input id="dimension-label" value={label} onChange={(e) => setLabel(e.target.value)} />
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>

          <Button
            onClick={handleSubmit}
            loading={createDimension.isPending || updateDimension.isPending}
            disabled={!isValid}
          >
            {mode === 'create' ? 'Create' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
