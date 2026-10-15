"use client"

import { useMemo, useState } from "react"
import { useAccount } from "wagmi"
import { CircleHelpIcon, Loader2Icon, WalletIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { WalletConnectButton } from "@/components/wallet-connect-button"
import { USE_RAINBOWKIT } from "@/lib/wallet-mode"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const MOCK_BALANCE = 5
const REWARD_FEE = 0.1
const EXCHANGE = 1
const BONUS_RATE = 0.008

const copperButton =
  "w-full bg-[#B87333] text-white hover:bg-[#9A5B2E] dark:bg-[#B87333] dark:hover:bg-[#CD7F32]"

interface EthereumProvider {
  isMetaMask?: boolean
  isPhantom?: boolean
  providers?: EthereumProvider[]
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
}

function getProvider(): EthereumProvider | null {
  if (typeof window === "undefined") return null
  const eth = (window as Window & { ethereum?: EthereumProvider }).ethereum
  if (!eth) return null
  const list = Array.isArray(eth.providers) && eth.providers.length > 0 ? eth.providers : [eth]
  return (
    list.find((p) => p.isMetaMask && !p.isPhantom) ??
    list.find((p) => !p.isPhantom) ??
    list[0]
  )
}

function parseAmount(value: string) {
  const n = Number.parseFloat(value.replace(/,/g, ""))
  return Number.isFinite(n) && n >= 0 ? n : null
}

function formatAmount(n: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 4,
  }).format(n)
}

function InfoRow({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 text-sm">
      <div className="flex items-center gap-1 text-muted-foreground">
        {label}
        {hint ? (
          <Tooltip>
            <TooltipTrigger
              type="button"
              aria-label={hint}
              className="inline-flex text-muted-foreground/70 hover:text-foreground"
            >
              <CircleHelpIcon className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent>{hint}</TooltipContent>
          </Tooltip>
        ) : null}
      </div>
      <div className="tabular-nums font-medium">{value}</div>
    </div>
  )
}

export function YieldStakeForm() {
  const [amount, setAmount] = useState("")
  const [wallet, setWallet] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [staking, setStaking] = useState(false)
  const [bonus, setBonus] = useState(false)
  const { address, isConnected } = useAccount()

  const connectedAddress = USE_RAINBOWKIT
    ? isConnected
      ? (address ?? null)
      : null
    : wallet

  const parsed = parseAmount(amount)
  const base = parsed && parsed > 0 ? parsed * EXCHANGE : 0
  const receive = bonus ? base * (1 + BONUS_RATE) : base
  const canStake = !!connectedAddress && parsed !== null && parsed > 0

  const shortWallet = useMemo(() => {
    if (!connectedAddress) return null
    return `${connectedAddress.slice(0, 6)}…${connectedAddress.slice(-4)}`
  }, [connectedAddress])

  // Disabled while USE_RAINBOWKIT is true. Kept so we can switch back
  // to injected window.ethereum without rewriting this form.
  const connectWallet = async () => {
    if (USE_RAINBOWKIT) return
    const provider = getProvider()
    if (!provider) {
      toast.error("No wallet detected. Install MetaMask to stake.")
      return
    }
    setConnecting(true)
    try {
      const accs = (await provider.request({ method: "eth_requestAccounts" })) as string[]
      const addr = accs?.[0] ?? null
      if (!addr) {
        toast.error("No account selected.")
        return
      }
      setWallet(addr)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Wallet connection cancelled.")
    } finally {
      setConnecting(false)
    }
  }

  const stake = async () => {
    if (!canStake) return
    setStaking(true)
    await new Promise((r) => setTimeout(r, 700))
    setStaking(false)
    toast.success(
      `Staked ${formatAmount(parsed!)} COPTT. You receive ${formatAmount(receive)} stCOPTT.`,
    )
  }

  return (
    <TooltipProvider>
      <div className="mx-auto w-full max-w-md space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Stake COPTT</CardTitle>
            <CardDescription>
              Receive stCOPTT 1:1. Connect a wallet, then enter an amount.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              autoComplete="off"
              onSubmit={(e) => {
                e.preventDefault()
                if (connectedAddress) void stake()
                else if (!USE_RAINBOWKIT) void connectWallet()
              }}
            >
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="stake-amount">COPTT amount</FieldLabel>
                  <div className="flex gap-2">
                    <Input
                      id="stake-amount"
                      name="amount"
                      inputMode="decimal"
                      placeholder="0"
                      autoComplete="off"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!connectedAddress}
                      onClick={() => setAmount(String(MOCK_BALANCE))}
                    >
                      MAX
                    </Button>
                  </div>
                  <FieldDescription>
                    Equals {formatAmount(receive)} stCOPTT
                    {connectedAddress ? ` · ${MOCK_BALANCE} COPTT available` : ""}
                  </FieldDescription>
                </Field>

                <Field>
                  {USE_RAINBOWKIT ? (
                    <>
                      <WalletConnectButton />
                      {connectedAddress ? (
                        <Button
                          type="submit"
                          className={copperButton}
                          disabled={!canStake || staking}
                        >
                          {staking ? <Loader2Icon className="animate-spin" /> : null}
                          Stake
                        </Button>
                      ) : null}
                    </>
                  ) : connectedAddress ? (
                    <Button
                      type="submit"
                      className={copperButton}
                      disabled={!canStake || staking}
                    >
                      {staking ? <Loader2Icon className="animate-spin" /> : null}
                      Stake
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      className={copperButton}
                      disabled={connecting}
                    >
                      {connecting ? (
                        <Loader2Icon className="animate-spin" />
                      ) : (
                        <WalletIcon />
                      )}
                      Connect wallet
                    </Button>
                  )}
                  {shortWallet ? (
                    <FieldDescription>Connected {shortWallet}</FieldDescription>
                  ) : null}
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between gap-3 pt-6">
            <p className="text-sm text-muted-foreground">
              Get a <span className="font-medium text-foreground">0.80% bonus</span> by
              staking COPTT for stCOPTT
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setBonus((on) => !on)
                toast.success(bonus ? "Bonus removed." : "0.80% staking bonus applied.")
              }}
            >
              {bonus ? "Applied" : "Get bonus"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="divide-y pt-2">
            <InfoRow
              label="You will receive"
              value={`${formatAmount(receive)} stCOPTT`}
            />
            <InfoRow label="Exchange rate" value="1 COPTT = 1 stCOPTT" />
            <InfoRow label="Max transaction cost" value="$0.03" />
            <InfoRow
              label="Reward fee"
              value={`${REWARD_FEE * 100}%`}
              hint="A 10% fee is taken from staking rewards. Your principal is not charged this fee."
            />
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}
