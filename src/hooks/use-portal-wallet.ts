"use client"

import { useAccount, usePublicClient, useSendTransaction, useSwitchChain } from "wagmi"

import type { TxRequest } from "@/lib/api"
import {
  ensureChain as injectedEnsureChain,
  sendTx as injectedSendTx,
  waitForReceipt as injectedWaitForReceipt,
} from "@/lib/wallet"
import { USE_RAINBOWKIT } from "@/lib/wallet-mode"

/**
 * Shared send / switch / wait for buy, redeem and convert.
 *
 * RainbowKit owns the session while USE_RAINBOWKIT is true. The injected
 * helpers in wallet.ts stay as the fallback path.
 */
export function usePortalWallet() {
  const { address, isConnected } = useAccount()
  const { switchChainAsync } = useSwitchChain()
  const { sendTransactionAsync } = useSendTransaction()
  const publicClient = usePublicClient()

  const rainbowAddress =
    USE_RAINBOWKIT && isConnected && address ? address : null

  return {
    rainbowAddress,
    ensureChain: async (chainId: number) => {
      if (USE_RAINBOWKIT) {
        await switchChainAsync({ chainId })
        return
      }
      await injectedEnsureChain(chainId)
    },
    sendTx: async (from: string, tx: TxRequest) => {
      if (USE_RAINBOWKIT) {
        return sendTransactionAsync({
          to: tx.to as `0x${string}`,
          data: tx.data as `0x${string}`,
          value: BigInt(tx.value || "0"),
        })
      }
      return injectedSendTx(from, tx)
    },
    waitForReceipt: async (hash: string) => {
      if (USE_RAINBOWKIT) {
        if (!publicClient) throw new Error("No RPC client.")
        const receipt = await publicClient.waitForTransactionReceipt({
          hash: hash as `0x${string}`,
          timeout: 5 * 60_000,
        })
        return { status: receipt.status === "success" ? "success" : "reverted" } as const
      }
      return injectedWaitForReceipt(hash)
    },
  }
}
