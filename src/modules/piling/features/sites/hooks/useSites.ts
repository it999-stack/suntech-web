import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { sitesService } from '../api/sites.api'
import type { UpdateSitePayload } from '../types/sites.types'

export const sitesQueryKeys = {
  list: ['piling-sites'] as const,
}

export function useSites() {
  return useQuery({
    queryKey: sitesQueryKeys.list,
    queryFn: sitesService.getSites,
  })
}

export function useUpdateSite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ siteId, payload }: { siteId: string; payload: UpdateSitePayload }) =>
      sitesService.updateSite(siteId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sitesQueryKeys.list })
    },
  })
}
