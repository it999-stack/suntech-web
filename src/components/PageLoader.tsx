import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

interface PageLoaderProps {
  className?: string
}

export function PageLoader({ className }: PageLoaderProps) {
  return (
    <div className={cn('flex flex-1 items-center justify-center', className)}>
      <Spinner className="size-6 text-muted-foreground" />
    </div>
  )
}
