import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500/20",
  {
    variants: {
      variant: {
        default: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/40 dark:bg-emerald-400/12 dark:text-emerald-300",
        secondary: "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-600/70 dark:bg-slate-800/55 dark:text-slate-200",
        destructive: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/42 dark:bg-rose-400/12 dark:text-rose-300",
        outline: "border-slate-200 bg-white text-slate-700 dark:border-slate-600/70 dark:bg-slate-900/55 dark:text-slate-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
