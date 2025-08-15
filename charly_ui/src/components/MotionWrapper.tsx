import React from 'react';

// Motion components using CSS transitions (Framer Motion alternative)
// This provides smooth animations without external dependencies

interface MotionProps {
  children: React.ReactNode;
  className?: string;
  initial?: 'hidden' | 'visible';
  animate?: 'hidden' | 'visible';
  exit?: 'hidden' | 'visible';
  transition?: {
    duration?: number;
    delay?: number;
    ease?: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';
  };
  style?: React.CSSProperties;
}

// Page transition animations
export function PageTransition({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div 
      className={`
        animate-in fade-in slide-in-from-bottom-4 duration-500
        ${className}
      `}
      style={{
        '--animate-duration': '0.5s',
        '--animate-ease': 'cubic-bezier(0.16, 1, 0.3, 1)'
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

// Stagger animation for lists
export function StaggerContainer({ 
  children, 
  className = '',
  staggerDelay = 100 
}: { 
  children: React.ReactNode; 
  className?: string;
  staggerDelay?: number;
}) {
  const childrenArray = React.Children.toArray(children);
  
  return (
    <div className={className}>
      {childrenArray.map((child, index) => (
        <div
          key={index}
          className="animate-in fade-in slide-in-from-bottom-2"
          style={{
            animationDelay: `${index * staggerDelay}ms`,
            animationDuration: '400ms',
            animationFillMode: 'both'
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}

// Hover scale animation
export function HoverScale({ 
  children, 
  className = '',
  scale = 1.02
}: { 
  children: React.ReactNode; 
  className?: string;
  scale?: number;
}) {
  return (
    <div 
      className={`
        transition-transform duration-200 ease-out
        hover:scale-[${scale}] active:scale-[0.98]
        ${className}
      `}
    >
      {children}
    </div>
  );
}

// Slide up animation
export function SlideUp({ 
  children, 
  className = '',
  delay = 0 
}: { 
  children: React.ReactNode; 
  className?: string;
  delay?: number;
}) {
  return (
    <div 
      className={`
        animate-in slide-in-from-bottom-6 fade-in duration-600
        ${className}
      `}
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: 'both'
      }}
    >
      {children}
    </div>
  );
}

// Fade in animation
export function FadeIn({ 
  children, 
  className = '',
  delay = 0,
  duration = 400
}: { 
  children: React.ReactNode; 
  className?: string;
  delay?: number;
  duration?: number;
}) {
  return (
    <div 
      className={`
        animate-in fade-in duration-[${duration}ms]
        ${className}
      `}
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: 'both'
      }}
    >
      {children}
    </div>
  );
}

// Bounce in animation for buttons
export function BounceIn({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode; 
  className?: string;
}) {
  return (
    <div 
      className={`
        animate-in zoom-in-50 duration-300 ease-[cubic-bezier(0.68,-0.55,0.265,1.55)]
        ${className}
      `}
    >
      {children}
    </div>
  );
}

// Reveal animation with intersection observer
export function RevealOnScroll({ 
  children, 
  className = '',
  threshold = 0.1 
}: { 
  children: React.ReactNode; 
  className?: string;
  threshold?: number;
}) {
  const [isVisible, setIsVisible] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return (
    <div 
      ref={ref}
      className={`
        transition-all duration-700 ease-out
        ${isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-8'
        }
        ${className}
      `}
    >
      {children}
    </div>
  );
}

// Pulse animation for loading states
export function Pulse({ 
  children, 
  className = '' 
}: { 
  children?: React.ReactNode; 
  className?: string;
}) {
  return (
    <div className={`animate-pulse ${className}`}>
      {children}
    </div>
  );
}

// Smooth height animation
export function CollapseTransition({ 
  isOpen, 
  children,
  className = ''
}: { 
  isOpen: boolean; 
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div 
      className={`
        overflow-hidden transition-all duration-300 ease-out
        ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
        ${className}
      `}
    >
      <div className="p-1">
        {children}
      </div>
    </div>
  );
}

// Shared transition constants for consistency
export const TRANSITIONS = {
  fast: 'transition-all duration-150 ease-out',
  normal: 'transition-all duration-200 ease-out',
  slow: 'transition-all duration-300 ease-out',
  slowest: 'transition-all duration-500 ease-out'
} as const;

// Easing curves
export const EASINGS = {
  linear: 'ease-linear',
  in: 'ease-in',
  out: 'ease-out',
  inOut: 'ease-in-out',
  elastic: 'ease-[cubic-bezier(0.68,-0.55,0.265,1.55)]',
  smooth: 'ease-[cubic-bezier(0.16,1,0.3,1)]'
} as const;