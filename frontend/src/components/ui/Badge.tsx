import * as React from "react"
import { cn, severityColor } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'critical' | 'high' | 'medium' | 'low' | 'info' | 'success' | 'outline' | 'default' | string;
}

function Badge({ className, variant = "info", ...props }: BadgeProps) {
  let colorClass = severityColor(variant as any);
  if (variant === 'outline') {
    colorClass = 'border-slate-700 text-slate-300 bg-transparent';
  } else if (variant === 'default') {
    colorClass = 'border-transparent bg-slate-800 text-slate-100';
  }
  return (
    <div className={cn("inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", colorClass, className)} {...props} />
  )
}

export { Badge }
export default Badge
