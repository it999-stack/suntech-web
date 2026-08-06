export interface ClientSiteOption {
  id: string
  name: string
}

export interface ClientListItem {
  id: string
  name: string
  sites: ClientSiteOption[]
  createdAt: string | null
}

export interface CreateClientPayload {
  name: string
}

export interface UpdateClientPayload {
  name: string
}
