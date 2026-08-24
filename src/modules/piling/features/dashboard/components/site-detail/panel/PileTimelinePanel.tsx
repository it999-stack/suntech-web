import { useMemo } from 'react'
import { CalendarClockIcon, ClipboardCheckIcon } from 'lucide-react'
import { dateOnly, formatTime } from '@/lib/date'
import { byNumber } from '@/lib/sort'
import type { ChecklistStepRow, MachineDowntimeWindow, NonWorkingWindow } from '../../../types/dashboard.types'
import { MachineRail } from './MachineRail'
import { PileTimelineFooterStats } from './PileTimelineFooterStats'
import { PlanActualStepColumn } from './PlanActualStepColumn'
import { StepTimelineRail } from './StepTimelineRail'
import { buildTimelineLayout, findCurrentNodeIndex, groupConsecutiveMachines } from '../lib/timelineMath'

interface PileTimelinePanelProps {
  rows: ChecklistStepRow[]
  selectedDate: string // 'YYYY-MM-DD'
  downtimeWindows?: MachineDowntimeWindow[]
  nonWorkingWindows?: NonWorkingWindow[]
  planStartTime?: string | null
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

// Column identity, not step status — Planned is always blue, Actual is
// always emerald, regardless of any individual step's own status (a step's
// real status still shows via its own pill/circle color on the Actual side;
// see PlanActualStepColumn).
const PLANNED_THEME = {
  text: 'text-blue-700',
  iconBg: 'bg-blue-100 text-blue-600',
  panel: 'bg-blue-50/60 ring-1 ring-blue-100',
}
const ACTUAL_THEME = {
  text: 'text-emerald-700',
  iconBg: 'bg-emerald-100 text-emerald-600',
  panel: 'bg-emerald-50/60 ring-1 ring-emerald-100',
}

// Tinted backdrop spanning the full height of one steps column (behind its
// header + every card in it) — rendered before everything else so later
// siblings (dividers, header, cards) naturally paint on top. Wider than the
// column itself (negative margin) so the cards inside read as inset within a
// frame, and so it reaches all the way to the adjacent divider — the timeline
// rail's horizontal dashed connectors travel through that gap, and without
// full coverage they'd cross a strip of plain (white) background instead of
// this panel's tint. 33px = columnGap(16) + divider(1) + columnGap(16), the
// fixed distance from this column's edge to the neighboring divider.
function SectionPanel({ gridColumn, className }: { gridColumn: string; className: string }) {
  return (
    <div
      style={{ gridColumn, gridRow: '1 / -1', margin: '0 -33px 12px' }}
      className={`rounded-xl ${className}`}
    />
  )
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  gridColumn,
  theme,
}: {
  icon: typeof CalendarClockIcon
  title: string
  subtitle: string
  gridColumn: string
  theme: typeof PLANNED_THEME
}) {
  return (
    <div style={{ gridColumn, gridRow: 1 }} className="flex items-center gap-2 px-2 pt-3 pb-2">
      <span className={`flex size-7 shrink-0 items-center justify-center rounded-md ${theme.iconBg}`}>
        <Icon className="size-4" />
      </span>
      <div className="flex flex-col leading-tight">
        <span className={`text-sm font-bold tracking-wide ${theme.text}`}>{title}</span>
        <span className="text-xs text-muted-foreground">{subtitle}</span>
      </div>
    </div>
  )
}

export function PileTimelinePanel({
  rows,
  selectedDate,
  downtimeWindows = [],
  nonWorkingWindows = [],
  planStartTime = null,
}: PileTimelinePanelProps) {
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
          <SectionPanel gridColumn={String(COLUMNS.plannedSteps)} className={PLANNED_THEME.panel} />
          <SectionPanel gridColumn={String(COLUMNS.actualSteps)} className={ACTUAL_THEME.panel} />

          <ColumnDivider column={4} />
          <ColumnDivider column={6} />
          <ColumnDivider column={8} />

          <SectionHeader
            icon={CalendarClockIcon}
            title="PLANNED SCHEDULE"
            subtitle="Expected plan"
            gridColumn={String(COLUMNS.plannedSteps)}
            theme={PLANNED_THEME}
          />
          <SectionHeader
            icon={ClipboardCheckIcon}
            title="ACTUAL EXECUTION"
            subtitle="Recorded on site"
            gridColumn={String(COLUMNS.actualSteps)}
            theme={ACTUAL_THEME}
          />

          <MachineRail cells={plannedMachineCells} column={COLUMNS.plannedMachines} side="right" />
          <PlanActualStepColumn cells={stepCells} mode="planned" column={COLUMNS.plannedSteps} />
          <StepTimelineRail
            cells={timelineCells}
            currentContentRow={currentContentRow}
            nowLabel={nowLabel}
            column={COLUMNS.timeline}
          />
          <PlanActualStepColumn
            cells={stepCells}
            mode="actual"
            column={COLUMNS.actualSteps}
            downtimeWindows={downtimeWindows}
            nonWorkingWindows={nonWorkingWindows}
            planStartTime={planStartTime}
          />
          <MachineRail cells={actualMachineCells} column={COLUMNS.actualMachines} side="left" />
        </div>
      </div>
      <PileTimelineFooterStats
        rows={rows}
        diameterMm={rows[0]?.dimensionDiaMm ?? undefined}
        totalDepthM={rows[0]?.dimensionDepthM ?? undefined}
      />
    </div>
  )
}