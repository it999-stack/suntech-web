import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { personnelService } from '../api/personnel.api'
import type { CreatePersonnelPayload, UpdatePersonnelPayload } from '../types/personnel.types'

export const personnelQueryKeys = {
  bySite: (siteId: string) => ['piling-sites', siteId, 'personnel'] as const,
}

export function useSitePersonnel(siteId: string | undefined) {
  return useQuery({
    queryKey: personnelQueryKeys.bySite(siteId ?? ''),
    queryFn: () => personnelService.getPersonnelForSite(siteId as string),
    enabled: !!siteId,
  })
}

export function useCreatePersonnel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ siteId, payload }: { siteId: string; payload: CreatePersonnelPayload }) =>
      personnelService.createPersonnel(siteId, payload),

    onSuccess: (_data, { siteId }) => {
      queryClient.invalidateQueries({ queryKey: personnelQueryKeys.bySite(siteId) })
    },
  })
}

export function useUpdatePersonnel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      personnelId,
      payload,
    }: {
      siteId: string
      personnelId: string
      payload: UpdatePersonnelPayload
    }) => personnelService.updatePersonnel(personnelId, payload),

    onSuccess: (_data, { siteId }) => {
      queryClient.invalidateQueries({ queryKey: personnelQueryKeys.bySite(siteId) })
    },
  })
}

export function useDeletePersonnel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ personnelId }: { siteId: string; personnelId: string }) =>
      personnelService.deletePersonnel(personnelId),

    onSuccess: (_data, { siteId }) => {
      queryClient.invalidateQueries({ queryKey: personnelQueryKeys.bySite(siteId) })
    },
  })
}
