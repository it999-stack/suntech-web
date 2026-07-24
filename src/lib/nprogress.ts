import { useEffect } from 'react'
import NProgress from 'nprogress'

NProgress.configure({ showSpinner: false, trickleSpeed: 120, minimum: 0.12 })

// Reference-counted so multiple simultaneous callers (route nav + background
// fetches) don't stomp on each other — the bar only clears once every caller
// that started it has finished.
let activeCount = 0

function increment() {
  activeCount += 1
  if (activeCount === 1) NProgress.start()
}

function decrement() {
  activeCount = Math.max(0, activeCount - 1)
  if (activeCount === 0) NProgress.done()
}

export const routeProgress = { start: increment, done: decrement }

/** Drives the shared top progress bar while `active` is true. Safe to call from
 * multiple places at once (route nav, per-query refetches, global fetch state). */
export function useQueryProgress(active: boolean) {
  useEffect(() => {
    if (!active) return
    increment()
    return () => decrement()
  }, [active])
}
