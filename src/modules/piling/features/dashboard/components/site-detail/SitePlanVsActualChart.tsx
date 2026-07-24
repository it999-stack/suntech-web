import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/EmptyState'
import { ChartTooltip, type ChartTooltipPayloadEntry } from '@/components/ChartTooltip'
import { TrendingUpIcon } from 'lucide-react'
import { formatTooltipTime } from '@/lib/date'
import { ACTUAL_COLOR, PLANNED_COLOR } from '../../lib/chartColors'
import type { SitePlanVsActualPoint } from '../../types/dashboard.types'

interface SitePlanVsActualChartProps {
  points: SitePlanVsActualPoint[]
}

export function SitePlanVsActualChart({ points }: SitePlanVsActualChartProps) {
  return (
    <Card className="bg-white ring-foreground/5 dark:bg-neutral-950">
      <CardHeader>
        <CardTitle>Site Progress — Today</CardTitle>
        <CardDescription>Actual vs. planned pile completions over the day, for the selected date</CardDescription>
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
              <AreaChart data={points} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="sitePlanVsActualActualFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={ACTUAL_COLOR} stopOpacity={0.22} />
                    <stop offset="100%" stopColor={ACTUAL_COLOR} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="sitePlanVsActualPlannedFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={PLANNED_COLOR} stopOpacity={0.16} />
                    <stop offset="100%" stopColor={PLANNED_COLOR} stopOpacity={0} />
                  </linearGradient>
                  <pattern id="sitePlanVsActualDotGrid" width="16" height="16" patternUnits="userSpaceOnUse">
                    <circle cx="1" cy="1" r="1" fill="var(--color-border)" />
                  </pattern>
                </defs>
                <CartesianGrid stroke="none" fill="url(#sitePlanVsActualDotGrid)" />
                <XAxis dataKey="hourLabel" tickLine={false} axisLine={false} className="text-xs fill-muted-foreground" />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={32}
                  allowDecimals={false}
                  className="text-xs fill-muted-foreground"
                />
                <Tooltip
                  content={({ active, payload }) => (
                    <ChartTooltip
                      active={active}
                      payload={payload as readonly ChartTooltipPayloadEntry[] | undefined}
                      formatLabel={(point) =>
                        point && typeof point === 'object' && 'timeIso' in point
                          ? formatTooltipTime((point as SitePlanVsActualPoint).timeIso)
                          : null
                      }
                      colorForKey={(key) => (key === 'actualCumulative' ? ACTUAL_COLOR : PLANNED_COLOR)}
                    />
                  )}
                  cursor={{ stroke: 'var(--color-muted-foreground)', strokeDasharray: '4 4' }}
                />
                <Area
                  type="monotone"
                  dataKey="plannedCumulative"
                  name="Planned"
                  stroke={PLANNED_COLOR}
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fill="url(#sitePlanVsActualPlannedFill)"
                  dot={false}
                  activeDot={{ r: 4, fill: PLANNED_COLOR, stroke: 'var(--color-chart-surface)', strokeWidth: 2 }}
                  connectNulls
                />
                <Area
                  type="monotone"
                  dataKey="actualCumulative"
                  name="Actual"
                  stroke={ACTUAL_COLOR}
                  strokeWidth={2}
                  fill="url(#sitePlanVsActualActualFill)"
                  dot={false}
                  activeDot={{ r: 4, fill: ACTUAL_COLOR, stroke: 'var(--color-chart-surface)', strokeWidth: 2 }}
                  connectNulls
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
