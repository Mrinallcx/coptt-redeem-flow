import { cn } from "@/lib/utils"

export const SENSITIVE_BLUR = "pointer-events-none select-none blur-[5px]"

const SENSITIVE_RE =
  /Los Azules|San Juan Province|San Juan|Kamoa-Kakula|Kamoa Holding|Kolwezi|Ivanhoe Mines|Ivanhoe|Zijin Mining|Zijin|McEwen Copper Inc\.|McEwen Copper|McEwen Inc\.|McEwen/gi

function splitSensitive(text: string) {
  const nodes: { key: string; value: string; blur: boolean }[] = []
  const re = new RegExp(SENSITIVE_RE.source, "gi")
  let last = 0
  let match: RegExpExecArray | null
  let i = 0

  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push({ key: `t-${i}`, value: text.slice(last, match.index), blur: false })
      i += 1
    }
    nodes.push({ key: `b-${i}`, value: match[0], blur: true })
    i += 1
    last = match.index + match[0].length
  }

  if (last < text.length) {
    nodes.push({ key: `t-${i}`, value: text.slice(last), blur: false })
  }

  return nodes
}

export function SensitiveText({
  text,
  className,
  blurAll,
}: {
  text: string
  className?: string
  blurAll?: boolean
}) {
  if (blurAll) {
    return <span className={cn(className, SENSITIVE_BLUR)}>{text}</span>
  }

  return (
    <span className={className}>
      {splitSensitive(text).map((part) =>
        part.blur ? (
          <span key={part.key} className={SENSITIVE_BLUR}>
            {part.value}
          </span>
        ) : (
          <span key={part.key}>{part.value}</span>
        ),
      )}
    </span>
  )
}

export function shouldBlurField(label: string) {
  const key = label.toLowerCase()
  return key === "deposit" || key === "mining partner"
}
