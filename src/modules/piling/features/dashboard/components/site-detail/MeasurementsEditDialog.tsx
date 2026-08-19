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
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getErrorMessage } from '@/lib/errors'
import { useSiteContractors } from '@/modules/piling/features/contractors/hooks/useContractors'
import { useUpdatePileMeasurements } from '../../hooks/useUpdatePileMeasurements'
import type { PileMeasurements } from '../../types/dashboard.types'

const NO_CONTRACTOR = 'none'

interface MeasurementsEditDialogProps {
  pileId: string
  siteId: string
  measurements: PileMeasurements | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
}

function toInputValue(value: number | null): string {
  return value === null ? '' : String(value)
}

function toNullableNumber(value: string): number | null {
  const trimmed = value.trim()
  return trimmed === '' ? null : Number(trimmed)
}

export function MeasurementsEditDialog({
  pileId,
  siteId,
  measurements,
  open,
  onOpenChange,
  onSaved,
}: MeasurementsEditDialogProps) {
  const [eglM, setEglM] = useState(() => toInputValue(measurements?.eglM ?? null))
  const [pileContractorId, setPileContractorId] = useState(() => measurements?.pileContractorId ?? NO_CONTRACTOR)
  const [cageContractorId, setCageContractorId] = useState(() => measurements?.cageContractorId ?? NO_CONTRACTOR)
  const [pileLengthM, setPileLengthM] = useState(() => toInputValue(measurements?.pileLengthM ?? null))
  const [cageWeightKg, setCageWeightKg] = useState(() => toInputValue(measurements?.cageWeightKg ?? null))
  const [ctlM, setCtlM] = useState(() => toInputValue(measurements?.ctlM ?? null))
  const [colM, setColM] = useState(() => toInputValue(measurements?.colM ?? null))
  const [boreDepthM, setBoreDepthM] = useState(() => toInputValue(measurements?.boreDepthM ?? null))
  const [hookLengthM, setHookLengthM] = useState(() => toInputValue(measurements?.hookLengthM ?? null))
  const [flM, setFlM] = useState(() => toInputValue(measurements?.flM ?? null))
  const [plannedQtyM3, setPlannedQtyM3] = useState(() => toInputValue(measurements?.plannedQtyM3 ?? null))
  const [actualQtyM3, setActualQtyM3] = useState(() => toInputValue(measurements?.actualQtyM3 ?? null))

  const contractorsQuery = useSiteContractors(siteId)
  const contractors = contractorsQuery.data ?? []
  const contractorItems = [
    { value: NO_CONTRACTOR, label: 'None' },
    ...contractors.map((contractor) => ({ value: contractor.id, label: contractor.name })),
  ]

  const updateMeasurements = useUpdatePileMeasurements()

  async function handleSubmit() {
    try {
      await updateMeasurements.mutateAsync({
        pileId,
        update: {
          eglM: toNullableNumber(eglM),
          pileContractorId: pileContractorId === NO_CONTRACTOR ? null : pileContractorId,
          cageContractorId: cageContractorId === NO_CONTRACTOR ? null : cageContractorId,
          pileLengthM: toNullableNumber(pileLengthM),
          cageWeightKg: toNullableNumber(cageWeightKg),
          ctlM: toNullableNumber(ctlM),
          colM: toNullableNumber(colM),
          boreDepthM: toNullableNumber(boreDepthM),
          hookLengthM: toNullableNumber(hookLengthM),
          flM: toNullableNumber(flM),
          plannedQtyM3: toNullableNumber(plannedQtyM3),
          actualQtyM3: toNullableNumber(actualQtyM3),
        },
      })

      toast.success('Measurements updated')
      onSaved?.()
      onOpenChange(false)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to update measurements'))
    }
  }

  function contractorSelect(
    id: string,
    label: string,
    value: string,
    onValueChange: (value: string) => void
  ) {
    return (
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={id}>{label}</Label>
        <Select value={value} onValueChange={(v) => onValueChange(v ?? NO_CONTRACTOR)} items={contractorItems}>
          <SelectTrigger id={id} className="w-full">
            <SelectValue placeholder="None" />
          </SelectTrigger>

          <SelectContent>
            <SelectGroup>
              {contractorItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    )
  }

  function numberField(id: string, label: string, value: string, onChange: (value: string) => void) {
    return (
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={id}>{label}</Label>
        <Input id={id} type="number" value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[560px] gap-4 max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Measurements</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div>
            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Before Casing
            </div>
            <div className="grid grid-cols-2 gap-4">
              {numberField('m-egl', 'Existing Ground Level (m)', eglM, setEglM)}
              {numberField('m-pile-length', 'Pile Length (m)', pileLengthM, setPileLengthM)}
              {numberField('m-cage-weight', 'Cage Weight (kg)', cageWeightKg, setCageWeightKg)}
              {contractorSelect('m-pile-contractor', 'Pile Contractor', pileContractorId, setPileContractorId)}
              {contractorSelect('m-cage-contractor', 'Cage Contractor', cageContractorId, setCageContractorId)}
            </div>
          </div>

          <div>
            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              After Casing
            </div>
            <div className="grid grid-cols-2 gap-4">
              {numberField('m-ctl', 'Casing Top Level (m)', ctlM, setCtlM)}
              {numberField('m-col', 'Cut Off Level (m)', colM, setColM)}
            </div>
          </div>

          <div>
            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              After Boring
            </div>
            <div className="grid grid-cols-2 gap-4">
              {numberField('m-bore-depth', 'Bore Depth (m)', boreDepthM, setBoreDepthM)}
            </div>
          </div>

          <div>
            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              After Cage Lowering
            </div>
            <div className="grid grid-cols-2 gap-4">
              {numberField('m-hook-length', 'Hook Length (m)', hookLengthM, setHookLengthM)}
            </div>
          </div>

          <div>
            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              After Concreting
            </div>
            <div className="grid grid-cols-2 gap-4">
              {numberField('m-fl', 'Founding Level (m)', flM, setFlM)}
              {numberField('m-planned-qty', 'Planned Concrete Qty (m³)', plannedQtyM3, setPlannedQtyM3)}
              {numberField('m-actual-qty', 'Actual Concrete Qty (m³)', actualQtyM3, setActualQtyM3)}
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>

          <Button onClick={handleSubmit} loading={updateMeasurements.isPending}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
