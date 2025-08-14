import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, useSpring, AnimatePresence } from 'framer-motion';
import { SPRING_PRESETS } from './SpringPhysicsEngine';
import { useColorPalette } from '../color/ColorPaletteManager';
import { useHapticFeedback } from '../mobile/HapticFeedbackEngine';

interface StateAnimationProps {
  state: 'idle' | 'loading' | 'success' | 'error' | 'warning';
  message?: string;
  duration?: number;
  autoReset?: boolean;
  resetDelay?: number;
  showIcon?: boolean;
  showMessage?: boolean;
  onStateChange?: (state: string) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

interface ToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  onClose?: () => void;
}

const CheckmarkIcon: React.FC<{ size?: number; color?: string }> = ({ size = 24, color = '#10B981' }) => (
  <motion.svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    initial={{ scale: 0, rotate: -90 }}
    animate={{ scale: 1, rotate: 0 }}
    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
  >
    <motion.circle
      cx="12"
      cy="12"
      r="10"
      stroke={color}
      strokeWidth="2"
      fill="none"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
    />
    <motion.path
      d="M8 12l2 2 6-6"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.3, delay: 0.2, ease: 'easeInOut' }}
    />
  </motion.svg>
);

const ErrorIcon: React.FC<{ size?: number; color?: string }> = ({ size = 24, color = '#EF4444' }) => (
  <motion.svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    initial={{ scale: 0, rotate: 90 }}
    animate={{ scale: 1, rotate: 0 }}
    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
  >
    <motion.circle
      cx="12"
      cy="12"
      r="10"
      stroke={color}
      strokeWidth="2"
      fill="none"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
    />
    <motion.path
      d="M8 8l8 8M16 8l-8 8"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.3, delay: 0.2, ease: 'easeInOut' }}
    />
  </motion.svg>
);

const WarningIcon: React.FC<{ size?: number; color?: string }> = ({ size = 24, color = '#F59E0B' }) => (
  <motion.svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    initial={{ scale: 0, rotate: -45 }}
    animate={{ scale: 1, rotate: 0 }}
    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
  >
    <motion.path
      d="M12 2L2 20h20L12 2z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
    />
    <motion.path
      d="M12 8v4M12 16h.01"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.3, delay: 0.2, ease: 'easeInOut' }}
    />
  </motion.svg>
);

const LoadingSpinner: React.FC<{ size?: number; color?: string }> = ({ size = 24, color = '#3B82F6' }) => (
  <motion.svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    animate={{ rotate: 360 }}
    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
  >
    <motion.circle
      cx="12"
      cy="12"
      r="10"
      stroke={color}
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeDasharray="60 40"
      initial={{ strokeDashoffset: 0 }}
      animate={{ strokeDashoffset: 100 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    />
  </motion.svg>
);

const PulseEffect: React.FC<{ 
  active: boolean; 
  color?: string; 
  size?: number; 
  intensity?: number;
}> = ({ active, color = '#3B82F6', size = 40, intensity = 0.3 }) => (
  <AnimatePresence>
    {active && (
      <motion.div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          backgroundColor: color,
          width: size,
          height: size,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)'
        }}
        initial={{ scale: 0.5, opacity: intensity }}
        animate={{ scale: 2, opacity: 0 }}
        exit={{ scale: 0.5, opacity: 0 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'easeOut' }}
      />
    )}
  </AnimatePresence>
);

