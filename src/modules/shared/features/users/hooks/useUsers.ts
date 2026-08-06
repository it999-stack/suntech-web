import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { usersService } from '../api/users.api'
import type { CreateUserPayload, UpdateUserPasswordPayload, UpdateUserPayload } from '../types/users.types'

export const usersQueryKeys = {
  list: ['shared-users'] as const,
}

export function useUsers() {
  return useQuery({
    queryKey: usersQueryKeys.list,
    queryFn: usersService.getUsers,
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateUserPayload) => usersService.createUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersQueryKeys.list })
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: UpdateUserPayload }) =>
      usersService.updateUser(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersQueryKeys.list })
    },
  })
}

export function useUpdateUserPassword() {
  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: UpdateUserPasswordPayload }) =>
      usersService.updateUserPassword(userId, payload),
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => usersService.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersQueryKeys.list })
    },
  })
}
