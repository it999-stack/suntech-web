import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/EmptyState'
import { ChartTooltip, type ChartTooltipPayloadEntry } from '@/components/ChartTooltip'
import { TrendingUpIcon } from 'lucide-react'
import { formatTooltipDate } from '@/lib/date'
import { ACTUAL_COLOR, PLANNED_COLOR } from '../../lib/chartColors'
import type { RangeChartPoint } from '../../types/dashboard.types'

interface SiteProgressRangeChartProps {
  points: RangeChartPoint[]
}

export function SiteProgressRangeChart({ points }: SiteProgressRangeChartProps) {
  return (
    <Card className="bg-white ring-foreground/5 dark:bg-neutral-950">
      <CardHeader>
        <CardTitle>Site Progress</CardTitle>
        <CardDescription>Actual vs. planned pile completions over the selected date range</CardDescription>
      </CardHeader>
      <CardContent>
        {points.length === 0 ? (
          <EmptyState
            icon={TrendingUpIcon}
            title="Nothing to chart yet"
            description="No checklist history for this site within the selected range."
          />
        ) : (
          <div className="h-72 w-full rounded-lg">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={points} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="siteProgressRangeActualFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={ACTUAL_COLOR} stopOpacity={0.22} />
                    <stop offset="100%" stopColor={ACTUAL_COLOR} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="siteProgressRangePlannedFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={PLANNED_COLOR} stopOpacity={0.16} />
                    <stop offset="100%" stopColor={PLANNED_COLOR} stopOpacity={0} />
                  </linearGradient>
                  <pattern id="siteProgressRangeDotGrid" width="16" height="16" patternUnits="userSpaceOnUse">
                    <circle cx="1" cy="1" r="1" fill="var(--color-border)" />
                  </pattern>
                </defs>
                <CartesianGrid stroke="none" fill="url(#siteProgressRangeDotGrid)" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} className="text-xs fill-muted-foreground" />
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
                        point && typeof point === 'object' && 'date' in point
                          ? formatTooltipDate((point as RangeChartPoint).date)
                          : null
                      }
                      colorForKey={(key) => (key === 'actual' ? ACTUAL_COLOR : PLANNED_COLOR)}
                    />
                  )}
                  cursor={{ stroke: 'var(--color-muted-foreground)', strokeDasharray: '4 4' }}
                />
                <Area
                  type="monotone"
                  dataKey="planned"
                  name="Planned"
                  stroke={PLANNED_COLOR}
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fill="url(#siteProgressRangePlannedFill)"
                  dot={false}
                  activeDot={{ r: 4, fill: PLANNED_COLOR, stroke: 'var(--color-chart-surface)', strokeWidth: 2 }}
                  connectNulls
                />
                <Area
                  type="monotone"
                  dataKey="actual"
                  name="Actual"
                  stroke={ACTUAL_COLOR}
                  strokeWidth={2}
                  fill="url(#siteProgressRangeActualFill)"
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
