/**
 * 🍎 CHARLY 2.0 - APPLE-QUALITY CARD COMPONENT
 * 
 * Implements floating depth and sophisticated elevation
 * through invisible technology and progressive disclosure.
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

// ============================================================================
// CARD VARIANTS - Apple Elevation System
// ============================================================================

const cardVariants = cva(
  // Base styles - Apple card foundation
  [
    'relative overflow-hidden',
    'bg-white',
    'transition-all duration-300 ease-in-out',
    'border border-gray-100',
    'hover:border-gray-200',
  ],
  {
    variants: {
      // Elevation levels - Apple depth system
      elevation: {
        flat: 'shadow-none',
        subtle: 'shadow-sm hover:shadow-lg hover:-translate-y-1',
        raised: 'shadow-md hover:shadow-xl hover:-translate-y-1',
        floating: 'shadow-lg hover:shadow-2xl hover:-translate-y-2',
        prominent: 'shadow-xl hover:shadow-2xl hover:-translate-y-2',
        modal: 'shadow-2xl',
      },
      
      // Border radius - Apple curves
      radius: {
        none: 'rounded-none',
        sm: 'rounded-md',
        md: 'rounded-lg',
        lg: 'rounded-xl',
        xl: 'rounded-2xl',
      },
      
      // Interactive states
      interactive: {
        none: '',
        hover: [
          'cursor-pointer',
          'hover:shadow-xl hover:-translate-y-0.5',
          'active:shadow-lg active:translate-y-0',
          'active:scale-[0.998]',
        ],
        subtle: [
          'cursor-pointer',
          'hover:shadow-lg hover:-translate-y-0.5',
          'hover:border-gray-300/50',
          'active:shadow-md active:translate-y-0',
        ],
      },
      
      // Padding variants
      padding: {
        none: 'p-0',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
        xl: 'p-10',
      },
      
      // Background variants
      background: {
        default: 'bg-white',
        secondary: 'bg-background-secondary',
        transparent: 'bg-transparent',
        glass: 'bg-white/90 backdrop-blur-xl border-white/30 shadow-xl',
      },
    },
    defaultVariants: {
      elevation: 'raised',
      radius: 'md',
      interactive: 'none',
      padding: 'md',
      background: 'default',
    },
  }
);

// ============================================================================
// CARD COMPONENT INTERFACE
// ============================================================================

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  as?: React.ElementType;
}

// ============================================================================
// CARD COMPONENT IMPLEMENTATION
// ============================================================================

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      elevation,
      radius,
      interactive,
      padding,
      background,
      as: Component = 'div',
      children,
      ...props
    },
    ref
  ) => {
    return (
      <Component
        ref={ref}
        className={cn(
          cardVariants({
            elevation,
            radius,
            interactive,
            padding,
            background,
            className,
          })
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Card.displayName = 'Card';

// ============================================================================
// CARD SUBCOMPONENTS - Apple Information Hierarchy
// ============================================================================

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    border?: boolean;
  }
>(({ className, border = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex flex-col space-y-1.5',
      border && 'border-b border-neutral-200/50 pb-4 mb-6',
      className
    )}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement> & {
    level?: 1 | 2 | 3 | 4 | 5 | 6;
  }
>(({ className, level = 3, children, ...props }, ref) => {
  const Component = `h${level}` as keyof JSX.IntrinsicElements;
  
  const sizeClasses = {
    1: 'text-display-medium',
    2: 'text-headline-large',
    3: 'text-headline-medium',
    4: 'text-title-large',
    5: 'text-title-medium',
    6: 'text-title-small',
  };

  return (
    <Component
      ref={ref}
      className={cn(
        'font-semibold leading-none tracking-tight text-gray-900',
        sizeClasses[level],
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
});
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      'text-body-medium text-gray-600 leading-relaxed',
      className
    )}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('', className)}
    {...props}
  />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    border?: boolean;
    justify?: 'start' | 'center' | 'end' | 'between';
  }
>(({ className, border = false, justify = 'end', ...props }, ref) => {
  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
  };

  return (
    <div
      ref={ref}
      className={cn(
        'flex items-center',
        justifyClasses[justify],
        border && 'border-t border-neutral-200/50 pt-4 mt-6',
        className
      )}
      {...props}
    />
  );
});
CardFooter.displayName = 'CardFooter';

// ============================================================================
// SPECIALIZED CARD VARIANTS
// ============================================================================

// Metric Card - For KPI display
const MetricCard = React.forwardRef<
  HTMLDivElement,
  CardProps & {
    value: string | number;
    label: string;
    change?: {
      value: number;
      label: string;
      trend: 'up' | 'down' | 'neutral';
    };
    icon?: React.ReactNode;
    color?: 'primary' | 'success' | 'warning' | 'danger';
  }
>(({ value, label, change, icon, color = 'primary', className, ...props }, ref) => {
  const colorClasses = {
    primary: {
      icon: 'text-primary-500 bg-primary-50',
      trend: {
        up: 'text-success-600',
        down: 'text-danger-600',
        neutral: 'text-neutral-500',
      },
    },
    success: {
      icon: 'text-success-500 bg-success-50',
      trend: {
        up: 'text-success-600',
        down: 'text-danger-600',
        neutral: 'text-neutral-500',
      },
    },
    warning: {
      icon: 'text-warning-500 bg-warning-50',
      trend: {
        up: 'text-success-600',
        down: 'text-danger-600',
        neutral: 'text-neutral-500',
      },
    },
    danger: {
      icon: 'text-danger-500 bg-danger-50',
      trend: {
        up: 'text-success-600',
        down: 'text-danger-600',
        neutral: 'text-neutral-500',
      },
    },
  };

  return (
    <Card
      ref={ref}
      elevation="floating"
      interactive="hover"
      className={cn('transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]', className)}
      {...props}
    >
      <CardContent className="p-6">
        {/* Header with icon */}
        <div className="flex items-center justify-between mb-4">
          {icon && (
            <div className={cn(
              'p-3 rounded-lg',
              colorClasses[color].icon
            )}>
              {icon}
            </div>
          )}
          {change && (
            <div className="flex items-center space-x-1">
              <span className={cn(
                'text-label-small font-medium',
                colorClasses[color].trend[change.trend]
              )}>
                {change.trend === 'up' && '↗'}
                {change.trend === 'down' && '↘'}
                {change.trend === 'neutral' && '→'}
                {change.value > 0 && '+'}
                {change.value}%
              </span>
            </div>
          )}
        </div>

        {/* Value */}
        <div className="space-y-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            {label}
          </p>
          <p className="text-3xl font-bold text-gray-900 mb-1">
            {value}
          </p>
          {change && (
            <p className="text-caption text-gray-600">
              {change.label}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
});
MetricCard.displayName = 'MetricCard';

// Feature Card - For showcasing capabilities
const FeatureCard = React.forwardRef<
  HTMLDivElement,
  CardProps & {
    title: string;
    description: string;
    icon?: React.ReactNode;
    action?: React.ReactNode;
  }
>(({ title, description, icon, action, className, ...props }, ref) => (
  <Card
    ref={ref}
    elevation="floating"
    interactive="subtle"
    className={cn('group', className)}
    {...props}
  >
    <CardHeader>
      {icon && (
        <div className="w-12 h-12 rounded-lg bg-primary-50 text-primary-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
      )}
      <CardTitle level={4}>{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <CardDescription>{description}</CardDescription>
    </CardContent>
    {action && (
      <CardFooter>
        {action}
      </CardFooter>
    )}
  </Card>
));
FeatureCard.displayName = 'FeatureCard';

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  MetricCard,
  FeatureCard,
};