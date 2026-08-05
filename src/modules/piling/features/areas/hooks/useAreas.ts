import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { areasService } from '../api/areas.api'
import type { CreateAreaPayload, UpdateAreaPayload } from '../types/areas.types'

export const areasQueryKeys = {
  bySite: (siteId: string) => ['piling-sites', siteId, 'areas'] as const,
}

export function useSiteAreas(siteId: string | undefined) {
  return useQuery({
    queryKey: areasQueryKeys.bySite(siteId ?? ''),
    queryFn: () => areasService.getAreasForSite(siteId as string),
    enabled: !!siteId,
  })
}

export function useCreateArea() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ siteId, payload }: { siteId: string; payload: CreateAreaPayload }) =>
      areasService.createArea(siteId, payload),

    onSuccess: (_data, { siteId }) => {
      queryClient.invalidateQueries({ queryKey: areasQueryKeys.bySite(siteId) })
    },
  })
}

export function useUpdateArea() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      areaId,
      payload,
    }: {
      siteId: string
      areaId: string
      payload: UpdateAreaPayload
    }) => areasService.updateArea(areaId, payload),

    onSuccess: (_data, { siteId }) => {
      queryClient.invalidateQueries({ queryKey: areasQueryKeys.bySite(siteId) })
    },
  })
}

export function useDeleteArea() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ areaId }: { siteId: string; areaId: string }) => areasService.deleteArea(areaId),

    onSuccess: (_data, { siteId }) => {
      queryClient.invalidateQueries({ queryKey: areasQueryKeys.bySite(siteId) })
    },
  })
}
