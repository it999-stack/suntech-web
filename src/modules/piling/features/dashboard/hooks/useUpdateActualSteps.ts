import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { toLocalIsoString } from '@/lib/date'
import { siteDetailQueryKeys } from './useSiteDetailQueries'

export interface ActualStepUpdate {
  stepId: string
  actualStart: Date | null
  actualEnd: Date | null
}

interface UpdateActualStepsVars {
  checklistPileId: string
  entries: ActualStepUpdate[]
}

function toPayload(entries: ActualStepUpdate[]) {
  return entries.map((entry) => ({
    step_id: entry.stepId,
    actual_start: entry.actualStart ? toLocalIsoString(entry.actualStart) : null,
    actual_end: entry.actualEnd ? toLocalIsoString(entry.actualEnd) : null,
  }))
}

export function useUpdateActualSteps(checklistId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ checklistPileId, entries }: UpdateActualStepsVars) =>
      apiClient.patch(`/piling/checklist-piles/${checklistPileId}/actual`, toPayload(entries)),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: siteDetailQueryKeys.checklist(checklistId) })
    },
  })
}
