"use client"

import { ConnectButton } from "@rainbow-me/rainbowkit"
import { Loader2Icon, WalletIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { USE_RAINBOWKIT } from "@/lib/wallet-mode"

const copper =
  "bg-[#B87333] text-white hover:bg-[#9A5B2E] dark:bg-[#B87333] dark:hover:bg-[#CD7F32]"
const stone = "bg-stone-900 text-white hover:bg-stone-800"

export function WalletConnectButton({
  label = "Connect wallet",
  className,
  tone = "copper",
  fullWidth = true,
  onLegacyConnect,
  legacyConnecting,
}: {
  label?: string
  className?: string
  tone?: "copper" | "stone"
  fullWidth?: boolean
  onLegacyConnect?: () => void
  legacyConnecting?: boolean
}) {
  const toneClass = tone === "stone" ? stone : copper

  if (!USE_RAINBOWKIT) {
    return (
      <Button
        type="button"
        className={cn(fullWidth && "w-full", toneClass, className)}
        onClick={onLegacyConnect}
        disabled={legacyConnecting}
      >
        {legacyConnecting ? <Loader2Icon className="animate-spin" /> : <WalletIcon />}
        {label}
      </Button>
    )
  }

  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
        if (!mounted) {
          return (
            <Button type="button" disabled className={cn(fullWidth && "w-full", toneClass, className)}>
              {label}
            </Button>
          )
        }

        if (!account || !chain) {
          return (
            <Button
              type="button"
              className={cn(fullWidth && "w-full", toneClass, className)}
              onClick={openConnectModal}
            >
              <WalletIcon />
              {label}
            </Button>
          )
        }

        if (chain.unsupported) {
          return (
            <Button
              type="button"
              className={cn(fullWidth && "w-full", toneClass, className)}
              onClick={openChainModal}
            >
              Wrong network
            </Button>
          )
        }

        return (
          <Button
            type="button"
            variant="outline"
            className={cn(fullWidth && "w-full", className)}
            onClick={openAccountModal}
          >
            {account.displayName}
          </Button>
        )
      }}
    </ConnectButton.Custom>
  )
}
