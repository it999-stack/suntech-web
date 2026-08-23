import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '../api/dashboard.api'
import { siteDetailService } from '../api/siteDetail.api'

export const siteDetailQueryKeys = {
  site: (siteId: string) => ['piling-site-detail', 'site', siteId] as const,
  planState: (siteId: string, date: string) => ['piling-site-detail', 'plan-state', siteId, date] as const,
  checklist: (checklistId: string) => ['piling-site-detail', 'checklist', checklistId] as const,
  progressHistory: (siteId: string) => ['piling-site-detail', 'progress-history', siteId] as const,
  pileProgressRange: (siteId: string, from: string, to: string) =>
    ['piling-site-detail', 'pile-progress-range', siteId, from, to] as const,
  pileStepsRange: (pileId: string, from: string, to: string) =>
    ['piling-site-detail', 'pile-steps-range', pileId, from, to] as const,
  dashboardOverview: (siteId: string, date: string) =>
    ['piling-site-detail', 'dashboard-overview', siteId, date] as const,
  machineTimeline: (siteId: string, date: string) =>
    ['piling-site-detail', 'machine-timeline', siteId, date] as const,
}

export function useSite(siteId: string | undefined) {
  return useQuery({
    queryKey: siteDetailQueryKeys.site(siteId ?? ''),
    queryFn: () => siteDetailService.getSite(siteId as string),
    enabled: !!siteId,
  })
}

export function usePlanState(siteId: string | undefined, date: string) {
  return useQuery({
    queryKey: siteDetailQueryKeys.planState(siteId ?? '', date),
    queryFn: () => siteDetailService.getPlanState(siteId as string, date),
    enabled: !!siteId,
  })
}

export function useChecklistDetail(checklistId: string | null | undefined) {
  return useQuery({
    queryKey: siteDetailQueryKeys.checklist(checklistId ?? ''),
    queryFn: () => siteDetailService.getChecklistDetail(checklistId as string),
    enabled: !!checklistId,
  })
}

// Full (unfiltered) daily plan-vs-actual history for the site, sliced
// client-side to whatever date range the user picks on the detail page.
export function useSiteProgressHistory(siteId: string | undefined) {
  return useQuery({
    queryKey: siteDetailQueryKeys.progressHistory(siteId ?? ''),
    queryFn: () => dashboardService.getSiteProgressHistory(siteId as string),
    enabled: !!siteId,
  })
}

// Drives the range pile table — lightweight, no step-level detail.
export function usePileProgressForRange(siteId: string | undefined, from: string, to: string) {
  return useQuery({
    queryKey: siteDetailQueryKeys.pileProgressRange(siteId ?? '', from, to),
    queryFn: () => siteDetailService.getPileProgressForRange(siteId as string, from, to),
    enabled: !!siteId,
  })
}

// One pile's full step detail for the range — fetched lazily (prefetched for
// the first ~10 rows, on demand for the rest); cached by [pileId, from, to]
// so re-opening an already-fetched pile is free.
export function usePileStepsForRange(pileId: string | undefined, from: string, to: string, enabled: boolean) {
  return useQuery({
    queryKey: siteDetailQueryKeys.pileStepsRange(pileId ?? '', from, to),
    queryFn: () => siteDetailService.getPileStepsForRange(pileId as string, from, to),
    enabled: !!pileId && enabled,
  })
}

// Drives the redesigned single-day page: stat tiles, machine (rig/crane)
// cards, area summary, and the piles overview table's rows. Deliberately
// excludes the Gantt timeline (see useMachineTimeline) and per-step detail
// (see usePileStepsForRange, fetched lazily only once a pile is opened).
export function useSiteDashboardOverview(siteId: string | undefined, date: string) {
  return useQuery({
    queryKey: siteDetailQueryKeys.dashboardOverview(siteId ?? '', date),
    queryFn: () => siteDetailService.getSiteDashboardOverview(siteId as string, date),
    enabled: !!siteId,
  })
}

// Own query so the Gantt's data doesn't block the overview's initial paint —
// no idle/delay math on the backend, just plan/actual timestamps per machine.
export function useMachineTimeline(siteId: string | undefined, date: string) {
  return useQuery({
    queryKey: siteDetailQueryKeys.machineTimeline(siteId ?? '', date),
    queryFn: () => siteDetailService.getMachineTimeline(siteId as string, date),
    enabled: !!siteId,
  })
}
