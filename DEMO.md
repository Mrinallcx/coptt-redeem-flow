# Public demo build

A no-login, no-backend build of the portal for showcasing. Same design,
same pages, same copper price as the authenticated build — every backend
read is answered from `src/lib/demo-data.ts` instead.

## Deploying (Vercel)

Set one environment variable:

```
NEXT_PUBLIC_DEMO_MODE=true
```

That is the whole configuration. No API URL, no database, no Go backend.
`next build` produces static pages for every route.

## What the flag changes

| | Authenticated build | Demo build |
|---|---|---|
| `/login`, `/signup` | real forms | redirect to `/dashboard` |
| Protected routes | redirect to `/login` | open |
| `/auth/me` | backend call | `DEMO_USER` |
| Copper price | `GET /coptt/price` | `demoPrice()` — $6.77/lb |
| Price chart | `GET /coptt/price/history` | `demoPriceHistory()` |
| `/backend/*` rewrite | proxies to the Go API | removed |

The price series is a deterministic mean-reverting walk that finishes
exactly on $6.77, so the chart's last point matches the price card. It is
tagged `source: "mock"`, which is what makes the portal show its
"Sample data" badge — the demo never claims to show market data.

## Keeping it off everywhere else

`DEV_BYPASS_AUTH` reads `NEXT_PUBLIC_DEMO_MODE` at build time rather than
being a hardcoded boolean, so merging this branch cannot arm the bypass by
accident. Any environment that does not set the variable gets the real
cookie gate.

**Never set this on a deployment that can reach real user data.**

## Before making this public

Carried over from the authenticated build, and more consequential once
anyone can reach the page:

- The checkout's **bank transfer panel** shows beneficiary, bank and IBAN
  with "use the reference exactly so we can match your transfer". The IBAN
  is a placeholder.
- **Confirm** runs a 700ms timer, calls nothing, and reports the
  investment as "recorded".
- **Funding figures** (CHF 4,312,000 raised, 134 investors, 77%, 15 days
  left) are hardcoded.
- The offer is labelled **"Equity"** under "Type of Investment".
- The page states both **1 COPTT = 1 Mt** and **1 COPTT = 1 lb**. The
  contracts use pounds.
