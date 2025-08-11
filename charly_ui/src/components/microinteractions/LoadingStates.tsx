import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useMicroInteractions } from './SpringPhysicsEngine';
import { useAdaptiveColor } from '../color/AdaptiveColorEngine';
import { useColorAccessibility } from '../color/ColorAccessibilityProvider';

interface LoadingStateProps {
  type: 'spinner' | 'pulse' | 'breathe' | 'skeleton' | 'shimmer' | 'dots' | 'wave' | 'progress';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  speed?: 'slow' | 'normal' | 'fast';
  overlay?: boolean;
  message?: string;
  progress?: number; // 0-100 for progress type
  className?: string;
  style?: React.CSSProperties;
}

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular' | 'rounded';
}

export const LoadingSpinner: React.FC<LoadingStateProps> = ({
  type = 'spinner',
  size = 'md',
  color,
  speed = 'normal',
  overlay = false,
  message,
  progress,
  className = '',
  style = {}
}) => {
  const { currentPalette } = useAdaptiveColor();
  const { reducedMotionMode } = useColorAccessibility();
  const { animateSpring } = useMicroInteractions();
  const spinnerRef = useRef<HTMLDivElement>(null);
  
  const loadingColor = color || currentPalette.primary;
  
  // Size configurations
  const sizeConfig = {
    sm: { size: 16, strokeWidth: 2, fontSize: '12px' },
    md: { size: 24, strokeWidth: 3, fontSize: '14px' },
    lg: { size: 32, strokeWidth: 4, fontSize: '16px' },
    xl: { size: 48, strokeWidth: 5, fontSize: '18px' }
  };
  
  // Speed configurations
  const speedConfig = {
    slow: { duration: '2s', delay: '0.2s' },
    normal: { duration: '1s', delay: '0.15s' },
    fast: { duration: '0.5s', delay: '0.1s' }
  };
  
  const config = sizeConfig[size];
  const timing = speedConfig[speed];

  // Spinner with Apple-style smoothness
  const renderSpinner = () => (
    <div
      ref={spinnerRef}
      className={`inline-block ${className}`}
      style={{
        width: config.size,
        height: config.size,
        ...style
      }}
    >
      <svg
        width={config.size}
        height={config.size}
        viewBox="0 0 50 50"
        className="animate-spin"
        style={{
          animation: reducedMotionMode ? 'none' : `spin ${timing.duration} cubic-bezier(0.4, 0, 0.2, 1) infinite`
        }}
      >
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke={loadingColor}
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
          strokeDasharray="31.416"
          strokeDashoffset="31.416"
          className="animate-dash"
          style={{
            animation: reducedMotionMode ? 'none' : `dash ${timing.duration} cubic-bezier(0.4, 0, 0.2, 1) infinite`
          }}
        />
      </svg>
    </div>
  );

  // Pulse animation
  const renderPulse = () => (
    <div
      className={`inline-flex items-center justify-center ${className}`}
      style={{
        width: config.size,
        height: config.size,
        ...style
      }}
    >
      <div
        className="rounded-full"
        style={{
          width: config.size,
          height: config.size,
          backgroundColor: loadingColor,
          animation: reducedMotionMode ? 'none' : `pulse ${timing.duration} cubic-bezier(0.4, 0, 0.2, 1) infinite`
        }}
      />
    </div>
  );

  // Breathe animation
  const renderBreathe = () => (
    <div
      className={`inline-flex items-center justify-center ${className}`}
      style={{
        width: config.size,
        height: config.size,
        ...style
      }}
    >
      <div
        className="rounded-full"
        style={{
          width: config.size * 0.8,
          height: config.size * 0.8,
          backgroundColor: loadingColor,
          animation: reducedMotionMode ? 'none' : `breathe ${timing.duration} cubic-bezier(0.4, 0, 0.2, 1) infinite`
        }}
      />
    </div>
  );

  // Dots animation
  const renderDots = () => (
    <div
      className={`inline-flex items-center space-x-1 ${className}`}
      style={style}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="rounded-full"
          style={{
            width: config.size / 3,
            height: config.size / 3,
            backgroundColor: loadingColor,
            animation: reducedMotionMode ? 'none' : `bounce ${timing.duration} cubic-bezier(0.4, 0, 0.2, 1) infinite ${i * 0.1}s`
          }}
        />
      ))}
    </div>
  );

  // Wave animation
  const renderWave = () => (
    <div
      className={`inline-flex items-center space-x-1 ${className}`}
      style={style}
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="rounded-full"
          style={{
            width: config.size / 6,
            height: config.size,
            backgroundColor: loadingColor,
            animation: reducedMotionMode ? 'none' : `wave ${timing.duration} cubic-bezier(0.4, 0, 0.2, 1) infinite ${i * 0.1}s`
          }}
        />
      ))}
    </div>
  );

  // Progress bar
  const renderProgress = () => (
    <div
      className={`relative overflow-hidden rounded-full ${className}`}
      style={{
        width: '100%',
        height: config.size / 2,
        backgroundColor: `${loadingColor}20`,
        ...style
      }}
    >
      <div
        className="absolute top-0 left-0 h-full rounded-full transition-all duration-300 ease-out"
        style={{
          width: `${progress || 0}%`,
          backgroundColor: loadingColor,
          transform: reducedMotionMode ? 'none' : 'translateX(-100%)',
          animation: reducedMotionMode ? 'none' : progress === undefined ? `progress ${timing.duration} cubic-bezier(0.4, 0, 0.2, 1) infinite` : 'none'
        }}
      />
    </div>
  );

  // Shimmer effect
  const renderShimmer = () => (
    <div
      className={`relative overflow-hidden rounded ${className}`}
      style={{
        width: '100%',
        height: config.size,
        backgroundColor: `${loadingColor}20`,
        ...style
      }}
    >
      <div
        className="absolute inset-0 -translate-x-full"
        style={{
          background: `linear-gradient(90deg, transparent, ${loadingColor}40, transparent)`,
          animation: reducedMotionMode ? 'none' : `shimmer ${timing.duration} cubic-bezier(0.4, 0, 0.2, 1) infinite`
        }}
      />
    </div>
  );

  const renderLoadingState = () => {
    switch (type) {
      case 'spinner':
        return renderSpinner();
      case 'pulse':
        return renderPulse();
      case 'breathe':
        return renderBreathe();
      case 'dots':
        return renderDots();
      case 'wave':
        return renderWave();
      case 'progress':
        return renderProgress();
      case 'shimmer':
        return renderShimmer();
      default:
        return renderSpinner();
    }
  };

  const content = (
    <div className="flex flex-col items-center space-y-3">
      {renderLoadingState()}
      {message && (
        <div
          className="text-center font-medium"
          style={{
            color: loadingColor,
            fontSize: config.fontSize
          }}
        >
          {message}
        </div>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        style={{
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)'
        }}
      >
        <div className="bg-white rounded-xl p-6 shadow-2xl">
          {content}
        </div>
      </div>
    );
  }

  return content;
};

