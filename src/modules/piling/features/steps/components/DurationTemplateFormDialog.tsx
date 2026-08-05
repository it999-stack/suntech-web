import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { useSiteDimensions } from '@/modules/piling/features/dimensions/hooks/useDimensions'
import { useCreateDurationTemplate, useSiteSteps, useUpdateDurationTemplate } from '../hooks/useSteps'
import type { StepDimensionTemplate } from '../types/steps.types'

interface DurationTemplateFormDialogProps {
  mode: 'create' | 'edit'
  siteId: string
  editingTemplate?: StepDimensionTemplate | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function dimensionLabel(dimension: { label: string | null; dia: number; depth: number }) {
  return dimension.label?.trim() ? dimension.label : `${dimension.dia}mm × ${dimension.depth}m`
}

export function DurationTemplateFormDialog({
  mode,
  siteId,
  editingTemplate,
  open,
  onOpenChange,
}: DurationTemplateFormDialogProps) {
  const [stepId, setStepId] = useState('')
  const [dimensionId, setDimensionId] = useState('')
  const [duration, setDuration] = useState('')
  const [buffer, setBuffer] = useState('')

  const stepsQuery = useSiteSteps(siteId)
  const dimensionsQuery = useSiteDimensions(siteId)
  const createTemplate = useCreateDurationTemplate()
  const updateTemplate = useUpdateDurationTemplate()

  useEffect(() => {
    if (mode === 'edit' && editingTemplate) {
      setStepId(editingTemplate.stepId)
      setDimensionId(editingTemplate.dimensionId)
      setDuration(String(editingTemplate.durationMinutes))
      setBuffer(String(editingTemplate.bufferBeforeMinutes))
    }
  }, [mode, editingTemplate])

  const steps = stepsQuery.data ?? []
  const dimensions = dimensionsQuery.data ?? []

  const stepSelectItems = useMemo(
    () => steps.map((step) => ({ value: step.id, label: step.stepName })),
    [steps]
  )

  const selectedStep = steps.find((step) => step.id === stepId)
  const configuredDimensionIds = useMemo(
    () => new Set((selectedStep?.templates ?? []).map((template) => template.dimensionId)),
    [selectedStep]
  )

  const dimensionSelectItems = useMemo(
    () =>
      dimensions
        .filter((dimension) => !configuredDimensionIds.has(dimension.id))
        .map((dimension) => ({ value: dimension.id, label: dimensionLabel(dimension) })),
    [dimensions, configuredDimensionIds]
  )

  const durationSuggestions = useMemo(() => {
    const values = new Set<string>()
    steps.forEach((step) => step.templates.forEach((template) => values.add(String(template.durationMinutes))))
    return Array.from(values).sort((a, b) => Number(a) - Number(b))
  }, [steps])

  const bufferSuggestions = useMemo(() => {
    const values = new Set<string>()
    steps.forEach((step) => step.templates.forEach((template) => values.add(String(template.bufferBeforeMinutes))))
    return Array.from(values).sort((a, b) => Number(a) - Number(b))
  }, [steps])

  async function handleSubmit() {
    const payload = {
      stepId,
      dimensionId,
      durationMinutes: Number(duration),
      bufferBeforeMinutes: Number(buffer) || 0,
    }

    try {
      if (mode === 'edit') {
        if (!editingTemplate) return

        await updateTemplate.mutateAsync({ siteId, templateId: editingTemplate.id, payload })
        toast.success('Duration updated')
      } else {
        await createTemplate.mutateAsync({ siteId, payload })
        toast.success('Duration added')
      }

      onOpenChange(false)
    } catch (error) {
      toast.error(getErrorMessage(error, mode === 'create' ? 'Failed to add duration' : 'Failed to update duration'))
    }
  }

  const isValid = stepId !== '' && dimensionId !== '' && duration.trim() !== '' && Number(duration) > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[420px] gap-4">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Add Step Duration' : 'Edit Step Duration'}</DialogTitle>
        </DialogHeader>

        {mode === 'edit' ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Step</Label>
              <p className="text-sm text-foreground">{editingTemplate?.stepName}</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Dimension</Label>
              <p className="text-sm text-foreground">
                {editingTemplate
                  ? dimensionLabel({
                      label: editingTemplate.dimensionLabel,
                      dia: editingTemplate.dia,
                      depth: editingTemplate.depth,
                    })
                  : ''}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="duration-template-step">Step</Label>

              <Select
                items={stepSelectItems}
                value={stepId}
                onValueChange={(value) => {
                  setStepId(value ?? '')
                  setDimensionId('')
                }}
              >
                <SelectTrigger id="duration-template-step" className="w-full">
                  <SelectValue placeholder={stepsQuery.isLoading ? 'Loading steps...' : 'Select a step'} />
                </SelectTrigger>

                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Steps</SelectLabel>

                    {stepSelectItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="duration-template-dimension">Dimension</Label>

              <Select
                items={dimensionSelectItems}
                value={dimensionId}
                onValueChange={(value) => setDimensionId(value ?? '')}
              >
                <SelectTrigger
                  id="duration-template-dimension"
                  className="w-full"
                  disabled={!stepId || (!dimensionsQuery.isLoading && dimensionSelectItems.length === 0)}
                >
                  <SelectValue
                    placeholder={
                      !stepId
                        ? 'Select a step first'
                        : dimensionsQuery.isLoading
                          ? 'Loading dimensions...'
                          : dimensionSelectItems.length === 0
                            ? 'All dimensions configured for this step'
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
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="duration-template-duration">Avg Duration (min)</Label>

            <Combobox items={durationSuggestions} inputValue={duration} onInputValueChange={setDuration}>
              <ComboboxInput id="duration-template-duration" placeholder="e.g. 45" showClear />

              <ComboboxContent>
                <ComboboxEmpty>No previous values match — your typed value will be used.</ComboboxEmpty>
                <ComboboxList>
                  {(item: string) => (
                    <ComboboxItem key={item} value={item}>
                      {item} min
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="duration-template-buffer">Buffer (min)</Label>

            <Combobox items={bufferSuggestions} inputValue={buffer} onInputValueChange={setBuffer}>
              <ComboboxInput id="duration-template-buffer" placeholder="e.g. 10" showClear />

              <ComboboxContent>
                <ComboboxEmpty>No previous values match — your typed value will be used.</ComboboxEmpty>
                <ComboboxList>
                  {(item: string) => (
                    <ComboboxItem key={item} value={item}>
                      {item} min
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>

          <Button
            onClick={handleSubmit}
            loading={createTemplate.isPending || updateTemplate.isPending}
            disabled={!isValid}
          >
            {mode === 'create' ? 'Add' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
