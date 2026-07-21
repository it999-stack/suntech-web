import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface FormSkeletonProps {
  fields?: number
  title?: boolean
}

/** For future create/edit pages that fetch existing data before rendering a form. */
export function FormSkeleton({ fields = 4, title = true }: FormSkeletonProps) {
  return (
    <Card>
      {title && (
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
      )}
      <CardContent className="flex flex-col gap-4">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
        <Skeleton className="mt-2 h-9 w-24" />
      </CardContent>
    </Card>
  )
}
