import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { appUsersService } from '../api/app-users.api'
import type { CreateAppUserPayload, UpdateAppUserPasswordPayload, UpdateAppUserPayload } from '../types/app-users.types'

export const appUsersQueryKeys = {
  bySite: (siteId: string) => ['piling-sites', siteId, 'app-users'] as const,
}

export function useSiteAppUsers(siteId: string | undefined) {
  return useQuery({
    queryKey: appUsersQueryKeys.bySite(siteId ?? ''),
    queryFn: () => appUsersService.getAppUsersForSite(siteId as string),
    enabled: !!siteId,
  })
}

export function useCreateAppUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ siteId, payload }: { siteId: string; payload: CreateAppUserPayload }) =>
      appUsersService.createAppUser(siteId, payload),

    onSuccess: (_data, { siteId }) => {
      queryClient.invalidateQueries({ queryKey: appUsersQueryKeys.bySite(siteId) })
    },
  })
}

export function useUpdateAppUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      siteId,
      userId,
      payload,
    }: {
      siteId: string
      userId: string
      payload: UpdateAppUserPayload
    }) => appUsersService.updateAppUser(siteId, userId, payload),

    onSuccess: (_data, { siteId }) => {
      queryClient.invalidateQueries({ queryKey: appUsersQueryKeys.bySite(siteId) })
    },
  })
}

export function useUpdateAppUserPassword() {
  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: UpdateAppUserPasswordPayload }) =>
      appUsersService.updateAppUserPassword(userId, payload),
  })
}

export function useToggleAppUserActive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ siteId, userId, isActive }: { siteId: string; userId: string; isActive: boolean }) =>
      appUsersService.setAppUserActive(siteId, userId, isActive),

    onSuccess: (_data, { siteId }) => {
      queryClient.invalidateQueries({ queryKey: appUsersQueryKeys.bySite(siteId) })
    },
  })
}

export function useDeleteAppUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ siteId, userId }: { siteId: string; userId: string }) =>
      appUsersService.deleteAppUser(siteId, userId),

    onSuccess: (_data, { siteId }) => {
      queryClient.invalidateQueries({ queryKey: appUsersQueryKeys.bySite(siteId) })
    },
  })
}
