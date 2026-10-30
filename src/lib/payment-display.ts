/** Checkout minimum line (sheet subtitle on all buy steps except done). */
export const PAYMENT_MIN_CHECKOUT = "Minimum 1 lb - Paid in USDC"

export const CHECKOUT_SHEET_DESCRIPTION = PAYMENT_MIN_CHECKOUT

/** Wallet and bank settlement currencies. */
export const PAYMENT_CURRENCIES = "USDC, USD1"

export function formatPaymentAmount(totalUsd: number): string {
  return `${totalUsd.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${PAYMENT_CURRENCIES}`
}
