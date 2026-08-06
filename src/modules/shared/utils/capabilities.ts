/**
 * Role-name-based capabilities, orthogonal to hasModuleAccess(). Some roles share the
 * same module grant (e.g. piling_admin/process_coordinator/app_user all hold "piling:*")
 * but must still be distinguished for specific actions — add a new key here for each
 * such action rather than trying to encode it into modules.
 */
export const ROLE_CAPABILITIES: Record<string, string[]> = {
  'app_users:manage': ['main_admin', 'piling_admin', 'process_coordinator'],
  'sites:manage': ['main_admin', 'piling_admin'],
  'clients:manage': ['main_admin', 'piling_admin'],
  'users:manage': ['main_admin', 'piling_admin'],
}

export function hasCapability(role: string | null | undefined, capability: string): boolean {
  return !!role && (ROLE_CAPABILITIES[capability] ?? []).includes(role)
}
