import { useEffect, useMemo, useRef } from 'react'
import { ClockIcon, CircleAlert } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { EmptyState } from '@/components/EmptyState'
import { Image } from '@/components/ui/image'
import { cn } from '@/lib/utils'
import { formatDuration, formatTime } from '@/lib/date'
import rigImage from '@/assets/images/rig.png'
import craneImage from '@/assets/images/crane.png'
import type { MachinePerformance, MachineTimeline } from '../../../types/dashboard.types'
import { formatSignedDuration, machineStatusVisuals } from './lib/format'
import {
  buildHourTicks,
  buildMachineTimelineRows,
  computeTimelineAxis,
  shortestSegmentMinutes,
  type TimelineSegment,
} from './lib/machineTimelineLayout'

interface MachineActivityTimelineProps {
  timelines: MachineTimeline[]
  machines: MachinePerformance[]
  referenceNow: Date
  planStartTime: string | null
  isLoading?: boolean
}

const STEP_COLORS: Record<string, string> = {
  CASING: 'var(--color-chart-1)',
  BORING: 'var(--color-chart-2)',
  'CAGE LOWERING': 'var(--color-chart-3)',
  'TREMIE LOWERING': 'var(--color-chart-4)',
  CONCRETING: 'var(--color-chart-5)',
}
const IDLE_COLOR = 'var(--color-border)'
const FALLBACK_COLOR = 'var(--color-chart-5)'

