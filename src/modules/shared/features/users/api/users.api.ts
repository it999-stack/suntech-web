import { apiClient } from '@/lib/apiClient'
import type {
  CreateUserPayload,
  SiteOption,
  UpdateUserPasswordPayload,
  UpdateUserPayload,
  UserListItem,
  UserRole,
} from '../types/users.types'

interface RawUserOut {
  id: string
  name: string
  email: string
  role: UserRole
  sites: SiteOption[]
}

function mapUser(raw: RawUserOut): UserListItem {
  return {
    id: raw.id,
    name: raw.name,
    email: raw.email,
    role: raw.role,
    sites: raw.sites,
  }
}

async function getUsers(): Promise<UserListItem[]> {
  const { data } = await apiClient.get<RawUserOut[]>('/shared/users')
  return data.map(mapUser)
}

async function createUser(payload: CreateUserPayload): Promise<void> {
  await apiClient.post('/shared/users', {
    name: payload.name,
    email: payload.email,
    password: payload.password,
    role: payload.role,
    site_ids: payload.siteIds,
  })
}

async function updateUser(userId: string, payload: UpdateUserPayload): Promise<void> {
  await apiClient.patch(`/shared/users/${userId}`, {
    name: payload.name,
    email: payload.email,
    role: payload.role,
    site_ids: payload.siteIds,
  })
}

async function updateUserPassword(userId: string, payload: UpdateUserPasswordPayload): Promise<void> {
  await apiClient.patch(`/shared/users/${userId}/password`, payload)
}

async function deleteUser(userId: string): Promise<void> {
  await apiClient.delete(`/shared/users/${userId}`)
}

export const usersService = {
  getUsers,
  createUser,
  updateUser,
  updateUserPassword,
  deleteUser,
}
