import { apiClient } from '@/lib/apiClient'

async function updateClient(clientId: string, payload: { name: string }): Promise<void> {
  await apiClient.patch(`/piling/clients/${clientId}`, payload)
}

export const clientsService = {
  updateClient,
}
