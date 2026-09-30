import { AppSidebar } from "@/components/app-sidebar"
import { InvestmentPositions } from "@/components/investment-positions"
import { InvestmentSummaryCards } from "@/components/investment-summary-cards"
import { CopttrPanel } from "@/components/copttr-panel"
import { RedeemPanel } from "@/components/redeem-panel"
import { SiteHeader } from "@/components/site-header"
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
            <div className="flex flex-col gap-6 py-4 md:gap-8 md:py-6">
              <InvestmentSummaryCards />
              <InvestmentPositions />
              <div className="grid gap-6 px-4 lg:grid-cols-2 lg:px-6">
                <CopttrPanel />
                <RedeemPanel />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