// Skeleton component for content placeholders
export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '20px',
  borderRadius = '4px',
  className = '',
  variant = 'rectangular'
}) => {
  const { currentPalette } = useAdaptiveColor();
  const { reducedMotionMode } = useColorAccessibility();
  
  const getVariantStyles = () => {
    switch (variant) {
      case 'text':
        return {
          width: width,
          height: '1em',
          borderRadius: '4px'
        };
      case 'circular':
        return {
          width: width,
          height: width,
          borderRadius: '50%'
        };
      case 'rounded':
        return {
          width: width,
          height: height,
          borderRadius: '12px'
        };
      default:
        return {
          width: width,
          height: height,
          borderRadius: borderRadius
        };
    }
  };

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        backgroundColor: `${currentPalette.text.primary}10`,
        ...getVariantStyles()
      }}
    >
      <div
        className="absolute inset-0 -translate-x-full"
        style={{
          background: `linear-gradient(90deg, transparent, ${currentPalette.text.primary}20, transparent)`,
          animation: reducedMotionMode ? 'none' : 'shimmer 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite'
        }}
      />
    </div>
  );
};

// Skeleton group for multiple placeholders
export const SkeletonGroup: React.FC<{
  lines?: number;
  variant?: 'text' | 'card' | 'list';
  className?: string;
}> = ({ lines = 3, variant = 'text', className = '' }) => {
  const renderVariant = () => {
    switch (variant) {
      case 'text':
        return (
          <div className="space-y-2">
            {Array.from({ length: lines }).map((_, i) => (
              <Skeleton
                key={i}
                width={i === lines - 1 ? '60%' : '100%'}
                height="16px"
                variant="text"
              />
            ))}
          </div>
        );
      case 'card':
        return (
          <div className="space-y-4">
            <Skeleton width="100%" height="200px" variant="rounded" />
            <div className="space-y-2">
              <Skeleton width="100%" height="20px" variant="text" />
              <Skeleton width="80%" height="16px" variant="text" />
              <Skeleton width="60%" height="16px" variant="text" />
            </div>
          </div>
        );
      case 'list':
        return (
          <div className="space-y-3">
            {Array.from({ length: lines }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <Skeleton width="40px" height="40px" variant="circular" />
                <div className="flex-1 space-y-1">
                  <Skeleton width="100%" height="16px" variant="text" />
                  <Skeleton width="70%" height="14px" variant="text" />
                </div>
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={className}>
      {renderVariant()}
    </div>
  );
};

// Global CSS for animations
const LoadingAnimations = () => (
  <style jsx global>{`
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    @keyframes dash {
      0% { stroke-dashoffset: 31.416; }
      50% { stroke-dashoffset: 7.854; }
      100% { stroke-dashoffset: 31.416; }
    }
    
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.1); opacity: 0.7; }
    }
    
    @keyframes breathe {
      0%, 100% { transform: scale(1); opacity: 0.7; }
      50% { transform: scale(1.2); opacity: 1; }
    }
    
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
    
    @keyframes wave {
      0%, 100% { transform: scaleY(1); }
      50% { transform: scaleY(1.5); }
    }
    
    @keyframes progress {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
    
    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
    
    @media (prefers-reduced-motion: reduce) {
      * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }
  `}</style>
);

export { LoadingAnimations };
export default LoadingSpinner;