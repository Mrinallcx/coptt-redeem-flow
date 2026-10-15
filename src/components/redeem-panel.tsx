"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { AlertTriangleIcon, ExternalLinkIcon, Loader2Icon, PackageIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ApiRequestError,
  copttApi,
  type Redemption,
  type RedemptionConfig,
} from "@/lib/api"
import { WalletConnectButton } from "@/components/wallet-connect-button"
import { usePortalWallet } from "@/hooks/use-portal-wallet"
import {
  connect,
  currentAccount,
  explorerTx,
  isUserRejection,
} from "@/lib/wallet"
import { USE_RAINBOWKIT } from "@/lib/wallet-mode"
import { cn } from "@/lib/utils"

/**
 * Redeeming COPTT for physical copper.
 *
 * Two prompts, because the contract genuinely needs two: an escrow approval
 * and the request itself. The tokens are escrowed, not burned — a request the
 * desk cannot fulfil returns them — and the panel says so, because "your
 * tokens are locked" reads very differently from "your tokens are gone".
 */
export function RedeemPanel() {
  const [config, setConfig] = useState<RedemptionConfig | null>(null)
  const [rows, setRows] = useState<Redemption[]>([])
  const [wallet, setWallet] = useState<string | null>(null)
  const { rainbowAddress, ensureChain, sendTx, waitForReceipt } = usePortalWallet()
  const connectedWallet = USE_RAINBOWKIT ? rainbowAddress : wallet

  const [amountLb, setAmountLb] = useState("")
  const [busy, setBusy] = useState(false)
  const [statusLine, setStatusLine] = useState("")
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const [c, list] = await Promise.all([
        copttApi.getRedemptionConfig(),
        copttApi.listRedemptions().catch(() => ({ redemptions: [], count: 0 })),
      ])
      setConfig(c)
      setRows(list.redemptions)
      if (!amountLb) setAmountLb(String(c.min_redemption_lb))
    } catch {
      setConfig(null)
    }
  }, [amountLb])

  useEffect(() => {
    load()
    if (!USE_RAINBOWKIT) currentAccount().then(setWallet)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const lb = Number.parseFloat(amountLb)
  const valid = Number.isFinite(lb) && config !== null && lb >= config.min_redemption_lb

  const submit = async () => {
    if (!valid || !config) return
    setBusy(true)
    setError(null)

    try {
      const from = connectedWallet ?? (USE_RAINBOWKIT ? null : await connect())
      if (!from) {
        setError("Connect a wallet first.")
        return
      }
      setWallet(from)
      await ensureChain(config.chain_id)

      const prepared = await copttApi.prepareRedemption(lb)

      setStatusLine("Approve the escrow…")
      const approveHash = await sendTx(from, prepared.approve_tx)
      setStatusLine("Waiting for the approval…")
      if ((await waitForReceipt(approveHash)).status !== "success") {
        throw new Error("The approval reverted.")
      }

      setStatusLine("Confirm the redemption request…")
      const hash = await sendTx(from, prepared.request_tx)
      setStatusLine("Waiting for confirmation…")
      if ((await waitForReceipt(hash)).status !== "success") {
        throw new Error("The request reverted — nothing was escrowed.")
      }

      toast.success(`Requested redemption of ${lb} lb`)
      setStatusLine("")
      // The list comes from the indexer, so a fresh request takes a few
      // blocks to appear. Said plainly rather than showing an empty table.
      toast.info("It will appear below once the chain confirms.")
      setTimeout(load, 20_000)
    } catch (err) {
      if (!isUserRejection(err)) {
        setError(explainRedeemError(err))
      }
      setStatusLine("")
    } finally {
      setBusy(false)
    }
  }

  const cancel = async (r: Redemption) => {
    if (!config) return
    setBusy(true)
    setError(null)
    try {
      const from = connectedWallet ?? (USE_RAINBOWKIT ? null : await connect())
      if (!from) {
        setError("Connect a wallet first.")
        return
      }
      await ensureChain(config.chain_id)
      const { cancel_tx } = await copttApi.prepareCancelRedemption(r.redemption_id)
      const hash = await sendTx(from, cancel_tx)
      setStatusLine("Cancelling…")
      if ((await waitForReceipt(hash)).status !== "success") {
        throw new Error("The cancellation reverted — the desk may already have committed to it.")
      }
      toast.success("Redemption cancelled, tokens returned")
      setTimeout(load, 20_000)
    } catch (err) {
      if (!isUserRejection(err)) setError(err instanceof Error ? err.message : "Could not cancel")
    } finally {
      setBusy(false)
      setStatusLine("")
    }
  }

  if (!config) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Redeem for physical copper
          </CardTitle>
          <CardDescription className="text-xs">
            Not available on this environment.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Redeem for physical copper
              </CardTitle>
              <CardDescription className="text-xs">
                Minimum {config.min_redemption_lb.toLocaleString()} lb · the desk
                has {config.fulfilment_window_days} days to deliver
              </CardDescription>
            </div>
            {!config.escrow_solvent ? (
              <Badge variant="outline" className="border-destructive/40 text-destructive">
                Escrow mismatch
              </Badge>
            ) : null}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {error ? (
            <div className="flex gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
              <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="redeem-lb">Amount (lb)</Label>
            <Input
              id="redeem-lb"
              inputMode="decimal"
              value={amountLb}
              onChange={(e) => setAmountLb(e.target.value)}
            />
          </div>

          <p className="rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            Your COPTT is held in escrow, not burned. If the delivery cannot be
            completed the tokens come back to you. They are only destroyed once
            the metal has actually changed hands.
          </p>

          {!connectedWallet ? (
            <WalletConnectButton
              onLegacyConnect={() => {
                void connect().then(setWallet).catch((err) => {
                  if (!isUserRejection(err)) {
                    setError(err instanceof Error ? err.message : "Could not connect")
                  }
                })
              }}
            />
          ) : (
            <Button
              className="w-full bg-[#B87333] text-white hover:bg-[#9A5B2E]"
              disabled={!valid || busy || config.paused}
              onClick={submit}
            >
              {busy ? <Loader2Icon className="animate-spin" /> : <PackageIcon />}
              {busy ? statusLine || "Working…" : "Request redemption"}
            </Button>
          )}
        </CardContent>
      </Card>

      {rows.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Your redemptions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {rows.map((r) => (
              <div
                key={r.redemption_id}
                className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-sm"
              >
                <div>
                  <p className="font-medium tabular-nums">{r.amount_lb} lb</p>
                  <p className="text-xs text-muted-foreground">
                    Deadline {new Date(r.deadline).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={statusTone(r.status)}>
                    {r.status}
                  </Badge>
                  {r.status === "requested" ? (
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => cancel(r)}>
                      Cancel
                    </Button>
                  ) : null}
                  {r.settle_tx ? (
                    <a
                      href={explorerTx(r.settle_tx, config.chain_id)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-muted-foreground"
                    >
                      <ExternalLinkIcon className="size-3.5" />
                    </a>
                  ) : null}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}

function statusTone(status: string) {
  return cn(
    status === "settled" && "text-emerald-600 dark:text-emerald-400",
    status === "fulfilling" && "text-amber-600 dark:text-amber-400",
    (status === "cancelled" || status === "expired") && "text-muted-foreground",
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
