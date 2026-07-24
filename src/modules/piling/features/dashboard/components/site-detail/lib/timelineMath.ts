import { differenceInMinutes } from 'date-fns'
import { toLocalIsoString } from '@/lib/date'
import type { ChecklistStepRow, MachineSummary } from '../../types/dashboard.types'
import type { TimelineNodeKind } from '../status/stepStatusVisuals'

// The buffer occupies the last `bufferMinutes` of a step's own planned
// window (plannedEnd = plannedStart + durationMinutes + bufferMinutes) — not
// a gap after it. This locates where work ends and buffer begins.
function addMinutes(iso: string, minutes: number): string {
  return toLocalIsoString(new Date(new Date(iso).getTime() + minutes * 60_000))
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

export interface StepDelay {
  startDeltaMinutes: number | null
  endDeltaMinutes: number | null
}

/**
 * Positive = ran late vs plan. Negative = ran early. Null = no actual yet
 * (or, for endDeltaMinutes, the step hasn't finished).
 */
export function computeStepDelay(row: ChecklistStepRow): StepDelay {
  if (!row.actualStart || !row.plannedStart) {
    return { startDeltaMinutes: null, endDeltaMinutes: null }
  }
  return {
    startDeltaMinutes: differenceInMinutes(new Date(row.actualStart), new Date(row.plannedStart)),
    endDeltaMinutes:
      row.actualEnd && row.plannedEnd
        ? differenceInMinutes(new Date(row.actualEnd), new Date(row.plannedEnd))
        : null,
  }
}

export function formatDelta(minutes: number | null): string | null {
  if (minutes === null || minutes === 0) return null
  const sign = minutes > 0 ? '+' : '−'
  return `${sign}${Math.abs(minutes)} min`
}