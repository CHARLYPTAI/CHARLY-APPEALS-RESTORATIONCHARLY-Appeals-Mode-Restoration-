import * as React from "react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/lib/button-variants";
import { Loader2 } from "lucide-react";

export interface EnhancedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof buttonVariants.variant;
  size?: keyof typeof buttonVariants.size;
  asChild?: boolean;
  loading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  hoverScale?: boolean;
}

const EnhancedButton = React.forwardRef<HTMLButtonElement, EnhancedButtonProps>(
  ({ 
    className, 
    variant = "default", 
    size = "default", 
    asChild = false, 
    loading = false,
    loadingText,
    icon,
    hoverScale = true,
    children,
    disabled,
    ...props 
  }, ref) => {
    const baseClasses = cn(
      // Base styles from original button
      "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      // Enhanced hover and focus styles
      hoverScale && "hover:scale-105 active:scale-95",
      "focus:ring-2 focus:ring-offset-2",
      // Variant-specific focus colors
      variant === "default" && "focus:ring-zinc-400",
      variant === "destructive" && "focus:ring-red-500",
      variant === "outline" && "focus:ring-zinc-400",
      variant === "secondary" && "focus:ring-zinc-400",
      variant === "ghost" && "focus:ring-zinc-400",
      variant === "link" && "focus:ring-zinc-400",
      // Apply variant and size styles
      buttonVariants.variant[variant],
      buttonVariants.size[size],
      // Disable hover effects when disabled or loading
      (disabled || loading) && "hover:scale-100",
      className
    );
    
    if (asChild) {
      return (
        <span className={baseClasses} {...props} />
      );
    }

    return (
      <button
        className={baseClasses}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {loadingText || children}
          </>
        ) : (
          <>
            {icon && <span className="mr-2">{icon}</span>}
            {children}
          </>
        )}
      </button>
    );
  }
);
EnhancedButton.displayName = "EnhancedButton";

export { EnhancedButton };