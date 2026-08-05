import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { dimensionsService } from '../api/dimensions.api'
import type { CreateDimensionPayload, UpdateDimensionPayload } from '../types/dimensions.types'

export const dimensionsQueryKeys = {
  bySite: (siteId: string) => ['piling-sites', siteId, 'dimensions'] as const,
}

export function useSiteDimensions(siteId: string | undefined) {
  return useQuery({
    queryKey: dimensionsQueryKeys.bySite(siteId ?? ''),
    queryFn: () => dimensionsService.getDimensionsForSite(siteId as string),
    enabled: !!siteId,
  })
}

export function useCreateDimension() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ siteId, payload }: { siteId: string; payload: CreateDimensionPayload }) =>
      dimensionsService.createDimension(siteId, payload),

    onSuccess: (_data, { siteId }) => {
      queryClient.invalidateQueries({ queryKey: dimensionsQueryKeys.bySite(siteId) })
    },
  })
}

export function useUpdateDimension() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      dimensionId,
      payload,
    }: {
      siteId: string
      dimensionId: string
      payload: UpdateDimensionPayload
    }) => dimensionsService.updateDimension(dimensionId, payload),

    onSuccess: (_data, { siteId }) => {
      queryClient.invalidateQueries({ queryKey: dimensionsQueryKeys.bySite(siteId) })
    },
  })
}

export function useDeleteDimension() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ dimensionId }: { siteId: string; dimensionId: string }) =>
      dimensionsService.deleteDimension(dimensionId),

    onSuccess: (_data, { siteId }) => {
      queryClient.invalidateQueries({ queryKey: dimensionsQueryKeys.bySite(siteId) })
    },
  })
}
