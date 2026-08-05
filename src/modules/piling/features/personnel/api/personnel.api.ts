import { apiClient } from '@/lib/apiClient'
import type { CreatePersonnelPayload, SitePersonnel, UpdatePersonnelPayload } from '../types/personnel.types'

interface RawPersonnelOut {
  id: string
  site_id: string
  name: string
  designation: string
  phone: string | null
  email: string | null
  employee_code: string | null
  is_active: boolean
}

interface RawPersonnelWithDeletions {
  items: RawPersonnelOut[]
  deleted_ids: string[]
}

function mapPersonnel(raw: RawPersonnelOut): SitePersonnel {
  return {
    id: raw.id,
    name: raw.name,
    designation: raw.designation,
    phone: raw.phone,
    email: raw.email,
    employeeCode: raw.employee_code,
    isActive: raw.is_active,
  }
}

async function getPersonnelForSite(siteId: string): Promise<SitePersonnel[]> {
  const { data } = await apiClient.get<RawPersonnelWithDeletions>(`/piling/sites/${siteId}/personnel`)
  return data.items.map(mapPersonnel)
}

async function createPersonnel(siteId: string, payload: CreatePersonnelPayload): Promise<void> {
  await apiClient.post(`/piling/sites/${siteId}/personnel`, {
    name: payload.name,
    designation: payload.designation,
    phone: payload.phone,
    email: payload.email,
    employee_code: payload.employeeCode,
    is_active: payload.isActive,
  })
}

async function updatePersonnel(personnelId: string, payload: UpdatePersonnelPayload): Promise<void> {
  await apiClient.patch(`/piling/personnel/${personnelId}`, {
    name: payload.name,
    designation: payload.designation,
    phone: payload.phone,
    email: payload.email,
    employee_code: payload.employeeCode,
    is_active: payload.isActive,
  })
}

async function deletePersonnel(personnelId: string): Promise<void> {
  await apiClient.delete(`/piling/personnel/${personnelId}`)
}

export const personnelService = {
  getPersonnelForSite,
  createPersonnel,
  updatePersonnel,
  deletePersonnel,
}
