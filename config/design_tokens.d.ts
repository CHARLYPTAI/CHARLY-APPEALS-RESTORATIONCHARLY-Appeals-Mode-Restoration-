// LOC_CATEGORY: interface
export declare const designTokens: {
  colors: {
    primary: Record<string, string>;
    secondary: Record<string, string>;
    neutral: Record<string, string>;
    semantic: {
      success: { light: string; DEFAULT: string; dark: string; };
      warning: { light: string; DEFAULT: string; dark: string; };
      error: { light: string; DEFAULT: string; dark: string; };
      info: { light: string; DEFAULT: string; dark: string; };
    };
    brand: Record<string, string>;
    background: Record<string, string>;
    text: Record<string, string>;
    border: Record<string, string>;
  };
  typography: {
    fontFamily: Record<string, string[]>;
    fontSize: Record<string, [string, { lineHeight: string; letterSpacing: string; }]>;
    fontWeight: Record<string, string>;
    lineHeight: Record<string, string>;
    letterSpacing: Record<string, string>;
  };
  spacing: Record<string, string>;
  animation: {
    easing: Record<string, string>;
    duration: Record<string, string>;
  };
  shadows: Record<string, string> & {
    elevation: Record<string, string>;
  };
  borderRadius: Record<string, string>;
  zIndex: Record<string, string>;
  screens: Record<string, string>;
  components: Record<string, any>;
  accessibility: Record<string, any>;
  darkMode: {
    colors: {
      background: Record<string, string>;
      text: Record<string, string>;
      border: Record<string, string>;
    };
  };
};