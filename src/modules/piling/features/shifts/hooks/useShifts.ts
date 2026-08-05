import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { shiftsService } from '../api/shifts.api'
import type {
  CreateNonWorkingWindowPayload,
  CreateShiftPayload,
  UpdateNonWorkingWindowPayload,
  UpdateShiftPayload,
} from '../types/shifts.types'

export const shiftsQueryKeys = {
  bySite: (siteId: string) => ['piling-sites', siteId, 'shifts'] as const,
}

export function useSiteShifts(siteId: string | undefined) {
  return useQuery({
    queryKey: shiftsQueryKeys.bySite(siteId ?? ''),
    queryFn: () => shiftsService.getShiftsForSite(siteId as string),
    enabled: !!siteId,
  })
}

export function useCreateShift() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ siteId, payload }: { siteId: string; payload: CreateShiftPayload }) =>
      shiftsService.createShift(siteId, payload),

    onSuccess: (_data, { siteId }) => {
      queryClient.invalidateQueries({ queryKey: shiftsQueryKeys.bySite(siteId) })
    },
  })
}

export function useUpdateShift() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ shiftId, payload }: { siteId: string; shiftId: string; payload: UpdateShiftPayload }) =>
      shiftsService.updateShift(shiftId, payload),

    onSuccess: (_data, { siteId }) => {
      queryClient.invalidateQueries({ queryKey: shiftsQueryKeys.bySite(siteId) })
    },
  })
}

export function useDeleteShift() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ shiftId }: { siteId: string; shiftId: string }) => shiftsService.deleteShift(shiftId),

    onSuccess: (_data, { siteId }) => {
      queryClient.invalidateQueries({ queryKey: shiftsQueryKeys.bySite(siteId) })
    },
  })
}

export function useCreateNonWorkingWindow() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ payload }: { siteId: string; payload: CreateNonWorkingWindowPayload }) =>
      shiftsService.createWindow(payload),

    onSuccess: (_data, { siteId }) => {
      queryClient.invalidateQueries({ queryKey: shiftsQueryKeys.bySite(siteId) })
    },
  })
}

export function useUpdateNonWorkingWindow() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      windowId,
      payload,
    }: {
      siteId: string
      windowId: string
      payload: UpdateNonWorkingWindowPayload
    }) => shiftsService.updateWindow(windowId, payload),

    onSuccess: (_data, { siteId }) => {
      queryClient.invalidateQueries({ queryKey: shiftsQueryKeys.bySite(siteId) })
    },
  })
}

export function useDeleteNonWorkingWindow() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ windowId }: { siteId: string; windowId: string }) =>
      shiftsService.deleteWindow(windowId),

    onSuccess: (_data, { siteId }) => {
      queryClient.invalidateQueries({ queryKey: shiftsQueryKeys.bySite(siteId) })
    },
  })
}
