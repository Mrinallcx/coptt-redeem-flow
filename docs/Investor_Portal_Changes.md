# Investor Portal Homepage: Dev Changes

**Toto Finance** · October 19, 2026  
Source: `Investor_Portal_Changes.pages`

**Implementation (code):** all dashboard card copy lives in one file:

`src/content/investor-portal-dashboard.ts`

The dashboard, New Orleans offer vault tab, and investments mock data must stay in sync with that module. UI tickers use **CuTT / CuTTy / CuTTr** (the Pages file uses COPTT / COPTTY / COPTTR).

---

## Checklist (Pages → app)

| # | Requirement | Status |
|---|-------------|--------|
| 1 | Delete Rotterdam vault card | Done |
| 2 | Add Tucson vault (copy New Orleans structure, Soon) | Done |
| 3 | Five cards: NO, Tucson, CuTTy Staking, Los Azules royalties, Kamoa royalties | Done |
| 4 | Soon badge: same pill as Live, grey dot, no lock in badge | Done |
| 5 | Card 1 **View offer**; CuTTy **View offer** → `/yield`; royalties **View details** (disabled) | Done |
| 6 | Chart first (COMEX HG, USD / lb axis), no LME in UI | Done |
| 7 | Sidebar: Stake CuTTy for stCuTTy | Done |
| 8 | No LME, no McEwen; NDA mining partner on Los Azules | Done |
| 9 | Layout row 1 (3 cards), row 2 (2 cards) | Done |
| 10 | Investments: no Rotterdam, Tucson, CuTT/CuTTr, COMEX/lb | Done |

---

## Card copy (see `investor-portal-dashboard.ts` for exact strings)

### Row 1

1. **CuTT — New Orleans Vault** (Live, View offer)  
2. **CuTT — Tucson Vault** (Soon)  
3. **CuTTy — Staking** (View offer → Earn, no Live pill)

### Row 2

4. **CuTTr — Los Azules, Argentina** (Soon, View details)  
5. **CuTTr — Kamoa-Kakula, DRC** (Soon, View details)

Vault fields: UNDERLYING, LOCATION, LIVE PRICE, AVAILABLE, MIN. TICKET (COMEX, FDA warehouse, lb, Reg D 506(b)/Reg S).

Staking: YIELD SOURCE, UNDERLYING, DISTRIBUTION, MIN. TICKET.

Royalties: DEPOSIT, MINING PARTNER, STAGE, FUTURE PRODUCTION, EXPOSURE, YIELD SOURCE, DISTRIBUTION (+ RUN-RATE on Kamoa).

Los Azules exposure per layout note in Pages: **25,000 lb (11.34 t)**.

---

## Banner

`COMEX Grade 1 cathode in bonded warehouses. 1 CuTT = 1 lb.`

---

*Do not edit card tables in `section-cards.tsx`; edit `investor-portal-dashboard.ts` only.*
