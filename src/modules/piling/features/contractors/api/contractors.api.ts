import { apiClient } from '@/lib/apiClient'
import type { Contractor, CreateContractorPayload, UpdateContractorPayload } from '../types/contractors.types'

interface RawContractorOut {
  id: string
  site_id: string
  name: string
  is_active: boolean
}

interface RawContractorsWithDeletions {
  items: RawContractorOut[]
  deleted_ids: string[]
}

function mapContractor(raw: RawContractorOut): Contractor {
  return {
    id: raw.id,
    name: raw.name,
    isActive: raw.is_active,
  }
}

async function getContractorsForSite(siteId: string): Promise<Contractor[]> {
  const { data } = await apiClient.get<RawContractorsWithDeletions>(`/piling/sites/${siteId}/contractors`)
  return data.items.map(mapContractor)
}

async function createContractor(siteId: string, payload: CreateContractorPayload): Promise<void> {
  await apiClient.post(`/piling/sites/${siteId}/contractors`, {
    name: payload.name,
    is_active: payload.isActive,
  })
}

async function updateContractor(contractorId: string, payload: UpdateContractorPayload): Promise<void> {
  await apiClient.patch(`/piling/contractors/${contractorId}`, {
    name: payload.name,
    is_active: payload.isActive,
  })
}

async function deleteContractor(contractorId: string): Promise<void> {
  await apiClient.delete(`/piling/contractors/${contractorId}`)
}

export const contractorsService = {
  getContractorsForSite,
  createContractor,
  updateContractor,
  deleteContractor,
}
