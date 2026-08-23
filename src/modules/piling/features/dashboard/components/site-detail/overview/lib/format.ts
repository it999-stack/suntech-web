import { formatDuration } from '@/lib/date'
import type { MachineActivityStatus } from '../../../../types/dashboard.types'

// e.g. 90 -> "+1h 30m", -45 -> "-45 min", 0 -> "0 min". Same "Xh Ym" shape as
// formatDuration, just with an explicit sign for delta/delay values.
export function formatSignedDuration(minutes: number): string {
  if (minutes === 0) return formatDuration(0)
  const sign = minutes > 0 ? '+' : '-'
  return `${sign}${formatDuration(Math.abs(minutes))}`
}

export function formatPercent0(value: number | null): string {
  if (value === null) return '—'
  return `${Math.round(value)}%`
}

// Shared between MachinePerformanceCard and MachineActivityTimeline so both
// read a machine's ACTIVE/IDLE/BREAKDOWN/INACTIVE status the same way.
export const machineStatusVisuals: Record<MachineActivityStatus, { label: string; dotClassName: string }> = {
  ACTIVE: { label: 'Working', dotClassName: 'bg-success' },
  IDLE: { label: 'Idle', dotClassName: 'bg-warning' },
  BREAKDOWN: { label: 'Breakdown', dotClassName: 'bg-destructive' },
  INACTIVE: { label: 'Inactive', dotClassName: 'bg-muted-foreground' },
}
