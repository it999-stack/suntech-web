import { useEffect, useState } from 'react'
import { ListOrderedIcon, PencilLine, PenLine, PlusIcon, RulerIcon, Trash2Icon } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { EmptyState } from '@/components/EmptyState'
import { TableSkeleton } from '@/components/skeletons/TableSkeleton'
import { ReorderList } from '@/components/shadix-ui/components/reorder-list'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getErrorMessage } from '@/lib/errors'
import { DeleteDimensionDialog } from '../../../dimensions/components/DeleteDimensionDialog'
import { DimensionFormDialog } from '../../../dimensions/components/DimensionFormDialog'
import { useSiteDimensions } from '../../../dimensions/hooks/useDimensions'
import type { SiteDimension } from '../../../dimensions/types/dimensions.types'
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

function templateLabel(template: StepDimensionTemplate) {
  return template.dimensionLabel?.trim() ? template.dimensionLabel : `${template.dia}mm × ${template.depth}m`
}

export default function SitePilingStepsPage() {
  const { siteId } = useParams<{ siteId: string }>()
  const [addStepDialogOpen, setAddStepDialogOpen] = useState(false)
  const [addDurationDialogOpen, setAddDurationDialogOpen] = useState(false)
  const [templateToEdit, setTemplateToEdit] = useState<StepDimensionTemplate | null>(null)
  const [stepToRemove, setStepToRemove] = useState<SiteStep | null>(null)

  const [createDimensionDialogOpen, setCreateDimensionDialogOpen] = useState(false)
  const [dimensionToEdit, setDimensionToEdit] = useState<SiteDimension | null>(null)
  const [dimensionToDelete, setDimensionToDelete] = useState<SiteDimension | null>(null)

  const stepsQuery = useSiteSteps(siteId)
  const steps = stepsQuery.data ?? []
  // Only steps with a duration configured for this site are shown/draggable —
  // an added-but-unconfigured step stays invisible here until someone sets
  // its duration via Add Duration.
  const visibleSteps = steps.filter((step) => step.templates.length > 0)

  // Uncontrolled internally (only reads props.children on mount) — remount
  // whenever the visible set changes (add/remove/refetch) so drag state
  // never goes stale against what the server actually has.
  const [orderedStepsKey, setOrderedStepsKey] = useState('')
  useEffect(() => {
    setOrderedStepsKey(visibleSteps.map((step) => step.id).join(','))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps])

  const dimensionsQuery = useSiteDimensions(siteId)
  const dimensions = dimensionsQuery.data ?? []

  const updateStep = useUpdateStep()
  const reorderSteps = useReorderSiteSteps()

  async function handleToggleSplittable(step: SiteStep, isSplittable: boolean) {
    if (!siteId) return
    try {
      await updateStep.mutateAsync({ siteId, siteStepId: step.id, isSplittable })
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to update step'))
    }
  }

  async function handleReorderFinish(newOrder: React.ReactElement[]) {
    if (!siteId) return
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
    // untemplated (hidden) steps exactly where they already were.
    const visibleIdSet = new Set(visibleSteps.map((step) => step.id))
    let cursor = 0
    const orderedSiteStepIds = steps.map((step) =>
      visibleIdSet.has(step.id) ? newVisibleIds[cursor++] : step.id
    )

    try {
      await reorderSteps.mutateAsync({ siteId, orderedSiteStepIds })
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to reorder steps'))
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Piling Steps</CardTitle>

          <CardAction className="flex gap-2">
            <Button variant="outline" onClick={() => setAddDurationDialogOpen(true)} disabled={steps.length === 0}>
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Duration
            </Button>
            <Button onClick={() => setAddStepDialogOpen(true)}>
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Step
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent>
          {stepsQuery.isLoading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-24 rounded-lg" />
              ))}
            </div>
          ) : steps.length === 0 ? (
            <EmptyState
              icon={ListOrderedIcon}
              title="No piling steps configured yet"
              description="Click Add Step to add a step from the catalog to this site."
            />
          ) : visibleSteps.length === 0 ? (
            <EmptyState
              icon={ListOrderedIcon}
              title="No step durations configured yet"
              description="Click Add Duration to set a duration for one of this site's steps — it'll show up here once configured."
            />
          ) : (
            <ReorderList key={orderedStepsKey} withDragHandle onReorderFinish={handleReorderFinish} className="gap-3">
              {visibleSteps.map((step, index) => (
                <Card key={step.id} data-site-step-id={step.id} className="gap-3 py-4">
                  <CardHeader className="px-4">
                    <div className="flex items-center gap-2">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                        {index + 1}
                      </span>
                      <CardTitle className="text-sm">{step.stepName}</CardTitle>
                    </div>

                    <CardAction className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <Switch
                          id={`step-splittable-${step.id}`}
                          checked={step.isSplittable}
                          disabled={updateStep.isPending}
                          onCheckedChange={(checked) => handleToggleSplittable(step, checked)}
                        />
                        <label htmlFor={`step-splittable-${step.id}`} className="text-xs text-muted-foreground">
                          Splittable
                        </label>
                      </div>

                      <Badge variant={trackVariant[step.track]}>{step.track}</Badge>

                      <Button variant="ghost" size="icon-xs" onClick={() => setStepToRemove(step)}>
                        <Trash2Icon className="text-destructive" />
                        <span className="sr-only">Remove {step.stepName} from this site</span>
                      </Button>
                    </CardAction>
                  </CardHeader>

                  <CardContent className="flex flex-col gap-1.5 px-4">
                    {step.templates.map((template) => (
                      <div key={template.id} className="flex items-center justify-between text-sm">
                        <span className="text-foreground">{templateLabel(template)}</span>

                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">
                            {template.durationMinutes} min
                            {template.bufferBeforeMinutes > 0 && ` + ${template.bufferBeforeMinutes} min buffer`}
                          </span>

                          <Button variant="ghost" size="icon-xs" onClick={() => setTemplateToEdit(template)}>
                            <PencilLine className="text-muted-foreground" />
                            <span className="sr-only">Edit {templateLabel(template)} duration</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </ReorderList>
          )}
        </CardContent>
      </Card>

      {dimensionsQuery.isLoading ? (
        <TableSkeleton rows={8} columns={4} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Dimensions</CardTitle>

            <CardAction>
              <Button onClick={() => setCreateDimensionDialogOpen(true)}>
                <PlusIcon className="mr-2 h-4 w-4" />
                Create Dimension
              </Button>
            </CardAction>
          </CardHeader>

          <CardContent>
            {dimensions.length === 0 ? (
              <EmptyState
                icon={RulerIcon}
                title="No dimensions yet"
                description="Dimensions added to this site will show up here."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Label</TableHead>
                    <TableHead>Dia (mm)</TableHead>
                    <TableHead>Depth (m)</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dimensions.map((dimension) => (
                    <TableRow key={dimension.id}>
                      <TableCell className="font-medium text-foreground">
                        {dimension.label ?? '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{dimension.dia}</TableCell>
                      <TableCell className="text-muted-foreground">{dimension.depth}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon-sm" onClick={() => setDimensionToEdit(dimension)}>
                          <PenLine />
                          <span className="sr-only">Edit dimension</span>
                        </Button>

                        <Button variant="ghost" size="icon-sm" onClick={() => setDimensionToDelete(dimension)}>
                          <Trash2Icon className="text-destructive" />
                          <span className="sr-only">Delete dimension</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

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

      {siteId && (
        <DimensionFormDialog
          key={`dimension-create-${createDimensionDialogOpen}`}
          mode="create"
          siteId={siteId}
          open={createDimensionDialogOpen}
          onOpenChange={setCreateDimensionDialogOpen}
        />
      )}

      {siteId && (
        <DimensionFormDialog
          key={`dimension-edit-${dimensionToEdit?.id}`}
          mode="edit"
          siteId={siteId}
          dimension={dimensionToEdit}
          open={dimensionToEdit !== null}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setDimensionToEdit(null)
          }}
        />
      )}

      {siteId && (
        <DeleteDimensionDialog
          siteId={siteId}
          dimension={dimensionToDelete}
          open={dimensionToDelete !== null}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setDimensionToDelete(null)
          }}
        />
      )}
    </>
  )
}
