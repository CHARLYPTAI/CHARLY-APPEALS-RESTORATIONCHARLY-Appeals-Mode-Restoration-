import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import { SPRING_PRESETS } from './SpringPhysicsEngine';
import { useColorPalette } from '../color/ColorPaletteManager';
import { useHapticFeedback } from '../mobile/HapticFeedbackEngine';

interface FormFieldFocusProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'error' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  required?: boolean;
  label?: string;
  error?: string;
  hint?: string;
  className?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  onChange?: (value: string) => void;
}

interface FloatingLabelProps {
  label: string;
  isFocused: boolean;
  hasValue: boolean;
  variant: FormFieldFocusProps['variant'];
  size: FormFieldFocusProps['size'];
  required?: boolean;
}

const FloatingLabel: React.FC<FloatingLabelProps> = ({
  label,
  isFocused,
  hasValue,
  variant,
  size,
  required
}) => {
  const { currentPalette } = useColorPalette();
  const springConfig = SPRING_PRESETS.responsive;
  
  const labelVariants = {
    default: {
      y: 0,
      scale: 1,
      color: currentPalette.textSecondary,
      transition: springConfig
    },
    focused: {
      y: size === 'sm' ? -18 : size === 'lg' ? -22 : -20,
      scale: 0.85,
      color: variant === 'error' ? currentPalette.error : 
             variant === 'success' ? currentPalette.success :
             variant === 'warning' ? currentPalette.warning :
             currentPalette.primary,
      transition: springConfig
    }
  };

  return (
    <motion.label
      className="absolute left-3 pointer-events-none select-none"
      style={{
        top: size === 'sm' ? '0.625rem' : size === 'lg' ? '0.875rem' : '0.75rem',
        transformOrigin: 'left center',
        zIndex: 1
      }}
      variants={labelVariants}
      animate={isFocused || hasValue ? 'focused' : 'default'}
    >
      <span className="bg-white dark:bg-gray-900 px-1 rounded text-sm font-medium">
        {label}
        {required && (
          <motion.span
            className="ml-1"
            style={{ color: currentPalette.error }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, ...springConfig }}
          >
            *
          </motion.span>
        )}
      </span>
    </motion.label>
  );
};

const FocusRing: React.FC<{
  isFocused: boolean;
  variant: FormFieldFocusProps['variant'];
  size: FormFieldFocusProps['size'];
}> = ({ isFocused, variant, size }) => {
  const { currentPalette } = useColorPalette();
  const springConfig = SPRING_PRESETS.gentle;

  const ringColor = variant === 'error' ? currentPalette.error :
                   variant === 'success' ? currentPalette.success :
                   variant === 'warning' ? currentPalette.warning :
                   currentPalette.primary;

  const ringSize = size === 'sm' ? 2 : size === 'lg' ? 4 : 3;

  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      style={{
        borderRadius: 'inherit',
        boxShadow: `0 0 0 ${ringSize}px ${ringColor}`,
        opacity: 0
      }}
      animate={{
        opacity: isFocused ? 0.2 : 0,
        scale: isFocused ? 1 : 0.95,
        transition: springConfig
      }}
    />
  );
};

const GlowEffect: React.FC<{
  isFocused: boolean;
  variant: FormFieldFocusProps['variant'];
  intensity?: number;
}> = ({ isFocused, variant, intensity = 0.15 }) => {
  const { currentPalette } = useColorPalette();
  const springConfig = SPRING_PRESETS.gentle;

  const glowColor = variant === 'error' ? currentPalette.error :
                   variant === 'success' ? currentPalette.success :
                   variant === 'warning' ? currentPalette.warning :
                   currentPalette.primary;

  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      style={{
        borderRadius: 'inherit',
        background: `radial-gradient(ellipse at center, ${glowColor} 0%, transparent 70%)`,
        opacity: 0,
        filter: 'blur(8px)',
        transform: 'scale(1.1)',
        zIndex: -1
      }}
      animate={{
        opacity: isFocused ? intensity : 0,
        scale: isFocused ? 1.05 : 1,
        transition: springConfig
      }}
    />
  );
};

