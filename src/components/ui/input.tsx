
import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-xl border text-foreground placeholder:text-muted-foreground ring-offset-background transition-all duration-200 ease-in-out shadow-glass-soft",
          // Pearl white message UI inspired style
          "bg-white/[.18] dark:bg-black/[.18] backdrop-blur-xl",
          "border-white/[.25] dark:border-white/[.15]",
          "ring-1 ring-inset ring-white/40 dark:ring-1 dark:ring-inset dark:ring-white/20",

          // Focus state: No visual indicators
          "focus:outline-none focus-visible:outline-none",

          "disabled:cursor-not-allowed disabled:opacity-50",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          "px-4 py-2.5 text-base md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
