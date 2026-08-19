import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { contractorsService } from '../api/contractors.api'
import type { CreateContractorPayload, UpdateContractorPayload } from '../types/contractors.types'

export const contractorsQueryKeys = {
  bySite: (siteId: string) => ['piling-sites', siteId, 'contractors'] as const,
}

export function useSiteContractors(siteId: string | undefined) {
  return useQuery({
    queryKey: contractorsQueryKeys.bySite(siteId ?? ''),
    queryFn: () => contractorsService.getContractorsForSite(siteId as string),
    enabled: !!siteId,
  })
}

export function useCreateContractor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ siteId, payload }: { siteId: string; payload: CreateContractorPayload }) =>
      contractorsService.createContractor(siteId, payload),

    onSuccess: (_data, { siteId }) => {
      queryClient.invalidateQueries({ queryKey: contractorsQueryKeys.bySite(siteId) })
    },
  })
}

export function useUpdateContractor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      contractorId,
      payload,
    }: {
      siteId: string
      contractorId: string
      payload: UpdateContractorPayload
    }) => contractorsService.updateContractor(contractorId, payload),

    onSuccess: (_data, { siteId }) => {
      queryClient.invalidateQueries({ queryKey: contractorsQueryKeys.bySite(siteId) })
    },
  })
}

export function useDeleteContractor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ contractorId }: { siteId: string; contractorId: string }) =>
      contractorsService.deleteContractor(contractorId),

    onSuccess: (_data, { siteId }) => {
      queryClient.invalidateQueries({ queryKey: contractorsQueryKeys.bySite(siteId) })
    },
  })
}
