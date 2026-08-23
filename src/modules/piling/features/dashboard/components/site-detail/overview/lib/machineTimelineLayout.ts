import { hourCeil, hourFloor } from '@/lib/date'
import type { MachineTimeline } from '../../../../types/dashboard.types'

export interface TimelineSegment {
  key: string
  label: string
  pileIdCode: string | null
  startIso: string
  endIso: string
  leftPct: number
  widthPct: number
  isIdle: boolean
  isOngoing: boolean
  // Planned (avg/target) and actual duration for a real step segment, in
  // minutes — null on Idle segments, and actualDurationMin is also null for
  // a step that hasn't started yet (no actualStart recorded).
  plannedDurationMin: number | null
  actualDurationMin: number | null
}

export interface MachineTimelineRow {
  machine: MachineTimeline['machine']
  // "Actual" track: Idle gaps interleaved with real segments positioned by
  // actual timing — a step with no actualStart yet contributes nothing here
  // (the whole span it would have occupied just reads as Idle).
  segments: TimelineSegment[]
  // "Planned (avg.)" track: one dashed segment per plan step, positioned by
  // its own planned_start/planned_end, regardless of whether it's started.
  plannedSegments: TimelineSegment[]
  // When this machine's most recent actual step ended — null if it hasn't
  // done anything yet today. Drives the machine column's "Last: HH:MM" line
  // for a machine that isn't currently working.
  lastActivityIso: string | null
}

export interface TimelineAxis {
  start: Date
  end: Date
}

// A Gantt spanning more than this many hours stops being readable (hour
// ticks start overlapping) — caps the open (ongoing/idle-trailing) end so a
// step left dangling for days (actual_start set, no actual_end recorded)
// can't blow the axis out. `referenceNow` is the caller's notion of "now"
// for this view — the real clock when viewing today, or the end of the
// selected day otherwise (see SiteDetailPage), so a past date's axis isn't
// dragged all the way to the real current moment either.
const MAX_AXIS_HOURS = 30

// The visible time window: starts at the checklist's own plan_start_time
// (e.g. 8 AM) when known, so time before any machine's first step still
// renders as Idle instead of being clipped off; falls back to the earliest
// block's own start/end (actual if recorded, else planned) when no checklist
// plan_start_time is available. Floored/ceiled to the hour. `referenceNow` is
// folded into the end so a still-open block's open end renders correctly
// instead of clipping at the last known timestamp.
export function computeTimelineAxis(
  timelines: MachineTimeline[],
  referenceNow: Date,
  planStartTime: string | null
): TimelineAxis {
  let minStart = referenceNow.getTime()
  let maxEnd = referenceNow.getTime()

  for (const timeline of timelines) {
    for (const block of timeline.blocks) {
      const start = new Date(block.actualStart ?? block.plannedStart).getTime()
      const end = new Date(block.actualEnd ?? block.plannedEnd ?? block.plannedStart).getTime()
      if (start < minStart) minStart = start
      if (end > maxEnd) maxEnd = end
    }
  }

  const startMs = planStartTime ? new Date(planStartTime).getTime() : minStart
  const start = hourFloor(new Date(startMs))
  const uncappedEndMs = Math.max(maxEnd, referenceNow.getTime())
  const cappedEndMs = Math.min(uncappedEndMs, start.getTime() + MAX_AXIS_HOURS * 60 * 60 * 1000)
  return { start, end: hourCeil(new Date(cappedEndMs)) }
}

function pct(iso: string, axis: TimelineAxis): number {
  const total = axis.end.getTime() - axis.start.getTime()
  if (total <= 0) return 0
  const clamped = Math.min(Math.max(new Date(iso).getTime(), axis.start.getTime()), axis.end.getTime())
  return ((clamped - axis.start.getTime()) / total) * 100
}

function toSegment(
  startIso: string,
  endIso: string,
  axis: TimelineAxis,
  isIdle: boolean,
  isOngoing: boolean,
  label: string,
  pileIdCode: string | null,
  key: string,
  plannedDurationMin: number | null = null,
  actualDurationMin: number | null = null
): TimelineSegment {
  const leftPct = pct(startIso, axis)
  const widthPct = Math.max(pct(endIso, axis) - leftPct, 0.4)
  return {
    key,
    label,
    pileIdCode,
    startIso,
    endIso,
    leftPct,
    widthPct,
    isIdle,
    isOngoing,
    plannedDurationMin,
    actualDurationMin,
  }
}

function plannedDurationOf(block: MachineTimeline['blocks'][number]): number | null {
  return block.plannedEnd
    ? Math.round((new Date(block.plannedEnd).getTime() - new Date(block.plannedStart).getTime()) / 60_000)
    : null
}

