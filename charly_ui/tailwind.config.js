/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // Apple-quality design system integration
      colors: {
        // Primary colors (Apple Blue)
        primary: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          500: '#007AFF',
          600: '#0056CC',
          700: '#003D99',
          900: '#002966',
        },
        // Success (Apple Green)
        success: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          500: '#34C759',
          600: '#16A34A',
          700: '#15803D',
        },
        // Warning (Apple Orange)
        warning: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          500: '#FF9500',
          600: '#D97706',
          700: '#B45309',
        },
        // Danger (Apple Red)
        danger: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          500: '#FF3B30',
          600: '#DC2626',
          700: '#B91C1C',
        },
        // Enhanced neutral system
        neutral: {
          0: '#FFFFFF',
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
          950: '#030712',
        },
        // Background system
        background: {
          primary: '#FFFFFF',
          secondary: '#F5F5F7',
          tertiary: '#F2F2F7',
          elevated: '#FFFFFF',
        },
        // Text hierarchy
        text: {
          primary: '#000000',
          secondary: '#8E8E93',
          tertiary: '#C7C7CC',
          inverse: '#FFFFFF',
          link: '#007AFF',
          placeholder: '#C7C7CC',
        },
        // Interactive states
        interactive: {
          hover: 'rgba(0, 122, 255, 0.1)',
          pressed: 'rgba(0, 122, 255, 0.2)',
          focus: '#007AFF',
          disabled: '#F2F2F7',
        },
      },
      // Apple-inspired typography
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'system-ui', 'sans-serif'],
        display: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'system-ui', 'sans-serif'],
        mono: ['SF Mono', 'Monaco', 'Consolas', 'monospace'],
      },
      // Apple's font size scale
      fontSize: {
        'display-large': ['3.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-medium': ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '600' }],
        'display-small': ['1.875rem', { lineHeight: '1.3', fontWeight: '600' }],
        'headline-large': ['2rem', { lineHeight: '1.25', fontWeight: '600' }],
        'headline-medium': ['1.75rem', { lineHeight: '1.3', fontWeight: '600' }],
        'headline-small': ['1.5rem', { lineHeight: '1.33', fontWeight: '600' }],
        'title-large': ['1.375rem', { lineHeight: '1.36', fontWeight: '500' }],
        'title-medium': ['1.125rem', { lineHeight: '1.44', fontWeight: '500' }],
        'title-small': ['1rem', { lineHeight: '1.5', fontWeight: '500' }],
        'body-large': ['1.0625rem', { lineHeight: '1.47', fontWeight: '400' }], // Apple's 17px
        'body-medium': ['1rem', { lineHeight: '1.5', fontWeight: '400' }],
        'body-small': ['0.875rem', { lineHeight: '1.57', fontWeight: '400' }],
        'label-large': ['0.875rem', { lineHeight: '1.57', fontWeight: '500' }],
        'label-medium': ['0.75rem', { lineHeight: '1.67', fontWeight: '500' }],
        'label-small': ['0.6875rem', { lineHeight: '1.64', fontWeight: '500' }],
        'caption': ['0.75rem', { lineHeight: '1.5', fontWeight: '400' }],
        'overline': ['0.625rem', { lineHeight: '1.6', letterSpacing: '0.05em', fontWeight: '500' }],
      },
      // Apple's subtle shadows
      boxShadow: {
        'apple-sm': '0px 1px 2px rgba(0, 0, 0, 0.04)',
        'apple-md': '0px 2px 10px rgba(0, 0, 0, 0.04)',
        'apple-lg': '0px 4px 16px rgba(0, 0, 0, 0.08)',
        'apple-xl': '0px 8px 32px rgba(0, 0, 0, 0.12)',
        'apple-2xl': '0px 16px 64px rgba(0, 0, 0, 0.16)',
        'apple-focus': '0px 0px 0px 3px rgba(0, 122, 255, 0.3)',
        'apple-focus-danger': '0px 0px 0px 3px rgba(255, 59, 48, 0.3)',
        'apple-inner': 'inset 0px 1px 2px rgba(0, 0, 0, 0.05)',
      },
      // Apple's transition timing
      transitionTimingFunction: {
        'apple': 'cubic-bezier(0.25, 0.1, 0.25, 1)',
        'apple-ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      // Apple's border radius preferences
      borderRadius: {
        'apple': '0.5rem',      // 8px - Apple's preferred radius
        'apple-lg': '0.75rem',  // 12px
        'apple-xl': '1rem',     // 16px
        'apple-2xl': '1.5rem',  // 24px
      },
      // Enhanced spacing for 64px grid system
      spacing: {
        '18': '4.5rem',  // 72px
        '22': '5.5rem',  // 88px
        '26': '6.5rem',  // 104px
        '30': '7.5rem',  // 120px
        '34': '8.5rem',  // 136px
        '38': '9.5rem',  // 152px
        '42': '10.5rem', // 168px
        '46': '11.5rem', // 184px
        '50': '12.5rem', // 200px
      },
      // Animation keyframes
      keyframes: {
        'fade-in-apple': {
          '0%': { opacity: '0', transform: 'translateY(-8px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'gentle-bounce': {
          '0%, 20%, 53%, 80%, 100%': { transform: 'translate3d(0, 0, 0)' },
          '40%, 43%': { transform: 'translate3d(0, -4px, 0)' },
          '70%': { transform: 'translate3d(0, -2px, 0)' },
          '90%': { transform: 'translate3d(0, -1px, 0)' },
        },
      },
      // Animation classes
      animation: {
        'fade-in-apple': 'fade-in-apple 300ms cubic-bezier(0.25, 0.1, 0.25, 1)',
        'slide-in-right': 'slide-in-right 300ms cubic-bezier(0, 0, 0.2, 1)',
        'scale-in': 'scale-in 150ms cubic-bezier(0, 0, 0.2, 1)',
        'gentle-bounce': 'gentle-bounce 1s cubic-bezier(0.25, 0.1, 0.25, 1)',
      },
    },
  },
  plugins: [],
};