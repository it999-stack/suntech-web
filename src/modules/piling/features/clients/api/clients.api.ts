import { apiClient } from '@/lib/apiClient'
import type { ClientListItem, ClientSiteOption, CreateClientPayload, UpdateClientPayload } from '../types/clients.types'

interface RawClientListItem {
  id: string
  name: string
  created_at: string | null
  sites: ClientSiteOption[]
}

function mapClientListItem(raw: RawClientListItem): ClientListItem {
  return {
    id: raw.id,
    name: raw.name,
    sites: raw.sites,
    createdAt: raw.created_at,
  }
}

async function getClients(): Promise<ClientListItem[]> {
  const { data } = await apiClient.get<RawClientListItem[]>('/piling/clients')
  return data.map(mapClientListItem)
}

async function createClient(payload: CreateClientPayload): Promise<void> {
  await apiClient.post('/piling/clients', payload)
}

async function updateClient(clientId: string, payload: UpdateClientPayload): Promise<void> {
  await apiClient.patch(`/piling/clients/${clientId}`, payload)
}

export const clientsService = {
  getClients,
  createClient,
  updateClient,
}
