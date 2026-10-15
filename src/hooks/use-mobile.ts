import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  // Always false on the first render (server + hydration). Reading
  // window.innerWidth in useState breaks SSR when the viewport is narrow:
  // the server renders the desktop sidebar tree, the client renders mobile
  // Sheet, and React stalls on a hydration mismatch.
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const sync = () => setIsMobile(mql.matches)
    sync()
    mql.addEventListener("change", sync)
    return () => mql.removeEventListener("change", sync)
  }, [])

  return isMobile
}
