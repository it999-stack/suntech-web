import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { sitesQueryKeys } from '../../sites/hooks/useSites'
import { pilesService } from '../api/piles.api'
import type { CreatePilePayload, PileImportRowResult, UpdatePilePayload } from '../types/piles.types'

export const pilesQueryKeys = {
  detail: (pileId: string) => ['piles', pileId] as const,
  areas: (siteId: string) => ['piling-sites', siteId, 'piles', 'areas'] as const,
}

export function useCreatePile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ siteId, payload }: { siteId: string; payload: CreatePilePayload }) =>
      pilesService.createPile(siteId, payload),

    onSuccess: (_data, { siteId }) => {
      queryClient.invalidateQueries({ queryKey: [...sitesQueryKeys.detail(siteId), 'piles'] })
      queryClient.invalidateQueries({ queryKey: sitesQueryKeys.list })
      queryClient.invalidateQueries({ queryKey: pilesQueryKeys.areas(siteId) })
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
      queryClient.invalidateQueries({ queryKey: pilesQueryKeys.areas(siteId) })
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

export function useAreaSuggestions(siteId: string | undefined) {
  return useQuery({
    queryKey: pilesQueryKeys.areas(siteId ?? ''),
    queryFn: () => pilesService.getAreaSuggestions(siteId as string),
    enabled: !!siteId,
  })
}

export function usePreviewPileImport() {
  return useMutation({
    mutationFn: ({ siteId, file }: { siteId: string; file: File }) =>
      pilesService.previewPileImport(siteId, file),
  })
}

export function useConfirmPileImport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ siteId, rows }: { siteId: string; rows: PileImportRowResult[] }) =>
      pilesService.confirmPileImport(siteId, rows),

    onSuccess: (_data, { siteId }) => {
      queryClient.invalidateQueries({ queryKey: [...sitesQueryKeys.detail(siteId), 'piles'] })
      queryClient.invalidateQueries({ queryKey: sitesQueryKeys.list })
      queryClient.invalidateQueries({ queryKey: pilesQueryKeys.areas(siteId) })
    },
  })
}