// DB step names are ALL CAPS ("CAGE LOWERING") — display them Title Case
// ("Cage Lowering") while still keying the color map off the raw value.
function titleCase(s: string): string {
  return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

function colorForSegment(segment: TimelineSegment): string {
  if (segment.isIdle) return IDLE_COLOR
  return STEP_COLORS[segment.label.toUpperCase()] ?? FALLBACK_COLOR
}

// Compact "45m" / "1h 20m" form — the labelled formatDuration() ("45 min")
// is too wide for these small tiles.
function formatSegmentMinutes(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m`
  const hours = Math.floor(minutes / 60)
  const mins = Math.round(minutes % 60)
  return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`
}

// "Actual: 4h 40m | Avg: 3h 45m" — actual vs. the step's planned (avg.)
// duration, shown on the dashed badge (not the solid actual bar above it,
// which only carries the pile/step name and its actual start–end time).
// Only the half that's known is shown when the other isn't (e.g. not
// started yet has no actual; a still-open plan window has no planned end).
function durationCompareLabel(segment: TimelineSegment): string | null {
  const actual = segment.actualDurationMin !== null ? `Actual: ${formatSegmentMinutes(segment.actualDurationMin)}` : null
  const avg = segment.plannedDurationMin !== null ? `Avg: ${formatSegmentMinutes(segment.plannedDurationMin)}` : null
  if (actual && avg) return `${actual} | ${avg}`
  return actual ?? avg
}

function actualSegmentTooltip(segment: TimelineSegment): string {
  const range = `${formatTime(segment.startIso)} – ${segment.isOngoing ? 'now' : formatTime(segment.endIso)}`
  if (segment.isIdle) return `Idle · ${range}`
  return `${segment.pileIdCode ?? ''} — ${titleCase(segment.label)}\n${range}`
}

function plannedSegmentTooltip(segment: TimelineSegment): string {
  const label = durationCompareLabel(segment) ?? '—'
  return `${segment.pileIdCode ?? ''} — ${titleCase(segment.label)}\n${label}`
}

const LEGEND_ITEMS = [...Object.keys(STEP_COLORS).map((k) => [titleCase(k), STEP_COLORS[k]] as [string, string]), ['Idle', IDLE_COLOR] as [string, string]]

const MACHINE_COLUMN_WIDTH = 176
const SUMMARY_COLUMN_WIDTH = 168
// Baseline pixels-per-hour — wide enough that tick labels stay legible even
// across many hours. Bumped up dynamically (see MIN_SEGMENT_LABEL_PX below)
// when the shortest real step on screen would otherwise render too narrow
// to show its own start–end time, rather than truncating that label.
const BASE_PX_PER_HOUR = 130
const MAX_PX_PER_HOUR = 420
const MIN_SEGMENT_LABEL_PX = 150
// The dashed badge's "Actual: 4h 40m | Avg: 3h 45m" line needs more room
// than the actual bar's own lines to stay legible — gated separately so a
// narrower badge just renders as an empty outlined box.
const MIN_DURATION_LABEL_PX = 230
const MIN_TRACK_WIDTH = 640
// Breathing room at each end of the scrollable track — without it, the
// first/last hour tick's centered label (and the very first/last segment)
// sit flush against the sticky machine column and the scroll edge and get
// visually clipped.
const EDGE_PADDING_PX = 40

// Two stacked bars per real step — a solid "actual" bar on top, a dashed
// "planned (avg.)" bar directly below it — plus a taller Idle bar spanning
// the same combined height so idle gaps read at a consistent visual weight.
const ROW_HEIGHT = 88
const ACTUAL_BAR_HEIGHT = 46
const PLANNED_BAR_HEIGHT = 22
const BAR_GAP = 4
const STACK_TOP = (ROW_HEIGHT - (ACTUAL_BAR_HEIGHT + BAR_GAP + PLANNED_BAR_HEIGHT)) / 2
const PLANNED_TOP = STACK_TOP + ACTUAL_BAR_HEIGHT + BAR_GAP
const IDLE_HEIGHT = ACTUAL_BAR_HEIGHT + BAR_GAP + PLANNED_BAR_HEIGHT

export function MachineActivityTimeline({
  timelines,
  machines,
  referenceNow,
  planStartTime,
  isLoading,
}: MachineActivityTimelineProps) {
  const axis = useMemo(
    () => computeTimelineAxis(timelines, referenceNow, planStartTime),
    [timelines, referenceNow, planStartTime]
  )
  const rows = useMemo(
    () => buildMachineTimelineRows(timelines, axis, referenceNow),
    [timelines, axis, referenceNow]
  )
  const ticks = useMemo(() => buildHourTicks(axis), [axis])
  const nowPct = useMemo(() => {
    const total = axis.end.getTime() - axis.start.getTime()
    if (total <= 0) return null
    if (referenceNow < axis.start || referenceNow > axis.end) return null
    return ((referenceNow.getTime() - axis.start.getTime()) / total) * 100
  }, [axis, referenceNow])

  const axisHours = Math.max((axis.end.getTime() - axis.start.getTime()) / (60 * 60 * 1000), 1)
  const pxPerHour = useMemo(() => {
    const shortestMinutes = shortestSegmentMinutes(rows)
    if (!shortestMinutes) return BASE_PX_PER_HOUR
    const neededForShortest = MIN_SEGMENT_LABEL_PX / (shortestMinutes / 60)
    return Math.min(Math.max(neededForShortest, BASE_PX_PER_HOUR), MAX_PX_PER_HOUR)
  }, [rows])
  const trackWidth = Math.max(Math.round(axisHours * pxPerHour), MIN_TRACK_WIDTH)

  // Lets a plain vertical mouse-wheel scroll this wide track horizontally,
  // like a Gantt chart, instead of requiring the scrollbar or shift+wheel.
  // Registered as a native listener (not React's onWheel) because React
  // attaches wheel handlers as passive by default, which silently ignores
  // preventDefault() and lets the page scroll vertically underneath too.
  const scrollTrackRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = scrollTrackRef.current
    if (!el) return
    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return
      el.scrollLeft += e.deltaY
      e.preventDefault()
    }
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [])

  return (
    <Card className="min-w-0">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-1.5">
            Machine Activity Timeline — Today
            <CircleAlert className="size-4 text-muted-foreground" />
          </CardTitle>
          <CardDescription>Planned (avg.) vs Actual activity and pile progress</CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded-full bg-foreground/60" />
            Actual
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-0 w-4 rounded-full border-t-2 border-dashed border-foreground/45" />
            Planned (avg.)
          </span>
          <span className="h-3.5 w-px bg-border" />
          {LEGEND_ITEMS.map(([label, color]) => (
            <span key={label} className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm" style={{ backgroundColor: color }} />
              {label}
            </span>
          ))}
        </div>
      </CardHeader>
      <CardContent className="min-w-0">
        {isLoading ? (
          <div className="h-40 animate-pulse rounded-lg bg-muted" />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={ClockIcon}
            title="No activity yet"
            description="No machine activity recorded for this date."
          />
        ) : (
          // grid-cols-1 (Tailwind: grid-template-columns: minmax(0, 1fr)) is
          // load-bearing here, not decorative — it's what actually caps this
          // column's width to "available space" regardless of how any
          // ancestor flexbox resolves min-width:auto. Without it, the wide
          // scrollable content below can still inflate the whole page's
          // width instead of scrolling within its own card.
          <div className="grid grid-cols-1">
            <div ref={scrollTrackRef} className="overflow-x-auto">
              <div
                style={{
                  width: trackWidth + MACHINE_COLUMN_WIDTH + SUMMARY_COLUMN_WIDTH + EDGE_PADDING_PX * 2,
                }}
              >
                {/* Hour ticks header */}
                <div className="flex">
                  <div
                    style={{ width: MACHINE_COLUMN_WIDTH }}
                    className="sticky left-0 z-20 shrink-0 border-r border-border/60 bg-card"
                  />
                  <div className="relative h-6 flex-1 border-b border-border">
                    {ticks.map((tick) => (
                      <span
                        key={tick.iso}
                        className="absolute -translate-x-1/2 whitespace-nowrap text-xs text-muted-foreground"
                        style={{ left: EDGE_PADDING_PX + (tick.leftPct / 100) * trackWidth }}
                      >
                        {formatTime(tick.iso)}
                      </span>
                    ))}
                  </div>
                  <div
                    style={{ width: SUMMARY_COLUMN_WIDTH }}
                    className="sticky right-0 z-20 shrink-0 border-b border-l border-border/60 bg-card"
                  />
                </div>

                {/* Machine rows */}
                <div className="relative">
                  {nowPct !== null && (
                    <div
                      className="pointer-events-none absolute top-0 bottom-0 z-10 border-l-2 border-dashed border-destructive"
                      style={{ left: MACHINE_COLUMN_WIDTH + EDGE_PADDING_PX + (nowPct / 100) * trackWidth }}
                    />
                  )}
                  {rows.map(({ machine, segments, plannedSegments, lastActivityIso }) => {
                    const perf = machines.find((m) => m.machine.id === machine.id)
                    const status = perf ? machineStatusVisuals[perf.status] : null
                    const delayVariant =
                      perf && perf.delayMin > 0 ? 'text-destructive' : perf && perf.delayMin < 0 ? 'text-success' : 'text-foreground'

                    return (
                      <div
                        key={machine.id}
                        className="flex items-stretch border-b border-border/60 last:border-b-0"
                        style={{ height: ROW_HEIGHT }}
                      >
                        <div
                          style={{ width: MACHINE_COLUMN_WIDTH }}
                          className="sticky left-0 z-20 flex shrink-0 flex-col justify-center gap-1 truncate border-r border-border/60 bg-card px-3 py-2"
                        >
                          <span className="truncate text-sm font-semibold text-foreground">{machine.machineNo}</span>
                          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            {status && <span className={cn('size-1.5 shrink-0 rounded-full', status.dotClassName)} />}
                            <Image
                              src={machine.type === 'CRANE' ? craneImage : rigImage}
                              alt={machine.type === 'CRANE' ? 'Crane' : 'Rig'}
                              className="size-3.5 shrink-0 object-contain"
                            />
                            {machine.type === 'CRANE' ? 'Crane' : 'Rig'}
                          </span>
                          <span className="truncate text-xs text-muted-foreground">
                            {perf?.status === 'ACTIVE' && perf.currentPileIdCode ? (
                              <>
                                Current: <span className="font-medium text-foreground">{perf.currentPileIdCode}</span>
                              </>
                            ) : lastActivityIso ? (
                              `Last: ${formatTime(lastActivityIso)}`
                            ) : (
                              '—'
                            )}
                          </span>
                        </div>

                        <div className="relative flex-1">
                          {segments.map((segment) => {
                            const segmentPx = (segment.widthPct / 100) * trackWidth
                            if (segment.isIdle) {
                              return (
                                <div
                                  key={segment.key}
                                  title={actualSegmentTooltip(segment)}
                                  className="absolute flex flex-col items-center justify-center gap-0.5 overflow-hidden rounded-md bg-muted px-2 text-center text-foreground/70"
                                  style={{
                                    left: EDGE_PADDING_PX + (segment.leftPct / 100) * trackWidth,
                                    width: segmentPx,
                                    top: STACK_TOP,
                                    height: IDLE_HEIGHT,
                                  }}
                                >
                                  {segmentPx > 36 && (
                                    <span className="truncate text-xs font-medium leading-tight opacity-80">Idle</span>
                                  )}
                                  {segmentPx >= MIN_SEGMENT_LABEL_PX - 20 && (
                                    <span className="truncate text-[11px] leading-tight opacity-70">
                                      {formatTime(segment.startIso)} –{' '}
                                      {segment.isOngoing ? 'now' : formatTime(segment.endIso)}
                                    </span>
                                  )}
                                </div>
                              )
                            }
                            const color = colorForSegment(segment)
                            return (
                              <div
                                key={segment.key}
                                title={actualSegmentTooltip(segment)}
                                className="absolute flex flex-col items-center justify-center gap-0.5 overflow-hidden rounded-md border px-2 text-center"
                                style={{
                                  left: EDGE_PADDING_PX + (segment.leftPct / 100) * trackWidth,
                                  width: segmentPx,
                                  top: STACK_TOP,
                                  height: ACTUAL_BAR_HEIGHT,
                                  backgroundColor: `color-mix(in srgb, ${color} 16%, transparent)`,
                                  borderColor: color,
                                  color,
                                }}
                              >
                                <span className="truncate text-xs font-semibold leading-tight">
                                  {segment.pileIdCode} — {titleCase(segment.label)}
                                </span>
                                {segmentPx >= MIN_SEGMENT_LABEL_PX - 20 && (
                                  <span className="truncate text-[10px] leading-none opacity-90">
                                    {formatTime(segment.startIso)} –{' '}
                                    {segment.isOngoing ? 'now' : formatTime(segment.endIso)}
                                  </span>
                                )}
                              </div>
                            )
                          })}
                          {plannedSegments.map((segment) => {
                            const segmentPx = (segment.widthPct / 100) * trackWidth
                            const color = colorForSegment(segment)
                            return (
                              <div
                                key={segment.key}
                                title={plannedSegmentTooltip(segment)}
                                className="absolute flex items-center justify-center overflow-hidden rounded-md border border-dashed px-2 text-center"
                                style={{
                                  left: EDGE_PADDING_PX + (segment.leftPct / 100) * trackWidth,
                                  width: segmentPx,
                                  top: PLANNED_TOP,
                                  height: PLANNED_BAR_HEIGHT,
                                  borderColor: color,
                                  backgroundColor: `color-mix(in srgb, ${color} 10%, transparent)`,
                                  color,
                                }}
                              >
                                {segmentPx >= MIN_DURATION_LABEL_PX && (
                                  <span className="truncate text-[10px] font-medium leading-none">
                                    {durationCompareLabel(segment)}
                                  </span>
                                )}
                              </div>
                            )
                          })}
                        </div>

                        <div
                          style={{ width: SUMMARY_COLUMN_WIDTH }}
                          className="sticky right-0 z-20 flex shrink-0 items-center justify-around gap-2 border-l border-border/60 bg-card px-2 text-center text-xs"
                        >
                          <div>
                            <div className="text-muted-foreground">Avg</div>
                            <div className="font-medium tabular-nums text-foreground">
                              {perf ? formatDuration(perf.cycleTimeTargetMin) : '—'}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Act</div>
                            <div className="font-medium tabular-nums text-foreground">
                              {perf ? formatDuration(perf.cycleTimeActualMin) : '—'}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Delay</div>
                            <div className={cn('font-medium tabular-nums', delayVariant)}>
                              {perf ? formatSignedDuration(perf.delayMin) : '—'}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
