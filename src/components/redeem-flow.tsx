"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import {
  AlertTriangleIcon,
  CheckIcon,
  Loader2Icon,
  MapPinIcon,
  PackageIcon,
  TruckIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  REDEMPTION_LOT_TONNES,
  REDEMPTION_MIN_LOTS,
  formatRedemptionTonnes,
  maxRedemptionLots,
  type RedemptionHolding,
} from "@/content/redemption-holdings"
import {
  connect,
  currentAccount,
  isUserRejection,
  shortAddress,
} from "@/lib/wallet"
import { USE_RAINBOWKIT } from "@/lib/wallet-mode"
import { cn } from "@/lib/utils"

type Step = "amount" | "shipment" | "confirm" | "working" | "done"

type ShipmentMethod = "pickup" | "delivery"

type DeliveryAddress = {
  contactName: string
  company: string
  email: string
  phone: string
  line1: string
  line2: string
  city: string
  region: string
  postalCode: string
  country: string
  instructions: string
}

const emptyAddress = (): DeliveryAddress => ({
  contactName: "",
  company: "",
  email: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  region: "",
  postalCode: "",
  country: "",
  instructions: "",
})

type RedeemFlowProps = {
  holding: RedemptionHolding | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RedeemFlow({ holding, open, onOpenChange }: RedeemFlowProps) {
  const [step, setStep] = useState<Step>("amount")
  const [lotsInput, setLotsInput] = useState("1")
  const [shipmentMethod, setShipmentMethod] = useState<ShipmentMethod>("pickup")
  const [address, setAddress] = useState<DeliveryAddress>(emptyAddress)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reference, setReference] = useState<string | null>(null)
  const [wallet, setWallet] = useState<string | null>(null)
  const { rainbowAddress, ensureChain, sendTx, waitForReceipt } = usePortalWallet()
  const connectedWallet = USE_RAINBOWKIT ? rainbowAddress : wallet

  const maxLots = holding ? maxRedemptionLots(holding.balanceTonnes) : 0

  const reset = useCallback(() => {
    setStep("amount")
    setLotsInput("1")
    setShipmentMethod("pickup")
    setAddress(emptyAddress())
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
      const startLots = Math.min(maxLots, Math.max(REDEMPTION_MIN_LOTS, 1))
      setLotsInput(String(startLots))
    }
  }, [open, holding, maxLots])

  useEffect(() => {
    if (!USE_RAINBOWKIT) currentAccount().then(setWallet)
  }, [])

  const lots = Number.parseInt(lotsInput, 10)
  const totalTonnes =
    Number.isFinite(lots) && lots > 0 ? lots * REDEMPTION_LOT_TONNES : 0

  const amountValid =
    holding &&
    Number.isInteger(lots) &&
    lots >= REDEMPTION_MIN_LOTS &&
    lots <= maxLots

  const deliveryValid =
    shipmentMethod === "pickup" ||
    (address.contactName.trim() !== "" &&
      address.email.trim() !== "" &&
      address.phone.trim() !== "" &&
      address.line1.trim() !== "" &&
      address.city.trim() !== "" &&
      address.region.trim() !== "" &&
      address.postalCode.trim() !== "" &&
      address.country.trim() !== "")

  const sheetTitle = useMemo(() => {
    if (step === "done") return "Redemption submitted"
    if (step === "confirm") return "Confirm redemption"
    if (step === "shipment") return "Shipment"
    if (step === "working") return "Processing"
    return "Redeem CuTT"
  }, [step])

  const deliveryRef = useMemo(() => {
    if (!holding || !amountValid) return ""
    return JSON.stringify({
      vault_id: holding.vaultId ?? holding.id,
      lots,
      tonnes: totalTonnes,
      method: shipmentMethod,
      ...(shipmentMethod === "pickup"
        ? {
            pickup: {
              warehouse: holding.warehouseName,
              address: holding.warehouseAddress,
            },
          }
        : { delivery: address }),
    })
  }, [holding, amountValid, lots, totalTonnes, shipmentMethod, address])

  const shipmentSummary = useMemo(() => {
    if (shipmentMethod === "pickup") {
      return `Pickup · ${holding?.warehouseName ?? "Bonded warehouse"}`
    }
    const parts = [
      address.contactName,
      address.line1,
      [address.city, address.region, address.postalCode].filter(Boolean).join(", "),
      address.country,
    ].filter(Boolean)
    return `Delivery · ${parts.join(" · ")}`
  }, [shipmentMethod, holding, address])

  const submitDemo = async () => {
    if (!holding || !amountValid || !deliveryValid) return
    setBusy(true)
    setStep("working")
    await new Promise((r) => setTimeout(r, 800))
    setReference(`RED-${Date.now().toString(36).toUpperCase()}`)
    setStep("done")
    setBusy(false)
    toast.success(
      `Redemption request for ${lots} lot${lots === 1 ? "" : "s"} (${formatRedemptionTonnes(totalTonnes)}) recorded`,
    )
  }

  const submitLive = async () => {
    if (!holding || !amountValid || !deliveryValid) return
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
      const prepared = await copttApi.prepareRedemption(totalTonnes, deliveryRef)
      const approveHash = await sendTx(from, prepared.approve_tx)
      if ((await waitForReceipt(approveHash)).status !== "success") {
        throw new Error("The approval reverted.")
      }
      const hash = await sendTx(from, prepared.request_tx)
      if ((await waitForReceipt(hash)).status !== "success") {
        throw new Error("The redemption request reverted.")
      }
      setReference(`RED-${holding.id}-${lots}L`)
      setStep("done")
      toast.success(
        `Requested redemption of ${formatRedemptionTonnes(totalTonnes)}`,
      )
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

  const setAddressField = (key: keyof DeliveryAddress, value: string) => {
    setAddress((prev) => ({ ...prev, [key]: value }))
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
              : `${holding.subtitle} · ${formatRedemptionTonnes(holding.balanceTonnes)} available · ${formatRedemptionTonnes(REDEMPTION_LOT_TONNES)} per lot`}
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
                <Label htmlFor="redeem-lots">Lots to redeem</Label>
                <Input
                  id="redeem-lots"
                  inputMode="numeric"
                  value={lotsInput}
                  onChange={(e) => setLotsInput(e.target.value.replace(/[^\d]/g, ""))}
                />
                <p className="text-xs text-muted-foreground">
                  1 lot = {formatRedemptionTonnes(REDEMPTION_LOT_TONNES)}. Minimum{" "}
                  {REDEMPTION_MIN_LOTS} lot · maximum {maxLots} lot
                  {maxLots === 1 ? "" : "s"} for your holding.
                </p>
                {amountValid ? (
                  <p className="text-sm font-medium">
                    Total: {formatRedemptionTonnes(totalTonnes)} ({lots} lot
                    {lots === 1 ? "" : "s"})
                  </p>
                ) : null}
              </div>
              <p className="rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                CuTT is escrowed for delivery, not burned. Redemptions must be whole lots of{" "}
                {formatRedemptionTonnes(REDEMPTION_LOT_TONNES)}. If fulfilment cannot complete,
                tokens return to your wallet.
              </p>
            </div>
          ) : null}

          {step === "shipment" ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Choose how COMEX Grade 1 cathode leaves the bonded warehouse after desk
                confirmation.
              </p>
              <div className="grid gap-2">
                <ShipmentChoice
                  selected={shipmentMethod === "pickup"}
                  icon={<MapPinIcon className="size-4" />}
                  title="Pickup at warehouse"
                  description="Collect at the vault with valid ID and this redemption reference."
                  onClick={() => setShipmentMethod("pickup")}
                />
                <ShipmentChoice
                  selected={shipmentMethod === "delivery"}
                  icon={<TruckIcon className="size-4" />}
                  title="Ship to your address"
                  description="Insured freight to your delivery location (commercial receiving)."
                  onClick={() => setShipmentMethod("delivery")}
                />
              </div>

              {shipmentMethod === "pickup" ? (
                <dl className="divide-y rounded-lg border text-sm">
                  <Row label="Facility" value={holding.warehouseName ?? holding.subtitle} />
                  <Row label="Address" value={holding.warehouseAddress ?? "—"} />
                  <Row
                    label="Pickup"
                    value="Business hours · photo ID · forklift-safe vehicle or arranged carrier"
                  />
                  <Row
                    label="Contact"
                    value="Desk email with your reference before arrival"
                  />
                </dl>
              ) : (
                <div className="space-y-3 rounded-lg border p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Delivery details
                  </p>
                  <AddressField
                    id="del-name"
                    label="Contact name"
                    required
                    value={address.contactName}
                    onChange={(v) => setAddressField("contactName", v)}
                  />
                  <AddressField
                    id="del-company"
                    label="Company"
                    value={address.company}
                    onChange={(v) => setAddressField("company", v)}
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <AddressField
                      id="del-email"
                      label="Email"
                      required
                      type="email"
                      value={address.email}
                      onChange={(v) => setAddressField("email", v)}
                    />
                    <AddressField
                      id="del-phone"
                      label="Phone"
                      required
                      type="tel"
                      value={address.phone}
                      onChange={(v) => setAddressField("phone", v)}
                    />
                  </div>
                  <AddressField
                    id="del-line1"
                    label="Address line 1"
                    required
                    value={address.line1}
                    onChange={(v) => setAddressField("line1", v)}
                  />
                  <AddressField
                    id="del-line2"
                    label="Address line 2"
                    value={address.line2}
                    onChange={(v) => setAddressField("line2", v)}
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <AddressField
                      id="del-city"
                      label="City"
                      required
                      value={address.city}
                      onChange={(v) => setAddressField("city", v)}
                    />
                    <AddressField
                      id="del-region"
                      label="State / province"
                      required
                      value={address.region}
                      onChange={(v) => setAddressField("region", v)}
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <AddressField
                      id="del-postal"
                      label="Postal code"
                      required
                      value={address.postalCode}
                      onChange={(v) => setAddressField("postalCode", v)}
                    />
                    <AddressField
                      id="del-country"
                      label="Country"
                      required
                      value={address.country}
                      onChange={(v) => setAddressField("country", v)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="del-notes">Delivery instructions</Label>
                    <Textarea
                      id="del-notes"
                      rows={3}
                      placeholder="Dock hours, liftgate, customs broker, etc."
                      value={address.instructions}
                      onChange={(e) => setAddressField("instructions", e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {step === "confirm" ? (
            <div className="space-y-4">
              <dl className="divide-y rounded-lg border text-sm">
                <Row label="Asset" value={`${holding.ticker} · ${holding.subtitle}`} />
                <Row
                  label="Amount"
                  value={`${lots} lot${lots === 1 ? "" : "s"} · ${formatRedemptionTonnes(totalTonnes)}`}
                />
                <Row label="Shipment" value={shipmentSummary} />
                {shipmentMethod === "pickup" ? (
                  <Row
                    label="Pickup location"
                    value={`${holding.warehouseName ?? holding.subtitle} — ${holding.warehouseAddress ?? ""}`}
                  />
                ) : (
                  <>
                    <Row label="Deliver to" value={address.contactName} />
                    <Row
                      label="Address"
                      value={[
                        address.line1,
                        address.line2,
                        [address.city, address.region, address.postalCode]
                          .filter(Boolean)
                          .join(", "),
                        address.country,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    />
                    <Row label="Phone" value={address.phone} />
                    <Row label="Email" value={address.email} />
                    {address.instructions.trim() ? (
                      <Row label="Instructions" value={address.instructions} />
                    ) : null}
                  </>
                )}
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
                {formatRedemptionTonnes(totalTonnes)} redemption request received
              </p>
              {reference ? (
                <p className="text-xs text-muted-foreground">Reference {reference}</p>
              ) : null}
              <p className="text-xs text-muted-foreground">{shipmentSummary}</p>
              <p className="text-xs text-muted-foreground">
                Physical delivery from {holding.subtitle}. Track status under Investments once
                the desk updates your request.
              </p>
            </div>
          ) : null}
        </div>

        <SheetFooter className="border-t">
          {step === "amount" ? (
            <Button
              className="bg-[#B87333] text-white hover:bg-[#9A5B2E]"
              disabled={!amountValid || busy}
              onClick={() => setStep("shipment")}
            >
              Continue
            </Button>
          ) : null}

          {step === "shipment" ? (
            <div className="grid w-full grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => setStep("amount")} disabled={busy}>
                Back
              </Button>
              <Button
                className="bg-[#B87333] text-white hover:bg-[#9A5B2E]"
                disabled={!deliveryValid || busy}
                onClick={() => setStep("confirm")}
              >
                Continue
              </Button>
            </div>
          ) : null}

          {step === "confirm" ? (
            <div className="grid w-full grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => setStep("shipment")} disabled={busy}>
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

function ShipmentChoice({
  selected,
  icon,
  title,
  description,
  onClick,
}: {
  selected: boolean
  icon: React.ReactNode
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full gap-3 rounded-lg border px-3 py-3 text-left transition-colors",
        selected
          ? "border-amber-300 bg-amber-50/80 ring-1 ring-amber-200 dark:border-amber-800 dark:bg-amber-950/30 dark:ring-amber-900"
          : "border-border bg-card hover:bg-muted/40",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
          selected ? "bg-amber-100 text-amber-900" : "bg-muted text-muted-foreground",
        )}
      >
        {icon}
      </span>
      <span>
        <span className="block text-sm font-medium">{title}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
      </span>
    </button>
  )
}

function AddressField({
  id,
  label,
  value,
  onChange,
  required,
  type = "text",
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  type?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {required ? " *" : ""}
      </Label>
      <Input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
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
        return `Minimum redemption is 1 lot (${formatRedemptionTonnes(REDEMPTION_LOT_TONNES)}).`
      case "redemption_paused":
        return "Redemption is paused."
    }
    return err.message ?? "Could not prepare the redemption."
  }
  return err instanceof Error ? err.message : "Could not prepare the redemption."
}
