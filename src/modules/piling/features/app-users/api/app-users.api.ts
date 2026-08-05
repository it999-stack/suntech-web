import { apiClient } from '@/lib/apiClient'
import type {
  AppUser,
  CreateAppUserPayload,
  UpdateAppUserPasswordPayload,
  UpdateAppUserPayload,
} from '../types/app-users.types'

interface RawAppUserOut {
  id: string
  name: string
  email: string
  is_active: boolean
  created_at: string | null
}

function mapAppUser(raw: RawAppUserOut): AppUser {
  return {
    id: raw.id,
    name: raw.name,
    email: raw.email,
    isActive: raw.is_active,
    createdAt: raw.created_at,
  }
}

async function getAppUsersForSite(siteId: string): Promise<AppUser[]> {
  const { data } = await apiClient.get<RawAppUserOut[]>(`/piling/sites/${siteId}/app-users`)
  return data.map(mapAppUser)
}

async function createAppUser(siteId: string, payload: CreateAppUserPayload): Promise<void> {
  await apiClient.post(`/piling/sites/${siteId}/app-users`, {
    name: payload.name,
    email: payload.email,
    password: payload.password,
  })
}

async function updateAppUser(siteId: string, userId: string, payload: UpdateAppUserPayload): Promise<void> {
  await apiClient.patch(`/piling/app-users/${userId}`, payload, { params: { site_id: siteId } })
}

async function updateAppUserPassword(userId: string, payload: UpdateAppUserPasswordPayload): Promise<void> {
  await apiClient.patch(`/piling/app-users/${userId}/password`, payload)
}

async function setAppUserActive(siteId: string, userId: string, isActive: boolean): Promise<void> {
  await apiClient.patch(`/piling/sites/${siteId}/app-users/${userId}/active`, { is_active: isActive })
}

async function deleteAppUser(siteId: string, userId: string): Promise<void> {
  await apiClient.delete(`/piling/sites/${siteId}/app-users/${userId}`)
}

export const appUsersService = {
  getAppUsersForSite,
  createAppUser,
  updateAppUser,
  updateAppUserPassword,
  setAppUserActive,
  deleteAppUser,
}
