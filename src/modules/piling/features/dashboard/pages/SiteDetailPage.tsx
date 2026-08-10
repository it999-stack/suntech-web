import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { ArrowLeftIcon, CalendarIcon, DownloadIcon } from 'lucide-react'
import type { DateRange } from 'react-day-picker'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CardSkeleton } from '@/components/skeletons/CardSkeleton'
import { TableSkeleton } from '@/components/skeletons/TableSkeleton'
import { EmptyState } from '@/components/EmptyState'
import { apiClient } from '@/lib/apiClient'
import { dateOnly, parseDateStr, today } from '@/lib/date'
import { getErrorMessage } from '@/lib/errors'
import { DelaySummaryCard } from '../components/site-detail/DelaySummaryCard'
import { computeDelayTotals } from '../components/site-detail/lib/timelineMath'
import { RangePileTable } from '../components/site-detail/RangePileTable'
import { SitePlanVsActualChart } from '../components/site-detail/SitePlanVsActualChart'
import { SiteProgressRangeChart } from '../components/site-detail/SiteProgressRangeChart'
import { StepStatusTable } from '../components/site-detail/StepStatusTable'
import { buildRangeChartPoints, buildSitePlanVsActualTimeline } from '../api/siteDetail.api'
import {
  useChecklistDetail,
  usePileProgressForRange,
  usePlanState,
  useSite,
  useSiteProgressHistory,
} from '../hooks/useSiteDetailQueries'

export default function SiteDetailPage() {
  const { siteId } = useParams<{ siteId: string }>()
  const [range, setRange] = useState<{ from: string; to: string }>({ from: today(), to: today() })
  const [isExporting, setIsExporting] = useState(false)
  const isSingleDay = range.from === range.to

  const siteQuery = useSite(siteId)
  const planStateQuery = usePlanState(siteId, range.from)
  const checklistQuery = useChecklistDetail(planStateQuery.data?.exists ? planStateQuery.data.checklistId : null)
  const progressHistoryQuery = useSiteProgressHistory(isSingleDay ? undefined : siteId)
  const pileProgressQuery = usePileProgressForRange(
    isSingleDay ? undefined : siteId,
    range.from,
    range.to
  )

  const rows = checklistQuery.data?.rows ?? []
  const chartPoints = useMemo(() => buildSitePlanVsActualTimeline(rows, range.from), [rows, range.from])
  const rangeChartPoints = useMemo(
    () => buildRangeChartPoints(progressHistoryQuery.data, range.from, range.to),
    [progressHistoryQuery.data, range.from, range.to]
  )
  const delayTotals = useMemo(
    () =>
      computeDelayTotals(
        rows,
        checklistQuery.data?.downtimeWindows ?? [],
        checklistQuery.data?.nonWorkingWindows ?? [],
        checklistQuery.data?.planStartTime ?? null,
        new Date()
      ),
    [rows, checklistQuery.data?.downtimeWindows, checklistQuery.data?.nonWorkingWindows, checklistQuery.data?.planStartTime]
  )

  const site = siteQuery.data
  const selectedRange: DateRange = { from: parseDateStr(range.from), to: parseDateStr(range.to) }
  const dateLabel = isSingleDay
    ? format(selectedRange.from!, 'd MMM yyyy')
    : `${format(selectedRange.from!, 'd MMM')} – ${format(selectedRange.to!, 'd MMM yyyy')}`

  const checklistId = planStateQuery.data?.exists ? planStateQuery.data.checklistId : null

  async function handleExportReport() {
    if (!checklistId) return
    setIsExporting(true)
    try {
      const { data } = await apiClient.get(`/piling/checklists/${checklistId}/export/delay-report`, {
        responseType: 'blob',
      })
      const url = URL.createObjectURL(data)
      const link = document.createElement('a')
      link.href = url
      link.download = `piling_delay_report_${range.from}.xlsx`
      link.click()
      URL.revokeObjectURL(url)
      toast.success('Report downloaded successfully')
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to export report'))
    } finally {
      setIsExporting(false)
    }
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
            <Button
              variant="outline"
              size="sm"
              title="Export Report"
              loading={isExporting}
              onClick={handleExportReport}
            >
              {!isExporting && <DownloadIcon className="size-4 text-muted-foreground" />}
            </Button>
          )}
          <Popover>
            <PopoverTrigger render={<Button variant="outline" size="sm" className="gap-2 font-normal" />}>
              <CalendarIcon className="size-4 text-muted-foreground" />
              {dateLabel}
            </PopoverTrigger>
            <PopoverContent align="end" className="w-auto p-2">
              <Calendar
                mode="range"
                selected={selectedRange}
                onSelect={(picked) =>
                  picked?.from && setRange({ from: dateOnly(picked.from), to: dateOnly(picked.to ?? picked.from) })
                }
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {!isSingleDay ? (
        <>
          <SiteProgressRangeChart points={rangeChartPoints} />
          {pileProgressQuery.isLoading ? (
            <TableSkeleton rows={5} columns={6} />
          ) : (
            <RangePileTable rows={pileProgressQuery.data ?? []} siteId={siteId!} from={range.from} to={range.to} />
          )}
        </>
      ) : planStateQuery.isLoading || (planStateQuery.data?.exists && checklistQuery.isLoading) ? (
        <>
          <CardSkeleton lines={6} />
          <TableSkeleton rows={5} columns={8} />
        </>
      ) : !planStateQuery.data?.exists ? (
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
          <SitePlanVsActualChart points={chartPoints} />
          {/* <DelaySummaryCard
            title="Overall Delay — All Piles"
            totalStartDelayMinutes={delayTotals.totalStartDelayMinutes}
            totalActivityDelayMinutes={delayTotals.totalActivityDelayMinutes}
          /> */}
          <StepStatusTable
            rows={rows}
            selectedDate={range.from}
            checklistId={planStateQuery.data.checklistId!}
            downtimeWindows={checklistQuery.data?.downtimeWindows}
            nonWorkingWindows={checklistQuery.data?.nonWorkingWindows}
            planStartTime={checklistQuery.data?.planStartTime}
          />
        </>
      )}
    </div>
  )
}
