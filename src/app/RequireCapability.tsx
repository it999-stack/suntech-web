import { Navigate, Outlet } from 'react-router-dom'
import { useHasCapability } from '@/modules/auth/hooks/useHasCapability'

export function RequireCapability({ capability }: { capability: string }) {
  const allowed = useHasCapability(capability)

  if (!allowed) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
