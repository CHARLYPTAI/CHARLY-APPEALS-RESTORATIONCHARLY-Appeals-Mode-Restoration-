// LOC_CATEGORY: interface
import type { Preview } from '@storybook/react-vite';
import { ConfigProvider } from 'antd';
import React from 'react';

import { charlyTheme, charlyDarkTheme } from '../src/design-system/theme';
import { designTokens } from '../src/design-system/tokens';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    docs: {
      theme: charlyTheme,
    },
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: designTokens.colors.background.default,
        },
        {
          name: 'dark',
          value: designTokens.colors.neutral[900],
        },
        {
          name: 'subtle',
          value: designTokens.colors.background.subtle,
        },
      ],
    },
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: {
            width: '375px',
            height: '667px',
          },
        },
        tablet: {
          name: 'Tablet',
          styles: {
            width: '768px',
            height: '1024px',
          },
        },
        desktop: {
          name: 'Desktop',
          styles: {
            width: '1920px',
            height: '1080px',
          },
        },
      },
    },
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true,
          },
          {
            id: 'focus-order-semantics',
            enabled: true,
          },
          {
            id: 'keyboard',
            enabled: true,
          },
        ],
      },
    },
  },
  decorators: [
    (Story, context) => {
      const isDark = context.globals.theme === 'dark';
      const theme = isDark ? charlyDarkTheme : charlyTheme;

      return React.createElement(ConfigProvider, { theme }, React.createElement(Story));
    },
  ],
  globalTypes: {
    theme: {
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'light', icon: 'circlehollow', title: 'Light' },
          { value: 'dark', icon: 'circle', title: 'Dark' },
        ],
        showName: true,
        dynamicTitle: true,
      },
    },
  },
};

export default preview;
