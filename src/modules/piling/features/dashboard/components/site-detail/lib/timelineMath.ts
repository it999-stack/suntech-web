import { differenceInMinutes } from 'date-fns'
import { addMinutesIso, toLocalIsoString } from '@/lib/date'
import { byNumber } from '@/lib/sort'
import { resolvePlannedEnd } from '../../../api/siteDetail.api'
import type { ChecklistStepRow, MachineDowntimeWindow, MachineSummary, NonWorkingWindow } from '../../../types/dashboard.types'
import type { TimelineNodeKind } from '../status/stepStatusVisuals'

// The buffer occupies the last `bufferMinutes` of a step's own planned
// window (plannedEnd = plannedStart + durationMinutes + bufferMinutes) — not
// a gap after it. This locates where work ends and buffer begins.
function addMinutes(iso: string, minutes: number): string {
  return toLocalIsoString(new Date(new Date(iso).getTime() + minutes * 60_000))
}

// When a step's actual work begins — plannedStart marks when its buffer
// period starts, not when work does (mirrors stepWorkStart() in the mobile
// app's utils/helpers.ts). plannedEnd is unaffected either way, since it's
// already stored as plannedStart + buffer + duration.
export function stepWorkStart(row: ChecklistStepRow): string | null {
  if (!row.plannedStart) return null
  return addMinutesIso(row.plannedStart, row.bufferMinutes ?? 0)
}

export interface TimelineNode {
  kind: TimelineNodeKind
  key: string
  label: string
  atIso: string | null
  contentRow: number // 0-based row index within the pile's content grid
}

export interface PileTimelineLayout {
  nodes: TimelineNode[]
  stepContentRow: number[] // 0-based content row per `rows` index — steps only, buffers excluded
  totalContentRows: number
}

// Interleaves a synthetic 'buffer' node after any step whose bufferMinutes is
// set, so the Timeline column can show idle gaps as their own node without
// StepStatus ever needing a 5th value.
export function buildTimelineLayout(rows: ChecklistStepRow[]): PileTimelineLayout {
  const nodes: TimelineNode[] = []
  const stepContentRow: number[] = []

  rows.forEach((row) => {
    stepContentRow.push(nodes.length)
    nodes.push({
      kind: row.status,
      key: row.stepId,
      label: row.stepName,
      atIso: row.plannedStart,
      contentRow: nodes.length,
    })
    if (row.bufferMinutes && row.bufferMinutes > 0) {
      const workEndIso =
        row.plannedStart && row.durationMinutes != null
          ? addMinutes(row.plannedStart, row.durationMinutes)
          : (row.plannedEnd ?? row.plannedStart)
      nodes.push({
        kind: 'buffer',
        key: `${row.stepId}-buffer`,
        label: 'Buffer',
        atIso: workEndIso,
        contentRow: nodes.length,
      })
    }
  })

  return { nodes, stepContentRow, totalContentRows: nodes.length }
}

// Index of the last node whose planned time has already passed `now` —
// nodes are chronological by construction, so this is the "current"
// position on the rail. Returns null once nothing has started yet.
export function findCurrentNodeIndex(nodes: TimelineNode[], now: Date): number | null {
  let currentIndex: number | null = null
  for (const node of nodes) {
    if (!node.atIso) continue
    if (new Date(node.atIso) <= now) {
      currentIndex = node.contentRow
    } else {
      break
    }
  }
  return currentIndex
}

export interface MachineGroup {
  machine: MachineSummary
  startContentRow: number
  endContentRow: number
}

// Groups contiguous rows sharing the same machine so a rail can draw one
// spanning line + one label per run instead of repeating it per row.
export function groupConsecutiveMachines(
  rows: ChecklistStepRow[],
  stepContentRow: number[],
  pick: (row: ChecklistStepRow) => MachineSummary | null
): MachineGroup[] {
  const groups: MachineGroup[] = []
  let current: { machine: MachineSummary; startIdx: number } | null = null

  rows.forEach((row, index) => {
    const machine = pick(row)
    if (!machine || (current && current.machine.id !== machine.id)) {
      if (current) {
        groups.push({
          machine: current.machine,
          startContentRow: stepContentRow[current.startIdx],
          endContentRow: stepContentRow[index - 1],
        })
      }
      current = machine ? { machine, startIdx: index } : null
    } else if (!current && machine) {
      current = { machine, startIdx: index }
    }
  })

  if (current) {
    const finished: { machine: MachineSummary; startIdx: number } = current
    groups.push({
      machine: finished.machine,
      startContentRow: stepContentRow[finished.startIdx],
      endContentRow: stepContentRow[rows.length - 1],
    })
  }

  return groups
}