// Two parallel tracks per machine, both laid out on the same axis so a
// step's actual bar and its planned (avg.) bar line up when they agree and
// visibly diverge when they don't:
//
// - Actual track: Idle gaps interleaved with real segments for whichever
//   steps have actually started (actualStart recorded) — a step that hasn't
//   started yet simply isn't here, so the time it would have occupied reads
//   as one continuous Idle span, including a trailing one if the machine has
//   gone quiet since its last recorded activity.
// - Planned track: one dashed segment per plan step, positioned by its own
//   planned_start/planned_end regardless of whether it's started — no Idle
//   filling here, gaps are just blank.
export function buildMachineTimelineRows(
  timelines: MachineTimeline[],
  axis: TimelineAxis,
  referenceNow: Date
): MachineTimelineRow[] {
  const nowIso = referenceNow.toISOString()

  return timelines.map((timeline) => {
    const startedBlocks = timeline.blocks
      .filter((block) => !!block.actualStart)
      .map((block) => {
        const startIso = block.actualStart as string
        const isOngoing = !block.actualEnd
        const endIso = block.actualEnd ?? nowIso
        return { block, startIso, endIso, isOngoing }
      })
      .sort((a, b) => new Date(a.startIso).getTime() - new Date(b.startIso).getTime())

    const segments: TimelineSegment[] = []
    const actualByBlockKey = new Map<string, TimelineSegment>()
    let cursorIso = axis.start.toISOString()
    let lastActivityIso: string | null = null

    for (const { block, startIso, endIso, isOngoing } of startedBlocks) {
      if (new Date(startIso).getTime() > new Date(cursorIso).getTime()) {
        segments.push(toSegment(cursorIso, startIso, axis, true, false, 'Idle', null, `idle-${cursorIso}`))
      }
      const actualDurationMin = Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60_000)
      const blockKey = `${block.checklistPileId}-${block.stepName}`
      const actualSegment = toSegment(
        startIso,
        endIso,
        axis,
        false,
        isOngoing,
        block.stepName,
        block.pileIdCode,
        blockKey,
        plannedDurationOf(block),
        actualDurationMin
      )
      segments.push(actualSegment)
      actualByBlockKey.set(blockKey, actualSegment)
      if (new Date(endIso).getTime() > new Date(cursorIso).getTime()) cursorIso = endIso
      if (!isOngoing) lastActivityIso = endIso
    }

    const trailingEndIso = referenceNow.getTime() < axis.end.getTime() ? nowIso : axis.end.toISOString()
    if (new Date(trailingEndIso).getTime() > new Date(cursorIso).getTime()) {
      segments.push(toSegment(cursorIso, trailingEndIso, axis, true, true, 'Idle', null, `idle-trailing-${cursorIso}`))
    }

    // The avg badge sits directly beneath its matching actual bar — same
    // left/width, for a direct visual compare — which only exists once the
    // step has actually started. A step that hasn't started yet has no
    // actual bar to align under; falling back to its own original planned
    // position doesn't work once the day has drifted far behind schedule
    // (common here — see DELAY_CALCULATIONS.md), since that stale slot then
    // renders on top of whatever's actually happening there now instead.
    // The still-Idle stretch of the row already communicates "not started".
    const plannedSegments: TimelineSegment[] = timeline.blocks.flatMap((block) => {
      const blockKey = `${block.checklistPileId}-${block.stepName}`
      const actualSegment = actualByBlockKey.get(blockKey)
      if (!actualSegment) return []
      return [
        toSegment(
          actualSegment.startIso,
          actualSegment.endIso,
          axis,
          false,
          false,
          block.stepName,
          block.pileIdCode,
          `planned-${blockKey}`,
          plannedDurationOf(block),
          actualSegment.actualDurationMin
        ),
      ]
    })

    return { machine: timeline.machine, segments, plannedSegments, lastActivityIso }
  })
}

// Duration of the shortest real (non-idle) segment across every row, in
// minutes — used to pick a pixels-per-hour scale wide enough that even that
// segment's label fits, rather than truncating short steps' time ranges.
export function shortestSegmentMinutes(rows: MachineTimelineRow[]): number | null {
  let shortest: number | null = null
  for (const row of rows) {
    for (const segment of [...row.segments, ...row.plannedSegments]) {
      if (segment.isIdle) continue
      const minutes = (new Date(segment.endIso).getTime() - new Date(segment.startIso).getTime()) / 60_000
      if (minutes > 0 && (shortest === null || minutes < shortest)) shortest = minutes
    }
  }
  return shortest
}

// Hour ticks across the axis, for the header row.
export function buildHourTicks(axis: TimelineAxis): { iso: string; leftPct: number }[] {
  const ticks: { iso: string; leftPct: number }[] = []
  for (const t = new Date(axis.start); t <= axis.end; t.setHours(t.getHours() + 1)) {
    ticks.push({ iso: t.toISOString(), leftPct: pct(t.toISOString(), axis) })
  }
  return ticks
}
