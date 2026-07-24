import { useEffect, useState } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { router } from '@/app/AppRouter'
import { queryClient } from '@/lib/queryClient'
import { useAuthStore } from '@/modules/auth/store/authStore'
import { EmptyState } from '@/components/EmptyState'
import { GlobalQueryProgress } from '@/components/GlobalQueryProgress'

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
      <div className="flex min-h-screen items-center justify-center">
        <EmptyState
          loading
          title="Loading dashboard..."
          description="Please wait while we prepare everything."
        />
      </div>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GlobalQueryProgress />
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}

export default App
