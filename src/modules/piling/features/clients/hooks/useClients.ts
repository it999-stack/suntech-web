import { useMutation, useQuery } from '@tanstack/react-query'
import { clientsService } from '../api/clients.api'

export const clientsQueryKeys = {
  list: ['piling-clients'] as const,
}

export function useClients() {
  return useQuery({
    queryKey: clientsQueryKeys.list,
    queryFn: clientsService.getClients,
  })
}

export function useUpdateClient() {
  return useMutation({
    mutationFn: ({ clientId, name }: { clientId: string; name: string }) =>
      clientsService.updateClient(clientId, { name }),
  })
}
