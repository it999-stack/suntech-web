import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { ArrowLeftIcon, CalendarIcon } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CardSkeleton } from '@/components/skeletons/CardSkeleton'
import { TableSkeleton } from '@/components/skeletons/TableSkeleton'
import { EmptyState } from '@/components/EmptyState'
import { dateOnly, parseDateStr, today } from '@/lib/date'
import { SitePlanVsActualChart } from '../components/site-detail/SitePlanVsActualChart'
import { StepStatusTable } from '../components/site-detail/StepStatusTable'
import { buildSitePlanVsActualTimeline } from '../api/siteDetail.api'
import { useChecklistDetail, usePlanState, useSite } from '../hooks/useSiteDetailQueries'

export default function SiteDetailPage() {
  const { siteId } = useParams<{ siteId: string }>()
  const [date, setDate] = useState(today)

  const siteQuery = useSite(siteId)
  const planStateQuery = usePlanState(siteId, date)
  const checklistQuery = useChecklistDetail(planStateQuery.data?.exists ? planStateQuery.data.checklistId : null)

  const rows = checklistQuery.data?.rows ?? []
  const chartPoints = useMemo(() => buildSitePlanVsActualTimeline(rows, date), [rows, date])

  const site = siteQuery.data

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

        <Popover>
          <PopoverTrigger render={<Button variant="outline" size="sm" className="gap-2 font-normal" />}>
            <CalendarIcon className="size-4 text-muted-foreground" />
            {format(parseDateStr(date), 'd MMM yyyy')}
          </PopoverTrigger>
          <PopoverContent align="end" className="w-auto p-2">
            <Calendar
              mode="single"
              selected={parseDateStr(date)}
              onSelect={(day) => day && setDate(dateOnly(day))}
            />
          </PopoverContent>
        </Popover>
      </div>

      {planStateQuery.isLoading || (planStateQuery.data?.exists && checklistQuery.isLoading) ? (
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
          <StepStatusTable rows={rows} selectedDate={date} checklistId={planStateQuery.data.checklistId!} />
        </>
      )}
    </div>
  )
}
