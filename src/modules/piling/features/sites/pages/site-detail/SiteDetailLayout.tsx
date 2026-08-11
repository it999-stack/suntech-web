import { ArrowLeftIcon } from 'lucide-react'
import { Link, NavLink, Outlet, useLocation, useParams } from 'react-router-dom'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useHasCapability } from '@/modules/auth/hooks/useHasCapability'
import { useSite } from '../../hooks/useSites'

const baseSections = [
  { value: 'piles', label: 'Piles', path: 'piles' },
  { value: 'locations', label: 'Locations', path: 'locations' },
  { value: 'piling-steps', label: 'Piling Steps', path: 'piling-steps' },
  { value: 'drawings', label: 'Drawings', path: 'drawings' },
  { value: 'personnel', label: 'Site Personnel', path: 'personnel' },
  { value: 'machines', label: 'Machines', path: 'machines' },
  { value: 'shifts', label: 'Shifts', path: 'shifts' },
]

export default function SiteDetailLayout() {
  const { siteId } = useParams<{ siteId: string }>()
  const location = useLocation()
  const siteQuery = useSite(siteId)
  const canManageAppUsers = useHasCapability('app_users:manage')

  const sections = canManageAppUsers
    ? [...baseSections, { value: 'app-users', label: 'App Users', path: 'app-users' }]
    : baseSections

  const activeValue = location.pathname.split('/').pop()

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-3 items-center">
        <Link
          to="/piling/sites"
          className="justify-self-start text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="size-md" />
        </Link>

        <h1 className="justify-self-center text-xl font-semibold">
          {siteQuery.data?.name ?? 'Site details'}
        </h1>

        <div />
      </div>

      <Tabs value={activeValue}>
        <TabsList variant="line">
          {sections.map((section) => (
            <TabsTrigger
              key={section.value}
              value={section.value}
              nativeButton={false}
              render={<NavLink to={section.path} />}
            >
              {section.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Outlet />
    </div>
  )
}
