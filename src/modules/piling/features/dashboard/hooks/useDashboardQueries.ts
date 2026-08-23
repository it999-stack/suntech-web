import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '../api/dashboard.api'

export const dashboardQueryKeys = {
  dashboard: (dateFrom: string, dateTo: string) => ['piling-dashboard', dateFrom, dateTo] as const,
  alerts: ['piling-dashboard', 'alerts'] as const,
  activity: ['piling-dashboard', 'activity'] as const,
}

export function useDashboardData(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: dashboardQueryKeys.dashboard(dateFrom, dateTo),
    queryFn: () => dashboardService.getDashboard(dateFrom, dateTo),
  })
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
