/**
 * Dashboard offer cards — single source of truth aligned with
 * Investor_Portal_Changes.pages (CuTT / CuTTy / CuTTr branding applied in UI).
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

export const VAULT_MIN_TICKET =
  "1 CuTT (1 lb), institutional minimums per Reg D 506(b) / Reg S"

export const STAKE_MIN_TICKET =
  "1 CuTTy (1 lb), institutional minimums per Reg D 506(b) / Reg S"

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
    {
      label: "AVAILABLE",
      value: "[X,000 tonnes], confirm from warrant inventory",
    },
    { label: "MIN. TICKET", value: VAULT_MIN_TICKET },
  ],
}

const tucsonVault: DashboardOfferCard = {
  ticker: "CuTT",
  subtitle: "Tucson Vault",
  category: "Commodities",
  comingSoon: true,
  coverImage: "/copper-vault.jpg",
  specs: [
    { label: "UNDERLYING", value: COMEX_UNDERLYING },
    {
      label: "LOCATION",
      value: "Tucson, AZ, USA (FDA-approved warehouse)",
    },
    { label: "LIVE PRICE", value: vaultLivePrice("Tucson") },
    {
      label: "AVAILABLE",
      value: "[X,000 tonnes], confirm from warrant inventory",
    },
    { label: "MIN. TICKET", value: VAULT_MIN_TICKET },
  ],
}

const cuttyStaking: DashboardOfferCard = {
  ticker: "CuTTy",
  subtitle: "Staking",
  category: "Commodities",
  href: "/yield",
  showLiveBadge: false,
  coverImage: "/copper-banner-coils.jpg",
  specs: [
    {
      label: "YIELD SOURCE",
      value: "Share of Toto Finance platform fees",
    },
    {
      label: "UNDERLYING",
      value: "Full CME COMEX copper price exposure",
    },
    {
      label: "DISTRIBUTION",
      value: "Quarterly, every 3 months from first issuance",
    },
    { label: "MIN. TICKET", value: STAKE_MIN_TICKET },
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
    {
      label: "EXPOSURE",
      value: "25,000 lb (11.34 t)",
    },
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
      value: "Ivanhoe Mines and Zijin Mining (via Kamoa Holding)",
    },
    { label: "STAGE", value: "In production, ramping" },
    {
      label: "FUTURE PRODUCTION",
      value: "First delivery May 2027",
    },
    {
      label: "EXPOSURE",
      value: "To be defined once a mandate is signed",
    },
    {
      label: "RUN-RATE",
      value:
        "About 290,000 to 330,000 t/y (2026), scaling toward 500,000+ t/y from 2028",
    },
    {
      label: "YIELD SOURCE",
      value: "Share of copper produced by Toto Finance mine programs",
    },
    {
      label: "DISTRIBUTION",
      value: "Quarterly, every 3 months from first issuance",
    },
  ],
}

/** Row 1: New Orleans, Tucson, CuTTy Staking */
export const DASHBOARD_ROW_ONE: DashboardOfferCard[] = [
  newOrleansVault,
  tucsonVault,
  cuttyStaking,
]

/** Row 2: Los Azules royalties, Kamoa-Kakula royalties */
export const DASHBOARD_ROW_TWO: DashboardOfferCard[] = [
  losAzulesRoyalties,
  kamoaRoyalties,
]

export const NEW_ORLEANS_VAULT_SPECS = newOrleansVault.specs

export const DASHBOARD_BANNER_TAGLINE =
  "COMEX Grade 1 cathode in bonded warehouses. 1 CuTT = 1 lb."
