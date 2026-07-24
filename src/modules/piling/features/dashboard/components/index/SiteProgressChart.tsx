import { useMemo, useState } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EmptyState } from '@/components/EmptyState'
import { ChartTooltip, type ChartTooltipPayloadEntry } from '@/components/ChartTooltip'
import { TrendingUpIcon } from 'lucide-react'
import { formatAxisDate, formatTooltipDate, today } from '@/lib/date'
import { useSiteProgressHistory } from '../../hooks/useDashboardQueries'
import { ACTUAL_COLOR, PLANNED_COLOR } from '../../lib/chartColors'
import type { SiteProgress, SiteProgressHistory } from '../../types/dashboard.types'

interface SiteProgressChartProps {
  sites: SiteProgress[]
  defaultSiteHistory: SiteProgressHistory | null | undefined
}

interface ChartPoint {
  date: string
  label: string
  actual: number | null
  planned: number | null
}

// Both lines are real generated-plan/actual-completion data from the API,
// bucketed by checklist date — not a projection, so the range is just
// whatever dates have history, plus today (so the actual line still reaches
// "now" even without a checklist dated exactly today).
function buildChartPoints(history: SiteProgressHistory | undefined): ChartPoint[] {
  const historyPoints = history?.points ?? []
  if (historyPoints.length === 0) return []

  const todayStr = today()
  const dates = new Set<string>(historyPoints.map((p) => p.date))
  dates.add(todayStr)

  const actualByDate = new Map(historyPoints.map((p) => [p.date, p.actualCumulative]))
  const plannedByDate = new Map(historyPoints.map((p) => [p.date, p.plannedCumulative]))
  let runningActual = 0
  let runningPlanned = 0

  return Array.from(dates)
    .sort()
    .map((date) => {
      runningActual = actualByDate.get(date) ?? runningActual
      runningPlanned = plannedByDate.get(date) ?? runningPlanned
      return { date, label: formatAxisDate(date), actual: runningActual, planned: runningPlanned }
    })
}

export function SiteProgressChart({ sites, defaultSiteHistory }: SiteProgressChartProps) {
  const defaultSiteId = sites[0]?.siteId
  const [selectedSiteId, setSelectedSiteId] = useState<string | undefined>(defaultSiteId)
  const activeSiteId = selectedSiteId ?? defaultSiteId

  const historyQuery = useSiteProgressHistory(activeSiteId, defaultSiteId, defaultSiteHistory)
  const selectedSite = sites.find((s) => s.siteId === activeSiteId)

  const chartPoints = useMemo(() => buildChartPoints(historyQuery.data), [historyQuery.data])

  // Base UI's <Select.Value> only resolves a human label when `items` is
  // supplied — without it, it falls back to rendering the raw value (the
  // site UUID) once the label can't be derived from the closed trigger.
  const selectItems = useMemo(
    () => sites.map((site) => ({ value: site.siteId, label: site.siteName })),
    [sites]
  )

  return (
    <Card className="bg-white ring-foreground/5 dark:bg-neutral-950">
      <CardHeader>
        <CardTitle>Site Progress</CardTitle>
        <CardDescription>Actual vs. planned pile completion over time</CardDescription>

        {sites.length > 0 && (
          <CardAction>
            <Select
              items={selectItems}
              value={activeSiteId}
              onValueChange={(value) => setSelectedSiteId(value ?? undefined)}
            >
              <SelectTrigger size="sm" className="w-auto">
                <SelectValue placeholder="Select a site" />
              </SelectTrigger>
              <SelectContent align="end" alignItemWithTrigger={false}>
                <SelectGroup>
                  <SelectLabel>Sites</SelectLabel>
                  {sites.map((site) => (
                    <SelectItem key={site.siteId} value={site.siteId}>
                      {site.siteName}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        {sites.length === 0 ? (
          <EmptyState
            icon={TrendingUpIcon}
            title="No sites yet"
            description="Progress will show up here once a site has checklist history."
          />
        ) : chartPoints.length === 0 ? (
          <EmptyState
            icon={TrendingUpIcon}
            title="Nothing to chart yet"
            description={`${selectedSite?.siteName ?? 'This site'} has no checklist history or target end date yet.`}
          />
        ) : (
          <div className="h-72 w-full rounded-lg">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartPoints} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="siteProgressActualFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={ACTUAL_COLOR} stopOpacity={0.22} />
                    <stop offset="100%" stopColor={ACTUAL_COLOR} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="siteProgressPlannedFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={PLANNED_COLOR} stopOpacity={0.16} />
                    <stop offset="100%" stopColor={PLANNED_COLOR} stopOpacity={0} />
                  </linearGradient>
                  <pattern id="siteProgressDotGrid" width="16" height="16" patternUnits="userSpaceOnUse">
                    <circle cx="1" cy="1" r="1" fill="var(--color-border)" />
                  </pattern>
                </defs>
                <CartesianGrid stroke="none" fill="url(#siteProgressDotGrid)" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  className="text-xs fill-muted-foreground"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={32}
                  className="text-xs fill-muted-foreground"
                />
                <Tooltip
                  content={({ active, payload }) => (
                    <ChartTooltip
                      active={active}
                      payload={payload as readonly ChartTooltipPayloadEntry[] | undefined}
                      formatLabel={(point) =>
                        point && typeof point === 'object' && 'date' in point
                          ? formatTooltipDate((point as ChartPoint).date)
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
                  fill="url(#siteProgressPlannedFill)"
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
                  fill="url(#siteProgressActualFill)"
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
