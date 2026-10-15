"use client"

import { CircleHelpIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const ETHERSCAN_URL = "https://sepolia.etherscan.io"

function StatRow({
  label,
  value,
  hint,
  valueClassName,
}: {
  label: string
  value: string
  hint?: string
  valueClassName?: string
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
      <div className={valueClassName ?? "tabular-nums font-medium"}>{value}</div>
    </div>
  )
}

export function YieldStats() {
  return (
    <TooltipProvider>
      <section className="mx-auto w-full max-w-md space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Statistics of the COPTT protocol</h2>
          <Button
            variant="link"
            size="sm"
            className="h-auto px-0"
            nativeButton={false}
            render={
              <a href={ETHERSCAN_URL} target="_blank" rel="nofollow noopener noreferrer" />
            }
          >
            View on Etherscan
          </Button>
        </div>

        <Card>
          <CardContent className="divide-y pt-2">
            <StatRow
              label="Annual percentage rate *"
              value="2.2%"
              valueClassName="tabular-nums font-medium text-emerald-600"
              hint="Moving average of staking rewards over the last 7 days. This is not a guaranteed return."
            />
            <StatRow label="Total staked with COPTT" value="12,450.500 COPTT" />
            <StatRow label="Stakers" value="1,284" />
            <StatRow label="stCOPTT market cap" value="$180,532,250" />
          </CardContent>
        </Card>
      </section>
    </TooltipProvider>
  )
}
