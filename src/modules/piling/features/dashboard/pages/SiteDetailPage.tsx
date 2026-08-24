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
import { CardSkeleton } from '@/components/skeletons/CardSkeleton'
import { TableSkeleton } from '@/components/skeletons/TableSkeleton'
import { DateRangePicker } from '@/components/DateRangePicker'
import { EmptyState } from '@/components/EmptyState'
import { apiClient } from '@/lib/apiClient'
import { dateOnly, formatTime, today } from '@/lib/date'
import { getErrorMessage } from '@/lib/errors'
import { useSiteMachines } from '@/modules/piling/features/machines/hooks/useMachines'
import { AttentionRequiredPanel } from '../components/site-detail/overview/AttentionRequiredPanel'
import { MachineMultiSelectFilter } from '../components/site-detail/MachineMultiSelectFilter'
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

export default function SiteDetailPage() {
  const { siteId } = useParams<{ siteId: string }>()
  const queryClient = useQueryClient()
  const [range, setRange] = useState<{ from: string; to: string }>({ from: today(), to: today() })
  const [exportingType, setExportingType] = useState<'delay' | 'boring' | null>(null)
  // Empty array = "All Machines" (no filter) — mirrors the ALL sentinel the
  // single-select version used.
  const [selectedMachineIds, setSelectedMachineIds] = useState<string[]>([])
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
  const machineFilterOptions = useMemo(
    () => machineOptions.map((m) => ({ value: m.id, label: m.machineNo })),
    [machineOptions]
  )
  const overview = overviewQuery.data
  const filteredMachines = useMemo(
    () =>
      overview
        ? overview.machines.filter((m) => selectedMachineIds.length === 0 || selectedMachineIds.includes(m.machine.id))
        : [],
    [overview, selectedMachineIds]
  )
  const filteredTimelines = useMemo(
    () =>
      (machineTimelineQuery.data?.machines ?? []).filter(
        (t) => selectedMachineIds.length === 0 || selectedMachineIds.includes(t.machine.id)
      ),
    [machineTimelineQuery.data, selectedMachineIds]
  )
  const filteredPiles = useMemo(
    () =>
      overview
        ? overview.piles.filter(
            (p) =>
              selectedMachineIds.length === 0 ||
              selectedMachineIds.includes(p.rig.id) ||
              (p.crane && selectedMachineIds.includes(p.crane.id))
          )
        : [],
    [overview, selectedMachineIds]
  )

  // Site-wide stats when no machine is selected, or the selected machines'
  // combined numbers otherwise (sums for count/delay figures, averages for
  // percentages) — keeps the KPI row in sync with the machine filter. With
  // exactly one machine selected this reduces to that machine's own numbers,
  // same as the old single-select behavior.
  const statRowData = useMemo(() => {
    if (selectedMachineIds.length === 0) return overview?.stats ?? null
    if (filteredMachines.length === 0) return null
    const utilizationValues = filteredMachines.map((m) => m.utilizationPct).filter((v): v is number => v != null)
    const adherenceValues = filteredMachines.map((m) => m.scheduleAdherencePct).filter((v): v is number => v != null)
    const average = (values: number[]) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : null)
    return {
      pilesCompleted: filteredMachines.reduce((sum, m) => sum + m.pilesCompleted, 0),
      pilesTotal: filteredMachines.reduce((sum, m) => sum + m.pilesTotal, 0),
      activityDelayMin: filteredMachines.reduce((sum, m) => sum + m.activityDelayMin, 0),
      startDelayMin: filteredMachines.reduce((sum, m) => sum + m.startDelayMin, 0),
      rigUtilizationPct: average(utilizationValues),
      scheduleAdherencePct: average(adherenceValues),
    }
  }, [overview, selectedMachineIds, filteredMachines])

  const selectedMachineLabels = useMemo(
    () =>
      selectedMachineIds
        .map((id) => machineFilterOptions.find((i) => i.value === id)?.label)
        .filter((label): label is string => !!label),
    [selectedMachineIds, machineFilterOptions]
  )
  const statRowTitle =
    selectedMachineLabels.length === 0
      ? 'Site overview'
      : selectedMachineLabels.length === 1
        ? `${selectedMachineLabels[0]} overview`
        : `${selectedMachineLabels.length} machines overview`
  const statRowDescription =
    selectedMachineLabels.length === 0
      ? 'Live performance across all rigs and cranes on the selected date'
      : selectedMachineLabels.length === 1
        ? `Live performance for ${selectedMachineLabels[0]} on the selected date`
        : `Live performance for ${selectedMachineLabels.length} selected machines on the selected date`

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
            <MachineMultiSelectFilter
              options={machineFilterOptions}
              selected={selectedMachineIds}
              onApply={setSelectedMachineIds}
            />
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
            resetKey={`${range.from}:${selectedMachineIds.join(',')}`}
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
