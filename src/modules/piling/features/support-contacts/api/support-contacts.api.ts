import { apiClient } from '@/lib/apiClient'
import type {
  CreateSupportContactPayload,
  SupportContact,
  SupportContactCandidate,
  SupportContactSource,
  UpdateSupportContactPayload,
} from '../types/support-contacts.types'

interface RawSupportContactOut {
  id: string
  person_id: string
  name: string
  email: string | null
  phone: string
  source: SupportContactSource
  is_active: boolean
}

interface RawSupportContactCandidateOut {
  person_id: string
  name: string
  email: string | null
  source: SupportContactSource
}

function mapSupportContact(raw: RawSupportContactOut): SupportContact {
  return {
    id: raw.id,
    personId: raw.person_id,
    name: raw.name,
    email: raw.email,
    phone: raw.phone,
    source: raw.source,
    isActive: raw.is_active,
  }
}

function mapCandidate(raw: RawSupportContactCandidateOut): SupportContactCandidate {
  return {
    personId: raw.person_id,
    name: raw.name,
    email: raw.email,
    source: raw.source,
  }
}

async function getSupportContactsForSite(siteId: string): Promise<SupportContact[]> {
  const { data } = await apiClient.get<RawSupportContactOut[]>(`/piling/sites/${siteId}/support-contacts`)
  return data.map(mapSupportContact)
}

async function getSupportContactCandidates(siteId: string): Promise<SupportContactCandidate[]> {
  const { data } = await apiClient.get<RawSupportContactCandidateOut[]>(
    `/piling/sites/${siteId}/support-contacts/candidates`
  )
  return data.map(mapCandidate)
}

async function createSupportContact(siteId: string, payload: CreateSupportContactPayload): Promise<void> {
  await apiClient.post(`/piling/sites/${siteId}/support-contacts`, {
    person_id: payload.personId,
    phone: payload.phone,
  })
}

async function updateSupportContact(contactId: string, payload: UpdateSupportContactPayload): Promise<void> {
  await apiClient.patch(`/piling/support-contacts/${contactId}`, {
    phone: payload.phone,
    is_active: payload.isActive,
  })
}

async function deleteSupportContact(contactId: string): Promise<void> {
  await apiClient.delete(`/piling/support-contacts/${contactId}`)
}

export const supportContactsService = {
  getSupportContactsForSite,
  getSupportContactCandidates,
  createSupportContact,
  updateSupportContact,
  deleteSupportContact,
}
