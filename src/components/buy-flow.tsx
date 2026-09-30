"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  CheckIcon,
  ExternalLinkIcon,
  Loader2Icon,
  WalletIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ApiRequestError, copttApi, type PurchaseConfig, type PurchaseQuote } from "@/lib/api"
import {
  connect,
  currentAccount,
  ensureChain,
  explorerTx,
  isUserRejection,
  sendTx,
  shortAddress,
  waitForReceipt,
} from "@/lib/wallet"
import { cn } from "@/lib/utils"

/**
 * Buying COPTT.
 *
 * The flow mirrors what the contracts actually require, rather than hiding it:
 * quote → approve (only if needed) → buy. Payment and issuance happen in the
 * same transaction, so there is no state where the buyer has paid and holds
 * nothing.
 *
 * The quote expires. That is not a UI detail to smooth over — the price is
 * fixed off-chain when the buyer clicks and the spread only covers so much
 * drift, so a lapsed quote is re-requested rather than retried.
 */

type Step = "amount" | "review" | "working" | "done"

export function BuyFlow({ className }: { className?: string }) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>("amount")

  const [config, setConfig] = useState<PurchaseConfig | null>(null)
  const [quote, setQuote] = useState<PurchaseQuote | null>(null)
  const [wallet, setWallet] = useState<string | null>(null)

  const [amountLb, setAmountLb] = useState("100")
  const [busy, setBusy] = useState(false)
  const [statusLine, setStatusLine] = useState("")
  const [txHash, setTxHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)

  useEffect(() => {
    copttApi.getPurchaseConfig().then(setConfig).catch(() => setConfig(null))
    currentAccount().then(setWallet)
  }, [])

  // A visible countdown, because a quote that silently lapses and then
  // reverts is the worst version of this.
  useEffect(() => {
    if (!quote || step === "done") return
    const tick = () => {
      const left = Math.floor((new Date(quote.expires_at).getTime() - Date.now()) / 1000)
      setSecondsLeft(left)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [quote, step])

  const reset = useCallback(() => {
    setStep("amount")
    setQuote(null)
    setBusy(false)
    setStatusLine("")
    setTxHash(null)
    setError(null)
    setSecondsLeft(null)
  }, [])

  const close = (next: boolean) => {
    setOpen(next)
    if (!next) reset()
  }

  const lb = Number.parseFloat(amountLb)
  const amountValid =
    Number.isFinite(lb) &&
    lb > 0 &&
    (!config || (lb >= config.min_amount_lb && lb <= config.max_amount_lb))

  const getQuote = async () => {
    if (!amountValid) return
    setBusy(true)
    setError(null)
    try {
      const q = await copttApi.requestQuote(lb)
      setQuote(q)
      setStep("review")
    } catch (err) {
      setError(explainQuoteError(err))
    } finally {
      setBusy(false)
    }
  }

  const connectWallet = async () => {
    try {
      setWallet(await connect())
    } catch (err) {
      if (!isUserRejection(err)) {
        toast.error(err instanceof Error ? err.message : "Could not connect")
      }
    }
  }

  const buy = async () => {
    if (!quote || !wallet) return
    setBusy(true)
    setError(null)
    setStep("working")

    try {
      await ensureChain(quote.chain_id)

      // Approve only when the allowance is short. Prompting for an approval
      // the buyer already granted reads as a second charge.
      if (quote.approve_tx) {
        setStatusLine(`Approve ${quote.pricing.payment_symbol} spending…`)
        const approveHash = await sendTx(wallet, quote.approve_tx)
        setStatusLine("Waiting for the approval to confirm…")
        const approved = await waitForReceipt(approveHash)
        if (approved.status !== "success") {
          throw new Error("The approval transaction reverted.")
        }
      }

      setStatusLine("Confirm the purchase…")
      const hash = await sendTx(wallet, quote.buy_tx)
      setTxHash(hash)

      setStatusLine("Waiting for the purchase to confirm…")
      const receipt = await waitForReceipt(hash)
      if (receipt.status !== "success") {
        // Payment and mint share a transaction, so a revert means nothing
        // moved. Worth saying, because "failed" otherwise invites the fear
        // that the money went somewhere.
        throw new Error(
          "The purchase reverted, so nothing was charged. The quote may have expired — request a new one.",
        )
      }

      setStep("done")
      toast.success(`Bought ${quote.pricing.amount_lb} lb of COPTT`)
    } catch (err) {
      if (isUserRejection(err)) {
        setStep("review")
        setStatusLine("")
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong")
        setStep("review")
      }
    } finally {
      setBusy(false)
    }
  }

  const expired = secondsLeft !== null && secondsLeft <= 0
  const accepting = config?.accepting ?? false

  return (
    <>
      <div className={cn("overflow-hidden rounded-xl border border-border/80 bg-card p-5 shadow-sm", className)}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold">Buy COPTT</p>
            <p className="mt-1 text-xs text-muted-foreground">
              1 COPTT = 1 lb of LME Grade A copper
              {config ? ` · settled in ${config.payment_symbol}` : ""}
            </p>
          </div>
          <Button
            size="lg"
            className="bg-[#B87333] text-white hover:bg-[#9A5B2E] sm:min-w-[10rem]"
            onClick={() => setOpen(true)}
            disabled={!accepting}
          >
            {accepting ? "Buy now" : "Unavailable"}
            <ArrowRightIcon />
          </Button>
        </div>
      </div>

      <Sheet open={open} onOpenChange={close}>
        <SheetContent side="right" className="w-full gap-0 sm:max-w-md">
          <SheetHeader className="border-b">
            <SheetTitle>
              {step === "done" ? "Purchase complete" : "Buy COPTT"}
            </SheetTitle>
            <SheetDescription>
              {config
                ? `Minimum ${config.min_amount_lb} lb · paid in ${config.payment_symbol}`
                : "Loading…"}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-5 overflow-y-auto px-4 py-5">
            {error ? (
              <div className="flex gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
                <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}

            {step === "amount" ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="buy-lb">Amount (lb)</Label>
                  <Input
                    id="buy-lb"
                    inputMode="decimal"
                    value={amountLb}
                    onChange={(e) => setAmountLb(e.target.value)}
                  />
                  {config ? (
                    <p className="text-xs text-muted-foreground">
                      Between {config.min_amount_lb} and{" "}
                      {config.max_amount_lb.toLocaleString()} lb
                    </p>
                  ) : null}
                </div>
                {config ? (
                  <p className="text-xs text-muted-foreground">
                    Price is fixed when you continue and held for{" "}
                    {Math.round(config.quote_validity_secs / 60)} minutes.
                  </p>
                ) : null}
              </div>
            ) : null}

            {quote && (step === "review" || step === "working") ? (
              <div className="space-y-4">
                <dl className="divide-y rounded-lg border text-sm">
                  <Row label="Amount" value={`${quote.pricing.amount_lb} lb`} />
                  <Row
                    label="Index price"
                    value={`$${quote.pricing.index_usd_per_lb.toFixed(4)} / lb`}
                  />
                  <Row
                    label="Spread"
                    value={`${(quote.pricing.spread_bps / 100).toFixed(2)}%`}
                  />
                  <Row
                    label="Your price"
                    value={`$${quote.pricing.effective_usd_per_lb.toFixed(4)} / lb`}
                  />
                  <Row
                    label="Total"
                    value={`${quote.pricing.total_usd.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })} ${quote.pricing.payment_symbol}`}
                    strong
                  />
                </dl>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Quote expires</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      expired && "border-destructive/40 text-destructive",
                      !expired && secondsLeft !== null && secondsLeft < 30 && "text-amber-600",
                    )}
                  >
                    {expired
                      ? "Expired"
                      : secondsLeft !== null
                        ? `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")}`
                        : "—"}
                  </Badge>
                </div>

                {!quote.approval.sufficient_funds ? (
                  <p className="rounded-lg border border-amber-500/40 bg-amber-50/60 px-3 py-2 text-xs dark:bg-amber-950/20">
                    Not enough {quote.pricing.payment_symbol} in this wallet to
                    complete the purchase.
                  </p>
                ) : null}

                {quote.approve_tx ? (
                  <p className="text-xs text-muted-foreground">
                    Two wallet prompts: one to approve{" "}
                    {quote.pricing.payment_symbol} spending, one to buy.
                  </p>
                ) : null}

                {step === "working" ? (
                  <p className="flex items-center gap-2 text-sm">
                    <Loader2Icon className="size-4 animate-spin" />
                    {statusLine}
                  </p>
                ) : null}
              </div>
            ) : null}

            {step === "done" && quote ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <span className="flex size-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                  <CheckIcon className="size-5" />
                </span>
                <p className="text-sm font-semibold">
                  {quote.pricing.amount_lb} lb COPTT is in your wallet
                </p>
                {txHash ? (
                  <a
                    href={explorerTx(txHash, quote.chain_id)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground underline"
                  >
                    View transaction <ExternalLinkIcon className="size-3" />
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>

          <SheetFooter className="border-t">
            {step === "amount" ? (
              <Button
                className="bg-[#B87333] text-white hover:bg-[#9A5B2E]"
                disabled={!amountValid || busy}
                onClick={getQuote}
              >
                {busy ? <Loader2Icon className="animate-spin" /> : null}
                Get price
              </Button>
            ) : null}

            {step === "review" ? (
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={reset} disabled={busy}>
                  Back
                </Button>
                {!wallet ? (
                  <Button
                    className="bg-[#B87333] text-white hover:bg-[#9A5B2E]"
                    onClick={connectWallet}
                  >
                    <WalletIcon /> Connect wallet
                  </Button>
                ) : expired ? (
                  <Button className="bg-[#B87333] text-white hover:bg-[#9A5B2E]" onClick={getQuote}>
                    New price
                  </Button>
                ) : (
                  <Button
                    className="bg-[#B87333] text-white hover:bg-[#9A5B2E]"
                    onClick={buy}
                    disabled={busy || !quote?.approval.sufficient_funds}
                  >
                    {busy ? <Loader2Icon className="animate-spin" /> : <CheckIcon />}
                    Buy
                  </Button>
                )}
              </div>
            ) : null}

            {step === "working" ? (
              <p className="w-full text-center text-xs text-muted-foreground">
                Keep this open until it confirms.
              </p>
            ) : null}

            {step === "done" ? (
              <Button variant="outline" onClick={() => close(false)}>
                Close
              </Button>
            ) : null}
          </SheetFooter>

          {wallet && step !== "done" ? (
            <p className="border-t px-4 py-2 text-xs text-muted-foreground">
              Paying from <span className="font-mono">{shortAddress(wallet)}</span>
            </p>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  )
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 px-3 py-2.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={cn("text-right tabular-nums", strong ? "font-semibold" : "font-medium")}>
        {value}
      </dd>
    </div>
  )
}

/** Turns the backend's error codes into something a buyer can act on. */
function explainQuoteError(err: unknown): string {
  if (err instanceof ApiRequestError) {
    switch (err.error) {
      case "wallet_not_bound":
        return "Bind a wallet in Settings before buying."
      case "price_stale":
        return "The copper price feed is not current, so we are not quoting. Try again shortly."
      case "insufficient_reserve":
        return "Not enough reserve-qualified copper to back this purchase right now."
      case "reserve_shortfall":
        return "Issuance is paused while a backing shortfall is resolved."
      case "no_qualified_lots":
        return "No copper lot is currently reserve-qualified."
      case "purchase_paused":
      case "mint_paused":
        return "Purchases are paused."
      case "amount_out_of_range":
        return err.message ?? "That amount is outside the allowed range."
      case "kyc_required":
        return "Complete identity verification before buying."
    }
    return err.message ?? "Could not get a price."
  }
  return err instanceof Error ? err.message : "Could not get a price."
}
