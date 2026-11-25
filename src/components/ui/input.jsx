import * as React from "react"
import { cn } from "cn"

function Input({
  className,
  type,
  ...props
}) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-[52px] w-full min-w-0 rounded-card border-0 bg-surface p-4 text-sm leading-5 font-medium tracking-[-0.14px] text-foreground transition-shadow outline-none placeholder:text-black/40 focus-visible:ring-3 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-3 aria-invalid:ring-destructive/30 file:hidden",
        className
      )}
      {...props}
    />
  )
}

export { Input }
