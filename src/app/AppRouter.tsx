import { createBrowserRouter, Navigate } from 'react-router-dom'
import LoginPage from '@/modules/auth/pages'
import CustomersPage from '@/modules/billing/features/customers/pages'
import InvoicesPage from '@/modules/billing/features/invoices/pages'
import LedgerPage from '@/modules/billing/features/ledger/pages'
import ClientsPage from '@/modules/piling/features/clients/pages'
import DailyChecklistsPage from '@/modules/piling/features/daily-checklists/pages'
import PilingDashboardPage from '@/modules/piling/features/dashboard/pages'
import SiteDetailPage from '@/modules/piling/features/dashboard/pages/SiteDetailPage'
import SitesPage from '@/modules/piling/features/sites/pages'
import SiteAppUsersPage from '@/modules/piling/features/sites/pages/site-detail/SiteAppUsersPage'
import SiteLocationsPage from '@/modules/piling/features/sites/pages/site-detail/SiteLocationsPage'
import SiteDetailLayout from '@/modules/piling/features/sites/pages/site-detail/SiteDetailLayout'
import SiteContractorsPage from '@/modules/piling/features/sites/pages/site-detail/SiteContractorsPage'
import SiteDrawingsPage from '@/modules/piling/features/sites/pages/site-detail/SiteDrawingsPage'
import SiteMachinesPage from '@/modules/piling/features/sites/pages/site-detail/SiteMachinesPage'
import SitePersonnelPage from '@/modules/piling/features/sites/pages/site-detail/SitePersonnelPage'
import SitePilesPage from '@/modules/piling/features/sites/pages/site-detail/SitePilesPage'
import SitePilingStepsPage from '@/modules/piling/features/sites/pages/site-detail/SitePilingStepsPage'
import SiteShiftsPage from '@/modules/piling/features/sites/pages/site-detail/SiteShiftsPage'
import SiteSupportContactsPage from '@/modules/piling/features/sites/pages/site-detail/SiteSupportContactsPage'
import CompaniesPage from '@/modules/shared/features/companies/pages'
import UsersPage from '@/modules/shared/features/users/pages'
import { Layout } from './Layout'
import { ProtectedRoute } from './ProtectedRoute'
import { RequireCapability } from './RequireCapability'
import { RequireModule } from './RequireModule'
import { RootRedirect } from './RootRedirect'

export const router = createBrowserRouter([
  { path: 'login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          { index: true, element: <RootRedirect /> },
          {
            element: <RequireModule module="piling:*" />,
            children: [
              { path: 'piling/dashboard', element: <PilingDashboardPage /> },
              { path: 'piling/dashboard/sites/:siteId', element: <SiteDetailPage /> },
              { path: 'piling/sites', element: <SitesPage /> },
              {
                path: 'piling/sites/:siteId',
                element: <SiteDetailLayout />,
                children: [
                  { index: true, element: <Navigate to="piles" replace /> },
                  { path: 'piles', element: <SitePilesPage /> },
                  { path: 'locations', element: <SiteLocationsPage /> },
                  { path: 'piling-steps', element: <SitePilingStepsPage /> },
                  { path: 'drawings', element: <SiteDrawingsPage /> },
                  { path: 'personnel', element: <SitePersonnelPage /> },
                  { path: 'machines', element: <SiteMachinesPage /> },
                  { path: 'contractors', element: <SiteContractorsPage /> },
                  { path: 'shifts', element: <SiteShiftsPage /> },
                  {
                    path: 'app-users',
                    element: <RequireCapability capability="app_users:manage" />,
                    children: [{ index: true, element: <SiteAppUsersPage /> }],
                  },
                  {
                    path: 'help-support',
                    element: <RequireCapability capability="app_users:manage" />,
                    children: [{ index: true, element: <SiteSupportContactsPage /> }],
                  },
                ],
              },
              { path: 'piling/clients', element: <ClientsPage /> },
              { path: 'piling/daily-checklists', element: <DailyChecklistsPage /> },
            ],
          },
          {
            element: <RequireModule module="billing:*" />,
            children: [
              { path: 'billing/customers', element: <CustomersPage /> },
              { path: 'billing/invoices', element: <InvoicesPage /> },
              { path: 'billing/ledger', element: <LedgerPage /> },
            ],
          },
          { path: 'shared/companies', element: <CompaniesPage /> },
          {
            element: <RequireCapability capability="users:manage" />,
            children: [{ path: 'shared/users', element: <UsersPage /> }],
          },
        ],
      },
    ],
  },
])
