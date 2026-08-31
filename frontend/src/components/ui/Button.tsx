import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    let variantStyles = "bg-cyan-600 text-white hover:bg-cyan-500 shadow-sm";
    if (variant === 'destructive') variantStyles = "bg-red-600 text-white hover:bg-red-500";
    else if (variant === 'outline') variantStyles = "border border-slate-700 bg-transparent hover:bg-slate-800 text-slate-200";
    else if (variant === 'secondary') variantStyles = "bg-slate-800 text-slate-200 hover:bg-slate-700";
    else if (variant === 'ghost') variantStyles = "hover:bg-slate-800 text-slate-300 hover:text-white";
    else if (variant === 'link') variantStyles = "text-cyan-400 underline-offset-4 hover:underline";

    let sizeStyles = "h-9 px-4 py-2 text-sm";
    if (size === 'sm') sizeStyles = "h-8 px-3 text-xs rounded-md";
    else if (size === 'lg') sizeStyles = "h-11 px-8 text-base rounded-md";
    else if (size === 'icon') sizeStyles = "h-9 w-9 p-0 flex items-center justify-center";

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500 disabled:pointer-events-none disabled:opacity-50",
          variantStyles,
          sizeStyles,
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
export default Button
