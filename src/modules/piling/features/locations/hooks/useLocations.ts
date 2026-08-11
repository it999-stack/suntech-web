import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { locationsService } from '../api/locations.api'
import type { CreateLocationPayload, UpdateLocationPayload } from '../types/locations.types'

export const locationsQueryKeys = {
  bySite: (siteId: string) => ['piling-sites', siteId, 'locations'] as const,
}

export function useSiteLocations(siteId: string | undefined) {
  return useQuery({
    queryKey: locationsQueryKeys.bySite(siteId ?? ''),
    queryFn: () => locationsService.getLocationsForSite(siteId as string),
    enabled: !!siteId,
  })
}

export function useCreateLocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ siteId, payload }: { siteId: string; payload: CreateLocationPayload }) =>
      locationsService.createLocation(siteId, payload),

    onSuccess: (_data, { siteId }) => {
      queryClient.invalidateQueries({ queryKey: locationsQueryKeys.bySite(siteId) })
    },
  })
}

export function useUpdateLocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      locationId,
      payload,
    }: {
      siteId: string
      locationId: string
      payload: UpdateLocationPayload
    }) => locationsService.updateLocation(locationId, payload),

    onSuccess: (_data, { siteId }) => {
      queryClient.invalidateQueries({ queryKey: locationsQueryKeys.bySite(siteId) })
    },
  })
}

export function useDeleteLocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ locationId }: { siteId: string; locationId: string }) =>
      locationsService.deleteLocation(locationId),

    onSuccess: (_data, { siteId }) => {
      queryClient.invalidateQueries({ queryKey: locationsQueryKeys.bySite(siteId) })
    },
  })
}
