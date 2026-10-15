"use client"

import type { TxRequest } from "@/lib/api"
import { USE_RAINBOWKIT } from "@/lib/wallet-mode"

/**
 * Wallet plumbing.
 *
 * Deliberately no web3 library. Every transaction this portal sends arrives
 * from the backend already encoded, so the browser only ever needs the four
 * injected-provider methods below — which is a far smaller thing to keep
 * correct than an ABI encoder and its dependency tree.
 */

export interface EthereumProvider {
  isMetaMask?: boolean
  isPhantom?: boolean
  providers?: EthereumProvider[]
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
}

/**
 * Picks MetaMask when several wallets have injected themselves. Phantom is
 * excluded explicitly: it injects `window.ethereum` and then fails on
 * ordinary EVM calls, which surfaces as a baffling error rather than a
 * missing wallet.
 */
export function getProvider(): EthereumProvider | null {
  if (typeof window === "undefined") return null
  const eth = (window as Window & { ethereum?: EthereumProvider }).ethereum
  if (!eth) return null
  const providers = eth.providers as EthereumProvider[] | undefined
  const list: EthereumProvider[] =
    Array.isArray(providers) && providers.length > 0 ? providers : [eth]
  return (
    list.find((p) => p.isMetaMask && !p.isPhantom) ??
    list.find((p) => !p.isPhantom) ??
    list[0]
  )
}

export class WalletError extends Error {
  constructor(message: string, readonly code?: number) {
    super(message)
    this.name = "WalletError"
  }
}

/** MetaMask's "user rejected" code. Not an error worth a red banner. */
export const USER_REJECTED = 4001

export function isUserRejection(err: unknown): boolean {
  if (err instanceof WalletError && err.code === USER_REJECTED) return true
  const e = err as { code?: number; name?: string }
  return e?.code === USER_REJECTED || e?.name === "UserRejectedRequestError"
}

function toWalletError(err: unknown): WalletError {
  const e = err as { message?: string; code?: number }
  return new WalletError(e?.message ?? "Wallet request failed", e?.code)
}

export async function connect(): Promise<string> {
  if (USE_RAINBOWKIT) {
    throw new WalletError("Connect a wallet from the RainbowKit modal.")
  }
  const provider = getProvider()
  if (!provider) throw new WalletError("No wallet detected. Install MetaMask to continue.")
  try {
    const accounts = (await provider.request({ method: "eth_requestAccounts" })) as string[]
    const address = accounts?.[0]
    if (!address) throw new WalletError("No account selected.")
    return address
  } catch (err) {
    throw toWalletError(err)
  }
}

export async function currentAccount(): Promise<string | null> {
  if (USE_RAINBOWKIT) return null
  const provider = getProvider()
  if (!provider) return null
  try {
    const accounts = (await provider.request({ method: "eth_accounts" })) as string[]
    return accounts?.[0] ?? null
  } catch {
    return null
  }
}

/**
 * Makes sure the wallet is on the right network before anything is signed.
 *
 * Without this a transaction can be sent to a chain where the contract does
 * not exist — which either reverts confusingly or, worse, succeeds against
 * something else at the same address.
 */
export async function ensureChain(chainId: number): Promise<void> {
  const provider = getProvider()
  if (!provider) throw new WalletError("No wallet detected.")

  const hex = "0x" + chainId.toString(16)
  const current = (await provider.request({ method: "eth_chainId" })) as string
  if (current?.toLowerCase() === hex.toLowerCase()) return

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: hex }],
    })
  } catch (err) {
    const e = err as { code?: number }
    // 4902 means the wallet does not know this network. Adding it is a
    // separate prompt and needs RPC details we do not hold here, so say so
    // plainly rather than failing silently.
    if (e?.code === 4902) {
      throw new WalletError(`Add network ${chainId} to your wallet, then try again.`)
    }
    throw toWalletError(err)
  }
}

/** Sends a transaction the backend encoded. Returns the hash. */
export async function sendTx(from: string, tx: TxRequest): Promise<string> {
  const provider = getProvider()
  if (!provider) throw new WalletError("No wallet detected.")
  try {
    return (await provider.request({
      method: "eth_sendTransaction",
      params: [{ from, to: tx.to, data: tx.data, value: tx.value }],
    })) as string
  } catch (err) {
    throw toWalletError(err)
  }
}

/**
 * Polls for a receipt.
 *
 * Deliberately generous: a Sepolia transaction has taken over three minutes
 * to be included, and a UI that gives up early tells the user their purchase
 * failed when it is merely pending.
 */
export async function waitForReceipt(
  hash: string,
  { timeoutMs = 5 * 60_000, intervalMs = 3_000 } = {},
): Promise<{ status: "success" | "reverted" }> {
  const provider = getProvider()
  if (!provider) throw new WalletError("No wallet detected.")

  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const receipt = (await provider.request({
      method: "eth_getTransactionReceipt",
      params: [hash],
    })) as { status?: string } | null

    if (receipt) {
      return { status: receipt.status === "0x1" ? "success" : "reverted" }
    }
    await new Promise((r) => setTimeout(r, intervalMs))
  }
  throw new WalletError("Still pending after five minutes. It may still land — check your wallet.")
}

export function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

export function explorerTx(hash: string, chainId: number): string {
  const base = chainId === 1 ? "https://etherscan.io" : "https://sepolia.etherscan.io"
  return `${base}/tx/${hash}`
}
