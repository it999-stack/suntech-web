import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useQueryProgress } from '@/lib/nprogress'

interface StaleContentProps {
  /** Pass `query.isFetching && !query.isLoading` — true during a background
   * refetch (filter/site change) but not the very first load, which should
   * show a skeleton instead of dimming empty content. */
  isFetching: boolean
  children: ReactNode
  className?: string
}

/**
 * Stale-while-revalidate wrapper: keeps the previous data visible (dimmed) while
 * a background refetch runs, instead of swapping to a skeleton. Pair with
 * `placeholderData: keepPreviousData` from `@tanstack/react-query` on the query
 * so `data` doesn't briefly go undefined between filter/site changes. Also drives
 * the shared top progress bar for the duration of the refetch.
 */
export function StaleContent({ isFetching, children, className }: StaleContentProps) {
  useQueryProgress(isFetching)

  return (
    <div className={cn(isFetching && 'opacity-60 transition-opacity', className)}>{children}</div>
  )
}
