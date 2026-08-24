// Shared date/time parsing and formatting for the piling dashboard.
//
// The backend returns naive ISO timestamps (no "Z", no UTC offset) that
// implicitly represent IST wall-clock time — every function here treats
// `new Date(iso)` as already being the correct local time and never applies
// its own timezone offset math.

/** Local Y-M-D for a `Date` — not `d.toISOString().slice(0, 10)`, which
 * converts to UTC first and can flip the computed date to the previous day
 * during the early hours of IST (UTC+5:30), e.g. 2:00 AM IST is still
 * 8:30 PM the prior day UTC. */
export function dateOnly(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function today(): string {
  return dateOnly(new Date())
}

// `date` state throughout the dashboard is always 'YYYY-MM-DD' — parse via
// the parts, not `new Date(dateStr)`, which treats a bare date string as UTC
// midnight and can shift the displayed day backward in any timezone behind UTC.
export function parseDateStr(s: string): Date {
  const [year, month, day] = s.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function formatTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

export function formatTimeRange(startIso: string | null, endIso: string | null): string {
  return `${formatTime(startIso)} – ${formatTime(endIso)}`
}

// Time + short date, no year — matches the mobile app's formatTimeWithDay
// (suntech-app/src/utils/formatTime.ts). e.g. "2:40 PM, 20 Aug".
export function formatTimeWithDay(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  const day = d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
  return `${time}, ${day}`
}

// Time range with short date — a shared date when both timestamps fall on
// the same day ("20 Aug, 2:40 PM – 4:10 PM"), or each side's own date when
// they don't (a step can now span a day boundary, e.g. resumed the next
// day), so bare times alone would be ambiguous about which day is which.
export function formatTimeRangeWithDay(startIso: string | null, endIso: string | null): string {
  if (!startIso && !endIso) return '—'
  if (!startIso) return `— – ${formatTimeWithDay(endIso)}`
  if (!endIso) return `${formatTimeWithDay(startIso)} – —`

  const s = new Date(startIso)
  const e = new Date(endIso)
  if (dateOnly(s) === dateOnly(e)) {
    const day = s.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
    const startTime = s.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    const endTime = e.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    return `${day}, ${startTime} – ${endTime}`
  }
  return `${formatTimeWithDay(startIso)} – ${formatTimeWithDay(endIso)}`
}

export function formatDuration(minutes: number | null): string {
  if (minutes == null) return '—'
  const hours = Math.floor(minutes / 60)
  const mins = Math.round(minutes % 60)
  if (hours === 0) return `${mins} min`
  return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`
}

export function formatDurationLong(minutes: number | null): string {
  if (minutes == null) return '—'
  return `${formatDuration(minutes)} (${Math.round(minutes)} min)`
}

export function minutesBetween(start: string | null, end: string | null): number {
  if (!start || !end) return 0
  return Math.max(0, (new Date(end).getTime() - new Date(start).getTime()) / 60_000)
}

export function hourFloor(d: Date): Date {
  const floored = new Date(d)
  floored.setMinutes(0, 0, 0)
  return floored
}

export function hourCeil(d: Date): Date {
  const ceiled = new Date(d)
  if (ceiled.getMinutes() || ceiled.getSeconds() || ceiled.getMilliseconds()) {
    ceiled.setHours(ceiled.getHours() + 1)
  }
  ceiled.setMinutes(0, 0, 0)
  return ceiled
}

export function formatHourLabel(d: Date): string {
  return d.toLocaleTimeString(undefined, { hour: 'numeric' })
}

export function formatAxisDate(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function formatTooltipDate(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })
}

export function formatTooltipTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

/** Formats a plain "HH:MM" 24-hour time string (as stored for shift types and
 * non-working windows) as 12-hour with AM/PM, e.g. "08:00" -> "8:00 AM". */
export function formatTime12h(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number)
  return new Date(2000, 0, 1, h || 0, m || 0).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatTimeInput(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// Serializes a Date's own local y/m/d/h/min/s components as a naive
// "YYYY-MM-DDTHH:mm:ss" string — no "Z", no UTC offset. The backend's
// actual_start/actual_end columns are timezone-naive and store whatever
// wall-clock numbers they're given, so `.toISOString()` (always UTC) would
// silently shift a correctly-picked local time by the browser's UTC offset
// once it lands in storage.
export function toLocalIsoString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  const y = date.getFullYear()
  const m = pad(date.getMonth() + 1)
  const d = pad(date.getDate())
  const h = pad(date.getHours())
  const min = pad(date.getMinutes())
  const s = pad(date.getSeconds())
  return `${y}-${m}-${d}T${h}:${min}:${s}`
}

export function addMinutesIso(iso: string, minutes: number): string {
  const d = new Date(iso)
  d.setMinutes(d.getMinutes() + minutes)
  return toLocalIsoString(d)
}