const ValidationIcon: React.FC<{
  variant: FormFieldFocusProps['variant'];
  show: boolean;
}> = ({ variant, show }) => {
  const { currentPalette } = useColorPalette();
  const springConfig = SPRING_PRESETS.snappy;

  const icons = {
    success: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M13.854 4.146a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.793l6.646-6.647a.5.5 0 0 1 .708 0z"
          fill={currentPalette.success}
        />
      </svg>
    ),
    error: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zM8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"
          fill={currentPalette.error}
        />
      </svg>
    ),
    warning: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M7.938 2.016A.13.13 0 0 1 8.002 2a.13.13 0 0 1 .063.016.146.146 0 0 1 .054.057l6.857 11.667c.036.06.035.124.002.183a.163.163 0 0 1-.054.06.116.116 0 0 1-.066.017H1.146a.115.115 0 0 1-.066-.017.163.163 0 0 1-.054-.06.176.176 0 0 1 .002-.183L7.884 2.073a.147.147 0 0 1 .054-.057zm1.044-.45a1.13 1.13 0 0 0-2.027 0L.099 13.233a1.176 1.176 0 0 0 1.014 1.767h13.774a1.176 1.176 0 0 0 1.013-1.767L8.982 1.566zM8.5 6v2.5a.5.5 0 0 1-1 0V6a.5.5 0 0 1 1 0zm0 4a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0z"
          fill={currentPalette.warning}
        />
      </svg>
    ),
    default: null
  };

  return (
    <AnimatePresence>
      {show && variant !== 'default' && (
        <motion.div
          className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none"
          initial={{ opacity: 0, scale: 0, rotate: -90 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0, rotate: 90 }}
          transition={springConfig}
        >
          {icons[variant]}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const MessageText: React.FC<{
  message: string;
  variant: FormFieldFocusProps['variant'];
  show: boolean;
}> = ({ message, variant, show }) => {
  const { currentPalette } = useColorPalette();
  const springConfig = SPRING_PRESETS.responsive;

  const messageColor = variant === 'error' ? currentPalette.error :
                      variant === 'success' ? currentPalette.success :
                      variant === 'warning' ? currentPalette.warning :
                      currentPalette.textSecondary;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="mt-2 px-3"
          initial={{ opacity: 0, y: -10, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -10, height: 0 }}
          transition={springConfig}
        >
          <div
            className="text-sm font-medium flex items-center gap-2"
            style={{ color: messageColor }}
          >
            {variant === 'error' && (
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path
                  d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zM8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"
                  fill="currentColor"
                />
              </svg>
            )}
            {variant === 'success' && (
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path
                  d="M13.854 4.146a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.793l6.646-6.647a.5.5 0 0 1 .708 0z"
                  fill="currentColor"
                />
              </svg>
            )}
            {variant === 'warning' && (
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path
                  d="M7.938 2.016A.13.13 0 0 1 8.002 2a.13.13 0 0 1 .063.016.146.146 0 0 1 .054.057l6.857 11.667c.036.06.035.124.002.183a.163.163 0 0 1-.054.06.116.116 0 0 1-.066.017H1.146a.115.115 0 0 1-.066-.017.163.163 0 0 1-.054-.06.176.176 0 0 1 .002-.183L7.884 2.073a.147.147 0 0 1 .054-.057zm1.044-.45a1.13 1.13 0 0 0-2.027 0L.099 13.233a1.176 1.176 0 0 0 1.014 1.767h13.774a1.176 1.176 0 0 0 1.013-1.767L8.982 1.566zM8.5 6v2.5a.5.5 0 0 1-1 0V6a.5.5 0 0 1 1 0zm0 4a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0z"
                  fill="currentColor"
                />
              </svg>
            )}
            {message}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const FormFieldFocus: React.FC<FormFieldFocusProps> = ({
  children,
  variant = 'default',
  size = 'md',
  disabled = false,
  required = false,
  label,
  error,
  hint,
  className = '',
  onFocus,
  onBlur,
  onChange
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { currentPalette } = useColorPalette();
  const { triggerHaptic } = useHapticFeedback();
  const springConfig = SPRING_PRESETS.responsive;

  // Detect if the field has a value by checking input elements
  useEffect(() => {
    const checkValue = () => {
      if (containerRef.current) {
        const input = containerRef.current.querySelector('input, textarea, select') as HTMLInputElement;
        if (input) {
          setHasValue(input.value.length > 0);
        }
      }
    };

    checkValue();
    
    // Set up observers for value changes
    const observer = new MutationObserver(checkValue);
    if (containerRef.current) {
      observer.observe(containerRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['value']
      });
    }

    return () => observer.disconnect();
  }, [children]);

  const handleFocus = useCallback(() => {
    if (disabled) return;
    
    setIsFocused(true);
    triggerHaptic('light');
    onFocus?.();
  }, [disabled, onFocus, triggerHaptic]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    onBlur?.();
  }, [onBlur]);

  const handleMouseEnter = useCallback(() => {
    if (disabled) return;
    setIsHovered(true);
  }, [disabled]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  const sizeClasses = {
    sm: 'h-10 text-sm',
    md: 'h-12 text-base',
    lg: 'h-14 text-lg'
  };

  const borderColor = variant === 'error' ? currentPalette.error :
                     variant === 'success' ? currentPalette.success :
                     variant === 'warning' ? currentPalette.warning :
                     isFocused ? currentPalette.primary :
                     isHovered ? currentPalette.textSecondary :
                     currentPalette.border;

  const backgroundHover = disabled ? 'transparent' : 
                         isHovered ? `${currentPalette.primary}08` : 
                         'transparent';

  return (
    <div className={`relative ${className}`}>
      <motion.div
        ref={containerRef}
        className="relative"
        style={{
          filter: disabled ? 'opacity(0.5)' : 'none',
          cursor: disabled ? 'not-allowed' : 'auto'
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        animate={{
          backgroundColor: backgroundHover,
          borderColor,
          transition: springConfig
        }}
      >
        <motion.div
          className={`
            relative overflow-hidden rounded-lg border-2 transition-all duration-200
            ${sizeClasses[size]}
            ${disabled ? 'cursor-not-allowed' : 'cursor-text'}
          `}
          style={{
            borderColor,
            backgroundColor: disabled ? currentPalette.surface + '40' : 
                           isFocused ? currentPalette.surface + '80' : 
                           currentPalette.surface + '20'
          }}
          whileHover={!disabled ? { scale: 1.01 } : {}}
          transition={springConfig}
        >
          {/* Focus ring */}
          <FocusRing
            isFocused={isFocused}
            variant={variant}
            size={size}
          />

          {/* Glow effect */}
          <GlowEffect
            isFocused={isFocused}
            variant={variant}
            intensity={0.1}
          />

          {/* Floating label */}
          {label && (
            <FloatingLabel
              label={label}
              isFocused={isFocused}
              hasValue={hasValue}
              variant={variant}
              size={size}
              required={required}
            />
          )}

          {/* Input field wrapper */}
          <div className="relative h-full flex items-center">
            {React.cloneElement(children as React.ReactElement, {
              className: `
                w-full h-full px-3 bg-transparent border-none outline-none
                placeholder-transparent focus:placeholder-gray-400
                transition-all duration-200
                ${(children as React.ReactElement).props.className || ''}
              `,
              style: {
                paddingTop: label ? (size === 'sm' ? '1.25rem' : size === 'lg' ? '1.5rem' : '1.375rem') : undefined,
                paddingBottom: label ? (size === 'sm' ? '0.25rem' : size === 'lg' ? '0.5rem' : '0.375rem') : undefined,
                color: currentPalette.text,
                fontSize: size === 'sm' ? '0.875rem' : size === 'lg' ? '1.125rem' : '1rem'
              },
              disabled,
              onFocus: handleFocus,
              onBlur: handleBlur,
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                setHasValue(e.target.value.length > 0);
                onChange?.(e.target.value);
                (children as React.ReactElement).props.onChange?.(e);
              }
            })}
          </div>

          {/* Validation icon */}
          <ValidationIcon
            variant={variant}
            show={isFocused || hasValue}
          />
        </motion.div>
      </motion.div>

      {/* Error message */}
      <MessageText
        message={error || ''}
        variant="error"
        show={Boolean(error)}
      />

      {/* Hint message */}
      <MessageText
        message={hint || ''}
        variant="default"
        show={Boolean(hint) && !error}
      />
    </div>
  );
};

// Specialized form field components
export const TextFieldFocus: React.FC<Omit<FormFieldFocusProps, 'children'> & {
  placeholder?: string;
  value?: string;
  type?: 'text' | 'email' | 'password' | 'tel' | 'url';
}> = ({ placeholder, value, type = 'text', ...props }) => (
  <FormFieldFocus {...props}>
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      aria-label={props.label}
      aria-describedby={props.error ? `${props.label}-error` : props.hint ? `${props.label}-hint` : undefined}
      aria-invalid={props.variant === 'error'}
      aria-required={props.required}
    />
  </FormFieldFocus>
);

export const TextAreaFocus: React.FC<Omit<FormFieldFocusProps, 'children'> & {
  placeholder?: string;
  value?: string;
  rows?: number;
}> = ({ placeholder, value, rows = 4, ...props }) => (
  <FormFieldFocus {...props}>
    <textarea
      rows={rows}
      placeholder={placeholder}
      value={value}
      aria-label={props.label}
      aria-describedby={props.error ? `${props.label}-error` : props.hint ? `${props.label}-hint` : undefined}
      aria-invalid={props.variant === 'error'}
      aria-required={props.required}
      style={{ resize: 'vertical', minHeight: `${rows * 1.5}rem` }}
    />
  </FormFieldFocus>
);

export const SelectFieldFocus: React.FC<Omit<FormFieldFocusProps, 'children'> & {
  options: { value: string; label: string }[];
  value?: string;
  placeholder?: string;
}> = ({ options, value, placeholder, ...props }) => (
  <FormFieldFocus {...props}>
    <select
      value={value}
      aria-label={props.label}
      aria-describedby={props.error ? `${props.label}-error` : props.hint ? `${props.label}-hint` : undefined}
      aria-invalid={props.variant === 'error'}
      aria-required={props.required}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </FormFieldFocus>
);

export default FormFieldFocus;