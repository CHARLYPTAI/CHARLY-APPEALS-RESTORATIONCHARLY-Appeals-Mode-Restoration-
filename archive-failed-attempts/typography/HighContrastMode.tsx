import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// import { useTypography } from './TypographyProvider';

interface HighContrastTheme {
  background: string;
  foreground: string;
  accent: string;
  border: string;
  focus: string;
  selection: string;
  link: string;
  visited: string;
  error: string;
  success: string;
  warning: string;
}

interface HighContrastModeProps {
  children: React.ReactNode;
  autoDetect?: boolean;
  theme?: 'dark' | 'light' | 'yellow' | 'blue' | 'custom';
  customTheme?: Partial<HighContrastTheme>;
  className?: string;
  style?: React.CSSProperties;
}

const HighContrastMode: React.FC<HighContrastModeProps> = ({
  children,
  autoDetect = true,
  theme = 'dark',
  customTheme = {},
  className = '',
  style = {},
}) => {
  // const { } = useTypography(); // eslint-disable-line @typescript-eslint/no-empty-pattern
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<HighContrastTheme | null>(null);
  const [userPreference, setUserPreference] = useState<string | null>(null);

  const themes: Record<string, HighContrastTheme> = useMemo(() => ({
    dark: {
      background: '#000000',
      foreground: '#ffffff',
      accent: '#ffff00',
      border: '#ffffff',
      focus: '#00ff00',
      selection: '#0078d4',
      link: '#ffffff',
      visited: '#d4d4d4',
      error: '#ff0000',
      success: '#00ff00',
      warning: '#ffff00',
    },
    light: {
      background: '#ffffff',
      foreground: '#000000',
      accent: '#0000ff',
      border: '#000000',
      focus: '#ff0000',
      selection: '#0078d4',
      link: '#0000ff',
      visited: '#800080',
      error: '#ff0000',
      success: '#008000',
      warning: '#ff8c00',
    },
    yellow: {
      background: '#000000',
      foreground: '#ffff00',
      accent: '#ffffff',
      border: '#ffff00',
      focus: '#00ff00',
      selection: '#ffffff',
      link: '#ffff00',
      visited: '#ffff80',
      error: '#ff0000',
      success: '#00ff00',
      warning: '#ffa500',
    },
    blue: {
      background: '#000080',
      foreground: '#ffffff',
      accent: '#ffff00',
      border: '#ffffff',
      focus: '#00ff00',
      selection: '#add8e6',
      link: '#ffffff',
      visited: '#d4d4d4',
      error: '#ff0000',
      success: '#00ff00',
      warning: '#ffff00',
    },
  }), []);

  const detectHighContrastPreference = useCallback(() => {
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
    const prefersMore = window.matchMedia('(prefers-contrast: more)').matches;
    const forcedColors = window.matchMedia('(forced-colors: active)').matches;
    
    const shouldActivate = prefersHighContrast || prefersMore || forcedColors;
    setIsHighContrast(shouldActivate);
    
    if (shouldActivate) {
      const savedTheme = localStorage.getItem('high-contrast-theme');
      setUserPreference(savedTheme || theme);
    }
  }, [theme]);

  const createCustomTheme = useCallback((): HighContrastTheme => {
    const baseTheme = themes[theme] || themes.dark;
    return { ...baseTheme, ...customTheme };
  }, [theme, customTheme, themes]);

  const applyHighContrastTheme = useCallback((themeName: string) => {
    const selectedTheme = themes[themeName] || createCustomTheme();
    setCurrentTheme(selectedTheme);
    
    const root = document.documentElement;
    Object.entries(selectedTheme).forEach(([key, value]) => {
      root.style.setProperty(`--hc-${key}`, value);
    });
    
    root.style.setProperty('--hc-text-shadow', 'none');
    root.style.setProperty('--hc-box-shadow', 'none');
    root.style.setProperty('--hc-border-radius', '0');
    root.style.setProperty('--hc-transition', 'none');
    
    localStorage.setItem('high-contrast-theme', themeName);
  }, [createCustomTheme, themes]);

  const removeHighContrastTheme = useCallback(() => {
    setCurrentTheme(null);
    
    const root = document.documentElement;
    const properties = [
      '--hc-background', '--hc-foreground', '--hc-accent', '--hc-border',
      '--hc-focus', '--hc-selection', '--hc-link', '--hc-visited',
      '--hc-error', '--hc-success', '--hc-warning',
      '--hc-text-shadow', '--hc-box-shadow', '--hc-border-radius', '--hc-transition',
    ];
    
    properties.forEach(prop => root.style.removeProperty(prop));
    localStorage.removeItem('high-contrast-theme');
  }, []);

  const toggleHighContrast = useCallback(() => {
    setIsHighContrast(prev => !prev);
  }, []);

  const switchTheme = useCallback((newTheme: string) => {
    setUserPreference(newTheme);
    if (isHighContrast) {
      applyHighContrastTheme(newTheme);
    }
  }, [isHighContrast, applyHighContrastTheme]);

  useEffect(() => {
    if (autoDetect) {
      detectHighContrastPreference();
      
      const mediaQueries = [
        window.matchMedia('(prefers-contrast: high)'),
        window.matchMedia('(prefers-contrast: more)'),
        window.matchMedia('(forced-colors: active)'),
      ];
      
      const handleChange = () => detectHighContrastPreference();
      
      mediaQueries.forEach(mq => mq.addEventListener('change', handleChange));
      
      return () => {
        mediaQueries.forEach(mq => mq.removeEventListener('change', handleChange));
      };
    }
  }, [autoDetect, detectHighContrastPreference]);

  useEffect(() => {
    if (isHighContrast) {
      applyHighContrastTheme(userPreference || theme);
    } else {
      removeHighContrastTheme();
    }
  }, [isHighContrast, userPreference, theme, applyHighContrastTheme, removeHighContrastTheme]);

  const highContrastStyles: React.CSSProperties = isHighContrast && currentTheme ? {
    backgroundColor: currentTheme.background,
    color: currentTheme.foreground,
    borderColor: currentTheme.border,
    textShadow: 'none',
    boxShadow: 'none',
    borderRadius: '0',
    outline: `2px solid ${currentTheme.focus}`,
    outlineOffset: '2px',
    transition: 'none',
    ...style,
  } : style;

  return (
    <motion.div
      className={`high-contrast-mode ${isHighContrast ? 'active' : 'inactive'} ${className}`}
      style={highContrastStyles}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {children}
      
      {process.env.NODE_ENV === 'development' && (
        <div className="high-contrast-controls" style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          zIndex: 9999,
          background: isHighContrast ? currentTheme?.background : '#000',
          color: isHighContrast ? currentTheme?.foreground : '#fff',
          padding: '8px',
          borderRadius: '4px',
          fontSize: '12px',
        }}>
          <button
            onClick={toggleHighContrast}
            style={{
              background: 'none',
              border: '1px solid',
              color: 'inherit',
              padding: '4px 8px',
              margin: '2px',
              cursor: 'pointer',
            }}
          >
            {isHighContrast ? 'Disable' : 'Enable'} High Contrast
          </button>
          
          {isHighContrast && (
            <div style={{ marginTop: '8px' }}>
              <label style={{ display: 'block', marginBottom: '4px' }}>Theme:</label>
              <select
                value={userPreference || theme}
                onChange={(e) => switchTheme(e.target.value)}
                style={{
                  background: currentTheme?.background,
                  color: currentTheme?.foreground,
                  border: `1px solid ${currentTheme?.border}`,
                  padding: '2px 4px',
                }}
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="yellow">Yellow</option>
                <option value="blue">Blue</option>
              </select>
            </div>
          )}
        </div>
      )}
      
      <AnimatePresence>
        {isHighContrast && (
          <motion.div
            className="high-contrast-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: 'none',
              zIndex: -1,
              background: currentTheme?.background,
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};


export default HighContrastMode;