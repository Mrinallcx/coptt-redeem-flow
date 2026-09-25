import type { NextConfig } from "next";

// Same-origin proxy to the Go API on this host. Browser calls /backend/*,
// Next rewrites to 127.0.0.1:8081 — no public API DNS required for staging.
const backendOrigin =
  process.env.COPTT_BACKEND_ORIGIN || "http://127.0.0.1:8081";

// The demo build has no backend behind it. Keeping the rewrite would point
// every /backend/* call at a loopback address that does not exist on the
// host, turning a clean "no API here" into a confusing gateway error.
const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

const nextConfig: NextConfig = {
  async rewrites() {
    if (demoMode) return [];
    return [
      {
        source: "/backend/:path*",
        destination: `${backendOrigin}/:path*`,
      },
    ];
  },
};

export default nextConfig;
