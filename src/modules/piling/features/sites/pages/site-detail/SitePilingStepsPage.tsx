import { useEffect, useState } from 'react'
import { ListOrderedIcon, PencilLine, PlusIcon, Trash2Icon } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { EmptyState } from '@/components/EmptyState'
import { ReorderList } from '@/components/shadix-ui/components/reorder-list'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { Switch } from '@/components/ui/switch'
import { getErrorMessage } from '@/lib/errors'
import { DimensionSwitcher } from '../../../dimensions/components/DimensionSwitcher'
import { useSiteDimensions } from '../../../dimensions/hooks/useDimensions'
import { AddSiteStepDialog } from '../../../steps/components/AddSiteStepDialog'
import { DurationTemplateFormDialog } from '../../../steps/components/DurationTemplateFormDialog'
import { RemoveSiteStepDialog } from '../../../steps/components/RemoveSiteStepDialog'
import { useReorderSiteSteps, useSiteSteps, useUpdateStep } from '../../../steps/hooks/useSteps'
import type { SiteStep, StepDimensionTemplate } from '../../../steps/types/steps.types'

const trackVariant = {
  RIG: 'default',
  CRANE: 'secondary',
  COMPRESSOR: 'outline',
} as const

const ROW_GRID_COLS = 'grid-cols-[2.5rem_1fr_8rem_7rem_5.5rem_4.5rem]'

function durationText(template: StepDimensionTemplate) {
  return template.bufferBeforeMinutes > 0
    ? `${template.durationMinutes} + ${template.bufferBeforeMinutes}m`
    : `${template.durationMinutes}m`
}

function totalDurationText(totalMinutes: number) {
  if (totalMinutes <= 0) return '0m'
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return `${minutes}m`
  if (minutes === 0) return `${hours}h`
  return `${hours}h ${minutes}m`
}

