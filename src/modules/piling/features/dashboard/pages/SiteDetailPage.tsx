import { useMemo, useState } from 'react'
import { ArrowLeftIcon, CalendarIcon } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { CardSkeleton } from '@/components/skeletons/CardSkeleton'
import { TableSkeleton } from '@/components/skeletons/TableSkeleton'
import { EmptyState } from '@/components/EmptyState'
import { StepPlanVsActualChart } from '../components/StepPlanVsActualChart'
import { StepStatusTable } from '../components/StepStatusTable'
import { buildStepDurationPoints } from '../api/siteDetail.api'
import { useChecklistDetail, usePlanState, useSite } from '../hooks/useSiteDetailQueries'

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function SiteDetailPage() {
  const { siteId } = useParams<{ siteId: string }>()
  const [date, setDate] = useState(todayStr)

  const siteQuery = useSite(siteId)
  const planStateQuery = usePlanState(siteId, date)
  const checklistQuery = useChecklistDetail(planStateQuery.data?.exists ? planStateQuery.data.checklistId : null)

  const rows = checklistQuery.data?.rows ?? []
  const chartPoints = useMemo(() => buildStepDurationPoints(rows), [rows])

  const site = siteQuery.data

  return (
    <div className="flex flex-col gap-4">
      <Link
        to="/piling/dashboard"
        className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" />
        Back to dashboard
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

        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarIcon className="size-4" />
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-auto"
          />
        </label>
      </div>

      {planStateQuery.isLoading || (planStateQuery.data?.exists && checklistQuery.isLoading) ? (
        <>
          <CardSkeleton lines={6} />
          <TableSkeleton rows={5} columns={8} />
        </>
      ) : !planStateQuery.data?.exists ? (
        <Card>
          <CardHeader>
            <CardTitle>Step Status</CardTitle>
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
          <StepPlanVsActualChart points={chartPoints} />
          <StepStatusTable rows={rows} />
        </>
      )}
    </div>
  )
}
