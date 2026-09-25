// Static data for the public demo build.
//
// The demo has no backend, so anything the portal would normally fetch is
// generated here instead. Keeping it in one file means the components stay
// byte-for-byte the same as the authenticated build: they still call the
// same hooks and render the same markup, they just read canned values.
//
// Every number here is invented. Nothing in this file should ever be
// presented as market data or as a real holding.
import type { CopperPrice, CopperPriceHistory, CopperPriceRange } from "@/lib/api"

/** Matches the backend's PYTH_MOCK_PRICE_USD_PER_LB. */
export const DEMO_USD_PER_LB = 6.77

const RANGE_WINDOWS: Record<CopperPriceRange, { days: number; stepMinutes: number }> = {
  "24h": { days: 1, stepMinutes: 15 },
  "7d": { days: 7, stepMinutes: 60 },
  "30d": { days: 30, stepMinutes: 240 },
  "90d": { days: 90, stepMinutes: 720 },
  "1y": { days: 365, stepMinutes: 1440 },
}

/**
 * Deterministic PRNG. A fixed seed means the chart is identical on every
 * render, on every machine, and between server and client — a Math.random
 * walk would differ across a hydration boundary and React would complain.
 */
function mulberry32(seed: number) {
  return function next() {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Box–Muller, so steps are normally distributed rather than uniform. */
function gaussian(rand: () => number) {
  const u = Math.max(rand(), Number.EPSILON)
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand())
}

/**
 * A mean-reverting walk around DEMO_USD_PER_LB that finishes exactly on it,
 * so the last point of the chart agrees with the price card instead of
 * leaving a visible step between the two. Mirrors the Go backfill.
 */
export function demoPriceHistory(range: CopperPriceRange): CopperPriceHistory {
  const { days, stepMinutes } = RANGE_WINDOWS[range] ?? RANGE_WINDOWS["7d"]
  const stepMs = stepMinutes * 60_000
  const steps = Math.floor((days * 24 * 60) / stepMinutes)

  const rand = mulberry32(20260925)
  const dailyVol = 0.009
  const vol = dailyVol * Math.sqrt(stepMinutes / (24 * 60))
  const reversion = 0.02

  const walk: number[] = []
  let level = DEMO_USD_PER_LB
  for (let i = 0; i < steps; i++) {
    level += (DEMO_USD_PER_LB - level) * reversion + level * vol * gaussian(rand)
    walk.push(level)
  }

  // Ease the correction back through the series so it bends the curve
  // rather than snapping the tail onto the target.
  const drift = DEMO_USD_PER_LB - walk[walk.length - 1]
  for (let i = 0; i < walk.length; i++) {
    walk[i] += (drift * i) / (walk.length - 1)
  }

  // Anchor to the step grid rather than to "now", so the series does not
  // shift under the user on every re-render.
  const end = Math.floor(Date.now() / stepMs) * stepMs
  const points = walk.map((usd, i) => ({
    t: new Date(end - (walk.length - 1 - i) * stepMs).toISOString(),
    usd_per_lb: Math.round(usd * 10000) / 10000,
  }))

  return {
    range,
    bucket_seconds: stepMs / 1000,
    from: points[0]?.t ?? new Date(end).toISOString(),
    to: points[points.length - 1]?.t ?? new Date(end).toISOString(),
    points,
    count: points.length,
    // "mock" is what makes the portal render its "Sample data" badge.
    sources: ["mock"],
  }
}

export function demoPrice(): CopperPrice {
  const now = new Date().toISOString()
  return {
    usd_per_lb: DEMO_USD_PER_LB,
    publish_time: now,
    source: "mock",
    fetched_at: now,
    feed_symbol: "Commodities.Index.CU/USD",
  }
}
