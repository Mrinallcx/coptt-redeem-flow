import {
  COMEX_UNDERLYING,
  COPTT_VAULT_OPTIONS,
  type CopttVaultId,
  VAULT_MIN_TICKET,
  type DashboardOfferSpec,
} from "@/content/investor-portal-dashboard"

/** COMEX-style physical redemption lot (tonnes). */
export const REDEMPTION_LOT_TONNES = 25_000

export const REDEMPTION_MIN_LOTS = 1

export type RedemptionHolding = {
  id: string
  vaultId?: CopttVaultId
  ticker: string
  subtitle: string
  category: string
  coverImage: string
  /** Token-backed copper balance available to redeem (tonnes). */
  balanceTonnes: number
  redeemable: boolean
  specs: DashboardOfferSpec[]
  warehouseName?: string
  warehouseAddress?: string
}

export const REDEMPTION_SHIPMENT_SUMMARY =
  "Warehouse pickup or insured delivery to your address"

export const REDEMPTION_FULFILMENT_DAYS = 30

export function formatRedemptionTonnes(tonnes: number): string {
  return `${tonnes.toLocaleString()} tonnes`
}

export function maxRedemptionLots(balanceTonnes: number): number {
  return Math.floor(balanceTonnes / REDEMPTION_LOT_TONNES)
}

function vaultHolding(
  vaultId: CopttVaultId,
  balanceTonnes: number,
): RedemptionHolding {
  const vault = COPTT_VAULT_OPTIONS.find((v) => v.id === vaultId)!
  const lots = maxRedemptionLots(balanceTonnes)
  return {
    id: vaultId,
    vaultId,
    ticker: "CuTT",
    subtitle: vault.label,
    category: "Commodities",
    coverImage: "/copper-vault.jpg",
    balanceTonnes,
    redeemable: lots >= REDEMPTION_MIN_LOTS,
    warehouseName: `${vault.premiumCity} bonded warehouse`,
    warehouseAddress: vault.location,
    specs: [
      {
        label: "YOUR HOLDING",
        value: `${formatRedemptionTonnes(balanceTonnes)} CuTT-backed`,
      },
      { label: "UNDERLYING", value: COMEX_UNDERLYING },
      { label: "LOCATION", value: vault.location },
      { label: "AVAILABLE", value: vault.available },
      {
        label: "LOT SIZE",
        value: `${formatRedemptionTonnes(REDEMPTION_LOT_TONNES)} (1 lot)`,
      },
      {
        label: "MIN. REDEMPTION",
        value: `${formatRedemptionTonnes(REDEMPTION_LOT_TONNES)} · increments of 1 lot`,
      },
      { label: "SHIPMENT", value: REDEMPTION_SHIPMENT_SUMMARY },
      { label: "MIN. TICKET", value: VAULT_MIN_TICKET },
    ],
  }
}

/** Demo portfolio holdings eligible for physical redemption (CuTT vaults only). */
export const REDEMPTION_HOLDINGS: RedemptionHolding[] = [
  vaultHolding("new-orleans", 50_000),
  vaultHolding("tucson", 75_000),
  {
    id: "los-azules",
    ticker: "CuTTr",
    subtitle: "Los Azules Royalties",
    category: "Commodities",
    coverImage: "/copper-pit-dusk.png",
    balanceTonnes: 0,
    redeemable: false,
    specs: [
      { label: "YOUR HOLDING", value: "2 CuTTr (royalty exposure)" },
      {
        label: "NOTE",
        value: "Physical redemption applies to CuTT vault copper only",
      },
      {
        label: "MIN. REDEMPTION",
        value: `${formatRedemptionTonnes(REDEMPTION_LOT_TONNES)} (CuTT vault lots)`,
      },
    ],
  },
]

/** @deprecated Use REDEMPTION_LOT_TONNES and lot counts in the redeem flow. */
export const REDEMPTION_MIN_LB = REDEMPTION_LOT_TONNES
