import { useMemo, useState } from 'react'
import { useQueries, useQueryClient } from '@tanstack/react-query'
import { EyeIcon, ListChecksIcon, Loader2Icon, PencilIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ButtonGroupInput } from '@/components/ButtonGroupInput'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Drawer, DrawerContent } from '@/components/ui/drawer'
import { EmptyState } from '@/components/EmptyState'
import { today } from '@/lib/date'
import { siteDetailService } from '../../api/siteDetail.api'
import { PILE_HISTORY_FROM, siteDetailQueryKeys, usePileStepsForRange } from '../../hooks/useSiteDetailQueries'
import type { PileLifecycle, PileProgressRow, StepStatus } from '../../types/dashboard.types'
import { EditPileActualDrawer } from './EditPileActualDrawer'
import { PileDetailSheet } from './PileDetailSheet'
import { StatusPill } from './status/StatusPill'

interface RangePileTableProps {
  rows: PileProgressRow[]
  siteId: string
  from: string
  to: string
}

const statusFilterItems = [
  { value: 'all', label: 'All statuses' },
  { value: 'NOT_STARTED', label: 'Not started' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'COMPLETED', label: 'Completed' },
]

// Range rows only carry summed step counts, not per-step timestamps, so
// "delayed" can't be determined here — that needs the lazily-fetched detail
// (see PileDetailSheet, which derives real StepStatus per step once loaded).
function toStepStatus(status: PileLifecycle): StepStatus {
  if (status === 'COMPLETED') return 'completed'
  if (status === 'IN_PROGRESS') return 'in_progress'
  return 'pending'
}

// Warms the cache for roughly the first screenful of piles so opening one is
// instant; anything beyond this fetches lazily, one pile at a time, on click.
const PREFETCH_COUNT = 10

export function RangePileTable({ rows, siteId, from, to }: RangePileTableProps) {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [selectedPileId, setSelectedPileId] = useState<string | null>(null)
  const [editPileId, setEditPileId] = useState<string | null>(null)

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (statusFilter !== 'all' && row.status !== statusFilter) return false
      if (search && !row.pileIdCode.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [rows, statusFilter, search])

  // The drawer always shows a pile's complete step history (see
  // PILE_HISTORY_FROM), not just the range this table is currently scoped
  // to — a pile's steps can span multiple days (e.g. CASING done yesterday,
  // BORING today), including days outside the picked range.
  const histTo = today()
  const prefetchIds = useMemo(() => rows.slice(0, PREFETCH_COUNT).map((row) => row.id), [rows])
  useQueries({
    queries: prefetchIds.map((pileId) => ({
      queryKey: siteDetailQueryKeys.pileStepsRange(pileId, PILE_HISTORY_FROM, histTo),
      queryFn: () => siteDetailService.getPileStepsForRange(pileId, PILE_HISTORY_FROM, histTo),
    })),
  })

  const selectedPile = rows.find((row) => row.id === selectedPileId) ?? null
  const editPile = rows.find((row) => row.id === editPileId) ?? null
  const selectedStepsQuery = usePileStepsForRange(selectedPileId ?? undefined, PILE_HISTORY_FROM, histTo, !!selectedPileId)
  const editStepsQuery = usePileStepsForRange(editPileId ?? undefined, PILE_HISTORY_FROM, histTo, !!editPileId)

  function invalidateThisPile(pileId: string) {
    queryClient.invalidateQueries({ queryKey: siteDetailQueryKeys.pileStepsRange(pileId, PILE_HISTORY_FROM, histTo) })
    queryClient.invalidateQueries({ queryKey: siteDetailQueryKeys.pileProgressRange(siteId, from, to) })
  }

  return (
    <Card>
      <CardHeader className="flex-row gap-4 space-y-0">
        {rows.length > 0 && (
          <div className="flex flex-1 items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <ButtonGroupInput
                value={search}
                onValueChange={setSearch}
                placeholder="Search pile..."
                className="w-64"
              />
            </div>

            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value ?? 'all')} items={statusFilterItems}>
              <SelectTrigger size="sm" className="w-36">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>

              <SelectContent>
                <SelectGroup>
                  {statusFilterItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <EmptyState
            icon={ListChecksIcon}
            title="No piles in this range"
            description="No checklist has been generated for this site within the selected dates."
          />
        ) : filteredRows.length === 0 ? (
          <EmptyState
            icon={ListChecksIcon}
            title="No matching piles"
            description="Try a different status filter or search term."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pile</TableHead>
                <TableHead>Area</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Rig/Crane</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.map((row) => (
                <TableRow key={row.id} className="cursor-pointer" onClick={() => setSelectedPileId(row.id)}>
                  <TableCell className="font-medium text-foreground">{row.pileIdCode}</TableCell>
                  <TableCell className="text-muted-foreground">{row.area ?? '—'}</TableCell>
                  <TableCell>
                    <StatusPill kind={toStepStatus(row.status)} />
                  </TableCell>
                  <TableCell>
                    {row.completedSteps} / {row.totalSteps}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.rig.machineNo} / {row.crane.machineNo}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`View ${row.pileIdCode}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedPileId(row.id)
                      }}
                    >
                      <EyeIcon className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Edit actual times for ${row.pileIdCode}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditPileId(row.id)
                      }}
                    >
                      <PencilIcon className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {selectedPile && (
        selectedStepsQuery.data ? (
          <PileDetailSheet
            rows={selectedStepsQuery.data}
            pileId={selectedPile.id}
            siteId={siteId}
            pileIdCode={selectedPile.pileIdCode}
            area={selectedPile.area}
            status={toStepStatus(selectedPile.status)}
            selectedDate={to}
            open={!!selectedPileId}
            onOpenChange={(open) => !open && setSelectedPileId(null)}
            onMeasurementsSaved={() => invalidateThisPile(selectedPile.id)}
          />
        ) : (
          <Drawer open={!!selectedPileId} onOpenChange={(open) => !open && setSelectedPileId(null)} showSwipeHandle swipeDirection="down">
            <DrawerContent className="flex max-h-[40vh] items-center justify-center">
              <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
            </DrawerContent>
          </Drawer>
        )
      )}

      {editPile && (
        editStepsQuery.data ? (
          <EditPileActualDrawer
            rows={editStepsQuery.data}
            pileIdCode={editPile.pileIdCode}
            open={!!editPileId}
            onOpenChange={(open) => !open && setEditPileId(null)}
            onSaved={() => invalidateThisPile(editPile.id)}
          />
        ) : (
          <Drawer open={!!editPileId} onOpenChange={(open) => !open && setEditPileId(null)} swipeDirection="right">
            <DrawerContent className="flex items-center justify-center">
              <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
            </DrawerContent>
          </Drawer>
        )
      )}
    </Card>
  )
}
