import { apiClient } from '@/lib/apiClient'

export interface ClientOption {
  id: string
  name: string
}

async function getClients(): Promise<ClientOption[]> {
  const { data } = await apiClient.get<ClientOption[]>('/piling/clients')
  return data
}

async function updateClient(clientId: string, payload: { name: string }): Promise<void> {
  await apiClient.patch(`/piling/clients/${clientId}`, payload)
}

export const clientsService = {
  getClients,
  updateClient,
}
