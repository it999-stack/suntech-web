import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { machinesService } from '../api/machines.api'
import type { CreateMachinePayload, UpdateMachinePayload } from '../types/machines.types'

export const machinesQueryKeys = {
  bySite: (siteId: string) => ['piling-sites', siteId, 'machines'] as const,
}

export function useSiteMachines(siteId: string | undefined) {
  return useQuery({
    queryKey: machinesQueryKeys.bySite(siteId ?? ''),
    queryFn: () => machinesService.getMachinesForSite(siteId as string),
    enabled: !!siteId,
  })
}

export function useCreateMachine() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ siteId, payload }: { siteId: string; payload: CreateMachinePayload }) =>
      machinesService.createMachine(siteId, payload),

    onSuccess: (_data, { siteId }) => {
      queryClient.invalidateQueries({ queryKey: machinesQueryKeys.bySite(siteId) })
    },
  })
}

export function useUpdateMachine() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      machineId,
      payload,
    }: {
      siteId: string
      machineId: string
      payload: UpdateMachinePayload
    }) => machinesService.updateMachine(machineId, payload),

    onSuccess: (_data, { siteId }) => {
      queryClient.invalidateQueries({ queryKey: machinesQueryKeys.bySite(siteId) })
    },
  })
}

export function useDeleteMachine() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ machineId }: { siteId: string; machineId: string }) =>
      machinesService.deleteMachine(machineId),

    onSuccess: (_data, { siteId }) => {
      queryClient.invalidateQueries({ queryKey: machinesQueryKeys.bySite(siteId) })
    },
  })
}
