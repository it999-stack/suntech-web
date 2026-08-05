import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox'
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
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getErrorMessage } from '@/lib/errors'
import { useSiteAreas } from '@/modules/piling/features/areas/hooks/useAreas'
import { useSiteDimensions } from '@/modules/piling/features/dimensions/hooks/useDimensions'
import { useAreaLocationSuggestions, useCreatePile, usePile, useUpdatePile } from '../hooks/usePiles'

interface PileFormDialogProps {
  mode: 'create' | 'edit'
  siteId: string
  pileId?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PileFormDialog({ mode, siteId, pileId, open, onOpenChange }: PileFormDialogProps) {
  const [pileIdCode, setPileIdCode] = useState('')
  const [dimensionId, setDimensionId] = useState('')
  const [areaId, setAreaId] = useState('')
  const [areaLocation, setAreaLocation] = useState('')
  const [notes, setNotes] = useState('')

  const dimensionsQuery = useSiteDimensions(siteId)
  const areasQuery = useSiteAreas(siteId)
  const locationSuggestionsQuery = useAreaLocationSuggestions(siteId)
  const pileQuery = usePile(mode === 'edit' ? pileId : undefined)
  const createPile = useCreatePile()
  const updatePile = useUpdatePile()

  const hasPrefilledRef = useRef(false)

  useEffect(() => {
    if (mode === 'edit' && pileQuery.data && !hasPrefilledRef.current) {
      hasPrefilledRef.current = true
      setPileIdCode(pileQuery.data.pileIdCode)
      setDimensionId(pileQuery.data.dimensionId)
      setAreaId(pileQuery.data.areaId ?? '')
      setAreaLocation(pileQuery.data.areaLocation ?? '')
      setNotes(pileQuery.data.notes ?? '')
    }
  }, [mode, pileQuery.data])

  const dimensionSelectItems = useMemo(
    () =>
      (dimensionsQuery.data ?? []).map((dimension) => ({
        value: dimension.id,
        label: dimension.label?.trim() ? dimension.label : `${dimension.dia}mm × ${dimension.depth}m`,
      })),
    [dimensionsQuery.data]
  )
  const areaSelectItems = useMemo(
    () =>
      (areasQuery.data ?? []).map((area) => ({
        value: area.id,
        label: area.code ? `${area.name} (${area.code})` : area.name,
      })),
    [areasQuery.data]
  )
  const locationSuggestions = locationSuggestionsQuery.data ?? []

  const isLoadingForEdit = mode === 'edit' && pileQuery.isLoading

  async function handleSubmit() {
    try {
      if (mode === 'edit') {
        if (!pileId) return

        await updatePile.mutateAsync({
          siteId,
          pileId,
          payload: {
            pileIdCode: pileIdCode.trim(),
            dimensionId,
            areaId: areaId || null,
            areaLocation: areaLocation.trim() || null,
            notes: notes.trim() || null,
          },
        })

        toast.success('Pile updated')
      } else {
        await createPile.mutateAsync({
          siteId,
          payload: {
            pileIdCode: pileIdCode.trim(),
            dimensionId,
            areaId: areaId || null,
            areaLocation: areaLocation.trim() || null,
            notes: notes.trim() || null,
          },
        })

        toast.success('Pile created')
      }

      onOpenChange(false)
    } catch (error) {
      toast.error(getErrorMessage(error, mode === 'create' ? 'Failed to create pile' : 'Failed to update pile'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[420px] gap-4">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Create Pile' : 'Edit Pile'}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pile-id-code">Pile ID Code</Label>
          <Input
            id="pile-id-code"
            value={pileIdCode}
            onChange={(e) => setPileIdCode(e.target.value)}
            disabled={isLoadingForEdit}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pile-dimension">Dimension</Label>

            <Select
              items={dimensionSelectItems}
              value={dimensionId}
              onValueChange={(value) => setDimensionId(value ?? '')}
            >
              <SelectTrigger
                id="pile-dimension"
                className="w-full"
                disabled={isLoadingForEdit || (!dimensionsQuery.isLoading && dimensionSelectItems.length === 0)}
              >
                <SelectValue
                  placeholder={
                    dimensionsQuery.isLoading
                      ? 'Loading dimensions...'
                      : dimensionSelectItems.length === 0
                        ? 'No dimensions configured for this site'
                        : 'Select a dimension'
                  }
                />
              </SelectTrigger>

              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Dimensions</SelectLabel>

                  {dimensionSelectItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pile-area">Area</Label>

            <Select items={areaSelectItems} value={areaId} onValueChange={(value) => setAreaId(value ?? '')}>
              <SelectTrigger
                id="pile-area"
                className="w-full"
                disabled={isLoadingForEdit || (!areasQuery.isLoading && areaSelectItems.length === 0)}
              >
                <SelectValue
                  placeholder={
                    areasQuery.isLoading
                      ? 'Loading areas...'
                      : areaSelectItems.length === 0
                        ? 'No areas configured'
                        : 'No area selected'
                  }
                />
              </SelectTrigger>

              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Areas</SelectLabel>

                  {areaSelectItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pile-location">Location</Label>

          <Combobox
            items={locationSuggestions}
            inputValue={areaLocation}
            onInputValueChange={(value) => setAreaLocation(value)}
          >
            <ComboboxInput
              id="pile-location"
              placeholder="e.g. Grid N1"
              disabled={isLoadingForEdit}
              showClear
            />

            <ComboboxContent>
              <ComboboxEmpty>No previous locations match — your typed value will be used.</ComboboxEmpty>
              <ComboboxList>
                {(item: string) => (
                  <ComboboxItem key={item} value={item}>
                    {item}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pile-notes">Notes</Label>
          <Input
            id="pile-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isLoadingForEdit}
          />
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>

          <Button
            onClick={handleSubmit}
            loading={createPile.isPending || updatePile.isPending}
            disabled={isLoadingForEdit || !pileIdCode.trim() || !dimensionId || dimensionsQuery.isLoading}
          >
            {mode === 'create' ? 'Create' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
