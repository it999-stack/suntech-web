export type SupportContactSource = 'app_user' | 'process_coordinator' | 'site_personnel' | 'other'

export const SUPPORT_CONTACT_SOURCE_LABELS: Record<SupportContactSource, string> = {
  app_user: 'App User',
  process_coordinator: 'Site Coordinator',
  site_personnel: 'Site Personnel',
  other: 'Other',
}

export interface SupportContact {
  id: string
  personId: string
  name: string
  email: string | null
  phone: string
  source: SupportContactSource
  isActive: boolean
}

export interface SupportContactCandidate {
  personId: string
  name: string
  email: string | null
  source: SupportContactSource
}

export interface CreateSupportContactPayload {
  personId: string
  phone: string
}

export interface UpdateSupportContactPayload {
  phone?: string
  isActive?: boolean
}
