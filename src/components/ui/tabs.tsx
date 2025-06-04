
"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-auto items-center justify-center rounded-xl p-1 text-muted-foreground", // Minimalist list container
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      // Base styles for all triggers (inactive and active)
      "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-200 ease-in-out outline-none focus:outline-none focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
      // Inactive state specific styling
      "px-3 py-2 text-muted-foreground",
      "hover:bg-white/10 dark:hover:bg-black/10 hover:text-foreground/90", // Subtle hover for inactive tabs
      // Active state: "Pearl White" glass effect
      "data-[state=active]:bg-white/[.18] dark:data-[state=active]:bg-black/[.18]",
      "data-[state=active]:backdrop-blur-xl",
      "data-[state=active]:border data-[state=active]:border-white/[.25] dark:data-[state=active]:border-white/[.15]",
      "data-[state=active]:text-primary",
      "data-[state=active]:shadow-glass-soft",
      "data-[state=active]:ring-1 data-[state=active]:ring-inset data-[state=active]:ring-white/40 dark:data-[state=active]:ring-white/20",
      "data-[state=active]:px-4 data-[state=active]:py-2.5", // Slightly larger padding for active tab
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
