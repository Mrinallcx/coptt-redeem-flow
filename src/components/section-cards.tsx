"use client"

import Link from "next/link"
import { ArrowRightIcon, LockIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { CopperPriceCard } from "@/components/copper-price"
import { CopperPriceChart } from "@/components/copper-price-chart"
import {
  DASHBOARD_BANNER_TAGLINE,
  DASHBOARD_OFFER_CARDS,
  type DashboardOfferCard,
  type DashboardOfferSpec,
} from "@/content/investor-portal-dashboard"
import { cn } from "@/lib/utils"

type OfferCard = DashboardOfferCard & {
  accent: "copper"
  description?: string
}

const liveCopperCard = {
  shell:
    "border-amber-200/90 bg-gradient-to-b from-amber-50/90 via-orange-50/35 to-card hover:border-amber-300/90 hover:shadow-md hover:shadow-amber-500/10 dark:border-amber-900/50 dark:from-amber-950/35 dark:via-orange-950/20 dark:to-card dark:hover:border-amber-800/60",
  bar: "from-[#8B4513] via-[#B87333] to-[#D4956A]",
  glow: "bg-gradient-to-br from-amber-500/10 via-orange-400/5 to-transparent",
  label: "text-[#9A5B2E] dark:text-amber-400/90",
  title: "text-foreground",
  subtitle: "text-amber-950/55 dark:text-amber-100/50",
  stat: "text-foreground",
  divider: "border-amber-200/70 dark:border-amber-900/40",
}

const inactiveCard = {
  shell:
    "border-zinc-200/90 bg-zinc-50/70 dark:border-zinc-800 dark:bg-zinc-900/35",
  bar: "from-zinc-300 via-zinc-200 to-zinc-300 dark:from-zinc-700 dark:via-zinc-600 dark:to-zinc-700",
  glow: "bg-zinc-400/5",
  label: "text-zinc-400 dark:text-zinc-500",
  title: "text-zinc-500 dark:text-zinc-400",
  subtitle: "text-zinc-400 dark:text-zinc-500",
  stat: "text-zinc-500 dark:text-zinc-400",
  divider: "border-zinc-200/80 dark:border-zinc-800",
}

function OfferCardItem({
  ticker,
  subtitle,
  category,
  href,
  comingSoon,
  coverImage,
  specs,
  ctaLabel,
  showLiveBadge = true,
}: OfferCard) {
  const isLive = !!href && !comingSoon
  const actionLabel = ctaLabel ?? (isLive ? "View offer" : "Coming soon")
  const showLivePill = isLive && showLiveBadge
  const styles = isLive ? liveCopperCard : inactiveCard

  return (
    <article
      className={cn(
        "group relative flex h-full w-full flex-col overflow-hidden rounded-2xl border transition-[box-shadow,border-color] duration-200",
        styles.shell,
      )}
    >
      <div className={cn("absolute inset-0", styles.glow)} aria-hidden />
      <div className="relative h-40 w-full shrink-0">
        <img src={coverImage} alt="" className="h-full w-full object-cover" />
      </div>
      <div
        className={cn("relative h-1 w-full bg-gradient-to-r", styles.bar)}
        aria-hidden
      />

      <div className="relative flex flex-1 flex-col px-4 py-5">
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p
              className={cn(
                "text-[10px] font-semibold uppercase tracking-[0.14em]",
                styles.label,
              )}
            >
              {category}
            </p>
            <h3
              className={cn(
                "mt-1 font-heading text-xl font-semibold tracking-tight",
                styles.title,
              )}
            >
              {ticker}
            </h3>
            <p className={cn("text-xs", styles.subtitle)}>{subtitle}</p>
          </div>

          {comingSoon ? (
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
              <span className="size-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500" />
              Soon
            </span>
          ) : showLivePill ? (
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-400">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Live
            </span>
          ) : null}
        </header>

        <dl className={cn("mt-3 divide-y", styles.divider)}>
          {specs.map((spec: DashboardOfferSpec) => (
            <div
              key={spec.label}
              className="grid grid-cols-[7.75rem_1fr] gap-2 py-2 first:pt-0 last:pb-0"
            >
              <dt
                className={cn(
                  "text-[10px] font-medium tracking-wide",
                  isLive
                    ? "text-muted-foreground"
                    : "text-zinc-400 dark:text-zinc-500",
                )}
              >
                {spec.label}
              </dt>
              <dd className={cn("text-xs leading-snug", styles.stat)}>{spec.value}</dd>
            </div>
          ))}
        </dl>

        <footer
          className={cn("mt-auto flex flex-col gap-2 border-t pt-3", styles.divider)}
        >
          {isLive ? (
            <Button
              className="w-full bg-[#B87333] text-white hover:bg-[#9A5B2E] dark:bg-[#B87333] dark:hover:bg-[#CD7F32]"
              nativeButton={false}
              render={<Link href={href!} />}
            >
              {actionLabel}
              <ArrowRightIcon className="transition-transform group-hover:translate-x-0.5" />
            </Button>
          ) : (
            <Button
              className="w-full border-zinc-200 bg-zinc-100 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-400"
              variant="outline"
              disabled
            >
              {comingSoon && actionLabel === "Coming soon" ? (
                <LockIcon />
              ) : null}
              {actionLabel}
            </Button>
          )}
        </footer>
      </div>
    </article>
  )
}

function toUiCard(card: DashboardOfferCard): OfferCard {
  return { ...card, accent: "copper" }
}

export function SectionCards() {
  const offers = DASHBOARD_OFFER_CARDS.map(toUiCard)

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
            Physical copper, tokenized
          </h2>
          <p className="mt-2 max-w-2xl text-base text-white/75 md:text-lg">
            {DASHBOARD_BANNER_TAGLINE}
          </p>
        </div>
      </div>
      <div className="grid auto-rows-fr grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
        {offers.map((offer, index) => (
          <OfferCardItem key={`${offer.ticker}-${offer.subtitle}-${index}`} {...offer} />
        ))}
      </div>
    </div>
  )
}
