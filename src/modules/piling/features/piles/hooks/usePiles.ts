import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { sitesQueryKeys } from '../../sites/hooks/useSites'
import { pilesService } from '../api/piles.api'
import type { CreatePilePayload, UpdatePilePayload } from '../types/piles.types'

export const pilesQueryKeys = {
  detail: (pileId: string) => ['piles', pileId] as const,
  areaLocations: (siteId: string) => ['piling-sites', siteId, 'piles', 'area-locations'] as const,
}

export function useCreatePile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ siteId, payload }: { siteId: string; payload: CreatePilePayload }) =>
      pilesService.createPile(siteId, payload),

    onSuccess: (_data, { siteId }) => {
      queryClient.invalidateQueries({ queryKey: [...sitesQueryKeys.detail(siteId), 'piles'] })
      queryClient.invalidateQueries({ queryKey: sitesQueryKeys.list })
      queryClient.invalidateQueries({ queryKey: pilesQueryKeys.areaLocations(siteId) })
    },
  })
}

export function usePile(pileId: string | undefined) {
  return useQuery({
    queryKey: pilesQueryKeys.detail(pileId ?? ''),
    queryFn: () => pilesService.getPileById(pileId as string),
    enabled: !!pileId,
    refetchOnWindowFocus: false,
  })
}

export function useUpdatePile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ pileId, payload }: { siteId: string; pileId: string; payload: UpdatePilePayload }) =>
      pilesService.updatePile(pileId, payload),

    onSuccess: (_data, { siteId, pileId }) => {
      queryClient.invalidateQueries({ queryKey: [...sitesQueryKeys.detail(siteId), 'piles'] })
      queryClient.invalidateQueries({ queryKey: sitesQueryKeys.list })
      queryClient.invalidateQueries({ queryKey: pilesQueryKeys.detail(pileId) })
      queryClient.invalidateQueries({ queryKey: pilesQueryKeys.areaLocations(siteId) })
    },
  })
}

export function useDeletePile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ pileId }: { siteId: string; pileId: string }) => pilesService.deletePile(pileId),

    onSuccess: (_data, { siteId }) => {
      queryClient.invalidateQueries({ queryKey: [...sitesQueryKeys.detail(siteId), 'piles'] })
      queryClient.invalidateQueries({ queryKey: sitesQueryKeys.list })
    },
  })
}

export function useAreaLocationSuggestions(siteId: string | undefined) {
  return useQuery({
    queryKey: pilesQueryKeys.areaLocations(siteId ?? ''),
    queryFn: () => pilesService.getAreaLocationSuggestions(siteId as string),
    enabled: !!siteId,
  })
}
