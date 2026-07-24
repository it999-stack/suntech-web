import type { ReactNode } from 'react'

export interface ChartTooltipPayloadEntry {
  dataKey?: string | number
  name?: ReactNode
  value?: number | string | null
  payload?: unknown
}

export interface RechartsTooltipRenderProps {
  active?: boolean
  payload?: readonly ChartTooltipPayloadEntry[]
}

interface ChartTooltipProps extends RechartsTooltipRenderProps {
  formatLabel: (point: unknown) => string | null
  colorForKey: (dataKey: string | number | undefined) => string
}

export function ChartTooltip({ active, payload, formatLabel, colorForKey }: ChartTooltipProps) {
  if (!active || !payload?.length) return null
  const label = formatLabel(payload[0]?.payload)
  return (
    <div className="min-w-40 rounded-lg bg-white p-3 text-sm shadow-lg ring-1 ring-foreground/10 dark:bg-neutral-900">
      {label && <div className="mb-2 font-medium text-foreground">{label}</div>}
      <div className="flex flex-col gap-1.5">
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center gap-2">
            <span className="h-0.5 w-3 rounded-full" style={{ backgroundColor: colorForKey(entry.dataKey) }} />
            <span className="text-muted-foreground">{entry.name}</span>
            <span className="ml-auto font-semibold tabular-nums text-foreground">{entry.value ?? '—'}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
