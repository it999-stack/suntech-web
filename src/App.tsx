import { useEffect, useState } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { router } from '@/app/AppRouter'
import { queryClient } from '@/lib/queryClient'
import { useAuthStore } from '@/modules/auth/store/authStore'

function App() {
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const token = useAuthStore((state) => state.token)
  const restoreSession = useAuthStore((state) => state.restoreSession)

  useEffect(() => {
    if (token) {
      restoreSession().finally(() => setIsBootstrapping(false))
    } else {
      setIsBootstrapping(false)
    }
    // Only ever run once, on initial mount — restoreSession/token intentionally excluded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (isBootstrapping) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}

export default App