export default function SitePilingStepsPage() {
  const { siteId } = useParams<{ siteId: string }>()
  const [addStepDialogOpen, setAddStepDialogOpen] = useState(false)
  const [addDurationDialogOpen, setAddDurationDialogOpen] = useState(false)
  const [templateToEdit, setTemplateToEdit] = useState<StepDimensionTemplate | null>(null)
  const [stepToRemove, setStepToRemove] = useState<SiteStep | null>(null)

  const [selectedDimensionId, setSelectedDimensionId] = useState<string | null>(null)
  const [pendingOrderedStepIds, setPendingOrderedStepIds] = useState<string[] | null>(null)
  const [resetToken, setResetToken] = useState(0)

  const stepsQuery = useSiteSteps(siteId)
  const steps = stepsQuery.data ?? []

  const dimensionsQuery = useSiteDimensions(siteId)
  const dimensions = dimensionsQuery.data ?? []

  // Default to the first dimension once dimensions load, or fall back if the
  // currently selected one was deleted out from under us.
  useEffect(() => {
    if (dimensions.length === 0) {
      setSelectedDimensionId(null)
      return
    }
    if (!dimensions.some((dimension) => dimension.id === selectedDimensionId)) {
      setSelectedDimensionId(dimensions[0].id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dimensions])

  // Only steps with a duration template for the selected dimension are
  // shown/draggable here — a step without one stays invisible until someone
  // configures its duration via Add Duration for this dimension.
  const visibleSteps = steps.filter((step) =>
    step.templates.some((template) => template.dimensionId === selectedDimensionId)
  )

  // Uncontrolled internally (only reads props.children on mount) — remount
  // whenever the visible set changes (add/remove/refetch/dimension switch)
  // or a pending reorder is cancelled, so drag state never goes stale.
  const [orderedStepsKey, setOrderedStepsKey] = useState('')
  useEffect(() => {
    setOrderedStepsKey(visibleSteps.map((step) => step.id).join(','))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps, selectedDimensionId, resetToken])

  const updateStep = useUpdateStep()
  const reorderSteps = useReorderSiteSteps()

  const totalMinutes = visibleSteps.reduce((sum, step) => {
    const template = step.templates.find((t) => t.dimensionId === selectedDimensionId)
    return sum + (template ? template.durationMinutes + template.bufferBeforeMinutes : 0)
  }, 0)

  async function handleToggleSplittable(step: SiteStep, isSplittable: boolean) {
    if (!siteId) return
    try {
      await updateStep.mutateAsync({ siteId, siteStepId: step.id, isSplittable })
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to update step'))
    }
  }

  function handlePendingReorder(newOrder: React.ReactElement[]) {
    // ReorderList seeds its internal state via React.Children.toArray, which
    // rewrites each element's .key to an internal-use path-prefixed string —
    // never the raw value we set via the `key` prop. A separate data
    // attribute (untouched by that rewrite) is the only reliable way to get
    // the real site-step id back out.
    const newVisibleIds = newOrder.map((item) => {
      const props = item.props as { 'data-site-step-id'?: string }
      return String(props['data-site-step-id'])
    })

    // The reorder endpoint requires every one of the site's steps, not just
    // the visible/templated ones being dragged — walk the full list and
    // splice the newly-dragged order into the visible slots, leaving
    // hidden steps exactly where they already were.
    const visibleIdSet = new Set(visibleSteps.map((step) => step.id))
    let cursor = 0
    const orderedSiteStepIds = steps.map((step) =>
      visibleIdSet.has(step.id) ? newVisibleIds[cursor++] : step.id
    )

    setPendingOrderedStepIds(orderedSiteStepIds)
  }

  async function handleSaveReorder() {
    if (!siteId || !pendingOrderedStepIds) return
    try {
      await reorderSteps.mutateAsync({ siteId, orderedSiteStepIds: pendingOrderedStepIds })
      setPendingOrderedStepIds(null)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to reorder steps'))
    }
  }

  function handleCancelReorder() {
    setPendingOrderedStepIds(null)
    setResetToken((token) => token + 1)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Piling steps</CardTitle>
            {selectedDimensionId && (
              <p className="text-sm text-muted-foreground">
                {visibleSteps.length} step{visibleSteps.length === 1 ? '' : 's'} · ~{totalDurationText(totalMinutes)}{' '}
                total per pile
              </p>
            )}
          </div>

          <CardAction className="flex gap-2">
            <Button variant="outline" onClick={() => setAddDurationDialogOpen(true)} disabled={steps.length === 0}>
              <PlusIcon className="mr-2 h-4 w-4" />
              Add duration
            </Button>
            <Button onClick={() => setAddStepDialogOpen(true)}>
              <PlusIcon className="mr-2 h-4 w-4" />
              Add step
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {siteId && (
            <DimensionSwitcher
              siteId={siteId}
              selectedDimensionId={selectedDimensionId}
              onSelectDimension={setSelectedDimensionId}
            />
          )}

          {pendingOrderedStepIds && (
            <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-3 py-2 text-sm">
              <span className="text-foreground">Step order changed — save to keep it, or cancel to revert.</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelReorder}
                  disabled={reorderSteps.isPending}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSaveReorder} loading={reorderSteps.isPending}>
                  Save order
                </Button>
              </div>
            </div>
          )}

          {stepsQuery.isLoading || dimensionsQuery.isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Spinner className="size-6 text-muted-foreground" />
            </div>
          ) : steps.length === 0 ? (
            <EmptyState
              icon={ListOrderedIcon}
              title="No piling steps configured yet"
              description="Click Add Step to add a step from the catalog to this site."
            />
          ) : dimensions.length === 0 ? (
            <EmptyState
              icon={ListOrderedIcon}
              title="No dimensions configured yet"
              description="Create a dimension above, then set step durations for it."
            />
          ) : visibleSteps.length === 0 ? (
            <EmptyState
              icon={ListOrderedIcon}
              title="No durations configured for this dimension yet"
              description="Click Add Duration to set a duration for one of this site's steps for this dimension."
            />
          ) : (
            <div className="flex flex-col gap-1">
              <div
                className={`grid ${ROW_GRID_COLS} items-center gap-2 pl-8 pr-3 text-xs font-medium text-muted-foreground uppercase`}
              >
                <span className="text-center">#</span>
                <span>Step</span>
                <span>Duration</span>
                <span>Machine</span>
                <span>Split</span>
                <span className="text-right">Actions</span>
              </div>

              <ReorderList
                key={`${orderedStepsKey}-${selectedDimensionId}-${resetToken}`}
                withDragHandle
                handlePosition="left"
                onReorderFinish={handlePendingReorder}
                className="gap-1"
              >
                {visibleSteps.map((step, index) => {
                  const template = step.templates.find((t) => t.dimensionId === selectedDimensionId)!

                  return (
                    <div
                      key={step.id}
                      data-site-step-id={step.id}
                      className={`grid ${ROW_GRID_COLS} items-center gap-2 rounded-lg border bg-background pl-8 pr-3 py-2`}
                    >
                      <span className="text-center text-sm text-muted-foreground">{index + 1}</span>
                      <span className="truncate text-sm font-medium text-foreground">{step.stepName}</span>
                      <span className="text-sm text-muted-foreground">{durationText(template)}</span>
                      <Badge variant={trackVariant[step.track]} className="w-fit">
                        {step.track}
                      </Badge>

                      <Switch
                        checked={step.isSplittable}
                        disabled={updateStep.isPending}
                        onCheckedChange={(checked) => handleToggleSplittable(step, checked)}
                      />

                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon-xs" onClick={() => setTemplateToEdit(template)}>
                          <PencilLine className="text-muted-foreground" />
                          <span className="sr-only">Edit {step.stepName} duration</span>
                        </Button>

                        <Button variant="ghost" size="icon-xs" onClick={() => setStepToRemove(step)}>
                          <Trash2Icon className="text-destructive" />
                          <span className="sr-only">Remove {step.stepName} from this site</span>
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </ReorderList>
            </div>
          )}
        </CardContent>
      </Card>

      {siteId && (
        <AddSiteStepDialog
          key={`step-add-${addStepDialogOpen}`}
          siteId={siteId}
          open={addStepDialogOpen}
          onOpenChange={setAddStepDialogOpen}
        />
      )}

      {siteId && (
        <RemoveSiteStepDialog
          siteId={siteId}
          step={stepToRemove}
          open={stepToRemove !== null}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setStepToRemove(null)
          }}
        />
      )}

      {siteId && (
        <DurationTemplateFormDialog
          key={`duration-create-${addDurationDialogOpen}`}
          mode="create"
          siteId={siteId}
          open={addDurationDialogOpen}
          onOpenChange={setAddDurationDialogOpen}
        />
      )}

      {siteId && (
        <DurationTemplateFormDialog
          key={`duration-edit-${templateToEdit?.id}`}
          mode="edit"
          siteId={siteId}
          editingTemplate={templateToEdit}
          open={templateToEdit !== null}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setTemplateToEdit(null)
          }}
        />
      )}
    </>
  )
}
