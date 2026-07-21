import { ArrowLeftIcon } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// import { useDashboardSites } from '../hooks/useDashboardQueries'

export default function SiteDetailPage() {
  // const { siteId } = useParams<{ siteId: string }>()
  // const { data: sites } = useDashboardSites()
  // const site = sites?.find((s) => s.siteId === siteId)

  return (
    <div className="flex flex-col gap-4">
      <Link
        to="/piling/dashboard"
        className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" />
        Back to dashboard
      </Link>
      <Card>
        <CardHeader>
          {/* <CardTitle>{site ? site.siteName : 'Site not found'}</CardTitle> */}
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Detailed view coming soon — pile statistics, checklist history, pending resumes,
            delayed steps, machine events, concrete variance, and daily reports for this site
            will live here.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
