/**
 * Wildcard-aware module check — TS port of core/permissions.py's has_module_access().
 * "*" grants everything; a granted string ending in ":*" (e.g. "piling:*") grants any
 * `required` equal to its namespace ("piling") or starting with that prefix ("piling:...").
 */
export function hasModuleAccess(userModules: string[], required: string | null): boolean {
  if (!required) return true

  for (const granted of userModules) {
    if (granted === '*') return true
    if (granted === required) return true
    if (granted.endsWith(':*')) {
      const prefix = granted.slice(0, -1) // "piling:"
      const namespace = granted.slice(0, -2) // "piling"
      if (required === namespace || required.startsWith(prefix)) return true
    }
  }

  return false
}
