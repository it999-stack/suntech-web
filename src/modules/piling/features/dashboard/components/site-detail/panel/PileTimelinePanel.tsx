import { useMemo } from 'react'
import { CalendarClockIcon, ClipboardCheckIcon } from 'lucide-react'
import { dateOnly, formatTime } from '@/lib/date'
import { byNumber } from '@/lib/sort'
import type { ChecklistStepRow } from '../../../types/dashboard.types'
import { MachineRail } from './MachineRail'
import { PileTimelineFooterStats } from './PileTimelineFooterStats'
import { PlanActualStepColumn } from './PlanActualStepColumn'
import { StepTimelineRail } from './StepTimelineRail'
import { buildTimelineLayout, findCurrentNodeIndex, groupConsecutiveMachines } from '../lib/timelineMath'

interface PileTimelinePanelProps {
  rows: ChecklistStepRow[]
  selectedDate: string // 'YYYY-MM-DD'
}

function isToday(dateStr: string): boolean {
  return dateStr === dateOnly(new Date())
}

// 9-track grid: the 5 real columns sit on odd tracks (1,3,5,7,9) and even
// tracks (2,4,6,8) hold 1px full-height dividers — gives a continuous
// vertical rule between columns instead of relying on the row gap.
function ColumnDivider({ column }: { column: number }) {
  return <div style={{ gridColumn: column, gridRow: '1 / -1' }} className="w-px justify-self-center bg-border" />
}

// Merged section header spanning a machine column + its adjacent steps
// column (and the divider between them) — rendered after the ColumnDivider
// elements so its opaque background paints over that divider for row 1 only;
// the divider still shows normally starting from row 2 down.
function SectionHeader({
  icon: Icon,
  label,
  gridColumn,
}: {
  icon: typeof CalendarClockIcon
  label: string
  gridColumn: string
}) {
  return (
    <div
      style={{ gridColumn, gridRow: 1 }}
      className="flex items-center justify-center gap-1.5 rounded-lg bg-card py-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase ring-1 ring-foreground/10"
    >
      <Icon className="size-3.5" />
      {label}
    </div>
  )
}

export function PileTimelinePanel({ rows, selectedDate }: PileTimelinePanelProps) {
  const sortedRows = useMemo(() => [...rows].sort(byNumber((row) => row.sequenceOrder)), [rows])

  const { nodes, stepContentRow, totalContentRows } = useMemo(() => buildTimelineLayout(sortedRows), [sortedRows])

  const currentContentRow = useMemo(() => {
    if (!isToday(selectedDate)) return null
    return findCurrentNodeIndex(nodes, new Date())
  }, [nodes, selectedDate])

  const nowLabel = currentContentRow !== null ? `Now ${formatTime(new Date().toISOString())}` : null

  const plannedGroups = useMemo(
    () => groupConsecutiveMachines(sortedRows, stepContentRow, (row) => row.plannedMachine),
    [sortedRows, stepContentRow]
  )
  const actualGroups = useMemo(
    () => groupConsecutiveMachines(sortedRows, stepContentRow, (row) => row.actualMachine),
    [sortedRows, stepContentRow]
  )

  const headerOffset = 1
  const stepCells = sortedRows.map((row, index) => ({ gridRow: stepContentRow[index] + 1 + headerOffset, row }))
  const timelineCells = nodes.map((node) => ({ gridRow: node.contentRow + 1 + headerOffset, node }))
  const plannedMachineCells = plannedGroups.map((group) => ({
    gridRowStart: group.startContentRow + 1 + headerOffset,
    gridRowEnd: group.endContentRow + 1 + headerOffset,
    machine: group.machine,
  }))
  const actualMachineCells = actualGroups.map((group) => ({
    gridRowStart: group.startContentRow + 1 + headerOffset,
    gridRowEnd: group.endContentRow + 1 + headerOffset,
    machine: group.machine,
  }))

  // real columns: 1 planned machines · 3 planned steps · 5 timeline · 7 actual steps · 9 actual machines
  // divider columns: 2 · 4 · 6 · 8
  const COLUMNS = {
    plannedMachines: 1,
    plannedSteps: 3,
    timeline: 5,
    actualSteps: 7,
    actualMachines: 9,
  }

  return (
    <div className="flex flex-col gap-4 px-4">
      {/* No overflow-x-auto here on purpose: any non-`visible` overflow value on
          this wrapper would make it a scroll container, which becomes the
          reference frame `position: sticky` measures against in MachineRail —
          for both axes, not just the one being scrolled. Since this div has no
          height constraint, that frame would never actually move, so sticky
          would silently never engage. Horizontal scrolling for this wide grid
          is instead handled by the sheet's single overflow-auto body, so
          sticky keeps resolving against the ancestor that's really scrolling. */}
      <div className="rounded-lg">
        <div
          className="grid w-full min-w-[980px] gap-y-1 px-3"
          style={{
            gridTemplateColumns:
              'minmax(120px, auto) 1px minmax(210px, 1fr) 1px 96px 1px minmax(210px, 1fr) 1px minmax(120px, auto)',
            gridTemplateRows: `auto repeat(${totalContentRows}, auto)`,
            columnGap: '1rem',
          }}
        >
          <ColumnDivider column={4} />
          <ColumnDivider column={6} />
          <ColumnDivider column={8} />

          <SectionHeader icon={CalendarClockIcon} label="Planned" gridColumn="1 / 4" />
          <SectionHeader icon={ClipboardCheckIcon} label="Actual" gridColumn="7 / 10" />

          <MachineRail cells={plannedMachineCells} column={COLUMNS.plannedMachines} side="right" />
          <PlanActualStepColumn cells={stepCells} mode="planned" column={COLUMNS.plannedSteps} />
          <StepTimelineRail
            cells={timelineCells}
            currentContentRow={currentContentRow}
            nowLabel={nowLabel}
            column={COLUMNS.timeline}
          />
          <PlanActualStepColumn cells={stepCells} mode="actual" column={COLUMNS.actualSteps} />
          <MachineRail cells={actualMachineCells} column={COLUMNS.actualMachines} side="left" />
        </div>
      </div>
      <PileTimelineFooterStats rows={sortedRows} />
    </div>
  )
}