import { useQuery } from '@tanstack/react-query'
import { siteDetailService } from '../api/siteDetail.api'

export const siteDetailQueryKeys = {
  site: (siteId: string) => ['piling-site-detail', 'site', siteId] as const,
  planState: (siteId: string, date: string) => ['piling-site-detail', 'plan-state', siteId, date] as const,
  checklist: (checklistId: string) => ['piling-site-detail', 'checklist', checklistId] as const,
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
