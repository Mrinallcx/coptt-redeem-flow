/**
 * Dashboard offer cards — single source of truth (product copy).
 */

export type DashboardOfferSpec = { label: string; value: string }

export type DashboardOfferCard = {
  ticker: string
  subtitle: string
  category: string
  href?: string
  comingSoon?: boolean
  showLiveBadge?: boolean
  ctaLabel?: string
  coverImage: string
  specs: DashboardOfferSpec[]
}

export const COMEX_UNDERLYING =
  "COMEX Grade 1 copper cathode, deliverable grade"

export const VAULT_MIN_TICKET = "1 CuTT (1 lb), institutional minimums"

export const STAKE_MIN_TICKET = "1 CuTTy (1 lb), institutional minimums"

/** Warrant-backed vault inventory (same wording on dashboard + investments). */
export const NEW_ORLEANS_AVAILABLE =
  "23,800 tonnes (confirm against official warrant inventory)"

export const TUCSON_AVAILABLE =
  "101,670 tonnes (confirm against official warrant inventory)"

export const LOS_AZULES_EXPOSURE = "2,500,000 lb (1,134 t)"

export const KAMOA_EXPOSURE = "330,000 tonnes (2026 run-rate basis)"

/** CuTTy products: 1 token = 1 lb COMEX exposure (no separate tonne inventory). */
export const CUTTY_NOTIONAL_PER_TOKEN = "1 CuTTy = 1 lb COMEX copper exposure"

function vaultLivePrice(city: string) {
  return `Full CME COMEX copper price + ${city} in-warehouse premium (oracle-fed, real-time)`
}

const newOrleansVault: DashboardOfferCard = {
  ticker: "CuTT",
  subtitle: "New Orleans Vault",
  category: "Commodities",
  href: "/offers/coptt",
  coverImage: "/copper-vault.jpg",
  specs: [
    { label: "UNDERLYING", value: COMEX_UNDERLYING },
    {
      label: "LOCATION",
      value: "New Orleans, LA, USA (FDA-approved warehouse)",
    },
    { label: "LIVE PRICE", value: vaultLivePrice("New Orleans") },
    { label: "AVAILABLE", value: NEW_ORLEANS_AVAILABLE },
    { label: "MIN. TICKET", value: VAULT_MIN_TICKET },
  ],
}

const tucsonVault: DashboardOfferCard = {
  ticker: "CuTT",
  subtitle: "Tucson Vault",
  category: "Commodities",
  href: "/offers/coptt",
  coverImage: "/copper-vault.jpg",
  specs: [
    { label: "UNDERLYING", value: COMEX_UNDERLYING },
    {
      label: "LOCATION",
      value: "Tucson, AZ, USA (FDA-approved warehouse)",
    },
    { label: "LIVE PRICE", value: vaultLivePrice("Tucson") },
    { label: "AVAILABLE", value: TUCSON_AVAILABLE },
    { label: "MIN. TICKET", value: VAULT_MIN_TICKET },
  ],
}

const losAzulesRoyalties: DashboardOfferCard = {
  ticker: "CuTTr",
  subtitle: "Los Azules, Argentina",
  category: "Commodities",
  comingSoon: true,
  ctaLabel: "View details",
  coverImage: "/copper-pit-dusk.png",
  specs: [
    {
      label: "DEPOSIT",
      value:
        "Open-pit copper deposit, San Juan Province, Argentina, Los Azules",
    },
    {
      label: "MINING PARTNER",
      value: "TSX/NYSE-listed mining group (named under NDA)",
    },
    {
      label: "STAGE",
      value: "Pre-production, first delivery 2030",
    },
    {
      label: "FUTURE PRODUCTION",
      value: "First delivery 2030 target",
    },
    { label: "EXPOSURE", value: LOS_AZULES_EXPOSURE },
    {
      label: "YIELD SOURCE",
      value: "Share of copper produced by Toto Finance mine programs",
    },
    {
      label: "DISTRIBUTION",
      value: "Quarterly, every 3 months",
    },
  ],
}

const kamoaRoyalties: DashboardOfferCard = {
  ticker: "CuTTr",
  subtitle: "Kamoa-Kakula, DRC",
  category: "Commodities",
  comingSoon: true,
  ctaLabel: "View details",
  coverImage: "/copper-pit.png",
  specs: [
    {
      label: "DEPOSIT",
      value: "Kamoa-Kakula, Kolwezi, DRC, high-grade underground copper",
    },
    {
      label: "MINING PARTNER",
      value: "NYSE-listed mining group (named under NDA)",
    },
    { label: "STAGE", value: "In production, ramping" },
    {
      label: "FUTURE PRODUCTION",
      value: "First delivery May 2027",
    },
    { label: "EXPOSURE", value: KAMOA_EXPOSURE },
    {
      label: "RUN-RATE",
      value:
        "About 290,000 to 330,000 t/y (2026), scaling toward 500,000+ t/y from 2028",
    },
    {
      label: "DISTRIBUTION",
      value: "Quarterly, every 3 months from first issuance",
    },
  ],
}

const cuttyRoyaltyStreams: DashboardOfferCard = {
  ticker: "CuTTy",
  subtitle: "Royalty streams",
  category: "Commodities",
  comingSoon: true,
  ctaLabel: "View details",
  coverImage: "/copper-banner-mine.jpg",
  specs: [
    {
      label: "YIELD SOURCE",
      value: "Share of Toto Finance platform fees and mine royalty streams",
    },
    {
      label: "UNDERLYING",
      value: "Full CME COMEX copper price exposure",
    },
    { label: "NOTIONAL", value: CUTTY_NOTIONAL_PER_TOKEN },
    {
      label: "DISTRIBUTION",
      value: "Quarterly, every 3 months from first issuance",
    },
    { label: "MIN. TICKET", value: STAKE_MIN_TICKET },
  ],
}

const cuttyStaking: DashboardOfferCard = {
  ticker: "CuTTy",
  subtitle: "Staking",
  category: "Commodities",
  href: "/yield",
  showLiveBadge: false,
  coverImage: "/copper-mine.jpg",
  specs: [
    {
      label: "YIELD SOURCE",
      value: "Share of Toto Finance platform fees",
    },
    {
      label: "UNDERLYING",
      value: "Full CME COMEX copper price exposure",
    },
    { label: "NOTIONAL", value: CUTTY_NOTIONAL_PER_TOKEN },
    {
      label: "DISTRIBUTION",
      value: "Daily, every 24 hours from first issuance",
    },
    { label: "MIN. TICKET", value: STAKE_MIN_TICKET },
  ],
}

/** Dashboard card order (CuTTy Staking is always last). */
export const DASHBOARD_OFFER_CARDS: DashboardOfferCard[] = [
  newOrleansVault,
  tucsonVault,
  losAzulesRoyalties,
  kamoaRoyalties,
  cuttyRoyaltyStreams,
  cuttyStaking,
]

/** @deprecated Use `DASHBOARD_OFFER_CARDS` — kept for docs / splits */
export const DASHBOARD_ROW_ONE = DASHBOARD_OFFER_CARDS.slice(0, 3)

/** @deprecated Use `DASHBOARD_OFFER_CARDS` — staking is the final entry */
export const DASHBOARD_ROW_TWO = DASHBOARD_OFFER_CARDS.slice(3)

export const NEW_ORLEANS_VAULT_SPECS = newOrleansVault.specs

export const DASHBOARD_BANNER_TAGLINE =
  "COMEX Grade 1 cathode in bonded warehouses. 1 CuTT = 1 lb."