const StateIndicator: React.FC<StateAnimationProps> = ({
  state,
  message,
  duration = 3000,
  autoReset = true,
  resetDelay = 1000,
  showIcon = true,
  showMessage = true,
  onStateChange,
  className = '',
  size = 'md'
}) => {
  const [currentState, setCurrentState] = useState(state);
  const [showContent, setShowContent] = useState(false);
  const { currentPalette } = useColorPalette();
  const { triggerHaptic } = useHapticFeedback();
  const springConfig = SPRING_PRESETS.responsive;
  const timeoutRef = useRef<NodeJS.Timeout>();

  const sizeMap = {
    sm: { icon: 16, container: 'p-2 text-sm' },
    md: { icon: 24, container: 'p-3 text-base' },
    lg: { icon: 32, container: 'p-4 text-lg' }
  };

  const stateConfig = {
    idle: {
      color: currentPalette.textSecondary,
      bgColor: currentPalette.surface,
      icon: null,
      haptic: null
    },
    loading: {
      color: currentPalette.primary,
      bgColor: currentPalette.primary + '10',
      icon: <LoadingSpinner size={sizeMap[size].icon} color={currentPalette.primary} />,
      haptic: null
    },
    success: {
      color: currentPalette.success,
      bgColor: currentPalette.success + '10',
      icon: <CheckmarkIcon size={sizeMap[size].icon} color={currentPalette.success} />,
      haptic: 'success'
    },
    error: {
      color: currentPalette.error,
      bgColor: currentPalette.error + '10',
      icon: <ErrorIcon size={sizeMap[size].icon} color={currentPalette.error} />,
      haptic: 'error'
    },
    warning: {
      color: currentPalette.warning,
      bgColor: currentPalette.warning + '10',
      icon: <WarningIcon size={sizeMap[size].icon} color={currentPalette.warning} />,
      haptic: 'warning'
    }
  };

  useEffect(() => {
    if (state !== currentState) {
      setCurrentState(state);
      onStateChange?.(state);

      // Trigger haptic feedback for state changes
      const config = stateConfig[state];
      if (config.haptic) {
        triggerHaptic(config.haptic as any);
      }

      // Show content animation
      if (state !== 'idle') {
        setShowContent(true);
      }

      // Auto-reset logic
      if (autoReset && (state === 'success' || state === 'error' || state === 'warning')) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(() => {
          setCurrentState('idle');
          setShowContent(false);
          onStateChange?.('idle');
        }, duration + resetDelay);
      }
    }
  }, [state, currentState, autoReset, duration, resetDelay, onStateChange, triggerHaptic]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const config = stateConfig[currentState];

  return (
    <motion.div
      className={`relative inline-flex items-center justify-center rounded-lg border transition-all duration-200 ${sizeMap[size].container} ${className}`}
      style={{
        backgroundColor: config.bgColor,
        borderColor: config.color + '40',
        color: config.color
      }}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={springConfig}
    >
      {/* Pulse effect for active states */}
      <PulseEffect
        active={currentState === 'loading'}
        color={config.color}
        size={sizeMap[size].icon + 16}
        intensity={0.2}
      />

      {/* Icon */}
      {showIcon && config.icon && (
        <motion.div
          className="flex items-center justify-center"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ ...springConfig, delay: 0.1 }}
        >
          {config.icon}
        </motion.div>
      )}

      {/* Message */}
      {showMessage && message && showContent && (
        <motion.div
          className={`${showIcon ? 'ml-2' : ''} font-medium`}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ...springConfig, delay: 0.2 }}
        >
          {message}
        </motion.div>
      )}
    </motion.div>
  );
};

