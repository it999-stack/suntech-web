import { useMutation } from '@tanstack/react-query'
import { clientsService } from '../api/clients.api'

export function useUpdateClient() {
  return useMutation({
    mutationFn: ({ clientId, name }: { clientId: string; name: string }) =>
      clientsService.updateClient(clientId, { name }),
  })
}
