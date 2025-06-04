
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
      "inline-flex h-auto items-center justify-center rounded-xl p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      // Base styles for all triggers
      "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium",
      // Removed transition line to diagnose flash issue
      // "transition-[background-color,border-color,color,box-shadow] duration-300 ease-out", 
      "outline-none focus:outline-none focus-visible:outline-none",
      // Remove ring focus states that conflict with active state
      "focus-visible:ring-0 focus-visible:ring-offset-0",
      "disabled:pointer-events-none disabled:opacity-50",
      // Inactive state styling
      "px-3 py-2 text-muted-foreground", 
      "hover:bg-white/10 dark:hover:bg-black/10 hover:text-foreground/90", 
      // Active state with stable focus handling
      "data-[state=active]:bg-white/[.18] dark:data-[state=active]:bg-black/[.18]",
      "data-[state=active]:backdrop-blur-xl",
      "data-[state=active]:border data-[state=active]:border-white/[.25] dark:data-[state=active]:border-white/[.15]",
      "data-[state=active]:text-primary",
      "data-[state=active]:shadow-glass-soft",
      "data-[state=active]:ring-1 data-[state=active]:ring-inset data-[state=active]:ring-white/40 dark:data-[state=active]:ring-white/20",
      "data-[state=active]:px-4 data-[state=active]:py-2.5",
      // Prevent focus styles from overriding active state
      "data-[state=active]:focus:bg-white/[.18] dark:data-[state=active]:focus:bg-black/[.18]",
      "data-[state=active]:focus-visible:bg-white/[.18] dark:data-[state=active]:focus-visible:bg-black/[.18]",
      className
    )}
    onFocus={(e) => {
      // Prevent default focus behavior that might cause flash
      e.preventDefault();
      // Call original onFocus if provided
      props.onFocus?.(e);
    }}
    {...props}
  >
    {children}
  </TabsPrimitive.Trigger>
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