// --- Plan vs actual delay ---------------------------------------------

// When this step could realistically have started: the previous step's
// actual end (or, if that hasn't been recorded yet, its resolved planned
// end), plus this step's own leading buffer (setup/travel time — see
// stepWorkStart() in the mobile app: plannedStart marks when the buffer
// starts, not when work does). A machine's first step of the day has no
// previous step to chain off, so its own plannedStart is the anchor instead
// — it already reflects any non-working-window skip (e.g. a shift-change
// break) the scheduler applied when laying out the plan, which the
// checklist's raw planStartTime does not. planStartTime is only a
// defensive fallback for the (practically impossible) case plannedStart
// itself is missing.
function expectedStepStart(row: ChecklistStepRow, previousRow: ChecklistStepRow | null, planStartTime: string | null): string | null {
  const anchor = previousRow ? (previousRow.actualEnd ?? resolvePlannedEnd(previousRow)) : (row.plannedStart ?? planStartTime)
  if (!anchor) return null
  return addMinutesIso(anchor, row.bufferMinutes ?? 0)
}

/**
 * Positive = started later than realistically expected. Negative = started
 * early. Null = no actual start recorded yet, or no anchor to compare
 * against.
 */
export function computeStartDelay(
  row: ChecklistStepRow,
  previousRow: ChecklistStepRow | null,
  planStartTime: string | null
): number | null {
  if (!row.actualStart) return null
  const expectedStart = expectedStepStart(row, previousRow, planStartTime)
  if (!expectedStart) return null
  return differenceInMinutes(new Date(row.actualStart), new Date(expectedStart))
}

// Sum of every window's overlap with [rangeStart, rangeEnd] — a window still
// open (`end: null`) is treated as ongoing through rangeEnd (i.e. still down
// "now" when rangeEnd is now). Structurally typed so it accepts both
// MachineDowntimeWindow (end may be null, still open) and NonWorkingWindow
// (end always resolved) without needing a union import.
function sumOverlapMinutes(windows: { start: string; end: string | null }[], rangeStart: Date, rangeEnd: Date): number {
  return windows.reduce((sum, w) => {
    const windowStart = new Date(w.start)
    const windowEnd = w.end ? new Date(w.end) : rangeEnd
    const overlapStart = windowStart > rangeStart ? windowStart : rangeStart
    const overlapEnd = windowEnd < rangeEnd ? windowEnd : rangeEnd
    return sum + Math.max(0, differenceInMinutes(overlapEnd, overlapStart))
  }, 0)
}

/**
 * Positive = net working time (actual span minus any downtime on this step's
 * track, and minus any non-working/shift-change window the span crossed)
 * ran longer than planned. Negative = finished faster. Null = no actual
 * start yet, or the step has no planned duration to compare against. No
 * actual end yet -> live estimate using `now` in its place.
 *
 * Non-working windows (e.g. a fixed lunch/shift-change break) aren't
 * track-scoped the way machine downtime is — a scheduled break stops
 * everyone, not just one machine — so they're netted out unconditionally,
 * with no `row.track` filter.
 */
export function computeActivityDelay(
  row: ChecklistStepRow,
  downtimeWindows: MachineDowntimeWindow[],
  nonWorkingWindows: NonWorkingWindow[],
  now: Date
): number | null {
  if (!row.actualStart || row.durationMinutes == null) return null
  const start = new Date(row.actualStart)
  const end = row.actualEnd ? new Date(row.actualEnd) : now
  const grossMinutes = differenceInMinutes(end, start)
  const nettedMinutes =
    sumOverlapMinutes(downtimeWindows.filter((w) => w.track === row.track), start, end) +
    sumOverlapMinutes(nonWorkingWindows, start, end)
  const netMinutes = Math.max(0, grossMinutes - nettedMinutes)
  return netMinutes - row.durationMinutes
}

export function formatDelta(minutes: number | null): string | null {
  if (minutes === null || minutes === 0) return null
  const sign = minutes > 0 ? '+' : '−'
  return `${sign}${Math.abs(minutes)} min`
}

