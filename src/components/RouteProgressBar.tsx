import { useEffect } from 'react'
import { useNavigation } from 'react-router-dom'
import { routeProgress } from '@/lib/nprogress'

/** Mounted once (in Layout.tsx) — sweeps the top progress bar across route transitions. */
export function RouteProgressBar() {
  const navigation = useNavigation()

  useEffect(() => {
    if (navigation.state !== 'idle') {
      routeProgress.start()
    } else {
      routeProgress.done()
    }
  }, [navigation.state])

  return null
}
