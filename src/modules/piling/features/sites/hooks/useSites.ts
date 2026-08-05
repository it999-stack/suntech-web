import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { sitesService } from '../api/sites.api'
import type { SitePileListParams, CreateSitePayload, UpdateSitePayload } from '../types/sites.types'

export const sitesQueryKeys = {
  companies: ['companies'] as const,
  list: ['piling-sites'] as const,
  detail: (siteId: string) => ['piling-sites', siteId] as const,
  piles: (siteId: string, params: SitePileListParams) =>
    ['piling-sites', siteId, 'piles', params] as const,
}

export function useCompanies() {
  return useQuery({
    queryKey: sitesQueryKeys.companies,
    queryFn: sitesService.getCompanies,
  })
}

export function useSites() {
  return useQuery({
    queryKey: sitesQueryKeys.list,
    queryFn: sitesService.getSites,
  })
}

export function useSite(siteId: string | undefined) {
  return useQuery({
    queryKey: sitesQueryKeys.detail(siteId ?? ''),
    queryFn: () => sitesService.getSiteById(siteId as string),
    enabled: !!siteId,
  })
}

export function useSitePiles(siteId: string | undefined, params: SitePileListParams) {
  return useQuery({
    queryKey: sitesQueryKeys.piles(siteId ?? '', params),
    queryFn: () => sitesService.getSitePiles(siteId as string, params),
    enabled: !!siteId,
    placeholderData: keepPreviousData,
  })
}

export function useCreateSite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      clientId,
      payload,
    }: {
      clientId: string
      payload: CreateSitePayload
    }) => sitesService.createSite(clientId, payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: sitesQueryKeys.list,
      })
    },
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
