import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { NAV_CONFIG } from "@/config/modules.config"
import { useAuthStore } from "@/modules/auth/store/authStore"
import { hasModuleAccess } from "@/modules/shared/utils/access"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = useAuthStore((state) => state.user)
  const userModules = user?.modules ?? []

  const navItems = NAV_CONFIG.filter((group) => hasModuleAccess(userModules, group.requiredModule)).map(
    (group) => ({
      title: group.label,
      icon: <group.icon />,
      isActive: true,
      items: group.items
        .filter((item) => hasModuleAccess(userModules, item.requiredModule))
        .map((item) => ({ title: item.label, url: item.path })),
    })
  )

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            S
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">Suntech</span>
            <span className="truncate text-xs text-muted-foreground">Infra</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        {user && <NavUser user={{ name: user.name, email: user.email, role: user.role }} />}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
