"use client"

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import { toast } from "sonner"
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  CheckIcon,
  ExternalLinkIcon,
  LandmarkIcon,
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
import { WalletConnectButton } from "@/components/wallet-connect-button"
import { usePortalWallet } from "@/hooks/use-portal-wallet"
import { ApiRequestError, copttApi, type PurchaseConfig, type PurchaseQuote } from "@/lib/api"
import {
  connect,
  currentAccount,
  explorerTx,
  isUserRejection,
  shortAddress,
} from "@/lib/wallet"
import { USE_RAINBOWKIT } from "@/lib/wallet-mode"
import { cn } from "@/lib/utils"
import { DEV_BYPASS_AUTH } from "@/lib/dev-bypass-auth"
import { demoPurchaseConfig, demoPurchaseQuote } from "@/lib/demo-data"

type PayMethod = "wallet" | "bank"
type Step = "amount" | "price" | "method" | "confirm" | "working" | "done"

export function BuyFlow({ className }: { className?: string }) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>("amount")
  const [method, setMethod] = useState<PayMethod>("wallet")
  const [bankReference, setBankReference] = useState<string | null>(null)

  const [config, setConfig] = useState<PurchaseConfig | null>(null)
  const [quote, setQuote] = useState<PurchaseQuote | null>(null)
  const [wallet, setWallet] = useState<string | null>(null)
  const { rainbowAddress, ensureChain, sendTx, waitForReceipt } = usePortalWallet()
  const connectedWallet = USE_RAINBOWKIT ? rainbowAddress : wallet

  const [amountLb, setAmountLb] = useState("100")
  const [busy, setBusy] = useState(false)
  const [statusLine, setStatusLine] = useState("")
  const [txHash, setTxHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)

  useEffect(() => {
    if (DEV_BYPASS_AUTH) {
      setConfig(demoPurchaseConfig())
      return
    }
    copttApi.getPurchaseConfig().then(setConfig).catch(() => setConfig(null))
    if (!USE_RAINBOWKIT) currentAccount().then(setWallet)
  }, [])

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

  useEffect(() => {
    if (step === "confirm" && method === "bank" && !bankReference) {
      setBankReference(`CuTT-${Date.now().toString(36).toUpperCase()}`)
    }
  }, [step, method, bankReference])

  const reset = useCallback(() => {
    setStep("amount")
    setMethod("wallet")
    setBankReference(null)
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
      const q = DEV_BYPASS_AUTH
        ? demoPurchaseQuote(lb)
        : await copttApi.requestQuote(lb)
      setQuote(q)
      setStep("price")
    } catch (err) {
      setError(explainQuoteError(err))
    } finally {
      setBusy(false)
    }
  }

  const connectWallet = async () => {
    if (USE_RAINBOWKIT) return
    try {
      setWallet(await connect())
    } catch (err) {
      if (!isUserRejection(err)) {
        toast.error(err instanceof Error ? err.message : "Could not connect")
      }
    }
  }

  const completeWalletPurchase = async () => {
    if (!quote) return
    if (DEV_BYPASS_AUTH) {
      setBusy(true)
      setError(null)
      setStep("working")
      setStatusLine("Confirming wallet payment…")
      await new Promise((resolve) => setTimeout(resolve, 700))
      setStep("done")
      toast.success(`Wallet checkout complete · ${quote.pricing.amount_lb} lb CuTT`)
      setBusy(false)
      return
    }
    if (!connectedWallet) return
    setBusy(true)
    setError(null)
    setStep("working")

    try {
      await ensureChain(quote.chain_id)

      if (quote.approve_tx) {
        setStatusLine(`Approve ${quote.pricing.payment_symbol} spending…`)
        const approveHash = await sendTx(connectedWallet, quote.approve_tx)
        setStatusLine("Waiting for the approval to confirm…")
        const approved = await waitForReceipt(approveHash)
        if (approved.status !== "success") {
          throw new Error("The approval transaction reverted.")
        }
      }

      setStatusLine("Confirm the purchase…")
      const hash = await sendTx(connectedWallet, quote.buy_tx)
      setTxHash(hash)

      setStatusLine("Waiting for the purchase to confirm…")
      const receipt = await waitForReceipt(hash)
      if (receipt.status !== "success") {
        throw new Error(
          "The purchase reverted, so nothing was charged. The quote may have expired — request a new one.",
        )
      }

      setStep("done")
      toast.success(`Bought ${quote.pricing.amount_lb} lb of CuTT`)
    } catch (err) {
      if (isUserRejection(err)) {
        setStep("confirm")
        setStatusLine("")
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong")
        setStep("confirm")
      }
    } finally {
      setBusy(false)
    }
  }

  const completeBankTransfer = async () => {
    if (!quote) return
    setBusy(true)
    await new Promise((resolve) => setTimeout(resolve, 700))
    setBusy(false)
    setStep("done")
    toast.success(
      bankReference
        ? `Bank transfer ${bankReference} recorded. We'll match it when funds arrive.`
        : "Bank transfer recorded.",
    )
  }

  const expired = secondsLeft !== null && secondsLeft <= 0
  const accepting = config?.accepting ?? false

  const sheetTitle = useMemo(() => {
    if (step === "done") {
      return method === "wallet" ? "Purchase complete" : "Transfer recorded"
    }
    if (step === "amount") return "Buy CuTT"
    if (step === "price") return "Your price"
    if (step === "method") return "Payment method"
    if (step === "confirm") {
      return method === "wallet" ? "Pay with wallet" : "Bank transfer"
    }
    return "Buy CuTT"
  }, [step, method])

  const totalLabel = quote
    ? `${quote.pricing.total_usd.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} ${quote.pricing.payment_symbol}`
    : "—"

  return (
    <>
      <div className={cn("overflow-hidden rounded-xl border border-border/80 bg-card p-5 shadow-sm", className)}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold">Buy CuTT</p>
            <p className="mt-1 text-xs text-muted-foreground">
              1 CuTT = 1 lb of COMEX Grade 1 copper
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
            <SheetTitle>{sheetTitle}</SheetTitle>
            <SheetDescription>
              {step === "done"
                ? "You can close this panel."
                : config
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

            {quote && step === "price" ? (
              <QuoteBreakdown
                quote={quote}
                expired={expired}
                secondsLeft={secondsLeft}
                showWalletHints
              />
            ) : null}

            {step === "method" ? (
              <div className="space-y-3">
                <PayOption
                  selected={method === "wallet"}
                  onSelect={() => setMethod("wallet")}
                  icon={<WalletIcon className="size-4" />}
                  title="Wallet"
                  detail="Connect your wallet and confirm on-chain."
                />
                <PayOption
                  selected={method === "bank"}
                  onSelect={() => setMethod("bank")}
                  icon={<LandmarkIcon className="size-4" />}
                  title="Bank transfer"
                  detail="Wire funds using the details we provide."
                />
              </div>
            ) : null}

            {quote && step === "confirm" && method === "wallet" ? (
              <div className="space-y-4">
                <OrderSummary quote={quote} totalLabel={totalLabel} />
                {connectedWallet ? (
                  <p className="rounded-lg border bg-muted/40 px-3 py-2 text-sm">
                    Connected{" "}
                    <span className="font-mono font-medium">
                      {shortAddress(connectedWallet)}
                    </span>
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Connect a wallet to complete checkout.
                  </p>
                )}
                {!DEV_BYPASS_AUTH && !quote.approval.sufficient_funds ? (
                  <p className="rounded-lg border border-amber-500/40 bg-amber-50/60 px-3 py-2 text-xs dark:bg-amber-950/20">
                    Not enough {quote.pricing.payment_symbol} in this wallet.
                  </p>
                ) : null}
              </div>
            ) : null}

            {quote && step === "confirm" && method === "bank" ? (
              <div className="space-y-4">
                <OrderSummary quote={quote} totalLabel={totalLabel} />
                <dl className="divide-y rounded-lg border text-sm">
                  <BankRow label="Beneficiary" value="Toto Finance Holdings LLC" />
                  <BankRow label="Bank" value="JPMorgan Chase Bank, N.A." />
                  <BankRow label="Routing (ABA)" value="021000021" />
                  <BankRow label="Account number" value="1234567890" />
                  <BankRow label="Reference" value={bankReference ?? "—"} />
                  <BankRow label="Amount" value={totalLabel} />
                </dl>
                <p className="text-xs text-muted-foreground">
                  Use the reference exactly so we can match your transfer.
                </p>
              </div>
            ) : null}

            {quote && step === "working" ? (
              <div className="space-y-4">
                <QuoteBreakdown quote={quote} expired={expired} secondsLeft={secondsLeft} />
                <p className="flex items-center gap-2 text-sm">
                  <Loader2Icon className="size-4 animate-spin" />
                  {statusLine}
                </p>
              </div>
            ) : null}

            {step === "done" && quote ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <span className="flex size-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                  <CheckIcon className="size-5" />
                </span>
                <p className="text-sm font-semibold">
                  {method === "wallet"
                    ? `${quote.pricing.amount_lb} lb CuTT is in your wallet`
                    : "Bank transfer instructions saved"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {totalLabel} for {quote.pricing.amount_lb} lb
                  {method === "bank" && bankReference ? ` · ${bankReference}` : ""}
                </p>
                {method === "wallet" && txHash ? (
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

            {step === "price" ? (
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={reset} disabled={busy}>
                  Back
                </Button>
                {expired ? (
                  <Button className="bg-[#B87333] text-white hover:bg-[#9A5B2E]" onClick={getQuote}>
                    New price
                  </Button>
                ) : (
                  <Button
                    className="bg-[#B87333] text-white hover:bg-[#9A5B2E]"
                    onClick={() => setStep("method")}
                  >
                    Continue
                  </Button>
                )}
              </div>
            ) : null}

            {step === "method" ? (
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => setStep("price")}>
                  Back
                </Button>
                <Button
                  className="bg-[#B87333] text-white hover:bg-[#9A5B2E]"
                  onClick={() => setStep("confirm")}
                >
                  Continue
                </Button>
              </div>
            ) : null}

            {step === "confirm" ? (
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => setStep("method")} disabled={busy}>
                  Back
                </Button>
                {method === "wallet" &&
                !DEV_BYPASS_AUTH &&
                !connectedWallet ? (
                  <WalletConnectButton onLegacyConnect={connectWallet} />
                ) : method === "wallet" ? (
                  <Button
                    className="bg-[#B87333] text-white hover:bg-[#9A5B2E]"
                    onClick={completeWalletPurchase}
                    disabled={
                      busy ||
                      (!DEV_BYPASS_AUTH &&
                        (!connectedWallet || !quote?.approval.sufficient_funds))
                    }
                  >
                    {busy ? <Loader2Icon className="animate-spin" /> : <CheckIcon />}
                    Confirm payment
                  </Button>
                ) : (
                  <Button
                    className="bg-[#B87333] text-white hover:bg-[#9A5B2E]"
                    onClick={completeBankTransfer}
                    disabled={busy}
                  >
                    {busy ? <Loader2Icon className="animate-spin" /> : <CheckIcon />}
                    I&apos;ve sent the wire
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
        </SheetContent>
      </Sheet>
    </>
  )
}

function OrderSummary({
  quote,
  totalLabel,
}: {
  quote: PurchaseQuote
  totalLabel: string
}) {
  return (
    <div className="rounded-lg border bg-muted/30 px-3 py-3 text-sm">
      <p className="font-semibold tabular-nums">{totalLabel}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {quote.pricing.amount_lb} lb CuTT · $
        {quote.pricing.effective_usd_per_lb.toFixed(4)} / lb
      </p>
    </div>
  )
}

function QuoteBreakdown({
  quote,
  expired,
  secondsLeft,
  showWalletHints,
}: {
  quote: PurchaseQuote
  expired: boolean
  secondsLeft: number | null
  showWalletHints?: boolean
}) {
  return (
    <div className="space-y-4">
      <dl className="divide-y rounded-lg border text-sm">
        <Row label="Amount" value={`${quote.pricing.amount_lb} lb`} />
        <Row
          label="Index price"
          value={`$${quote.pricing.index_usd_per_lb.toFixed(4)} / lb`}
        />
        <Row label="Spread" value={`${(quote.pricing.spread_bps / 100).toFixed(2)}%`} />
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

      {showWalletHints && !quote.approval.sufficient_funds ? (
        <p className="rounded-lg border border-amber-500/40 bg-amber-50/60 px-3 py-2 text-xs dark:bg-amber-950/20">
          Wallet checkout needs enough {quote.pricing.payment_symbol}. Bank transfer is
          available on the next step.
        </p>
      ) : null}

      {showWalletHints && quote.approve_tx ? (
        <p className="text-xs text-muted-foreground">
          Wallet checkout may ask you to approve {quote.pricing.payment_symbol} spending,
          then confirm the purchase.
        </p>
      ) : null}
    </div>
  )
}

function PayOption({
  selected,
  onSelect,
  icon,
  title,
  detail,
}: {
  selected: boolean
  onSelect: () => void
  icon: ReactNode
  title: string
  detail: string
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg border px-3 py-3 text-left transition-colors",
        selected
          ? "border-[#B87333]/50 bg-amber-50/60 dark:bg-amber-950/20"
          : "hover:bg-muted/50",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md border",
          selected ? "border-[#B87333]/40 text-[#9A5B2E]" : "text-muted-foreground",
        )}
      >
        {icon}
      </span>
      <span>
        <span className="block text-sm font-medium">{title}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{detail}</span>
      </span>
    </button>
  )
}

function BankRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 px-3 py-2.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium tabular-nums">{value}</dd>
    </div>
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
