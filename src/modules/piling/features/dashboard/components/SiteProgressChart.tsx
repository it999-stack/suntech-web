import { useMemo, useState } from 'react'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { cn } from '@/lib/utils'
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
import { TrendingUpIcon } from 'lucide-react'
import { useSiteProgressHistory } from '../hooks/useDashboardQueries'
import type { SiteProgress, SiteProgressHistory } from '../types/dashboard.types'

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

// Actual = categorical slot 1 (blue), Planned = slot 4 (amber) — reusing the
// app's own --chart-* tokens so light/dark swap for free instead of hardcoding hex.
const ACTUAL_COLOR = 'var(--color-chart-1)'
const PLANNED_COLOR = 'var(--color-chart-4)'

function formatAxisDate(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function formatTooltipDate(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })
}

function toDateOnly(isoOrDate: string): string {
  return isoOrDate.slice(0, 10)
}

// Anchors the timeline on the site's creation date and today, not just dates
// with completed piles — so a site with a target end date but zero progress
// yet still renders a planned line (and a flat actual line at 0) instead of
// an empty state.
function buildChartPoints(
  history: SiteProgressHistory | undefined,
  targetEndDate: string | null,
  siteCreatedAt: string | null
): ChartPoint[] {
  const actualPoints = history?.points ?? []
  const totalPiles = history?.totalPiles ?? 0
  const todayStr = toDateOnly(new Date().toISOString())

  const startCandidates = [siteCreatedAt ? toDateOnly(siteCreatedAt) : null, actualPoints[0]?.date ?? null].filter(
    (d): d is string => !!d
  )
  if (startCandidates.length === 0 && !targetEndDate) return []
  const startDate = startCandidates.length > 0 ? startCandidates.reduce((a, b) => (a < b ? a : b)) : todayStr

  const dates = new Set<string>([startDate])
  actualPoints.forEach((p) => dates.add(p.date))
  if (targetEndDate) dates.add(targetEndDate)
  if (!targetEndDate || todayStr <= targetEndDate) dates.add(todayStr)

  const start = new Date(`${startDate}T00:00:00`).getTime()
  const end = targetEndDate ? new Date(`${targetEndDate}T00:00:00`).getTime() : start
  const span = Math.max(end - start, 1)

  const actualByDate = new Map(actualPoints.map((p) => [p.date, p.actualCumulative]))
  let runningActual = 0

  return Array.from(dates)
    .sort()
    .map((date) => {
      if (actualByDate.has(date)) runningActual = actualByDate.get(date) as number
      const t = new Date(`${date}T00:00:00`).getTime()
      const ratio = targetEndDate ? Math.min(Math.max((t - start) / span, 0), 1) : null

      return {
        date,
        label: formatAxisDate(date),
        actual: date <= todayStr ? runningActual : null,
        planned: ratio === null ? null : Math.round(ratio * totalPiles),
      }
    })
}

function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const date: string = payload[0]?.payload?.date
  return (
    <div className="min-w-40 rounded-lg bg-white p-3 text-sm shadow-lg ring-1 ring-foreground/10 dark:bg-neutral-900">
      {date && <div className="mb-2 font-medium text-foreground">{formatTooltipDate(date)}</div>}
      <div className="flex flex-col gap-1.5">
        {payload.map((entry: any) => (
          <div key={entry.dataKey} className="flex items-center gap-2">
            <span
              className="h-0.5 w-3 rounded-full"
              style={{ backgroundColor: entry.dataKey === 'actual' ? ACTUAL_COLOR : PLANNED_COLOR }}
            />
            <span className="text-muted-foreground">{entry.name}</span>
            <span className="ml-auto font-semibold tabular-nums text-foreground">
              {entry.value ?? '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function SiteProgressChart({ sites, defaultSiteHistory }: SiteProgressChartProps) {
  const defaultSiteId = sites[0]?.siteId
  const [selectedSiteId, setSelectedSiteId] = useState<string | undefined>(defaultSiteId)
  const activeSiteId = selectedSiteId ?? defaultSiteId

  const historyQuery = useSiteProgressHistory(activeSiteId, defaultSiteId, defaultSiteHistory)
  const selectedSite = sites.find((s) => s.siteId === activeSiteId)

  const chartPoints = useMemo(
    () => buildChartPoints(historyQuery.data, selectedSite?.targetEndDate ?? null, selectedSite?.createdAt ?? null),
    [historyQuery.data, selectedSite?.targetEndDate, selectedSite?.createdAt]
  )

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
          <div
            className={cn(
              'h-72 w-full rounded-lg',
              '[background-image:radial-gradient(circle,var(--color-border)_1px,transparent_1px)]',
              '[background-size:16px_16px]'
            )}
          >
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
                </defs>
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
                  content={<ChartTooltip />}
                  cursor={{ stroke: 'var(--color-muted-foreground)', strokeDasharray: '4 4' }}
                />
                {selectedSite?.targetEndDate && (
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
                )}
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
        {selectedSite && !selectedSite.targetEndDate && chartPoints.length > 0 && (
          <p className="mt-3 text-xs text-muted-foreground">
            Set a target end date on this site to see planned progress alongside actual.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
