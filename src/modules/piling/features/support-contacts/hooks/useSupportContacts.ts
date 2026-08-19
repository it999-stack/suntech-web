import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supportContactsService } from '../api/support-contacts.api'
import type { CreateSupportContactPayload, UpdateSupportContactPayload } from '../types/support-contacts.types'

export const supportContactsQueryKeys = {
  bySite: (siteId: string) => ['piling-sites', siteId, 'support-contacts'] as const,
  candidatesBySite: (siteId: string) => ['piling-sites', siteId, 'support-contacts', 'candidates'] as const,
}

export function useSiteSupportContacts(siteId: string | undefined) {
  return useQuery({
    queryKey: supportContactsQueryKeys.bySite(siteId ?? ''),
    queryFn: () => supportContactsService.getSupportContactsForSite(siteId as string),
    enabled: !!siteId,
  })
}

export function useSupportContactCandidates(siteId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: supportContactsQueryKeys.candidatesBySite(siteId ?? ''),
    queryFn: () => supportContactsService.getSupportContactCandidates(siteId as string),
    enabled: !!siteId && enabled,
  })
}

export function useCreateSupportContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ siteId, payload }: { siteId: string; payload: CreateSupportContactPayload }) =>
      supportContactsService.createSupportContact(siteId, payload),

    onSuccess: (_data, { siteId }) => {
      queryClient.invalidateQueries({ queryKey: supportContactsQueryKeys.bySite(siteId) })
      queryClient.invalidateQueries({ queryKey: supportContactsQueryKeys.candidatesBySite(siteId) })
    },
  })
}

export function useUpdateSupportContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      contactId,
      payload,
    }: {
      siteId: string
      contactId: string
      payload: UpdateSupportContactPayload
    }) => supportContactsService.updateSupportContact(contactId, payload),

    onSuccess: (_data, { siteId }) => {
      queryClient.invalidateQueries({ queryKey: supportContactsQueryKeys.bySite(siteId) })
    },
  })
}

export function useDeleteSupportContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ contactId }: { siteId: string; contactId: string }) =>
      supportContactsService.deleteSupportContact(contactId),

    onSuccess: (_data, { siteId }) => {
      queryClient.invalidateQueries({ queryKey: supportContactsQueryKeys.bySite(siteId) })
      queryClient.invalidateQueries({ queryKey: supportContactsQueryKeys.candidatesBySite(siteId) })
    },
  })
}
