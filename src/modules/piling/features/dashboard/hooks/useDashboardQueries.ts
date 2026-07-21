import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '../api/dashboard.api'
import type { SiteProgressHistory } from '../types/dashboard.types'

export const dashboardQueryKeys = {
  dashboard: ['piling-dashboard'] as const,
  siteHistory: (siteId: string) => ['piling-dashboard', 'site-history', siteId] as const,
  alerts: ['piling-dashboard', 'alerts'] as const,
  activity: ['piling-dashboard', 'activity'] as const,
}

export function useDashboardData() {
  return useQuery({
    queryKey: dashboardQueryKeys.dashboard,
    queryFn: dashboardService.getDashboard,
  })
}

// Reuses the default site's history embedded in the dashboard payload when the
// filter is still on the default site — only fetches when the user picks a
// different site, keeping first paint down to a single request.
export function useSiteProgressHistory(
  siteId: string | undefined,
  defaultSiteId: string | undefined,
  defaultHistory: SiteProgressHistory | null | undefined
) {
  const isDefaultSite = !!siteId && siteId === defaultSiteId

  const query = useQuery({
    queryKey: dashboardQueryKeys.siteHistory(siteId ?? ''),
    queryFn: () => dashboardService.getSiteProgressHistory(siteId as string),
    enabled: !!siteId && !isDefaultSite,
  })

  if (isDefaultSite) {
    return { data: defaultHistory ?? undefined, isLoading: false, isError: false }
  }
  return query
}

export function useDashboardAlerts() {
  return useQuery({
    queryKey: dashboardQueryKeys.alerts,
    queryFn: dashboardService.getAlerts,
  })
}

export function useDashboardActivity() {
  return useQuery({
    queryKey: dashboardQueryKeys.activity,
    queryFn: dashboardService.getRecentActivity,
  })
}
