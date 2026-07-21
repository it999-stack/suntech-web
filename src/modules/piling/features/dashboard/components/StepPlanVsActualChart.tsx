import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/EmptyState'
import { TrendingUpIcon } from 'lucide-react'
import type { StepDurationPoint } from '../types/dashboard.types'

interface StepPlanVsActualChartProps {
  points: StepDurationPoint[]
}

// Same palette as SiteProgressChart — Actual = chart-1 (blue), Planned = chart-4
// (amber) — so the two "plan vs actual" charts in this module read as one system.
const ACTUAL_COLOR = 'var(--color-chart-1)'
const PLANNED_COLOR = 'var(--color-chart-4)'

function formatMinutes(value: number): string {
  const hours = Math.floor(value / 60)
  const minutes = Math.round(value % 60)
  if (hours === 0) return `${minutes}m`
  return `${hours}h ${minutes}m`
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="min-w-40 rounded-lg bg-white p-3 text-sm shadow-lg ring-1 ring-foreground/10 dark:bg-neutral-900">
      <div className="mb-2 font-medium text-foreground">{label}</div>
      <div className="flex flex-col gap-1.5">
        {payload.map((entry: any) => (
          <div key={entry.dataKey} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: entry.dataKey === 'actualMinutes' ? ACTUAL_COLOR : PLANNED_COLOR }}
            />
            <span className="text-muted-foreground">{entry.name}</span>
            <span className="ml-auto font-semibold tabular-nums text-foreground">
              {formatMinutes(entry.value ?? 0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function StepPlanVsActualChart({ points }: StepPlanVsActualChartProps) {
  return (
    <Card className="bg-white ring-foreground/5 dark:bg-neutral-950">
      <CardHeader>
        <CardTitle>Step Duration — Planned vs Actual</CardTitle>
        <CardDescription>Total time spent per step, summed across every pile on this date</CardDescription>
      </CardHeader>
      <CardContent>
        {points.length === 0 ? (
          <EmptyState
            icon={TrendingUpIcon}
            title="Nothing to chart yet"
            description="No plan or actual step times recorded for this date."
          />
        ) : (
          <div className="h-72 w-full rounded-lg">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={points} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <pattern id="stepDurationDotGrid" width="16" height="16" patternUnits="userSpaceOnUse">
                    <circle cx="1" cy="1" r="1" fill="var(--color-border)" />
                  </pattern>
                </defs>
                <CartesianGrid stroke="none" fill="url(#stepDurationDotGrid)" />
                <XAxis
                  dataKey="stepName"
                  tickLine={false}
                  axisLine={false}
                  className="text-xs fill-muted-foreground"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={40}
                  tickFormatter={formatMinutes}
                  className="text-xs fill-muted-foreground"
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--color-muted)', opacity: 0.4 }} />
                <Bar dataKey="plannedMinutes" name="Planned" fill={PLANNED_COLOR} radius={[4, 4, 0, 0]} />
                <Bar dataKey="actualMinutes" name="Actual" fill={ACTUAL_COLOR} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
