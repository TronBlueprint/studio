import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: // Glass button: semi-transparent white, primary text, subtle border, backdrop blur
          "bg-white/30 dark:bg-black/30 backdrop-blur-md text-primary border border-white/20 dark:border-white/10 shadow-glass hover:bg-white/40 dark:hover:bg-black/40 hover:border-white/30 active:bg-white/20 dark:active:bg-black/20",
        destructive:
          "bg-destructive/80 dark:bg-destructive/70 backdrop-blur-md text-destructive-foreground border border-destructive/50 shadow-glass hover:bg-destructive/90 dark:hover:bg-destructive/80 active:bg-destructive/70",
        outline: // Outline on glass: more transparent, stronger border on hover
          "border border-white/30 dark:border-white/20 bg-transparent backdrop-blur-sm text-foreground hover:bg-white/10 dark:hover:bg-black/10 hover:border-white/40 dark:hover:border-white/30 hover:text-primary active:bg-white/20 dark:active:bg-black/20",
        secondary: // Secondary glass: slightly different tint or opacity
          "bg-white/20 dark:bg-black/20 backdrop-blur-md text-secondary-foreground border border-white/10 dark:border-white/5 shadow-glass hover:bg-white/30 dark:hover:bg-black/30 active:bg-white/10 dark:active:bg-black/10",
        ghost: // Ghost on glass: very subtle, text color changes
          "bg-transparent text-foreground hover:bg-white/10 dark:hover:bg-black/10 hover:text-primary active:bg-white/5 dark:active:bg-black/5",
        link: "text-primary underline-offset-4 hover:underline bg-transparent",
      },
      size: {
        default: "h-11 px-6 py-2.5 rounded-xl", // Larger, more rounded
        sm: "h-10 rounded-lg px-4",
        lg: "h-12 rounded-xl px-8",
        icon: "h-11 w-11 rounded-xl", // More rounded for icon buttons
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
