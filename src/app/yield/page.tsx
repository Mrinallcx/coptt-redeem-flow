import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { YieldStakeForm } from "@/components/yield-stake-form"
import { YieldStats } from "@/components/yield-stats"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export default function Page() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-6 px-4 py-4 md:gap-8 md:py-6 lg:px-6">
              <div className="text-center">
                <h1 className="text-base font-semibold">Earn</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Stake COPTT to receive stCOPTT. 1 COPTT = 1 metric ton of copper.
                </p>
              </div>
              <YieldStakeForm />
              <YieldStats />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