export interface DelayTotals {
  totalStartDelayMinutes: number | null
  totalActivityDelayMinutes: number | null
}

// Which machine a row's step actually ran on: its own assigned machine, or
// (for the rare unassigned case) the pile's rig/crane by track — mirrors the
// fallback report_service.py uses when building delay-report rows.
export function rowMachineId(row: ChecklistStepRow): string | null {
  if (row.plannedMachine) return row.plannedMachine.id
  if (row.track === 'RIG') return row.pileRig.id
  if (row.track === 'CRANE') return row.pileCrane?.id ?? null
  return null
}

// Row identity within one day's checklist. `stepId` alone is NOT unique
// there — it's a catalog/template step id shared across every pile that
// includes it (see the dedupeByStepId comment in siteDetail.api.ts), so it
// must be paired with checklistPileId to identify one specific row.
export function rowChainKey(row: ChecklistStepRow): string {
  return `${row.checklistPileId}::${row.stepId}`
}

/**
 * Maps every row (by rowChainKey) to the row immediately before it in its
 * own machine's real chronological chain that day — the same per-machine,
 * cross-pile grouping computeDelayTotals() uses (see "Chain scope: per
 * machine, not per pile" in DELAY_CALCULATIONS.md) — or `null` if it's that
 * machine's first step of the day.
 *
 * `rows` must be every pile's rows for one site+date (e.g.
 * ChecklistDetail.rows from getChecklistDetail) — a single pile's own rows
 * aren't enough, since a pile's first step can chain off a different pile's
 * last step on the same machine. Unlike computeDelayTotals()'s totals,
 * every row is included here (not just completed ones) — a not-yet-finished
 * previous step is still a valid anchor via resolvePlannedEnd() inside
 * expectedStepStart().
 */
export function buildMachineChainPreviousRowMap(rows: ChecklistStepRow[]): Map<string, ChecklistStepRow | null> {
  const byMachine = new Map<string, ChecklistStepRow[]>()
  for (const row of rows) {
    const machineId = rowMachineId(row)
    if (machineId === null) continue
    const list = byMachine.get(machineId)
    if (list) list.push(row)
    else byMachine.set(machineId, [row])
  }

  const map = new Map<string, ChecklistStepRow | null>()
  for (const machineRows of byMachine.values()) {
    const sorted = [...machineRows].sort(
      byNumber((row) => (row.plannedStart ? new Date(row.plannedStart).getTime() : 0), (row) => row.sequenceOrder)
    )
    sorted.forEach((row, index) => {
      map.set(rowChainKey(row), index > 0 ? sorted[index - 1] : null)
    })
  }
  return map
}

export function computeDelayTotals(
  rows: ChecklistStepRow[],
  downtimeWindows: MachineDowntimeWindow[],
  nonWorkingWindows: NonWorkingWindow[],
  planStartTime: string | null,
  now: Date
): DelayTotals {
  const completedRows = rows.filter((row) => row.actualStart && row.actualEnd)

  const byMachine = new Map<string, ChecklistStepRow[]>()
  for (const row of completedRows) {
    const machineId = rowMachineId(row)
    if (machineId === null) continue
    const list = byMachine.get(machineId)
    if (list) list.push(row)
    else byMachine.set(machineId, [row])
  }

  let totalStart = 0
  let startCount = 0
  let totalActivity = 0
  let activityCount = 0

  for (const machineRows of byMachine.values()) {
    const sorted = [...machineRows].sort(
      byNumber((row) => (row.plannedStart ? new Date(row.plannedStart).getTime() : 0), (row) => row.sequenceOrder)
    )
    sorted.forEach((row, index) => {
      const previousRow = index > 0 ? sorted[index - 1] : null
      const startDelta = computeStartDelay(row, previousRow, planStartTime)
      if (startDelta !== null) {
        totalStart += startDelta
        startCount++
      }
    })
  }

  for (const row of completedRows) {
    const activityDelta = computeActivityDelay(row, downtimeWindows, nonWorkingWindows, now)
    if (activityDelta !== null) {
      totalActivity += activityDelta
      activityCount++
    }
  }

  return {
    totalStartDelayMinutes: startCount > 0 ? totalStart : null,
    totalActivityDelayMinutes: activityCount > 0 ? totalActivity : null,
  }
}