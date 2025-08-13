// 🍎 Input Component - Apple Form Excellence
// "Simplicity is the ultimate sophistication" - Leonardo da Vinci

import React, { InputHTMLAttributes, useState, useRef } from 'react';
import { APPLE_COLORS, NEUTRAL_COLORS } from '../design/colors';
import { SPACING } from '../design/spacing';
import { TRANSITIONS } from '../design/animations';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  success = false,
  onFocus,
  onBlur,
  ...props
}) => {
  const [focused, setFocused] = useState(false);
  const [hasValue, setHasValue] = useState(!!props.value || !!props.defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setFocused(false);
    setHasValue(!!e.target.value);
    onBlur?.(e);
  };

  const handleLabelClick = () => {
    inputRef.current?.focus();
  };

  const isLabelFloating = focused || hasValue;
  const borderColor = error 
    ? APPLE_COLORS.RED 
    : success 
    ? APPLE_COLORS.GREEN 
    : focused 
    ? APPLE_COLORS.BLUE 
    : NEUTRAL_COLORS.GRAY_100;

  return (
    <div style={styles.container}>
      <div style={styles.inputWrapper}>
        <input
          ref={inputRef}
          {...props}
          style={{
            ...styles.input,
            borderColor,
            paddingTop: label ? '20px' : '12px',
            paddingBottom: label ? '4px' : '12px',
          }}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={(e) => {
            setHasValue(!!e.target.value);
            props.onChange?.(e);
          }}
        />
        
        {label && (
          <label
            style={{
              ...styles.label,
              ...(isLabelFloating ? styles.labelFloating : styles.labelPlaceholder),
              color: error ? APPLE_COLORS.RED : focused ? APPLE_COLORS.BLUE : NEUTRAL_COLORS.GRAY_600,
            }}
            onClick={handleLabelClick}
          >
            {label}
          </label>
        )}
        
        {success && !error && (
          <div style={styles.successIcon}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M20 6L9 17l-5-5"
                stroke={APPLE_COLORS.GREEN}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}
      </div>
      
      {error && (
        <div style={styles.errorMessage}>
          {error}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },

  inputWrapper: {
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
  },

  input: {
    width: '100%',
    padding: '12px 16px',
    border: `1px solid ${NEUTRAL_COLORS.GRAY_100}`,
    borderRadius: '8px',
    fontSize: '16px',
    fontFamily: "'SF Pro Text', -apple-system, sans-serif",
    backgroundColor: NEUTRAL_COLORS.WHITE,
    color: NEUTRAL_COLORS.GRAY_900,
    transition: TRANSITIONS.STANDARD,
    outline: 'none',
    
    '::placeholder': {
      color: NEUTRAL_COLORS.GRAY_600,
      opacity: 0.7,
    },
    
    ':focus': {
      borderColor: APPLE_COLORS.BLUE,
      boxShadow: `0 0 0 3px ${APPLE_COLORS.BLUE}20`,
    },
    
    ':disabled': {
      backgroundColor: NEUTRAL_COLORS.GRAY_50,
      color: NEUTRAL_COLORS.GRAY_600,
      cursor: 'not-allowed',
    },
  },

  label: {
    position: 'absolute' as const,
    left: '16px',
    fontFamily: "'SF Pro Text', -apple-system, sans-serif",
    fontWeight: 500,
    transition: TRANSITIONS.STANDARD,
    cursor: 'text',
    pointerEvents: 'none' as const,
  },

  labelPlaceholder: {
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '16px',
    color: NEUTRAL_COLORS.GRAY_600,
  },

  labelFloating: {
    top: '8px',
    transform: 'translateY(0)',
    fontSize: '12px',
    fontWeight: 600,
  },

  successIcon: {
    position: 'absolute' as const,
    right: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  errorMessage: {
    fontSize: '14px',
    color: APPLE_COLORS.RED,
    fontWeight: 500,
    paddingLeft: '4px',
    animation: 'fadeIn 300ms ease-out',
  },
} as const;