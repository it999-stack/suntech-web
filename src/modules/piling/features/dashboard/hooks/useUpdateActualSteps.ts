import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { toLocalIsoString } from '@/lib/date'

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

// Caller decides what to invalidate on success (single-day mode invalidates
// the whole checklist; the range table invalidates that pile's range query)
// — a save can span more than one checklistPileId when the edited rows come
// from a multi-day range, so the caller may fire this once per day-group.
export function useUpdateActualSteps() {
  return useMutation({
    mutationFn: ({ checklistPileId, entries }: UpdateActualStepsVars) =>
      apiClient.patch(`/piling/checklist-piles/${checklistPileId}/actual`, toPayload(entries)),
  })
}
