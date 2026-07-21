import { createBrowserRouter } from 'react-router-dom'
import LoginPage from '@/modules/auth/pages'
import CustomersPage from '@/modules/billing/features/customers/pages'
import InvoicesPage from '@/modules/billing/features/invoices/pages'
import LedgerPage from '@/modules/billing/features/ledger/pages'
import ClientsPage from '@/modules/piling/features/clients/pages'
import DailyChecklistsPage from '@/modules/piling/features/daily-checklists/pages'
import PilingDashboardPage from '@/modules/piling/features/dashboard/pages'
import SiteDetailPage from '@/modules/piling/features/dashboard/pages/SiteDetailPage'
import PilesPage from '@/modules/piling/features/piles/pages'
import SitesPage from '@/modules/piling/features/sites/pages'
import CompaniesPage from '@/modules/shared/features/companies/pages'
import { Layout } from './Layout'
import { ProtectedRoute } from './ProtectedRoute'
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
              { path: 'piling/clients', element: <ClientsPage /> },
              { path: 'piling/piles', element: <PilesPage /> },
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
        ],
      },
    ],
  },
])
