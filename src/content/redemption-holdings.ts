import {
  COMEX_UNDERLYING,
  COPTT_VAULT_OPTIONS,
  type CopttVaultId,
  type DashboardOfferSpec,
} from "@/content/investor-portal-dashboard"

/** Physical redemption lot size (lb). */
export const REDEMPTION_LOT_LB = 25_000

/** @deprecated Alias for redeem flow imports. */
export const REDEMPTION_LOT_TONNES = REDEMPTION_LOT_LB

export const REDEMPTION_MIN_LOTS = 1

export type RedemptionHolding = {
  id: string
  vaultId?: CopttVaultId
  ticker: string
  subtitle: string
  category: string
  coverImage: string
  balanceLb: number
  redeemable: boolean
  specs: DashboardOfferSpec[]
  warehouseName?: string
  warehouseAddress?: string
}

export const REDEMPTION_DELIVERY_SUMMARY =
  "Warehouse pickup or insured shipment to your address"

/** @deprecated Use REDEMPTION_DELIVERY_SUMMARY on cards. */
export const REDEMPTION_SHIPMENT_SUMMARY = REDEMPTION_DELIVERY_SUMMARY

export const REDEMPTION_FULFILMENT_DAYS = 30

export function formatRedemptionLb(lb: number): string {
  return `${lb.toLocaleString()} lbs`
}

/** @deprecated Use formatRedemptionLb. */
export function formatRedemptionTonnes(lb: number): string {
  return formatRedemptionLb(lb)
}

export function maxRedemptionLots(balanceLb: number): number {
  return Math.floor(balanceLb / REDEMPTION_LOT_LB)
}

function redemptionLocation(vaultId: CopttVaultId): string {
  const vault = COPTT_VAULT_OPTIONS.find((v) => v.id === vaultId)!
  return vault.location.replace(
    /\(FDA-approved warehouse\)/i,
    "(CME-Approved)",
  )
}

function vaultHolding(vaultId: CopttVaultId, balanceLb: number): RedemptionHolding {
  const vault = COPTT_VAULT_OPTIONS.find((v) => v.id === vaultId)!
  const lots = maxRedemptionLots(balanceLb)
  const location = redemptionLocation(vaultId)
  return {
    id: vaultId,
    vaultId,
    ticker: "CuTT",
    subtitle: vault.label,
    category: "Commodities",
    coverImage: "/copper-vault.jpg",
    balanceLb,
    redeemable: lots >= REDEMPTION_MIN_LOTS,
    warehouseName: `${vault.premiumCity} bonded warehouse`,
    warehouseAddress: location,
    specs: [
      {
        label: "YOUR HOLDING",
        value: `${formatRedemptionLb(balanceLb)} CuTT-backed`,
      },
      { label: "UNDERLYING", value: COMEX_UNDERLYING },
      { label: "LOCATION", value: location },
      {
        label: "LOT SIZE",
        value: `${formatRedemptionLb(REDEMPTION_LOT_LB)} (1 lot)`,
      },
      {
        label: "MIN. REDEMPTION",
        value: `${formatRedemptionLb(REDEMPTION_LOT_LB)} · increments of 1 lot`,
      },
      { label: "DELIVERY", value: REDEMPTION_DELIVERY_SUMMARY },
    ],
  }
}

/** Demo portfolio holdings eligible for physical redemption (CuTT vaults only). */
export const REDEMPTION_HOLDINGS: RedemptionHolding[] = [
  vaultHolding("new-orleans", 50_000),
]

export const REDEMPTION_MIN_LB = REDEMPTION_LOT_LB
