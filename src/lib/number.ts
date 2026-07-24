export function formatNullable<T>(value: T | null, format: (v: T) => string, fallback = '—'): string {
  return value == null ? fallback : format(value)
}

export function formatM3(value: number | null): string {
  return formatNullable(value, (v) => `${v.toFixed(2)} m³`)
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`
}
