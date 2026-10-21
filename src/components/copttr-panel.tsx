"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { AlertTriangleIcon, ArrowRightLeftIcon, Loader2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { WalletConnectButton } from "@/components/wallet-connect-button"
import { usePortalWallet } from "@/hooks/use-portal-wallet"
import { ApiRequestError, copttApi, type CopttrHolding } from "@/lib/api"
import { connect, currentAccount, isUserRejection } from "@/lib/wallet"
import { USE_RAINBOWKIT } from "@/lib/wallet-mode"
import { cn } from "@/lib/utils"

/**
 * COPTTR holdings and conversion.
 *
 * A series is a claim on copper a mine expects to produce. As that copper
 * arrives it becomes convertible pro rata, so "claimable" is what this holder
 * can turn into COPTT today — not their whole balance, and not a race against
 * other holders. The entitlement is fixed at the moment copper is allocated
 * and waits for them.
 */
export function CopttrPanel() {
  const [holdings, setHoldings] = useState<CopttrHolding[]>([])
  const [chainId, setChainId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [wallet, setWallet] = useState<string | null>(null)
  const { rainbowAddress, ensureChain, sendTx, waitForReceipt } = usePortalWallet()
  const connectedWallet = USE_RAINBOWKIT ? rainbowAddress : wallet
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await copttApi.listHoldings()
      setHoldings(res.holdings)
      setChainId(res.chain_id)
    } catch {
      setHoldings([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    if (!USE_RAINBOWKIT) currentAccount().then(setWallet)
  }, [load])

  const convert = async (h: CopttrHolding) => {
    if (!chainId) return
    setBusyId(h.series_id)
    setError(null)
    try {
      const from = connectedWallet ?? (USE_RAINBOWKIT ? null : await connect())
      if (!from) {
        setError("Connect a wallet first.")
        return
      }
      setWallet(from)
      await ensureChain(chainId)

      const { convert_tx } = await copttApi.prepareConvert(h.series_id, h.claimable_lb)
      const hash = await sendTx(from, convert_tx)
      if ((await waitForReceipt(hash)).status !== "success") {
        throw new Error("The conversion reverted — nothing was burned.")
      }

      toast.success(`Converted ${h.claimable_lb} lb into CuTT`)
      setTimeout(load, 20_000)
    } catch (err) {
      if (!isUserRejection(err)) setError(explainConvertError(err))
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Forward positions (CuTTr)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (holdings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Forward positions (CuTTr)
          </CardTitle>
          <CardDescription className="text-xs">
            You hold no series. CuTTr is a claim on copper a mine expects to
            produce; it converts into CuTT as that copper is delivered.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Forward positions (CuTTr)
        </CardTitle>
        <CardDescription className="text-xs">
          Converts into CuTT pro rata as copper is delivered
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {error ? (
          <div className="flex gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
            <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        {holdings.map((h) => {
          const canConvert = h.claimable_lb > 0
          const windowOpen = new Date(h.earliest_conversion) <= new Date()

          return (
            <div key={h.series_id} className="rounded-lg border px-3 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{h.symbol || "CuTTr"}</p>
                  <p className="truncate text-xs text-muted-foreground">{h.name}</p>
                </div>
                <Badge variant="outline" className={cn(h.status === "converting" && "text-emerald-600")}>
                  {h.status}
                </Badge>
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Holding</dt>
                  <dd className="font-medium tabular-nums">{h.balance_lb} lb</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Convertible now</dt>
                  <dd
                    className={cn(
                      "font-medium tabular-nums",
                      canConvert && "text-emerald-600 dark:text-emerald-400",
                    )}
                  >
                    {h.claimable_lb} lb
                  </dd>
                </div>
              </dl>

              <p className="mt-2 text-xs text-muted-foreground">
                {windowOpen
                  ? "Conversion window is open"
                  : `Opens ${new Date(h.earliest_conversion).toLocaleDateString()}`}
              </p>

              {!connectedWallet ? (
                <div className="mt-3">
                  <WalletConnectButton
                    onLegacyConnect={() => {
                      void connect().then(setWallet).catch((err) => {
                        if (!isUserRejection(err)) {
                          setError(err instanceof Error ? err.message : "Could not connect")
                        }
                      })
                    }}
                  />
                </div>
              ) : (
              <Button
                size="sm"
                className="mt-3 w-full bg-[#B87333] text-white hover:bg-[#9A5B2E]"
                disabled={!canConvert || !windowOpen || busyId === h.series_id}
                onClick={() => convert(h)}
              >
                {busyId === h.series_id ? (
                  <Loader2Icon className="animate-spin" />
                ) : (
                  <ArrowRightLeftIcon />
                )}
                {canConvert ? `Convert ${h.claimable_lb} lb to CuTT` : "Nothing to convert yet"}
              </Button>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

function explainConvertError(err: unknown): string {
  if (err instanceof ApiRequestError) {
    switch (err.error) {
      case "wallet_not_bound":
        return "Bind a wallet in Settings before converting."
      case "exceeds_entitlement":
        return err.message ?? "More than you can convert today."
      case "copttr_unavailable":
        return "CuTTr is not available on this environment."
    }
    return err.message ?? "Could not convert."
  }
  return err instanceof Error ? err.message : "Could not convert."
}
