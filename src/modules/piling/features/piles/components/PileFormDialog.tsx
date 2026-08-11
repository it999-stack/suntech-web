import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  Autocomplete,
  AutocompleteContent,
  AutocompleteEmpty,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteList,
} from '@/components/ui/autocomplete'
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
import { useSiteLocations } from '@/modules/piling/features/locations/hooks/useLocations'
import { useSiteDimensions } from '@/modules/piling/features/dimensions/hooks/useDimensions'
import { useAreaSuggestions, useCreatePile, usePile, useUpdatePile } from '../hooks/usePiles'

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
  const [locationId, setLocationId] = useState('')
  const [area, setArea] = useState('')
  const [notes, setNotes] = useState('')

  const dimensionsQuery = useSiteDimensions(siteId)
  const locationsQuery = useSiteLocations(siteId)
  const areaSuggestionsQuery = useAreaSuggestions(siteId)
  const pileQuery = usePile(mode === 'edit' ? pileId : undefined)
  const createPile = useCreatePile()
  const updatePile = useUpdatePile()

  const hasPrefilledRef = useRef(false)

  useEffect(() => {
    if (mode === 'edit' && pileQuery.data && !hasPrefilledRef.current) {
      hasPrefilledRef.current = true
      setPileIdCode(pileQuery.data.pileIdCode)
      setDimensionId(pileQuery.data.dimensionId)
      setLocationId(pileQuery.data.locationId ?? '')
      setArea(pileQuery.data.area ?? '')
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
  const locationSelectItems = useMemo(
    () =>
      (locationsQuery.data ?? []).map((location) => ({
        value: location.id,
        label: location.code ? `${location.name} (${location.code})` : location.name,
      })),
    [locationsQuery.data]
  )
  const areaSuggestions = areaSuggestionsQuery.data ?? []

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
            locationId,
            area: area.trim() || null,
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
            locationId,
            area: area.trim() || null,
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
            <Label htmlFor="pile-location">Location</Label>

            <Select
              items={locationSelectItems}
              value={locationId}
              onValueChange={(value) => setLocationId(value ?? '')}
            >
              <SelectTrigger
                id="pile-location"
                className="w-full"
                disabled={isLoadingForEdit || (!locationsQuery.isLoading && locationSelectItems.length === 0)}
              >
                <SelectValue
                  placeholder={
                    locationsQuery.isLoading
                      ? 'Loading locations...'
                      : locationSelectItems.length === 0
                        ? 'No locations configured for this site'
                        : 'Select a location'
                  }
                />
              </SelectTrigger>

              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Locations</SelectLabel>

                  {locationSelectItems.map((item) => (
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
          <Label htmlFor="pile-area">Area</Label>

          <Autocomplete items={areaSuggestions} value={area} onValueChange={(value) => setArea(value)}>
            <AutocompleteInput id="pile-area" placeholder="e.g. Grid N1" disabled={isLoadingForEdit} showClear />

            <AutocompleteContent>
              <AutocompleteEmpty>No previous areas match — your typed value will be used.</AutocompleteEmpty>
              <AutocompleteList>
                {(item: string) => (
                  <AutocompleteItem key={item} value={item}>
                    {item}
                  </AutocompleteItem>
                )}
              </AutocompleteList>
            </AutocompleteContent>
          </Autocomplete>
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
            disabled={
              isLoadingForEdit ||
              !pileIdCode.trim() ||
              !dimensionId ||
              !locationId ||
              dimensionsQuery.isLoading ||
              locationsQuery.isLoading
            }
          >
            {mode === 'create' ? 'Create' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
