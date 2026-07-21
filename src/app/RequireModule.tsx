import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/modules/auth/store/authStore'
import { hasModuleAccess } from '@/modules/shared/utils/access'

export function RequireModule({ module }: { module: string }) {
  const modules = useAuthStore((state) => state.user?.modules ?? [])

  if (!hasModuleAccess(modules, module)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
