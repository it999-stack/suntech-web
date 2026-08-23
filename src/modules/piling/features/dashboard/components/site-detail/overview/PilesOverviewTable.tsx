import { useMemo, useState } from 'react'
import { useQueries, useQueryClient } from '@tanstack/react-query'
import { EyeIcon, ListChecksIcon, Loader2Icon, PencilIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ButtonGroupInput } from '@/components/ButtonGroupInput'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
import { Pagination } from '@/components/Pagination'
import { cn } from '@/lib/utils'
import { siteDetailService } from '../../../api/siteDetail.api'
import { siteDetailQueryKeys, usePileStepsForRange } from '../../../hooks/useSiteDetailQueries'
import type { PileOverviewRow, StepStatus } from '../../../types/dashboard.types'
import { EditPileActualDrawer } from '../EditPileActualDrawer'
import { PileDetailSheet } from '../PileDetailSheet'
import { StatusPill } from '../status/StatusPill'
import { formatSignedDuration } from './lib/format'

interface PilesOverviewTableProps {
  piles: PileOverviewRow[]
  siteId: string
  date: string
  focusPileId?: string | null
}

const statusFilterItems: { value: string; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'delayed', label: 'Delayed' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
]

const PAGE_SIZE = 5
const PREFETCH_COUNT = 10

export function PilesOverviewTable({ piles, siteId, date, focusPileId }: PilesOverviewTableProps) {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selectedPileId, setSelectedPileId] = useState<string | null>(focusPileId ?? null)
  const [editPileId, setEditPileId] = useState<string | null>(null)

  // focusPileId can change after mount (an Attention alert's "View" action
  // firing while the table's already on screen) — adjust state directly
  // during render (React's documented pattern for this) rather than via a
  // useEffect, which would cost an extra render pass for the same update.
  const [lastFocusPileId, setLastFocusPileId] = useState(focusPileId ?? null)
  if (focusPileId && focusPileId !== lastFocusPileId) {
    setLastFocusPileId(focusPileId)
    setSelectedPileId(focusPileId)
  }

  const filteredRows = useMemo(() => {
    return piles.filter((row) => {
      if (statusFilter !== 'all' && row.status !== (statusFilter as StepStatus)) return false
      if (search && !row.pileIdCode.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [piles, statusFilter, search])

  const totalPages = Math.max(Math.ceil(filteredRows.length / PAGE_SIZE), 1)
  const pageRows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Identity here is the physical pile id (row.pileId), not checklistPileId —
  // /piling/piles/{pile_id}/steps (and PileDetailSheet) key off the pile
  // itself, same as RangePileTable's existing pattern.
  const prefetchIds = useMemo(() => filteredRows.slice(0, PREFETCH_COUNT).map((row) => row.pileId), [filteredRows])
  useQueries({
    queries: prefetchIds.map((pileId) => ({
      queryKey: siteDetailQueryKeys.pileStepsRange(pileId, date, date),
      queryFn: () => siteDetailService.getPileStepsForRange(pileId, date, date),
    })),
  })

  const selectedPile = piles.find((row) => row.pileId === selectedPileId) ?? null
  const editPile = piles.find((row) => row.pileId === editPileId) ?? null
  const selectedStepsQuery = usePileStepsForRange(selectedPileId ?? undefined, date, date, !!selectedPileId)
  const editStepsQuery = usePileStepsForRange(editPileId ?? undefined, date, date, !!editPileId)

  function invalidateThisPile(pileId: string) {
    queryClient.invalidateQueries({ queryKey: siteDetailQueryKeys.pileStepsRange(pileId, date, date) })
    queryClient.invalidateQueries({ queryKey: siteDetailQueryKeys.dashboardOverview(siteId, date) })
  }

  return (
    <Card>
      <CardHeader className="flex-col items-start gap-3 space-y-0">
        <div>
          <CardTitle>Piles Overview</CardTitle>
          <CardDescription>{piles.length} piles today</CardDescription>
        </div>
        {piles.length > 0 && (
          <div className="flex w-full flex-wrap items-center justify-between gap-2">
            <ButtonGroupInput
              value={search}
              onValueChange={(v) => {
                setSearch(v)
                setPage(1)
              }}
              placeholder="Search pile..."
              className="w-56"
            />
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value ?? 'all')
                setPage(1)
              }}
              items={statusFilterItems}
            >
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
      <CardContent className="flex flex-col gap-3">
        {piles.length === 0 ? (
          <EmptyState icon={ListChecksIcon} title="No piles today" description="No checklist has been generated for this date." />
        ) : filteredRows.length === 0 ? (
          <EmptyState icon={ListChecksIcon} title="No matching piles" description="Try a different status filter or search term." />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pile ID</TableHead>
                  <TableHead>Area</TableHead>
                  <TableHead>Rig/Crane</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Delay</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((row) => (
                  <TableRow key={row.pileId} className="cursor-pointer" onClick={() => setSelectedPileId(row.pileId)}>
                    <TableCell className="font-medium text-foreground">{row.pileIdCode}</TableCell>
                    <TableCell className="text-muted-foreground">{row.area ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.rig.machineNo} / {row.crane?.machineNo ?? '—'}
                    </TableCell>
                    <TableCell>
                      {row.completedSteps} / {row.totalSteps}
                    </TableCell>
                    <TableCell>
                      <StatusPill kind={row.status} />
                    </TableCell>
                    <TableCell className={cn('tabular-nums', row.delayMin > 0 ? 'text-destructive' : row.delayMin < 0 ? 'text-success' : 'text-muted-foreground')}>
                      {row.delayMin === 0 ? '—' : formatSignedDuration(row.delayMin)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`View ${row.pileIdCode}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedPileId(row.pileId)
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
                          setEditPileId(row.pileId)
                        }}
                      >
                        <PencilIcon className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination
              page={page}
              totalPages={totalPages}
              totalItems={filteredRows.length}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          </>
        )}
      </CardContent>

      {selectedPile &&
        (selectedStepsQuery.data ? (
          <PileDetailSheet
            rows={selectedStepsQuery.data}
            pileId={selectedPile.pileId}
            siteId={siteId}
            pileIdCode={selectedPile.pileIdCode}
            area={selectedPile.area}
            status={selectedPile.status}
            selectedDate={date}
            open={!!selectedPileId}
            onOpenChange={(open) => !open && setSelectedPileId(null)}
            onMeasurementsSaved={() => invalidateThisPile(selectedPile.pileId)}
          />
        ) : (
          <Drawer open={!!selectedPileId} onOpenChange={(open) => !open && setSelectedPileId(null)} showSwipeHandle swipeDirection="down">
            <DrawerContent className="flex max-h-[40vh] items-center justify-center">
              <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
            </DrawerContent>
          </Drawer>
        ))}

      {editPile &&
        (editStepsQuery.data ? (
          <EditPileActualDrawer
            rows={editStepsQuery.data}
            pileIdCode={editPile.pileIdCode}
            open={!!editPileId}
            onOpenChange={(open) => !open && setEditPileId(null)}
            onSaved={() => invalidateThisPile(editPile.pileId)}
          />
        ) : (
          <Drawer open={!!editPileId} onOpenChange={(open) => !open && setEditPileId(null)} swipeDirection="right">
            <DrawerContent className="flex items-center justify-center">
              <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
            </DrawerContent>
          </Drawer>
        ))}
    </Card>
  )
}
