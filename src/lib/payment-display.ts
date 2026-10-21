/** Primary checkout rail (minimum line). */
export const PAYMENT_MIN_CHECKOUT = "Minimum 1 lb · Paid in USDC"

/** Wallet and bank settlement currencies. */
export const PAYMENT_CURRENCIES = "USDC, USD1"

export const PAYMENT_USD1_ADDON = "USD1 is also accepted alongside USDC."

/** Sheet subtitle on all checkout steps except done. */
export const CHECKOUT_SHEET_DESCRIPTION = `${PAYMENT_MIN_CHECKOUT}. ${PAYMENT_USD1_ADDON}`

/** Buy card / offer summary line. */
export const PAYMENT_SETTLEMENT_LINE = `Settled in USDC · USD1 also accepted`

export function formatPaymentAmount(totalUsd: number): string {
  return `${totalUsd.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${PAYMENT_CURRENCIES}`
}
