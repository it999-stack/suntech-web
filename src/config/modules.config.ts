import {
  BuildingIcon,
  HardHatIcon,
  type LucideIcon,
  ReceiptIcon,
} from 'lucide-react'

export interface NavItem {
  key: string
  label: string
  path: string
  requiredModule: string | null
}

export interface NavGroup {
  key: string
  label: string
  icon: LucideIcon
  requiredModule: string | null
  items: NavItem[]
}

export const NAV_CONFIG: NavGroup[] = [
  {
    key: 'piling',
    label: 'Piling',
    icon: HardHatIcon,
    requiredModule: 'piling:*',
    items: [
      { key: 'dashboard', label: 'Dashboard', path: '/piling/dashboard', requiredModule: 'piling:*' },
      { key: 'sites', label: 'Sites', path: '/piling/sites', requiredModule: 'piling:*' },
      { key: 'clients', label: 'Clients', path: '/piling/clients', requiredModule: 'piling:*' },
      { key: 'piles', label: 'Piles', path: '/piling/piles', requiredModule: 'piling:*' },
      {
        key: 'daily-checklists',
        label: 'Daily Checklists',
        path: '/piling/daily-checklists',
        requiredModule: 'piling:*',
      },
    ],
  },
  {
    key: 'billing',
    label: 'Billing',
    icon: ReceiptIcon,
    requiredModule: 'billing:*',
    items: [
      { key: 'customers', label: 'Customers', path: '/billing/customers', requiredModule: 'billing:*' },
      { key: 'invoices', label: 'Invoices', path: '/billing/invoices', requiredModule: 'billing:*' },
      { key: 'ledger', label: 'Ledger', path: '/billing/ledger', requiredModule: 'billing:*' },
    ],
  },
  {
    key: 'shared',
    label: 'Organization',
    icon: BuildingIcon,
    requiredModule: null,
    items: [{ key: 'companies', label: 'Companies', path: '/shared/companies', requiredModule: null }],
  },
]

/** Every route defined across the nav, in priority order — used to pick a default
 * landing page (first one the user's modules actually grant). */
export const ALL_NAV_ITEMS: NavItem[] = NAV_CONFIG.flatMap((group) => group.items)
