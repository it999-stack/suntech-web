export type UserRole = 'piling_admin' | 'process_coordinator' | 'app_user'

export const ROLE_OPTIONS: { value: UserRole; label: string; siteScoped: boolean }[] = [
  { value: 'piling_admin', label: 'Piling Admin', siteScoped: false },
  { value: 'process_coordinator', label: 'Process Coordinator', siteScoped: true },
  { value: 'app_user', label: 'App User', siteScoped: true },
]

export function isSiteScopedRole(role: UserRole): boolean {
  return ROLE_OPTIONS.find((option) => option.value === role)?.siteScoped ?? false
}

export interface SiteOption {
  id: string
  name: string
}

export interface UserListItem {
  id: string
  name: string
  email: string
  role: UserRole
  sites: SiteOption[]
}

export interface CreateUserPayload {
  name: string
  email: string
  password: string
  role: UserRole
  siteIds: string[]
}

export interface UpdateUserPayload {
  name?: string
  email?: string
  role?: UserRole
  siteIds?: string[]
}

export interface UpdateUserPasswordPayload {
  password: string
}
