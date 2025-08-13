/**
 * CHARLY 2.0 - Adaptive Layout System
 * Responsive layouts that adapt to screen size, orientation, and usage patterns
 */

import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { motion } from '../../hooks/useFramerMotionLite';

interface ScreenInfo {
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
  density: number;
  isTouch: boolean;
  breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

interface LayoutContext {
  screenInfo: ScreenInfo;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  adaptiveMode: boolean;
  setAdaptiveMode: (mode: boolean) => void;
}

const AdaptiveLayoutContext = createContext<LayoutContext | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useAdaptiveLayout = () => {
  const context = useContext(AdaptiveLayoutContext);
  if (!context) {
    throw new Error('useAdaptiveLayout must be used within AdaptiveLayoutProvider');
  }
  return context;
};

// Breakpoint definitions
const breakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280
};

// Get current breakpoint
const getBreakpoint = (width: number): 'xs' | 'sm' | 'md' | 'lg' | 'xl' => {
  if (width >= breakpoints.xl) return 'xl';
  if (width >= breakpoints.lg) return 'lg';
  if (width >= breakpoints.md) return 'md';
  if (width >= breakpoints.sm) return 'sm';
  return 'xs';
};

// Provider component
interface AdaptiveLayoutProviderProps {
  children: React.ReactNode;
}

export const AdaptiveLayoutProvider: React.FC<AdaptiveLayoutProviderProps> = ({ children }) => {
  const [screenInfo, setScreenInfo] = useState<ScreenInfo>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
    orientation: 'portrait',
    density: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
    isTouch: typeof window !== 'undefined' ? 'ontouchstart' in window : false,
    breakpoint: 'md'
  });
  
  const [adaptiveMode, setAdaptiveMode] = useState(true);

  // Update screen info
  const updateScreenInfo = useCallback(() => {
    if (typeof window === 'undefined') return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const orientation = width > height ? 'landscape' : 'portrait';
    const density = window.devicePixelRatio;
    const isTouch = 'ontouchstart' in window;
    const breakpoint = getBreakpoint(width);

    setScreenInfo({
      width,
      height,
      orientation,
      density,
      isTouch,
      breakpoint
    });
  }, []);

  useEffect(() => {
    updateScreenInfo();
    
    const handleResize = () => updateScreenInfo();
    const handleOrientationChange = () => {
      // Delay to get accurate dimensions after orientation change
      setTimeout(updateScreenInfo, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [updateScreenInfo]);

  const isMobile = screenInfo.breakpoint === 'xs' || screenInfo.breakpoint === 'sm';
  const isTablet = screenInfo.breakpoint === 'md';
  const isDesktop = screenInfo.breakpoint === 'lg' || screenInfo.breakpoint === 'xl';

  const contextValue: LayoutContext = {
    screenInfo,
    isMobile,
    isTablet,
    isDesktop,
    adaptiveMode,
    setAdaptiveMode
  };

  return (
    <AdaptiveLayoutContext.Provider value={contextValue}>
      {children}
    </AdaptiveLayoutContext.Provider>
  );
};

// Grid system
interface GridProps {
  children: React.ReactNode;
  cols?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: number;
  className?: string;
}

export const Grid: React.FC<GridProps> = ({
  children,
  cols = { xs: 1, sm: 2, md: 3, lg: 4, xl: 5 },
  gap = 4,
  className = ''
}) => {
  const { screenInfo } = useAdaptiveLayout();
  const currentCols = cols[screenInfo.breakpoint] || cols.xs || 1;

  return (
    <div
      className={`grid gap-${gap} ${className}`}
      style={{
        gridTemplateColumns: `repeat(${currentCols}, 1fr)`
      }}
    >
      {children}
    </div>
  );
};

// Responsive container
interface ContainerProps {
  children: React.ReactNode;
  fluid?: boolean;
  padding?: {
    xs?: string;
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
  };
  className?: string;
}

export const Container: React.FC<ContainerProps> = ({
  children,
  fluid = false,
  padding = { xs: 'px-4', sm: 'px-6', md: 'px-8', lg: 'px-12', xl: 'px-16' },
  className = ''
}) => {
  const { screenInfo } = useAdaptiveLayout();
  const currentPadding = padding[screenInfo.breakpoint] || padding.xs || 'px-4';

  const maxWidthClass = fluid ? 'w-full' : {
    xs: 'max-w-screen-xs',
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl'
  }[screenInfo.breakpoint] || 'max-w-screen-lg';

  return (
    <div className={`mx-auto ${maxWidthClass} ${currentPadding} ${className}`}>
      {children}
    </div>
  );
};

// Adaptive stack layout
interface StackProps {
  children: React.ReactNode;
  direction?: {
    xs?: 'vertical' | 'horizontal';
    sm?: 'vertical' | 'horizontal';
    md?: 'vertical' | 'horizontal';
    lg?: 'vertical' | 'horizontal';
    xl?: 'vertical' | 'horizontal';
  };
  spacing?: number;
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  className?: string;
}

export const Stack: React.FC<StackProps> = ({
  children,
  direction = { xs: 'vertical', md: 'horizontal' },
  spacing = 4,
  align = 'start',
  justify = 'start',
  className = ''
}) => {
  const { screenInfo } = useAdaptiveLayout();
  const currentDirection = direction[screenInfo.breakpoint] || direction.xs || 'vertical';

  const flexDirection = currentDirection === 'vertical' ? 'flex-col' : 'flex-row';
  const gap = currentDirection === 'vertical' ? `space-y-${spacing}` : `space-x-${spacing}`;
  
  const alignItems = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch'
  }[align];

  const justifyContent = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly'
  }[justify];

  return (
    <div className={`flex ${flexDirection} ${gap} ${alignItems} ${justifyContent} ${className}`}>
      {children}
    </div>
  );
};

