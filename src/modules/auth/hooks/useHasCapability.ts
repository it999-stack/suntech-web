import { hasCapability } from '@/modules/shared/utils/capabilities'
import { useAuthStore } from '../store/authStore'

export function useHasCapability(capability: string): boolean {
  const role = useAuthStore((state) => state.user?.role ?? null)
  return hasCapability(role, capability)
}
