import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'

type ChecklistPileStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

interface ToggleStatusVars {
  checklistPileId: string
  status: ChecklistPileStatus
}

/**
 * Optimistic-update recipe for quick toggles (e.g. marking a checklist pile's
 * status without waiting on the round trip). Not wired into a page yet — no
 * daily-checklists UI exists to call it from — but the endpoint it hits
 * (`PATCH /piling/checklist-piles/{id}`) is real, so this is ready to import
 * once that page is built. `any` stands in for the checklist shape below
 * because `checklist.types.ts` hasn't been filled in yet; replace it with the
 * real checklist type at that point.
 *
 * @param checklistQueryKey - the query key holding the parent checklist this
 *   pile belongs to (e.g. `['piling-checklist', checklistId]`).
 */
export function useUpdateChecklistPileStatus(checklistQueryKey: QueryKey) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ checklistPileId, status }: ToggleStatusVars) =>
      apiClient.patch(`/piling/checklist-piles/${checklistPileId}`, { status }),

    onMutate: async ({ checklistPileId, status }) => {
      await queryClient.cancelQueries({ queryKey: checklistQueryKey })
      const previous = queryClient.getQueryData(checklistQueryKey)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      queryClient.setQueryData(checklistQueryKey, (old: any) => {
        if (!old) return old
        return {
          ...old,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          checklist_piles: old.checklist_piles.map((pile: any) =>
            pile.id === checklistPileId ? { ...pile, status } : pile
          ),
        }
      })

      return { previous }
    },

    onError: (_error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(checklistQueryKey, context.previous)
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: checklistQueryKey })
    },
  })
}
