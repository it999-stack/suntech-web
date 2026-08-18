import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog'
import { useRemoveSiteStep } from '../hooks/useSteps'
import type { SiteStep } from '../types/steps.types'

interface RemoveSiteStepDialogProps {
  siteId: string
  step: SiteStep | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RemoveSiteStepDialog({ siteId, step, open, onOpenChange }: RemoveSiteStepDialogProps) {
  const removeSiteStep = useRemoveSiteStep()

  return (
    <ConfirmDeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Remove step from this site?"
      description={
        <>
          This removes <span className="font-medium text-foreground">{step?.stepName}</span> and its duration
          templates from this site only — other sites using this step are unaffected, and past checklists that
          already recorded this step keep their history.
        </>
      }
      onConfirm={async () => {
        if (!step) return
        await removeSiteStep.mutateAsync({ siteId, siteStepId: step.id })
      }}
      successMessage="Step removed"
      errorMessage="Failed to remove step"
      confirmLabel="Remove"
    />
  )
}
