import { cn } from "@/lib/utils"

type StatusVariant = "success" | "warning" | "info" | "error" | "neutral"

interface StatusBadgeProps {
  children: React.ReactNode
  variant?: StatusVariant
  className?: string
  dot?: boolean
}

const variantStyles: Record<StatusVariant, string> = {
  success: "text-emerald-600 dark:text-emerald-400 border-emerald-600/30 bg-emerald-500/10",
  warning: "text-amber-600 dark:text-amber-400 border-amber-600/30 bg-amber-500/10",
  info: "text-sky-600 dark:text-sky-400 border-sky-600/30 bg-sky-500/10",
  error: "text-rose-600 dark:text-rose-400 border-rose-600/30 bg-rose-500/10",
  neutral: "text-muted-foreground border-border bg-muted/50",
}

const dotStyles: Record<StatusVariant, string> = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  info: "bg-sky-500",
  error: "bg-rose-500",
  neutral: "bg-muted-foreground",
}

export function statusDotColor(variant: StatusVariant): string {
  return dotStyles[variant]
}

export function StatusBadge({ children, variant = "neutral", className, dot = true }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider",
        variantStyles[variant],
        className
      )}
    >
      {dot && (
        <span className={cn("h-1.5 w-1.5 rounded-full", dotStyles[variant])} />
      )}
      {children}
    </span>
  )
}

// Mapeo de status de ticket a variantes
export function getTicketStatusVariant(status: string): StatusVariant {
  switch (status) {
    case "open": return "success"
    case "pending": return "warning"
    case "review": return "info"
    case "resolved": return "success"
    case "closed": return "neutral"
    default: return "neutral"
  }
}

// Mapeo de prioridad a variantes
export function getTicketPriorityVariant(priority: string): StatusVariant {
  switch (priority) {
    case "urgent": return "error"
    case "high": return "warning"
    case "medium": return "info"
    case "normal": return "info"
    case "low": return "neutral"
    default: return "neutral"
  }
}
