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
import { today } from '@/lib/date'
import { cn } from '@/lib/utils'
import { siteDetailService } from '../../../api/siteDetail.api'
import { PILE_HISTORY_FROM, siteDetailQueryKeys, usePileStepsForRange } from '../../../hooks/useSiteDetailQueries'
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

const PAGE_SIZE = 15
const PREFETCH_COUNT = 15

export function PilesOverviewTable({ piles, siteId, date, focusPileId }: PilesOverviewTableProps) {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selectedPileId, setSelectedPileId] = useState<string | null>(focusPileId ?? null)
  const [editPileId, setEditPileId] = useState<string | null>(null)

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

  // The drawer always shows a pile's complete step history (see
  // PILE_HISTORY_FROM), not just this page's single selected date — a pile's
  // steps can span multiple days (e.g. CASING done yesterday, BORING today).
  const histTo = today()
  const prefetchIds = useMemo(() => filteredRows.slice(0, PREFETCH_COUNT).map((row) => row.pileId), [filteredRows])
  useQueries({
    queries: prefetchIds.map((pileId) => ({
      queryKey: siteDetailQueryKeys.pileStepsRange(pileId, PILE_HISTORY_FROM, histTo),
      queryFn: () => siteDetailService.getPileStepsForRange(pileId, PILE_HISTORY_FROM, histTo),
    })),
  })

  const selectedPile = piles.find((row) => row.pileId === selectedPileId) ?? null
  const editPile = piles.find((row) => row.pileId === editPileId) ?? null
  const selectedStepsQuery = usePileStepsForRange(selectedPileId ?? undefined, PILE_HISTORY_FROM, histTo, !!selectedPileId)
  const editStepsQuery = usePileStepsForRange(editPileId ?? undefined, PILE_HISTORY_FROM, histTo, !!editPileId)

  function invalidateThisPile(pileId: string) {
    queryClient.invalidateQueries({ queryKey: siteDetailQueryKeys.pileStepsRange(pileId, PILE_HISTORY_FROM, histTo) })
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
                  <TableHead className="sticky left-0 z-10 border-r border-border/60 bg-card">Pile ID</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Rig/Crane</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start Delay</TableHead>
                  <TableHead>Activity Delay</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((row) => (
                  <TableRow key={row.pileId} className="cursor-pointer" onClick={() => setSelectedPileId(row.pileId)}>
                    <TableCell className="sticky left-0 z-10 border-r border-border/60 bg-card font-medium text-foreground">
                      {row.pileIdCode}
                    </TableCell>
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
                    <TableCell
                      className={cn(
                        'tabular-nums',
                        row.startDelayMin > 0
                          ? 'text-destructive'
                          : row.startDelayMin < 0
                            ? 'text-success'
                            : 'text-muted-foreground'
                      )}
                    >
                      {row.startDelayMin === 0 ? '—' : formatSignedDuration(row.startDelayMin)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        'tabular-nums',
                        row.activityDelayMin > 0
                          ? 'text-destructive'
                          : row.activityDelayMin < 0
                            ? 'text-success'
                            : 'text-muted-foreground'
                      )}
                    >
                      {row.activityDelayMin === 0 ? '—' : formatSignedDuration(row.activityDelayMin)}
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
