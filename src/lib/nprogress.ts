import { useEffect } from 'react'
import NProgress from 'nprogress'

NProgress.configure({ showSpinner: false, trickleSpeed: 120, minimum: 0.12 })

export const routeProgress = {
  start: () => NProgress.start(),
  done: () => NProgress.done(),
}

/** Drives the same top progress bar from any React Query `isFetching` flag —
 * used for background refetches (filter/site change), not just route nav. */
export function useQueryProgress(isFetching: boolean) {
  useEffect(() => {
    if (isFetching) {
      routeProgress.start()
    } else {
      routeProgress.done()
    }
  }, [isFetching])
}
