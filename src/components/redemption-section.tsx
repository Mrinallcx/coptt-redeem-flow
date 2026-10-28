"use client"

import { useState } from "react"

import { DashboardOfferCardItem } from "@/components/dashboard-offer-card"
import { RedeemFlow } from "@/components/redeem-flow"
import {
  REDEMPTION_HOLDINGS,
  type RedemptionHolding,
} from "@/content/redemption-holdings"

export function RedemptionSection() {
  const [active, setActive] = useState<RedemptionHolding | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const openRedeem = (holding: RedemptionHolding) => {
    setActive(holding)
    setSheetOpen(true)
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Redemption
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Redeem CuTT vault holdings in 25,000-tonne lots for physical COMEX Grade 1
            copper. Choose warehouse pickup or insured delivery to your address.
          </p>
        </div>
        <div className="grid auto-rows-fr grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
          {REDEMPTION_HOLDINGS.map((holding) => (
            <DashboardOfferCardItem
              key={holding.id}
              ticker={holding.ticker}
              subtitle={holding.subtitle}
              category={holding.category}
              coverImage={holding.coverImage}
              specs={holding.specs}
              forceLiveStyle={holding.redeemable}
              comingSoon={!holding.redeemable}
              showLiveBadge={holding.redeemable}
              ctaLabel={holding.redeemable ? "Redeem" : "Not eligible"}
              ctaDisabled={!holding.redeemable}
              onCtaClick={
                holding.redeemable ? () => openRedeem(holding) : undefined
              }
            />
          ))}
        </div>
      </div>
      <RedeemFlow
        holding={active}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </>
  )
}
