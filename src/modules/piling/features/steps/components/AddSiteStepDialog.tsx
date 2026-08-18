import { useMemo, useState } from 'react'
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
import { useAddSiteStep, useSiteStepCatalog } from '../hooks/useSteps'

interface AddSiteStepDialogProps {
  siteId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddSiteStepDialog({ siteId, open, onOpenChange }: AddSiteStepDialogProps) {
  const [stepId, setStepId] = useState('')

  const catalogQuery = useSiteStepCatalog(siteId)
  const addSiteStep = useAddSiteStep()

  const catalogSteps = catalogQuery.data ?? []
  const stepSelectItems = useMemo(
    () => catalogSteps.map((step) => ({ value: step.id, label: `${step.stepName} (${step.track})` })),
    [catalogSteps]
  )

  async function handleSubmit() {
    try {
      await addSiteStep.mutateAsync({ siteId, payload: { stepId } })
      toast.success('Step added to site')
      setStepId('')
      onOpenChange(false)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to add step'))
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setStepId('')
        onOpenChange(next)
      }}
    >
      <DialogContent className="w-[420px] gap-4">
        <DialogHeader>
          <DialogTitle>Add Step</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="add-site-step">Step</Label>

          <Select items={stepSelectItems} value={stepId} onValueChange={(value) => setStepId(value ?? '')}>
            <SelectTrigger id="add-site-step" className="w-full" disabled={!catalogQuery.isLoading && stepSelectItems.length === 0}>
              <SelectValue
                placeholder={
                  catalogQuery.isLoading
                    ? 'Loading steps...'
                    : stepSelectItems.length === 0
                      ? 'Every catalog step is already on this site'
                      : 'Select a step'
                }
              />
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

          <p className="text-xs text-muted-foreground">Added to the end of this site's step order — drag to reposition after adding.</p>
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>

          <Button onClick={handleSubmit} loading={addSiteStep.isPending} disabled={!stepId}>
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
