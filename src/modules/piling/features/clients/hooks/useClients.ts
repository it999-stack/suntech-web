import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { clientsService } from '../api/clients.api'
import type { CreateClientPayload } from '../types/clients.types'

export const clientsQueryKeys = {
  list: ['piling-clients'] as const,
}

export function useClients() {
  return useQuery({
    queryKey: clientsQueryKeys.list,
    queryFn: clientsService.getClients,
  })
}

export function useCreateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateClientPayload) => clientsService.createClient(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientsQueryKeys.list })
    },
  })
}

export function useUpdateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ clientId, name }: { clientId: string; name: string }) =>
      clientsService.updateClient(clientId, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientsQueryKeys.list })
    },
  })
}
