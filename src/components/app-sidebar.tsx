"use client"

import * as React from "react"
import Link from "next/link"
import {
  CircleHelpIcon,
  FolderIcon,
  LayoutDashboardIcon,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

import { useAuth } from "@/contexts/auth-context"

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: (
        <LayoutDashboardIcon
        />
      ),
    },
    {
      title: "Investments",
      url: "/investments",
      icon: (
        <FolderIcon
        />
      ),
    },
  ],
}

export const SUPPORT_EMAIL = "support@totofinance.co"

// Support has no way to look a user up from a bare email, so the account
// address goes in the body when we know who is asking.
function supportMailto(userEmail?: string): string {
  const subject = "COPTT portal — support request"
  const body = userEmail
    ? `\n\n---\nAccount: ${userEmail}`
    : ""
  const query = new URLSearchParams({ subject })
  if (body) query.set("body", body)
  return `mailto:${SUPPORT_EMAIL}?${query.toString()}`
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // The signed-in user from auth context. On first render (before
  // AuthProvider's hydration effect has run) it's null — we fall back to
  // empty strings so the layout doesn't shift; once hydrated the real
  // values populate in place.
  const { user } = useAuth()
  const sidebarUser = {
    name: user?.name || user?.email?.split("@")[0] || "",
    email: user?.email || "",
    avatar: user?.picture || "",
  }

  const navSecondary = React.useMemo(
    () => [
      {
        title: "Get Help",
        url: supportMailto(user?.email),
        icon: <CircleHelpIcon />,
      },
    ],
    [user?.email],
  )

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<a href="/dashboard" />}
            >
              <img
                src="/logo.png"
                alt="Toto Finance logo"
                className="size-6 object-contain"
              />
              <span className="text-base font-semibold">Toto Finance</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <div className="mt-auto px-2 pb-1 group-data-[collapsible=icon]:hidden">
          <Link
            href="/yield"
            className="flex items-center gap-2.5 rounded-xl bg-[color-mix(in_oklab,var(--background),var(--foreground)_10%)] px-3 py-2.5 transition-colors duration-150 hover:bg-accent"
          >
            <span
              aria-hidden="true"
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground"
            >
              <svg
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
              >
                <path d="M2.00488 19H22.0049V21H2.00488V19ZM2.00488 5L7.00488 8.5L12.0049 2L17.0049 8.5L22.0049 5V17H2.00488V5ZM4.00488 8.84131V15H20.0049V8.84131L16.5854 11.2349L12.0049 5.28024L7.42435 11.2349L4.00488 8.84131Z" />
              </svg>
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="text-[13px] leading-4 font-medium text-foreground">
                Earn
              </span>
              <span className="text-pretty text-xs text-muted-foreground">
                Stake COPTT for stCOPTT
              </span>
            </span>
          </Link>
        </div>
        <NavSecondary items={navSecondary} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={sidebarUser} />
      </SidebarFooter>
    </Sidebar>
  )
}
