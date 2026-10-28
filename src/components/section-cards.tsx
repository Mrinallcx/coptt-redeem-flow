"use client"

import { CopperPriceCard } from "@/components/copper-price"
import { CopperPriceChart } from "@/components/copper-price-chart"
import { DashboardOfferCardItem } from "@/components/dashboard-offer-card"
import {
  DASHBOARD_BANNER_TAGLINE,
  DASHBOARD_OFFER_CARDS,
  type DashboardOfferCard,
} from "@/content/investor-portal-dashboard"

export function SectionCards() {
  const offers = DASHBOARD_OFFER_CARDS

  return (
    <div className="flex flex-col gap-8 px-4 lg:px-6">
      <CopperPriceChart />
      <CopperPriceCard />
      <div className="relative overflow-hidden rounded-2xl">
        <img
          src="/copper-banner-coils.jpg"
          alt=""
          className="h-48 w-full object-cover md:h-56"
        />
        <div className="absolute inset-0 bg-black/40" aria-hidden />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center md:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70 md:text-sm">
            Commodities
          </p>
          <h2 className="mt-1.5 font-heading text-3xl font-semibold tracking-tight text-white md:text-5xl">
            Physical copper
          </h2>
          <p className="mt-2 max-w-2xl text-base text-white/75 md:text-lg">
            {DASHBOARD_BANNER_TAGLINE}
          </p>
        </div>
      </div>
      <div className="grid auto-rows-fr grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
        {offers.map((offer: DashboardOfferCard, index) => (
          <DashboardOfferCardItem key={`${offer.ticker}-${offer.subtitle}-${index}`} {...offer} />
        ))}
      </div>
    </div>
  )
}
