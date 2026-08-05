import { useState } from 'react'
import { ListOrderedIcon, PencilLine, PenLine, PlusIcon, RulerIcon, Trash2Icon } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { EmptyState } from '@/components/EmptyState'
import { TableSkeleton } from '@/components/skeletons/TableSkeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DeleteDimensionDialog } from '../../../dimensions/components/DeleteDimensionDialog'
import { DimensionFormDialog } from '../../../dimensions/components/DimensionFormDialog'
import { useSiteDimensions } from '../../../dimensions/hooks/useDimensions'
import type { SiteDimension } from '../../../dimensions/types/dimensions.types'
import { DurationTemplateFormDialog } from '../../../steps/components/DurationTemplateFormDialog'
import { useSiteSteps } from '../../../steps/hooks/useSteps'
import type { StepDimensionTemplate } from '../../../steps/types/steps.types'

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
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [templateToEdit, setTemplateToEdit] = useState<StepDimensionTemplate | null>(null)

  const [createDimensionDialogOpen, setCreateDimensionDialogOpen] = useState(false)
  const [dimensionToEdit, setDimensionToEdit] = useState<SiteDimension | null>(null)
  const [dimensionToDelete, setDimensionToDelete] = useState<SiteDimension | null>(null)

  const stepsQuery = useSiteSteps(siteId)
  const configuredSteps = (stepsQuery.data ?? []).filter((step) => step.templates.length > 0)

  const dimensionsQuery = useSiteDimensions(siteId)
  const dimensions = dimensionsQuery.data ?? []

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Piling Steps</CardTitle>

          <CardAction>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Step
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent>
          {stepsQuery.isLoading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-32 rounded-lg" />
              ))}
            </div>
          ) : configuredSteps.length === 0 ? (
            <EmptyState
              icon={ListOrderedIcon}
              title="No piling steps configured yet"
              description="Click Add Step to configure a step's duration for this site."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {configuredSteps.map((step, index) => (
                <Card key={step.id} className="gap-3 py-4">
                  <CardHeader className="px-4">
                    <div className="flex items-center gap-2">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                        {index + 1}
                      </span>
                      <CardTitle className="text-sm">{step.stepName}</CardTitle>
                    </div>

                    <CardAction>
                      <Badge variant={trackVariant[step.track]}>{step.track}</Badge>
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

                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => setTemplateToEdit(template)}
                          >
                            <PencilLine className="text-muted-foreground" />
                            <span className="sr-only">Edit {templateLabel(template)} duration</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
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
        <DurationTemplateFormDialog
          key={`step-create-${createDialogOpen}`}
          mode="create"
          siteId={siteId}
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
        />
      )}

      {siteId && (
        <DurationTemplateFormDialog
          key={`step-edit-${templateToEdit?.id}`}
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
