import { useNavigation } from 'react-router-dom'
import { useQueryProgress } from '@/lib/nprogress'

/** Mounted once (in Layout.tsx) — sweeps the top progress bar across route transitions. */
export function RouteProgressBar() {
  const navigation = useNavigation()
  useQueryProgress(navigation.state !== 'idle')
  return null
}
