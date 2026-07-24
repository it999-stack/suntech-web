import { useMemo, useState } from 'react'
import { AlertTriangleIcon, Columns3Icon, EyeIcon, ListChecksIcon, PencilIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ButtonGroupInput } from '@/components/ButtonGroupInput'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
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
import { EmptyState } from '@/components/EmptyState'
import { formatTime } from '@/lib/date'
import { groupBy } from '@/lib/collections'
import { byNumber } from '@/lib/sort'
import type { ChecklistStepRow, StepStatus } from '../../types/dashboard.types'
import { EditPileActualDrawer } from './EditPileActualDrawer'
import { PileDetailSheet } from './PileDetailSheet'
import { StatusPill } from './status/StatusPill'

interface StepStatusTableProps {
  rows: ChecklistStepRow[]
  selectedDate: string
  checklistId: string
}

const statusFilterItems = [
  { value: 'all', label: 'All statuses' },
  { value: 'delayed', label: 'Delayed' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
]

interface PileGroup {
  checklistPileId: string
  pileSeqNo: number
  pileIdCode: string
  areaLocation: string | null
  rig: string
  crane: string
  status: StepStatus
  completedCount: number
  updatedAt: string | null
  plannedStart: string | null
  plannedEnd: string | null
  actualStart: string | null
  actualEnd: string | null
  totalApplicableSteps: number | null
  isPlanComplete: boolean | null
  rows: ChecklistStepRow[]
}

// A pile is "delayed" if any of its steps is delayed, "completed" once every
// step is, "in progress" once any step has started — otherwise it's pending.
function derivePileStatus(rows: ChecklistStepRow[]): StepStatus {
  if (rows.some((r) => r.status === 'delayed')) return 'delayed'
  if (rows.every((r) => r.status === 'completed')) return 'completed'
  if (rows.some((r) => r.status === 'in_progress')) return 'in_progress'
  return 'pending'
}

function latestActivity(rows: ChecklistStepRow[]): string | null {
  const timestamps = rows.flatMap((r) => [r.actualStart, r.actualEnd]).filter((t): t is string => !!t)
  return timestamps.length ? timestamps.reduce((a, b) => (a > b ? a : b)) : null
}

function earliest(timestamps: (string | null)[]): string | null {
  const values = timestamps.filter((t): t is string => !!t)
  return values.length ? values.reduce((a, b) => (a < b ? a : b)) : null
}

function latest(timestamps: (string | null)[]): string | null {
  const values = timestamps.filter((t): t is string => !!t)
  return values.length ? values.reduce((a, b) => (a > b ? a : b)) : null
}

function groupByPile(rows: ChecklistStepRow[]): PileGroup[] {
  return Array.from(groupBy(rows, (row) => row.checklistPileId).values())
    .map((pileRows) => {
      const first = pileRows[0]
      return {
        checklistPileId: first.checklistPileId,
        pileSeqNo: first.pileSeqNo,
        pileIdCode: first.pileIdCode,
        areaLocation: first.areaLocation,
        rig: first.pileRig.machineNo,
        crane: first.pileCrane.machineNo,
        status: derivePileStatus(pileRows),
        completedCount: pileRows.filter((r) => r.status === 'completed').length,
        updatedAt: latestActivity(pileRows),
        plannedStart: earliest(pileRows.map((r) => r.plannedStart)),
        // Null if any step is still "continuing" (its own plannedEnd is
        // null) — the pile's true planned end isn't known yet in that case.
        plannedEnd: pileRows.every((r) => r.plannedEnd) ? latest(pileRows.map((r) => r.plannedEnd)) : null,
        actualStart: earliest(pileRows.map((r) => r.actualStart)),
        // Only meaningful once every step has an actualEnd — otherwise the
        // pile is still in progress.
        actualEnd: pileRows.every((r) => r.actualEnd) ? latest(pileRows.map((r) => r.actualEnd)) : null,
        totalApplicableSteps: first.totalApplicableSteps,
        isPlanComplete: first.isPlanComplete,
        rows: pileRows,
      }
    })
    .sort(byNumber((group) => group.pileSeqNo))
}

function formatPlannedRange(plannedStart: string | null, plannedEnd: string | null): string {
  return `${formatTime(plannedStart)} – ${plannedEnd ? formatTime(plannedEnd) : 'Continuing…'}`
}

function formatActualRange(actualStart: string | null, actualEnd: string | null): string {
  if (!actualStart) return 'Not started'
  return `${formatTime(actualStart)} – ${actualEnd ? formatTime(actualEnd) : 'In progress'}`
}

export function StepStatusTable({ rows, selectedDate, checklistId }: StepStatusTableProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [selectedPileId, setSelectedPileId] = useState<string | null>(null)
  const [editPileId, setEditPileId] = useState<string | null>(null)
  const [showUpdated, setShowUpdated] = useState(false)

  const allGroups = useMemo(() => groupByPile(rows), [rows])

  const groups = useMemo(() => {
    return allGroups.filter((group) => {
      if (statusFilter !== 'all' && group.status !== statusFilter) return false
      if (search && !group.pileIdCode.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [allGroups, statusFilter, search])

  const selectedPile = allGroups.find((group) => group.checklistPileId === selectedPileId) ?? null
  const editPile = allGroups.find((group) => group.checklistPileId === editPileId) ?? null

  function openPile(pileId: string) {
    setSelectedPileId(pileId)
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

            <div className="flex items-center gap-2">
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value ?? 'all')}
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

              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="gap-1.5" />}>
                  <Columns3Icon className="size-3.5" />
                  Columns
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuCheckboxItem checked={showUpdated} onCheckedChange={setShowUpdated}>
                    Updated
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <EmptyState
            icon={ListChecksIcon}
            title="No plan for this date"
            description="No checklist has been generated for this site on the selected date."
          />
        ) : groups.length === 0 ? (
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
                {showUpdated && <TableHead>Updated</TableHead>}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map((group) => (
                <TableRow
                  key={group.checklistPileId}
                  className="cursor-pointer"
                  onClick={() => openPile(group.checklistPileId)}
                >
                  <TableCell className="font-medium text-foreground">
                    <HoverCard>
                      <HoverCardTrigger render={<span className="cursor-default" />}>
                        {group.pileIdCode}
                      </HoverCardTrigger>
                      <HoverCardContent>
                        <div className="flex flex-col gap-1.5 text-xs">
                          <div>
                            <span className="font-medium text-muted-foreground">Planned: </span>
                            {formatPlannedRange(group.plannedStart, group.plannedEnd)}
                          </div>
                          <div>
                            <span className="font-medium text-muted-foreground">Actual: </span>
                            {formatActualRange(group.actualStart, group.actualEnd)}
                          </div>
                          {group.isPlanComplete === false && (
                            <div className="flex items-center gap-1 text-warning">
                              <AlertTriangleIcon className="size-3.5 shrink-0" />
                              Planned through step {group.rows.length} of {group.totalApplicableSteps}
                            </div>
                          )}
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{group.areaLocation ?? '—'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <StatusPill kind={group.status} />
                      {group.isPlanComplete === false && (
                        <AlertTriangleIcon
                          className="size-3.5 shrink-0 text-warning"
                          aria-label="Plan incomplete"
                        >
                          <title>{`Planned through step ${group.rows.length} of ${group.totalApplicableSteps}`}</title>
                        </AlertTriangleIcon>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {group.completedCount} / {group.rows.length}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {group.rig} / {group.crane}
                  </TableCell>
                  {showUpdated && (
                    <TableCell className="text-muted-foreground">{formatTime(group.updatedAt)}</TableCell>
                  )}
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`View ${group.pileIdCode}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        openPile(group.checklistPileId)
                      }}
                    >
                      <EyeIcon className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Edit actual times for ${group.pileIdCode}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditPileId(group.checklistPileId)
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
        <PileDetailSheet
          rows={selectedPile.rows}
          pileIdCode={selectedPile.pileIdCode}
          areaLocation={selectedPile.areaLocation}
          status={selectedPile.status}
          selectedDate={selectedDate}
          open={!!selectedPileId}
          onOpenChange={(open) => !open && setSelectedPileId(null)}
        />
      )}

      {editPile && (
        <EditPileActualDrawer
          rows={editPile.rows}
          pileIdCode={editPile.pileIdCode}
          checklistId={checklistId}
          open={!!editPileId}
          onOpenChange={(open) => !open && setEditPileId(null)}
        />
      )}
    </Card>
  )
}
