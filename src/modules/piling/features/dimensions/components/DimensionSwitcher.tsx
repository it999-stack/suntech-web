import { useState } from 'react'
import { ChevronDownIcon, PenLine, PlusIcon, RulerIcon, Trash2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useSiteDimensions } from '../hooks/useDimensions'
import type { SiteDimension } from '../types/dimensions.types'
import { DeleteDimensionDialog } from './DeleteDimensionDialog'
import { DimensionFormDialog } from './DimensionFormDialog'

interface DimensionSwitcherProps {
  siteId: string
  selectedDimensionId: string | null
  onSelectDimension: (dimensionId: string) => void
}

function dimensionSummary(dimension: SiteDimension) {
  return `${dimension.dia}x${dimension.depth}`
}

function dimensionDetail(dimension: SiteDimension) {
  return `${dimension.dia}mm dia, ${dimension.depth}m depth`
}

export function DimensionSwitcher({ siteId, selectedDimensionId, onSelectDimension }: DimensionSwitcherProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [dimensionToEdit, setDimensionToEdit] = useState<SiteDimension | null>(null)
  const [dimensionToDelete, setDimensionToDelete] = useState<SiteDimension | null>(null)

  const dimensionsQuery = useSiteDimensions(siteId)
  const dimensions = dimensionsQuery.data ?? []
  const selectedDimension = dimensions.find((dimension) => dimension.id === selectedDimensionId) ?? null

  return (
    <>
      <div className="flex items-center gap-2">
        <RulerIcon className="size-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Dimension</span>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="outline" size="sm" className="rounded-full" disabled={dimensionsQuery.isLoading} />}
          >
            {selectedDimension ? (
              <>
                <span className="font-medium">{dimensionSummary(selectedDimension)}</span>
                <span className="text-muted-foreground">· {dimensionDetail(selectedDimension)}</span>
              </>
            ) : (
              <span className="text-muted-foreground">
                {dimensionsQuery.isLoading ? 'Loading dimensions...' : 'No dimensions yet'}
              </span>
            )}
            <ChevronDownIcon className="text-muted-foreground" />
          </DropdownMenuTrigger>

          <DropdownMenuContent className="min-w-64">
            {dimensions.map((dimension) => (
              <DropdownMenuItem key={dimension.id} onClick={() => onSelectDimension(dimension.id)}>
                <span className="font-medium text-foreground">{dimensionSummary(dimension)}</span>{' '}
                <span className="text-muted-foreground">· {dimensionDetail(dimension)}</span>
              </DropdownMenuItem>
            ))}

            {dimensions.length > 0 && <DropdownMenuSeparator />}

            <DropdownMenuItem onClick={() => setCreateDialogOpen(true)} className="text-primary">
              <PlusIcon className="size-4" />
              New dimension
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {selectedDimension && (
          <>
            <Button variant="ghost" size="icon-sm" onClick={() => setDimensionToEdit(selectedDimension)}>
              <PenLine />
              <span className="sr-only">Edit {dimensionSummary(selectedDimension)}</span>
            </Button>

            <Button variant="ghost" size="icon-sm" onClick={() => setDimensionToDelete(selectedDimension)}>
              <Trash2Icon className="text-destructive" />
              <span className="sr-only">Delete {dimensionSummary(selectedDimension)}</span>
            </Button>
          </>
        )}
      </div>

      <DimensionFormDialog
        key={`dimension-create-${createDialogOpen}`}
        mode="create"
        siteId={siteId}
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

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

      <DeleteDimensionDialog
        siteId={siteId}
        dimension={dimensionToDelete}
        open={dimensionToDelete !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setDimensionToDelete(null)
        }}
      />
    </>
  )
}
