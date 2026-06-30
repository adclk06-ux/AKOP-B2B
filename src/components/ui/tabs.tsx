import * as React from "react"
import { cn } from "@/lib/utils"

const Tabs = ({ value: _value, onValueChange: _onValueChange, children, className }: { value: string; onValueChange: (v: string) => void; children: React.ReactNode; className?: string }) => {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {children}
    </div>
  )
}

const TabsList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
))
TabsList.displayName = "TabsList"

const TabsTrigger = ({
  value,
  activeValue,
  onValueChange,
  className,
  children,
  ...props
}: {
  value: string
  activeValue: string
  onValueChange: (v: string) => void
} & React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    type="button"
    onClick={() => onValueChange(value)}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      activeValue === value
        ? "bg-background text-foreground shadow"
        : "hover:bg-background/50 hover:text-foreground",
      className
    )}
    {...props}
  >
    {children}
  </button>
)
TabsTrigger.displayName = "TabsTrigger"

const TabsContent = ({
  value,
  activeValue,
  className,
  children,
}: {
  value: string
  activeValue: string
  className?: string
  children: React.ReactNode
}) => {
  if (value !== activeValue) return null
  return <div className={cn("mt-2", className)}>{children}</div>
}
TabsContent.displayName = "TabsContent"

export { Tabs, TabsList, TabsTrigger, TabsContent }
