// Demo / no-login mode.
//
// Off unless NEXT_PUBLIC_DEMO_MODE is exactly "true" at build time. It is a
// build-time constant rather than a hardcoded boolean so that merging this
// branch cannot arm the bypass by accident: an environment that does not
// set the variable gets the real cookie gate, and flipping it on is a
// deliberate act in the deploy config.
//
// When on, the whole portal is readable with no account: the proxy stops
// redirecting to /login, auth-context serves DEMO_USER instead of calling
// /auth/me, and every backend read is answered from src/lib/demo-data.ts.
//
// This exists for a public showcase build with no backend attached. Never
// set it on a deployment that can reach real user data.
import type { UserProfile } from "@/lib/api";

export const DEV_BYPASS_AUTH = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

/** Alias — reads better at call sites added for the demo build. */
export const DEMO_MODE = DEV_BYPASS_AUTH;

export const DEV_BYPASS_USER: UserProfile = {
  id: "demo-user",
  email: "demo@totofinance.co",
  name: "Demo User",
  picture: "",
  email_verified: true,
  role: "user",
  kyc_status: "approved",
};

export const DEMO_USER = DEV_BYPASS_USER;
