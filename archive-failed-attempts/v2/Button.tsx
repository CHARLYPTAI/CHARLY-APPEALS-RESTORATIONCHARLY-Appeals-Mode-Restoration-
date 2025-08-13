/**
 * 🍎 CHARLY 2.0 - APPLE-QUALITY BUTTON COMPONENT
 * 
 * Implements invisible excellence through:
 * - Sophisticated simplicity
 * - Inevitable interactions
 * - Professional elevation
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

// ============================================================================
// BUTTON VARIANTS - Apple Design Language
// ============================================================================

const buttonVariants = cva(
  // Base styles - Apple foundation
  [
    'inline-flex items-center justify-center',
    'font-medium transition-all duration-300 ease-in-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'select-none touch-manipulation',
    // Apple micro-interactions
    'active:scale-[0.98] active:transition-transform active:duration-75',
    'hover:shadow-lg hover:-translate-y-0.5',
    // Professional appearance
    'rounded-lg border-0',
  ],
  {
    variants: {
      // Visual hierarchy variants
      variant: {
        // Primary action - Apple Blue
        primary: [
          'bg-primary-500 text-white',
          'hover:bg-primary-600 hover:shadow-xl hover:-translate-y-0.5',
          'active:bg-primary-700 active:translate-y-0',
          'shadow-md',
        ],
        
        // Secondary action - Sophisticated gray
        secondary: [
          'bg-gray-100 text-gray-700',
          'hover:bg-gray-200 hover:text-gray-800',
          'active:bg-gray-300',
          'shadow-sm border border-gray-200',
        ],
        
        // Success action - Apple Green
        success: [
          'bg-success-500 text-white',
          'hover:bg-success-600 hover:shadow-xl',
          'active:bg-success-700',
          'shadow-md',
        ],
        
        // Warning action - Apple Orange
        warning: [
          'bg-warning-500 text-white',
          'hover:bg-warning-600 hover:shadow-xl',
          'active:bg-warning-700',
          'shadow-md',
        ],
        
      },
      
      // Size variants - Apple scale
      size: {
        sm: 'h-8 px-3 text-label-medium rounded-md',
        md: 'h-10 px-4 text-body-medium rounded-lg',
        lg: 'h-12 px-6 text-body-large rounded-lg',
        icon: 'h-10 w-10 rounded-lg',
      },
      
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

// ============================================================================
// BUTTON COMPONENT INTERFACE
// ============================================================================

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

// ============================================================================
// BUTTON COMPONENT IMPLEMENTATION
// ============================================================================

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      weight,
      asChild = false,
      loading = false,
      icon,
      iconPosition = 'left',
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    // Icon sizing based on button size
    const getIconSize = () => {
      switch (size) {
        case 'sm':
        case 'icon-sm':
          return 'w-4 h-4';
        case 'lg':
        case 'icon-lg':
          return 'w-5 h-5';
        case 'xl':
          return 'w-6 h-6';
        default:
          return 'w-4 h-4';
      }
    };

    // Loading spinner component
    const LoadingSpinner = () => (
      <svg
        className={cn('animate-spin', getIconSize())}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    );

    // Render icon with proper spacing
    const renderIcon = (iconNode: React.ReactNode, position: 'left' | 'right') => {
      if (!iconNode) return null;
      
      const isIconOnly = !children;
      const spacingClass = isIconOnly 
        ? '' 
        : position === 'left' 
          ? 'mr-2' 
          : 'ml-2';

      return (
        <span className={cn(getIconSize(), spacingClass, 'flex-shrink-0')}>
          {iconNode}
        </span>
      );
    };

    const content = (
      <>
        {loading && <LoadingSpinner />}
        {!loading && iconPosition === 'left' && renderIcon(icon, 'left')}
        {children && (
          <span className={cn('truncate', loading && 'ml-2')}>
            {children}
          </span>
        )}
        {!loading && iconPosition === 'right' && renderIcon(icon, 'right')}
      </>
    );

    if (asChild) {
      return (
        <div
          className={cn(buttonVariants({ variant, size, weight, className }))}
          {...props}
        >
          {content}
        </div>
      );
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, weight, className }))}
        ref={ref}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        {...props}
      >
        {content}
      </button>
    );
  }
);

Button.displayName = 'Button';

// ============================================================================
// SPECIALIZED BUTTON VARIANTS
// ============================================================================

// Floating Action Button - Apple style
export const FloatingActionButton = React.forwardRef<
  HTMLButtonElement,
  Omit<ButtonProps, 'variant' | 'size'>
>(({ className, ...props }, ref) => (
  <Button
    ref={ref}
    variant="primary"
    size="icon-lg"
    className={cn(
      'fixed bottom-6 right-6 z-50',
      'rounded-full shadow-2xl',
      'hover:scale-110 hover:shadow-2xl',
      'active:scale-105',
      'backdrop-blur-xl',
      className
    )}
    {...props}
  />
));

FloatingActionButton.displayName = 'FloatingActionButton';


// eslint-disable-next-line react-refresh/only-export-components
export { Button, buttonVariants };