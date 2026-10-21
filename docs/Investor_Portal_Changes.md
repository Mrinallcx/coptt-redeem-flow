# Investor Portal Homepage: Dev Changes

**Toto Finance** · October 19, 2026  
Source: `Investor_Portal_Changes.pages`

**Implementation (code):** all dashboard card copy lives in one file:

`src/content/investor-portal-dashboard.ts`

Payment checkout copy: `src/lib/payment-display.ts` — `Minimum 1 lb · Paid in USDC` plus USD1 addon on all `BuyFlow` steps, offer highlight, and mint card note.

The dashboard, New Orleans offer vault tab, and investments mock data should stay in sync with that module. UI tickers use **CuTT / CuTTy / CuTTr** (the Pages file uses COPTT / COPTTY / COPTTR).

---

## Checklist (Pages → app)

| # | Requirement | Status |
|---|-------------|--------|
| 1 | Delete Rotterdam vault card | Done |
| 2 | Tucson vault live; 101,670 tonnes | Done |
| 3 | Six cards: NO, Tucson, Los Azules, Kamoa, CuTTy royalty streams, CuTTy staking (last) | Done |
| 4 | Soon badge: same pill as Live, grey dot, no lock in badge | Done |
| 5 | Vaults **View offer**; CuTTy staking → `/yield`; royalties **View details** (Soon) | Done |
| 6 | Chart first (COMEX HG, USD / lb axis), no LME in UI | Done |
| 7 | Sidebar: Stake CuTTy for stCuTTy | Done |
| 8 | No LME, no McEwen; NDA mining partners | Done |
| 9 | Layout row 1 (3 cards), row 2 (3 cards) | Done |
| 10 | Checkout: USDC, USD1; Toto Finance Inc.; Erebor Bank | Done |

---

## Card copy (see `investor-portal-dashboard.ts` for exact strings)

### Row 1

1. **CuTT — New Orleans Vault** (Live, View offer)  
2. **CuTT — Tucson Vault** (Live, View offer)  
3. **CuTTr — Los Azules, Argentina** (Soon, View details)

### Row 2

4. **CuTTr — Kamoa-Kakula, DRC** (Soon, View details; no YIELD SOURCE row)  
5. **CuTTy — Royalty streams** (Soon, View details)  
6. **CuTTy — Staking** (View offer → Earn, daily distribution, last card)

Vault fields: UNDERLYING, LOCATION, LIVE PRICE, AVAILABLE, MIN. TICKET (no Reg D footnotes).

Los Azules exposure: **2,500,000 lb (1,134 t)**. Vault available copy uses **official warrant inventory** note. Shared constants: `NEW_ORLEANS_AVAILABLE`, `TUCSON_AVAILABLE`, `LOS_AZULES_EXPOSURE`, `KAMOA_EXPOSURE`, `VAULT_MIN_TICKET` (used on investments + offer vault tab).

---

## Banner

`COMEX Grade 1 cathode in bonded warehouses. 1 CuTT = 1 lb.`

---

*Do not edit card tables in `section-cards.tsx`; edit `investor-portal-dashboard.ts` only.*
