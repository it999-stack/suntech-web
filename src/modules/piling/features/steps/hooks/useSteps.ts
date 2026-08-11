import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { stepsService } from '../api/steps.api'
import type { UpsertDurationTemplatePayload } from '../types/steps.types'

export const stepsQueryKeys = {
  bySite: (siteId: string) => ['piling-sites', siteId, 'steps'] as const,
}

export function useSiteSteps(siteId: string | undefined) {
  return useQuery({
    queryKey: stepsQueryKeys.bySite(siteId ?? ''),
    queryFn: () => stepsService.getStepsForSite(siteId as string),
    enabled: !!siteId,
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
    mutationFn: ({ stepId, isSplittable }: { siteId: string; stepId: string; isSplittable: boolean }) =>
      stepsService.updateStep(stepId, isSplittable),

    onSuccess: (_data, { siteId }) => {
      queryClient.invalidateQueries({ queryKey: stepsQueryKeys.bySite(siteId) })
    },
  })
}
