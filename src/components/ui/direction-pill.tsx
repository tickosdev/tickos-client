import { cn } from "@/lib/utils"

type Direction = "inbound" | "outbound" | "internal"

interface DirectionPillProps {
  direction: Direction
  className?: string
}

const directionStyles: Record<Direction, string> = {
  inbound: "text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-900/50 bg-sky-50/50 dark:bg-sky-950/30",
  outbound: "text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/30",
  internal: "text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/30",
}

const directionLabels: Record<Direction, string> = {
  inbound: "Inbound",
  outbound: "Outbound",
  internal: "Internal note",
}

export function DirectionPill({ direction, className }: DirectionPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wide",
        directionStyles[direction],
        className
      )}
    >
      {directionLabels[direction]}
    </span>
  )
}
