import * as React from "react"
import { cva } from "class-variance-authority";
import { cn } from "cn"
import { Slot } from "radix-ui"

// Styled after the Figma pills: 40px tall, fully rounded, Geist Medium 14/24.
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-transparent bg-clip-padding text-sm leading-6 font-medium whitespace-nowrap transition-colors outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // Black pill (primary action, e.g. "Add inspiration", "Log in").
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        // Grey pill on white (e.g. "Proofread", "Generate").
        secondary: "bg-surface text-foreground hover:bg-surface-strong",
        // Darker grey pill on grey panels (details sidebar).
        surface: "bg-surface-strong text-foreground hover:bg-[#dadada]",
        // Text-only pill that shows grey on hover (nav, "Cancel").
        ghost:
          "text-foreground hover:bg-surface aria-expanded:bg-surface data-[active=true]:bg-surface",
        outline: "border-border bg-background hover:bg-surface",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:ring-destructive/20",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        lg: "h-10 px-6 py-2",
        sm: "h-8 px-3 text-[13px]",
        icon: "size-10",
        "icon-sm": "size-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
