"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import {
  AlertTriangleIcon,
  CheckIcon,
  Loader2Icon,
  PackageIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { ApiRequestError, copttApi } from "@/lib/api"
import { DEV_BYPASS_AUTH } from "@/lib/dev-bypass-auth"
import {
  REDEMPTION_FULFILMENT_DAYS,
  REDEMPTION_MIN_LB,
  type RedemptionHolding,
} from "@/content/redemption-holdings"
import {
  connect,
  currentAccount,
  isUserRejection,
  shortAddress,
} from "@/lib/wallet"
import { USE_RAINBOWKIT } from "@/lib/wallet-mode"

type Step = "amount" | "confirm" | "working" | "done"

type RedeemFlowProps = {
  holding: RedemptionHolding | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RedeemFlow({ holding, open, onOpenChange }: RedeemFlowProps) {
  const [step, setStep] = useState<Step>("amount")
  const [amountLb, setAmountLb] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reference, setReference] = useState<string | null>(null)
  const [wallet, setWallet] = useState<string | null>(null)
  const { rainbowAddress, ensureChain, sendTx, waitForReceipt } = usePortalWallet()
  const connectedWallet = USE_RAINBOWKIT ? rainbowAddress : wallet

  const maxLb = holding?.balanceLb ?? 0

  const reset = useCallback(() => {
    setStep("amount")
    setAmountLb("")
    setBusy(false)
    setError(null)
    setReference(null)
  }, [])

  const close = (next: boolean) => {
    onOpenChange(next)
    if (!next) reset()
  }

  useEffect(() => {
    if (open && holding) {
      setAmountLb(String(Math.min(maxLb, Math.max(REDEMPTION_MIN_LB, 1))))
    }
  }, [open, holding, maxLb])

  useEffect(() => {
    if (!USE_RAINBOWKIT) currentAccount().then(setWallet)
  }, [])

  const lb = Number.parseFloat(amountLb)
  const amountValid =
    holding &&
    Number.isFinite(lb) &&
    lb >= REDEMPTION_MIN_LB &&
    lb <= holding.balanceLb

  const sheetTitle = useMemo(() => {
    if (step === "done") return "Redemption submitted"
    if (step === "confirm") return "Confirm redemption"
    if (step === "working") return "Processing"
    return "Redeem CuTT"
  }, [step])

  const submitDemo = async () => {
    if (!holding || !amountValid) return
    setBusy(true)
    setStep("working")
    await new Promise((r) => setTimeout(r, 800))
    setReference(`RED-${Date.now().toString(36).toUpperCase()}`)
    setStep("done")
    setBusy(false)
    toast.success(`Redemption request for ${lb} lb recorded`)
  }

  const submitLive = async () => {
    if (!holding || !amountValid) return
    if (!connectedWallet && !USE_RAINBOWKIT) {
      setError("Connect a wallet first.")
      return
    }
    setBusy(true)
    setError(null)
    setStep("working")
    try {
      const from = connectedWallet ?? (await connect())
      setWallet(from)
      const config = await copttApi.getRedemptionConfig()
      await ensureChain(config.chain_id)
      const prepared = await copttApi.prepareRedemption(lb)
      const approveHash = await sendTx(from, prepared.approve_tx)
      if ((await waitForReceipt(approveHash)).status !== "success") {
        throw new Error("The approval reverted.")
      }
      const hash = await sendTx(from, prepared.request_tx)
      if ((await waitForReceipt(hash)).status !== "success") {
        throw new Error("The redemption request reverted.")
      }
      setReference(`RED-${holding.id}-${lb}`)
      setStep("done")
      toast.success(`Requested redemption of ${lb} lb`)
    } catch (err) {
      if (!isUserRejection(err)) {
        setError(explainRedeemError(err))
      }
      setStep("confirm")
    } finally {
      setBusy(false)
    }
  }

  const onSubmit = () => {
    if (DEV_BYPASS_AUTH) void submitDemo()
    else void submitLive()
  }

  if (!holding) return null

  return (
    <Sheet open={open} onOpenChange={close}>
      <SheetContent side="right" className="w-full gap-0 sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle>{sheetTitle}</SheetTitle>
          <SheetDescription>
            {step === "done"
              ? "We will email you when the desk confirms delivery."
              : `${holding.subtitle} · up to ${holding.balanceLb} lb available`}
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
                <Label htmlFor="redeem-amount">Amount to redeem (lb)</Label>
                <Input
                  id="redeem-amount"
                  inputMode="decimal"
                  value={amountLb}
                  onChange={(e) => setAmountLb(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Between {REDEMPTION_MIN_LB} and {holding.balanceLb.toLocaleString()} lb
                </p>
              </div>
              <p className="rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                CuTT is escrowed for delivery, not burned. If fulfilment cannot complete,
                tokens return to your wallet.
              </p>
            </div>
          ) : null}

          {step === "confirm" ? (
            <div className="space-y-4">
              <dl className="divide-y rounded-lg border text-sm">
                <Row label="Asset" value={`${holding.ticker} · ${holding.subtitle}`} />
                <Row label="Amount" value={`${lb} lb`} />
                <Row
                  label="Delivery window"
                  value={`${REDEMPTION_FULFILMENT_DAYS} business days after confirmation`}
                />
              </dl>
              {!DEV_BYPASS_AUTH && !connectedWallet ? (
                <p className="text-sm text-muted-foreground">
                  Connect a wallet to escrow CuTT for this redemption.
                </p>
              ) : null}
              {!DEV_BYPASS_AUTH && connectedWallet ? (
                <p className="rounded-lg border bg-muted/40 px-3 py-2 text-sm">
                  Connected{" "}
                  <span className="font-mono font-medium">
                    {shortAddress(connectedWallet)}
                  </span>
                </p>
              ) : null}
            </div>
          ) : null}

          {step === "working" ? (
            <p className="flex items-center gap-2 text-sm">
              <Loader2Icon className="size-4 animate-spin" />
              {DEV_BYPASS_AUTH ? "Recording redemption…" : "Confirm on-chain escrow…"}
            </p>
          ) : null}

          {step === "done" ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <span className="flex size-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                <CheckIcon className="size-5" />
              </span>
              <p className="text-sm font-semibold">
                {lb} lb redemption request received
              </p>
              {reference ? (
                <p className="text-xs text-muted-foreground">Reference {reference}</p>
              ) : null}
              <p className="text-xs text-muted-foreground">
                Physical delivery from {holding.subtitle}. Track status under Investments
                once the desk updates your request.
              </p>
            </div>
          ) : null}
        </div>

        <SheetFooter className="border-t">
          {step === "amount" ? (
            <Button
              className="bg-[#B87333] text-white hover:bg-[#9A5B2E]"
              disabled={!amountValid || busy}
              onClick={() => setStep("confirm")}
            >
              Continue
            </Button>
          ) : null}

          {step === "confirm" ? (
            <div className="grid w-full grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => setStep("amount")} disabled={busy}>
                Back
              </Button>
              {!DEV_BYPASS_AUTH && !connectedWallet ? (
                <WalletConnectButton onLegacyConnect={() => connect().then(setWallet)} />
              ) : (
                <Button
                  className="bg-[#B87333] text-white hover:bg-[#9A5B2E]"
                  onClick={onSubmit}
                  disabled={busy}
                >
                  {busy ? <Loader2Icon className="animate-spin" /> : <PackageIcon />}
                  Submit redemption
                </Button>
              )}
            </div>
          ) : null}

          {step === "done" ? (
            <Button variant="outline" onClick={() => close(false)}>
              Close
            </Button>
          ) : null}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 px-3 py-2.5 sm:grid-cols-[7rem_1fr]">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  )
}

function explainRedeemError(err: unknown): string {
  if (err instanceof ApiRequestError) {
    switch (err.error) {
      case "wallet_not_bound":
        return "Bind a wallet in Settings before redeeming."
      case "below_minimum":
        return err.message ?? "Below the minimum lot size."
      case "redemption_paused":
        return "Redemption is paused."
    }
    return err.message ?? "Could not prepare the redemption."
  }
  return err instanceof Error ? err.message : "Could not prepare the redemption."
}
