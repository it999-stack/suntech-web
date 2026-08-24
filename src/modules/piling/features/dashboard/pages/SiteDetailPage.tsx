import { useMemo, useState } from 'react'
import { ArrowLeftIcon, CalendarIcon, DownloadIcon, RefreshCwIcon } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CardSkeleton } from '@/components/skeletons/CardSkeleton'
import { TableSkeleton } from '@/components/skeletons/TableSkeleton'
import { DateRangePicker } from '@/components/DateRangePicker'
import { EmptyState } from '@/components/EmptyState'
import { apiClient } from '@/lib/apiClient'
import { dateOnly, formatTime, today } from '@/lib/date'
import { getErrorMessage } from '@/lib/errors'
import { useSiteMachines } from '@/modules/piling/features/machines/hooks/useMachines'
import { AttentionRequiredPanel } from '../components/site-detail/overview/AttentionRequiredPanel'
import { PilesOverviewTable } from '../components/site-detail/overview/PilesOverviewTable'
import { MachineActivityTimeline } from '../components/site-detail/overview/MachineActivityTimeline'
import { MachinePerformanceSection } from '../components/site-detail/overview/MachinePerformanceSection'
import { SiteDashboardStatRow } from '../components/site-detail/overview/SiteDashboardStatRow'
import { SummaryByLocation } from '../components/site-detail/overview/SummaryByLocation'
import { RangePileTable } from '../components/site-detail/RangePileTable'
import { SiteProgressRangeChart } from '../components/site-detail/SiteProgressRangeChart'
import { buildRangeChartPoints } from '../api/siteDetail.api'
import type { AttentionAlert } from '../types/dashboard.types'
import {
  siteDetailQueryKeys,
  useMachineTimeline,
  usePileProgressForRange,
  usePlanState,
  useSite,
  useSiteDashboardOverview,
  useSiteProgressHistory,
} from '../hooks/useSiteDetailQueries'

const ALL = 'all'

