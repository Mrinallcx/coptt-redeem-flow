import { getDefaultConfig } from "@rainbow-me/rainbowkit"
import {
  coinbaseWallet,
  injectedWallet,
  metaMaskWallet,
  rainbowWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets"
import { mainnet, sepolia } from "wagmi/chains"

// WalletConnect Cloud project id (https://cloud.reown.com).
// A real id is required for the WalletConnect QR option; injected wallets
// (MetaMask, Rainbow, browser wallets) work without it.
const envProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
const projectId =
  envProjectId ?? "c4f79cc8210256d18783f201ae01b141"

// WalletConnect's Reown AppKit posts analytics on load. The demo project
// id rejects localhost origins and console.errors. Only include that
// connector when we have a project that can allowlist this origin.
const wallets = [
  {
    groupName: "Popular",
    wallets: envProjectId
      ? [
          metaMaskWallet,
          rainbowWallet,
          coinbaseWallet,
          walletConnectWallet,
          injectedWallet,
        ]
      : [metaMaskWallet, rainbowWallet, coinbaseWallet, injectedWallet],
  },
]

export const wagmiConfig = getDefaultConfig({
  appName: "Toto Finance",
  projectId,
  chains: [sepolia, mainnet],
  ssr: true,
  wallets,
  walletConnectParameters: {
    telemetryEnabled: false,
  },
})
