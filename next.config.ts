import path from "node:path";
import type { NextConfig } from "next";

// Same-origin proxy to the Go API on this host. Browser calls /backend/*,
// Next rewrites to 127.0.0.1:8081 — no public API DNS required for staging.
const backendOrigin =
  process.env.COPTT_BACKEND_ORIGIN || "http://127.0.0.1:8081";

const x402Stub = path.join(__dirname, "src/lib/empty-module.js");

const nextConfig: NextConfig = {
  transpilePackages: [
    "@rainbow-me/rainbowkit",
    "wagmi",
    "@wagmi/core",
    "@wagmi/connectors",
  ],
  // Coinbase's CDP SDK lazy-imports optional @x402 peers. Turbopack still
  // tries to resolve them even though we never call that payment path.
  serverExternalPackages: ["@coinbase/cdp-sdk"],
  turbopack: {
    resolveAlias: {
      "@x402/core/client": x402Stub,
      "@x402/evm/exact/client": x402Stub,
      "@x402/evm/upto/client": x402Stub,
      "@x402/svm/exact/client": x402Stub,
    },
  },
  // Coinbase Wallet's keys.coinbase.com popup needs window.opener. Next's
  // default same-origin COOP severs that and the popup shows
  // "window.opener is inaccessible".
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
    ]
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@x402/core/client": x402Stub,
      "@x402/evm/exact/client": x402Stub,
      "@x402/evm/upto/client": x402Stub,
      "@x402/svm/exact/client": x402Stub,
    }
    return config
  },
  async rewrites() {
    return [
      {
        source: "/backend/:path*",
        destination: `${backendOrigin}/:path*`,
      },
    ];
  },
};

export default nextConfig;
