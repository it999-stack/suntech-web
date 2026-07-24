import { useIsFetching, useIsMutating } from '@tanstack/react-query'
import { useQueryProgress } from '@/lib/nprogress'

/** Mounted once (in App.tsx) — drives the top progress bar off React Query's
 * global fetch/mutation state, so every query in the app shows it automatically
 * without each page having to wire up useQueryProgress itself. */
export function GlobalQueryProgress() {
  const isFetching = useIsFetching()
  const isMutating = useIsMutating()
  useQueryProgress(isFetching > 0 || isMutating > 0)
  return null
}
