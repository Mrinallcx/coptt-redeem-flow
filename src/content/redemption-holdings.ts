import {
  COMEX_UNDERLYING,
  COPTT_VAULT_OPTIONS,
  type CopttVaultId,
  VAULT_MIN_TICKET,
  type DashboardOfferSpec,
} from "@/content/investor-portal-dashboard"

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
}

const DEMO_MIN_REDEMPTION_LB = 1

function vaultHolding(
  vaultId: CopttVaultId,
  balanceLb: number,
): RedemptionHolding {
  const vault = COPTT_VAULT_OPTIONS.find((v) => v.id === vaultId)!
  return {
    id: vaultId,
    vaultId,
    ticker: "CuTT",
    subtitle: vault.label,
    category: "Commodities",
    coverImage: "/copper-vault.jpg",
    balanceLb,
    redeemable: true,
    specs: [
      { label: "YOUR HOLDING", value: `${balanceLb} CuTT (${balanceLb} lb)` },
      { label: "UNDERLYING", value: COMEX_UNDERLYING },
      { label: "LOCATION", value: vault.location },
      { label: "AVAILABLE", value: vault.available },
      { label: "MIN. REDEMPTION", value: `${DEMO_MIN_REDEMPTION_LB} lb` },
      { label: "MIN. TICKET", value: VAULT_MIN_TICKET },
    ],
  }
}

/** Demo portfolio holdings eligible for physical redemption (CuTT vaults only). */
export const REDEMPTION_HOLDINGS: RedemptionHolding[] = [
  vaultHolding("new-orleans", 5),
  vaultHolding("tucson", 3),
  {
    id: "los-azules",
    ticker: "CuTTr",
    subtitle: "Los Azules Royalties",
    category: "Commodities",
    coverImage: "/copper-pit-dusk.png",
    balanceLb: 0,
    redeemable: false,
    specs: [
      { label: "YOUR HOLDING", value: "2 CuTTr (royalty exposure)" },
      {
        label: "NOTE",
        value: "Physical redemption applies to CuTT vault copper only",
      },
    ],
  },
]

export const REDEMPTION_MIN_LB = DEMO_MIN_REDEMPTION_LB

export const REDEMPTION_FULFILMENT_DAYS = 30