const Toast: React.FC<ToastProps> = ({
  type,
  message,
  duration = 4000,
  position = 'top-right',
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const { currentPalette } = useColorPalette();
  const { triggerHaptic } = useHapticFeedback();
  const springConfig = SPRING_PRESETS.snappy;

  const typeConfig = {
    success: {
      color: currentPalette.success,
      bgColor: currentPalette.success + '10',
      icon: <CheckmarkIcon size={20} color={currentPalette.success} />,
      haptic: 'success'
    },
    error: {
      color: currentPalette.error,
      bgColor: currentPalette.error + '10',
      icon: <ErrorIcon size={20} color={currentPalette.error} />,
      haptic: 'error'
    },
    warning: {
      color: currentPalette.warning,
      bgColor: currentPalette.warning + '10',
      icon: <WarningIcon size={20} color={currentPalette.warning} />,
      haptic: 'warning'
    },
    info: {
      color: currentPalette.primary,
      bgColor: currentPalette.primary + '10',
      icon: <LoadingSpinner size={20} color={currentPalette.primary} />,
      haptic: 'light'
    }
  };

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
  };

  const slideDirection = {
    'top-right': { x: 100, y: -50 },
    'top-left': { x: -100, y: -50 },
    'bottom-right': { x: 100, y: 50 },
    'bottom-left': { x: -100, y: 50 },
    'top-center': { x: 0, y: -50 },
    'bottom-center': { x: 0, y: 50 }
  };

  const config = typeConfig[type];

  useEffect(() => {
    triggerHaptic(config.haptic as any);
    
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose?.(), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose, triggerHaptic, config.haptic]);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => onClose?.(), 300);
  }, [onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`fixed z-50 ${positionClasses[position]}`}
          initial={{ 
            opacity: 0, 
            scale: 0.8,
            ...slideDirection[position]
          }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            x: 0,
            y: 0
          }}
          exit={{ 
            opacity: 0, 
            scale: 0.8,
            ...slideDirection[position]
          }}
          transition={springConfig}
        >
          <motion.div
            className="flex items-center p-4 rounded-lg shadow-lg border backdrop-blur-sm max-w-md"
            style={{
              backgroundColor: config.bgColor,
              borderColor: config.color + '40',
              color: config.color,
              boxShadow: `0 10px 25px -5px ${currentPalette.shadow}40`
            }}
            whileHover={{ scale: 1.02 }}
            transition={springConfig}
          >
            {/* Icon */}
            <div className="flex-shrink-0 mr-3">
              {config.icon}
            </div>

            {/* Message */}
            <div className="flex-1 font-medium text-sm">
              {message}
            </div>

            {/* Close button */}
            <motion.button
              className="flex-shrink-0 ml-3 p-1 rounded-full hover:bg-black hover:bg-opacity-10 transition-colors"
              onClick={handleClose}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              transition={springConfig}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path
                  d="M18 6L6 18M6 6l12 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Progress indicator with state animations
const ProgressIndicator: React.FC<{
  progress: number;
  state?: 'loading' | 'success' | 'error';
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ progress, state = 'loading', showPercentage = true, size = 'md', className = '' }) => {
  const { currentPalette } = useColorPalette();
  const springConfig = SPRING_PRESETS.responsive;
  
  const progressValue = useSpring(progress, { 
    stiffness: 300, 
    damping: 30,
    restDelta: 0.001
  });

  const sizeMap = {
    sm: { height: 'h-2', text: 'text-sm' },
    md: { height: 'h-3', text: 'text-base' },
    lg: { height: 'h-4', text: 'text-lg' }
  };

  const stateColors = {
    loading: currentPalette.primary,
    success: currentPalette.success,
    error: currentPalette.error
  };

  return (
    <div className={`w-full ${className}`}>
      {showPercentage && (
        <div className={`flex justify-between items-center mb-2 ${sizeMap[size].text}`}>
          <span style={{ color: currentPalette.text }}>Progress</span>
          <span style={{ color: stateColors[state] }}>
            {Math.round(progress)}%
          </span>
        </div>
      )}
      
      <div 
        className={`relative w-full rounded-full overflow-hidden ${sizeMap[size].height}`}
        style={{ backgroundColor: currentPalette.surface }}
      >
        <motion.div
          className="absolute top-0 left-0 h-full rounded-full"
          style={{
            backgroundColor: stateColors[state],
            width: `${progressValue.get()}%`
          }}
          initial={{ width: 0 }}
          transition={springConfig}
        />
        
        {/* Animated shimmer effect */}
        {state === 'loading' && (
          <motion.div
            className="absolute top-0 left-0 h-full w-full"
            style={{
              background: `linear-gradient(90deg, transparent, ${stateColors[state]}40, transparent)`,
              width: '30%'
            }}
            animate={{ x: ['-100%', '400%'] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'linear'
            }}
          />
        )}
      </div>
    </div>
  );
};

// Toast manager hook
export const useToast = () => {
  const [toasts, setToasts] = useState<Array<ToastProps & { id: string }>>([]);

  const addToast = useCallback((toast: Omit<ToastProps, 'onClose'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const ToastContainer = () => (
    <div className="fixed inset-0 pointer-events-none z-50">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );

  return {
    addToast,
    removeToast,
    ToastContainer
  };
};

export { StateIndicator, Toast, ProgressIndicator };
export default StateIndicator;