export default function SiteDetailPage() {
  const { siteId } = useParams<{ siteId: string }>()
  const queryClient = useQueryClient()
  const [range, setRange] = useState<{ from: string; to: string }>({ from: today(), to: today() })
  const [exportingType, setExportingType] = useState<'delay' | 'boring' | null>(null)
  const [machineFilter, setMachineFilter] = useState<string>(ALL)
  const [focusPileId, setFocusPileId] = useState<string | null>(null)
  const isSingleDay = range.from === range.to

  const siteQuery = useSite(siteId)
  const planStateQuery = usePlanState(siteId, range.from)
  const progressHistoryQuery = useSiteProgressHistory(isSingleDay ? undefined : siteId)
  const pileProgressQuery = usePileProgressForRange(isSingleDay ? undefined : siteId, range.from, range.to)

  const overviewQuery = useSiteDashboardOverview(isSingleDay ? siteId : undefined, range.from)
  const machineTimelineQuery = useMachineTimeline(isSingleDay ? siteId : undefined, range.from)
  const machinesQuery = useSiteMachines(siteId)

  const rangeChartPoints = useMemo(
    () => buildRangeChartPoints(progressHistoryQuery.data, range.from, range.to),
    [progressHistoryQuery.data, range.from, range.to]
  )

  // The Machine Activity Timeline's notion of "now" — the real clock when
  // viewing today, or the end of the selected day otherwise. Using the real
  // clock unconditionally would drag a past date's axis (and any of its
  // still-open steps) all the way out to the actual current moment, days
  // later, wrecking the hour-tick spacing.
  const referenceNow = useMemo(() => {
    const now = new Date()
    return range.from === dateOnly(now) ? now : new Date(`${range.from}T23:59:59`)
  }, [range.from])

  const machineOptions = useMemo(
    () => (machinesQuery.data ?? []).filter((m) => m.type === 'RIG' || m.type === 'CRANE'),
    [machinesQuery.data]
  )
  const machineFilterItems = useMemo(
    () => [
      { value: ALL, label: 'All Machines' },
      ...machineOptions.map((m) => ({ value: m.id, label: m.machineNo })),
    ],
    [machineOptions]
  )
  const overview = overviewQuery.data
  const filteredMachines = useMemo(
    () => (overview ? overview.machines.filter((m) => machineFilter === ALL || m.machine.id === machineFilter) : []),
    [overview, machineFilter]
  )
  const filteredTimelines = useMemo(
    () =>
      (machineTimelineQuery.data?.machines ?? []).filter(
        (t) => machineFilter === ALL || t.machine.id === machineFilter
      ),
    [machineTimelineQuery.data, machineFilter]
  )
  const filteredPiles = useMemo(
    () =>
      overview
        ? overview.piles.filter(
            (p) => machineFilter === ALL || p.rig.id === machineFilter || p.crane?.id === machineFilter
          )
        : [],
    [overview, machineFilter]
  )

  // Site-wide stats when no machine is selected, or the single selected
  // machine's own numbers otherwise — keeps the KPI row in sync with the
  // machine filter.
  const statRowData = useMemo(() => {
    if (machineFilter === ALL) return overview?.stats ?? null
    const machine = filteredMachines[0]
    if (!machine) return null
    return {
      pilesCompleted: machine.pilesCompleted,
      pilesTotal: machine.pilesTotal,
      activityDelayMin: machine.activityDelayMin,
      startDelayMin: machine.startDelayMin,
      rigUtilizationPct: machine.utilizationPct,
      scheduleAdherencePct: machine.scheduleAdherencePct,
    }
  }, [overview, machineFilter, filteredMachines])

  const selectedMachineLabel =
    machineFilter === ALL ? null : machineFilterItems.find((i) => i.value === machineFilter)?.label
  const statRowTitle = selectedMachineLabel ? `${selectedMachineLabel} overview` : 'Site overview'
  const statRowDescription = selectedMachineLabel
    ? `Live performance for ${selectedMachineLabel} on the selected date`
    : 'Live performance across all rigs and cranes on the selected date'

  const site = siteQuery.data

  const checklistId = planStateQuery.data?.exists ? planStateQuery.data.checklistId : null

  async function handleExport(type: 'delay' | 'boring') {
    if (!checklistId) return
    setExportingType(type)
    try {
      const endpoint = type === 'delay' ? 'delay-report' : 'boring-checklist'
      const filenamePrefix = type === 'delay' ? 'piling_delay_report' : 'piling_boring_checklist'
      const { data } = await apiClient.get(`/piling/checklists/${checklistId}/export/${endpoint}`, {
        responseType: 'blob',
      })
      const url = URL.createObjectURL(data)
      const link = document.createElement('a')
      link.href = url
      link.download = `${filenamePrefix}_${range.from}.xlsx`
      link.click()
      URL.revokeObjectURL(url)
      toast.success('Report downloaded successfully')
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to export report'))
    } finally {
      setExportingType(null)
    }
  }

  function handleRefresh() {
    if (!siteId) return
    queryClient.invalidateQueries({ queryKey: siteDetailQueryKeys.dashboardOverview(siteId, range.from) })
    queryClient.invalidateQueries({ queryKey: siteDetailQueryKeys.machineTimeline(siteId, range.from) })
  }

  function handleViewAlert(alert: AttentionAlert) {
    if (!alert.targetId) return
    if (alert.targetType === 'machine') {
      document
        .getElementById(`machine-card-${alert.targetId}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      return
    }
    // Pile-type alert targets carry the checklist_pile_id — PilesOverviewTable
    // opens by the physical pile id instead, so resolve it from the already-
    // fetched overview rows rather than adding a second lookup endpoint.
    const pile = overview?.piles.find((p) => p.checklistPileId === alert.targetId)
    if (pile) setFocusPileId(pile.pileId)
  }

  return (
    <div className="flex flex-col gap-4">
      <Link
        to="/piling/dashboard"
        className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" />
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          {siteQuery.isLoading ? (
            <div className="h-7 w-48 animate-pulse rounded bg-muted" />
          ) : (
            <>
              <h1 className="text-xl font-semibold text-foreground">{site?.name ?? 'Site not found'}</h1>
              {site && (
                <p className="text-sm text-muted-foreground">
                  {site.clientName} · {site.companyName}
                  {site.location ? ` · ${site.location}` : ''}
                </p>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isSingleDay && checklistId && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 font-normal"
                    title="Download Report"
                    loading={exportingType !== null}
                  />
                }
              >
                {!exportingType && (
                  <>
                    <DownloadIcon className="size-4 text-muted-foreground" />
                    <span>Download Report</span>
                  </>
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem disabled={exportingType !== null} onClick={() => handleExport('delay')}>
                  Delay Report
                </DropdownMenuItem>
                <DropdownMenuItem disabled={exportingType !== null} onClick={() => handleExport('boring')}>
                  Boring Checklist
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <DateRangePicker from={range.from} to={range.to} onChange={setRange} align="end" />
        </div>
      </div>

      {isSingleDay && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Select value={machineFilter} onValueChange={(v) => setMachineFilter(v ?? ALL)} items={machineFilterItems}>
              <SelectTrigger size="sm" className="w-40">
                <SelectValue placeholder="All Machines" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {machineFilterItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          {overview && (
            <button
              type="button"
              onClick={handleRefresh}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <RefreshCwIcon className={`size-3.5 ${overviewQuery.isFetching ? 'animate-spin' : ''}`} />
              Last updated: {formatTime(overview.lastUpdated)}
            </button>
          )}
        </div>
      )}

      {!isSingleDay ? (
        <>
          <SiteProgressRangeChart points={rangeChartPoints} />
          {pileProgressQuery.isLoading ? (
            <TableSkeleton rows={5} columns={6} />
          ) : (
            <RangePileTable rows={pileProgressQuery.data ?? []} siteId={siteId!} from={range.from} to={range.to} />
          )}
        </>
      ) : planStateQuery.isLoading || overviewQuery.isLoading ? (
        <>
          <CardSkeleton lines={6} />
          <TableSkeleton rows={5} columns={8} />
        </>
      ) : !planStateQuery.data?.exists || !overview?.checklistExists ? (
        <Card>
          <CardHeader>
            <CardTitle>Site Status</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={CalendarIcon}
              title="No plan for this date"
              description="No checklist has been generated for this site on the selected date."
            />
          </CardContent>
        </Card>
      ) : (
        <>
          {statRowData && (
            <SiteDashboardStatRow stats={statRowData} title={statRowTitle} description={statRowDescription} />
          )}
          <MachinePerformanceSection machines={filteredMachines} />
          <MachineActivityTimeline
            timelines={filteredTimelines}
            machines={filteredMachines}
            referenceNow={referenceNow}
            planStartTime={machineTimelineQuery.data?.planStartTime ?? null}
            isLoading={machineTimelineQuery.isLoading}
            resetKey={`${range.from}:${machineFilter}`}
          />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <AttentionRequiredPanel alerts={overview.alerts} onView={handleViewAlert} />
            </div>
            <div className="lg:col-span-2">
              <PilesOverviewTable piles={filteredPiles} siteId={siteId!} date={range.from} focusPileId={focusPileId} />
            </div>
          </div>
          <SummaryByLocation locations={overview.areas} />
        </>
      )}
    </div>
  )
}