// Collapsible panel for mobile
interface CollapsiblePanelProps {
  children: React.ReactNode;
  title: string;
  defaultOpen?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export const CollapsiblePanel: React.FC<CollapsiblePanelProps> = ({
  children,
  title,
  defaultOpen = false,
  icon,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const { isMobile } = useAdaptiveLayout();

  // On desktop, always show content
  const shouldCollapse = isMobile;

  return (
    <div className={`border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      <button
        onClick={() => shouldCollapse && setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 bg-gray-50 text-left flex items-center justify-between ${
          shouldCollapse ? 'cursor-pointer hover:bg-gray-100' : 'cursor-default'
        }`}
        disabled={!shouldCollapse}
      >
        <div className="flex items-center space-x-3">
          {icon && <div className="flex-shrink-0">{icon}</div>}
          <span className="font-medium">{title}</span>
        </div>
        
        {shouldCollapse && (
          <motion.div
            animate={isOpen ? "scaleIn" : "scaleOut"}
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </motion.div>
        )}
      </button>

      {(shouldCollapse ? isOpen : true) && (
        <motion.div
          initial={shouldCollapse ? "fadeOut" : undefined}
          animate="fadeIn"
          className="overflow-hidden"
        >
          <div className="p-4">
            {children}
          </div>
        </motion.div>
      )}
    </div>
  );
};

// Responsive text
interface ResponsiveTextProps {
  children: React.ReactNode;
  size?: {
    xs?: string;
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
  };
  weight?: {
    xs?: string;
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
  };
  className?: string;
}

export const ResponsiveText: React.FC<ResponsiveTextProps> = ({
  children,
  size = { xs: 'text-sm', sm: 'text-base', md: 'text-lg', lg: 'text-xl', xl: 'text-2xl' },
  weight = { xs: 'font-normal' },
  className = ''
}) => {
  const { screenInfo } = useAdaptiveLayout();
  const currentSize = size[screenInfo.breakpoint] || size.xs || 'text-base';
  const currentWeight = weight[screenInfo.breakpoint] || weight.xs || 'font-normal';

  return (
    <span className={`${currentSize} ${currentWeight} ${className}`}>
      {children}
    </span>
  );
};

// Adaptive card layout
interface AdaptiveCardProps {
  children: React.ReactNode;
  compact?: boolean;
  padding?: {
    xs?: string;
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
  };
  className?: string;
}

export const AdaptiveCard: React.FC<AdaptiveCardProps> = ({
  children,
  compact = false,
  padding = { xs: 'p-4', sm: 'p-6', md: 'p-8' },
  className = ''
}) => {
  const { screenInfo } = useAdaptiveLayout();
  const currentPadding = padding[screenInfo.breakpoint] || padding.xs || 'p-4';
  
  const cardClass = compact 
    ? 'bg-white rounded-lg shadow-sm border border-gray-200'
    : 'bg-white rounded-xl shadow-lg border border-gray-100';

  return (
    <motion.div
      className={`${cardClass} ${currentPadding} ${className}`}
      initial="slideOutDown"
      animate="slideInUp"
    >
      {children}
    </motion.div>
  );
};

// Safe area wrapper for mobile devices
interface SafeAreaProps {
  children: React.ReactNode;
  top?: boolean;
  bottom?: boolean;
  left?: boolean;
  right?: boolean;
  className?: string;
}

export const SafeArea: React.FC<SafeAreaProps> = ({
  children,
  top = true,
  bottom = true,
  left = true,
  right = true,
  className = ''
}) => {
  const safeAreaClasses = [
    top && 'pt-safe-top',
    bottom && 'pb-safe-bottom',
    left && 'pl-safe-left',
    right && 'pr-safe-right'
  ].filter(Boolean).join(' ');

  return (
    <div className={`${safeAreaClasses} ${className}`}>
      {children}
    </div>
  );
};

export default AdaptiveLayoutProvider;