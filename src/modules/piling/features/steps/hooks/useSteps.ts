import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { stepsService } from '../api/steps.api'
import type { AddSiteStepPayload, UpsertDurationTemplatePayload } from '../types/steps.types'

export const stepsQueryKeys = {
  bySite: (siteId: string) => ['piling-sites', siteId, 'steps'] as const,
  catalogBySite: (siteId: string) => ['piling-sites', siteId, 'steps', 'catalog'] as const,
}

export function useSiteSteps(siteId: string | undefined) {
  return useQuery({
    queryKey: stepsQueryKeys.bySite(siteId ?? ''),
    queryFn: () => stepsService.getStepsForSite(siteId as string),
    enabled: !!siteId,
  })
}

export function useSiteStepCatalog(siteId: string | undefined) {
  return useQuery({
    queryKey: stepsQueryKeys.catalogBySite(siteId ?? ''),
    queryFn: () => stepsService.getCatalogStepsForSite(siteId as string),
    enabled: !!siteId,
  })
}

function invalidateSiteSteps(queryClient: ReturnType<typeof useQueryClient>, siteId: string) {
  queryClient.invalidateQueries({ queryKey: stepsQueryKeys.bySite(siteId) })
  queryClient.invalidateQueries({ queryKey: stepsQueryKeys.catalogBySite(siteId) })
}

export function useAddSiteStep() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ siteId, payload }: { siteId: string; payload: AddSiteStepPayload }) =>
      stepsService.addSiteStep(siteId, payload),

    onSuccess: (_data, { siteId }) => invalidateSiteSteps(queryClient, siteId),
  })
}

export function useRemoveSiteStep() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ siteId, siteStepId }: { siteId: string; siteStepId: string }) =>
      stepsService.removeSiteStep(siteId, siteStepId),

    onSuccess: (_data, { siteId }) => invalidateSiteSteps(queryClient, siteId),
  })
}

export function useReorderSiteSteps() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ siteId, orderedSiteStepIds }: { siteId: string; orderedSiteStepIds: string[] }) =>
      stepsService.reorderSiteSteps(siteId, orderedSiteStepIds),

    onSuccess: (_data, { siteId }) => {
      queryClient.invalidateQueries({ queryKey: stepsQueryKeys.bySite(siteId) })
    },
  })
}

export function useCreateDurationTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ siteId, payload }: { siteId: string; payload: UpsertDurationTemplatePayload }) =>
      stepsService.createDurationTemplate(siteId, payload),

    onSuccess: (_data, { siteId }) => {
      queryClient.invalidateQueries({ queryKey: stepsQueryKeys.bySite(siteId) })
    },
  })
}

export function useUpdateDurationTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      templateId,
      payload,
    }: {
      siteId: string
      templateId: string
      payload: UpsertDurationTemplatePayload
    }) => stepsService.updateDurationTemplate(templateId, payload),

    onSuccess: (_data, { siteId }) => {
      queryClient.invalidateQueries({ queryKey: stepsQueryKeys.bySite(siteId) })
    },
  })
}

export function useUpdateStep() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ siteId, siteStepId, isSplittable }: { siteId: string; siteStepId: string; isSplittable: boolean }) =>
      stepsService.updateStep(siteId, siteStepId, isSplittable),

    onSuccess: (_data, { siteId }) => {
      queryClient.invalidateQueries({ queryKey: stepsQueryKeys.bySite(siteId) })
    },
  })
}
