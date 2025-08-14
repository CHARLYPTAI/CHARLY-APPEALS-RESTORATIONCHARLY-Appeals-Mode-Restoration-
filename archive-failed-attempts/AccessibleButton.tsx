import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface AccessibleButtonProps extends ButtonProps {
  ariaLabel?: string;
  ariaDescribedBy?: string;
  ariaPressed?: boolean;
  ariaExpanded?: boolean;
  ariaHaspopup?: boolean | 'false' | 'true' | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
  focusRingColor?: 'blue' | 'green' | 'red' | 'purple';
  role?: string;
}

export const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(({ 
  children, 
  ariaLabel, 
  ariaDescribedBy,
  ariaPressed,
  ariaExpanded,
  ariaHaspopup,
  focusRingColor = 'blue',
  className,
  disabled,
  role = 'button',
  ...props 
}, ref) => {
  const focusRingClasses = {
    blue: 'focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus-visible:outline-none',
    green: 'focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus-visible:outline-none',
    red: 'focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus-visible:outline-none',
    purple: 'focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus-visible:outline-none',
  };

  return (
    <Button
      ref={ref}
      role={role}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-pressed={ariaPressed}
      aria-expanded={ariaExpanded}
      aria-haspopup={ariaHaspopup}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      className={cn(
        focusRingClasses[focusRingColor],
        'transition-all duration-200',
        // Ensure minimum 44px touch target (WCAG 2.1 AA)
        'min-h-[44px] min-w-[44px]',
        // High contrast mode support
        'border-2 border-transparent hover:border-current',
        // Reduced motion support
        'motion-reduce:transition-none',
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </Button>
  );
});

AccessibleButton.displayName = "AccessibleButton";

export default AccessibleButton;