import { Navigate } from 'react-router-dom'
import { ALL_NAV_ITEMS } from '@/config/modules.config'
import { useAuthStore } from '@/modules/auth/store/authStore'
import { hasModuleAccess } from '@/modules/shared/utils/access'

/** Sends the user to the first nav route their modules actually grant. */
export function RootRedirect() {
  const modules = useAuthStore((state) => state.user?.modules ?? [])
  const landing = ALL_NAV_ITEMS.find((item) => hasModuleAccess(modules, item.requiredModule))

  return <Navigate to={landing?.path ?? '/login'} replace />
}
