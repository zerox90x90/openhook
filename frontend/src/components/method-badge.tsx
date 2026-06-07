import { cn } from "@/lib/utils"
import { getMethodColor } from "@/lib/types"

interface MethodBadgeProps {
  method: string
  className?: string
}

export function MethodBadge({ method, className }: MethodBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-[11px] font-bold tracking-wide",
        getMethodColor(method),
        className
      )}
    >
      {method.toUpperCase()}
    </span>
  )
}
