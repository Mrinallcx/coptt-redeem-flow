"use client"

// COPTT offer detail. Information hierarchy mirrors the dashboard card:
// title → description → offer terms → highlights → KYC note → buy flow.

import type { ReactNode } from "react"
import { CheckIcon, DownloadIcon, FileTextIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { BuyCopttCard } from "@/components/buy-coptt-card"
import { BuyFlow } from "@/components/buy-flow"
import { CUPTT_VAULT_OFFER_SPECS, COPTT_VAULT_OPTIONS } from "@/content/investor-portal-dashboard"
import { PAYMENT_MIN_CHECKOUT } from "@/lib/payment-display"

const VAULT_HIGHLIGHT_LABELS = new Set(["UNDERLYING", "LOCATION", "UNIT"])

const HIGHLIGHTS = [
  "1 CuTT = 1 lb of COMEX Grade 1 copper cathode",
  "Physical copper held in a CME-approved warehouse in New Orleans",
  "ERC-20 on Ethereum with transparent supply and on-chain settlement",
  "Optional physical redemption for institutional holders",
  "KYC-gated wallets only, fully regulatory-compliant",
  PAYMENT_MIN_CHECKOUT,
]

const OFFER_RISKS = [
  {
    title: "Capital at risk",
    body: "CuTT is linked to the copper price, which can fall as well as rise. You may get back less than you invest, and you should be prepared to lose the entire amount.",
  },
  {
    title: "No advice or offer",
    body: "Nothing here is investment, legal, or tax advice, or an offer or solicitation in any jurisdiction where that would be unlawful.",
  },
  {
    title: "Eligibility and KYC",
    body: "Access requires identity verification and AML checks. Eligibility may be restricted by residence and investor classification.",
  },
  {
    title: "Digital-asset risks",
    body: "Tokens carry extra risks: wallet-key loss or theft, smart-contract defects, network failure, and limited or no secondary-market liquidity.",
  },
  {
    title: "Indicative information",
    body: "Prices, charts, and valuations are indicative only. Past performance is not a reliable indicator of future results.",
  },
  {
    title: "No guaranteed return",
    body: "Toto Finance does not guarantee any return, redemption value, or the ability to sell or transfer tokens at a particular price or time.",
  },
]

const DOCUMENTS = [
  { title: "CuTT Offering Memorandum", filename: "CuTT-Offering-Memorandum.txt" },
  { title: "Risk Factors", filename: "CuTT-Risk-Factors.txt" },
  { title: "Subscription Agreement", filename: "CuTT-Subscription-Agreement.txt" },
  { title: "Reserve Audit Summary", filename: "CuTT-Reserve-Audit-Summary.txt" },
]

function downloadDocument(title: string, filename: string) {
  const blob = new Blob(
    [`${title}\n\nPlaceholder document for local review. Replace with the signed PDF.`],
    { type: "text/plain" },
  )
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function VaultDetails() {
  return (
    <div className="space-y-4">
      <dl className="divide-y rounded-lg border">
        {CUPTT_VAULT_OFFER_SPECS.map((spec) => (
          <div
            key={spec.label}
            className={cn(
              "grid gap-1 px-4 py-3 sm:grid-cols-[8rem_1fr]",
              VAULT_HIGHLIGHT_LABELS.has(spec.label) &&
                "bg-amber-50/50 dark:bg-amber-950/20",
            )}
          >
            <dt className="text-[11px] font-medium tracking-wide text-muted-foreground">
              {spec.label}
            </dt>
            <dd className="text-sm leading-snug text-foreground">{spec.value}</dd>
          </div>
        ))}
      </dl>
      <div className="rounded-lg border">
        <p className="border-b px-4 py-2 text-[11px] font-medium tracking-wide text-muted-foreground">
          VAULT INVENTORY
        </p>
        <ul className="divide-y">
          {COPTT_VAULT_OPTIONS.map((vault) => (
            <li key={vault.id} className="px-4 py-3 text-sm">
              <p className="font-medium">{vault.label}</p>
              <p className="mt-1 text-muted-foreground">{vault.available}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function RiskDisclosure() {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Read these before you subscribe. They do not replace the full offering documents.
      </p>
      <ol className="divide-y rounded-lg border">
        {OFFER_RISKS.map((risk, index) => (
          <li key={risk.title} className="grid grid-cols-[2rem_1fr] gap-3 px-4 py-3">
            <span className="pt-0.5 text-xs font-semibold tabular-nums text-muted-foreground">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{risk.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{risk.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

function OfferDocuments() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Documents</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Download the offering materials for this vault.
        </p>
      </div>
      <ul className="divide-y rounded-lg border">
        {DOCUMENTS.map((doc) => (
          <li
            key={doc.filename}
            className="flex items-center justify-between gap-3 px-4 py-3"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-[#9A5B2E] dark:bg-amber-950/40 dark:text-amber-400">
                <FileTextIcon className="size-4" />
              </span>
              <p className="truncate text-sm font-medium">{doc.title}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => downloadDocument(doc.title, doc.filename)}
            >
              <DownloadIcon />
              Download
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Section({
  title,
  children,
  className,
}: {
  title: string
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn("space-y-3", className)}>
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  )
}

const panel =
  "rounded-xl border border-border/80 bg-card shadow-sm"

export function OfferCoptt() {
  return (
    <div className="w-full space-y-8 pb-2">
      <header className={cn("overflow-hidden", panel)}>
        <div
          className="h-1 bg-gradient-to-r from-[#8B4513] via-[#B87333] to-[#D4956A]"
          aria-hidden
        />
        <div className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9A5B2E]">
                Commodities
              </span>
              <Badge variant="outline">Vault</Badge>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Live
            </span>
          </div>

          <h1 className="mt-4 font-heading text-3xl font-semibold tracking-tight">
            CuTT
          </h1>
          <p className="mt-1 text-muted-foreground">Vaults</p>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            COMEX Grade 1 copper cathode held in New Orleans (CME-approved warehouse).
            1 CuTT represents 1 lb of deliverable copper with on-chain settlement.
          </p>
        </div>
      </header>

      <Tabs defaultValue="vault" className={cn("gap-3 p-6", panel)}>
        <TabsList>
          <TabsTrigger value="vault">Vault details</TabsTrigger>
          <TabsTrigger value="risk">Risk disclosure</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>
        <TabsContent value="vault">
          <VaultDetails />
        </TabsContent>
        <TabsContent value="risk">
          <RiskDisclosure />
        </TabsContent>
        <TabsContent value="documents">
          <OfferDocuments />
        </TabsContent>
      </Tabs>

      <Section title="Highlights">
        <ul className={cn("divide-y px-1", panel)}>
          {HIGHLIGHTS.map((highlight) => (
            <li
              key={highlight}
              className="flex gap-3 px-4 py-3.5 text-sm leading-relaxed text-foreground/90"
            >
              <CheckIcon className="mt-0.5 size-4 shrink-0 text-[#B87333]" aria-hidden />
              <span>{highlight}</span>
            </li>
          ))}
        </ul>
      </Section>

      <p className={cn("px-4 py-3 text-xs leading-relaxed text-muted-foreground", panel)}>
        Investing requires completed KYC. The mint module below will walk you through
        connecting a wallet and minting on Sepolia.
      </p>

      <BuyCopttCard />

      <BuyFlow />
    </div>
  )
}
