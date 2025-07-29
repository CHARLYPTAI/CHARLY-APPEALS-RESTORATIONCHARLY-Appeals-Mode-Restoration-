// LOC_CATEGORY: interface
import React, { ReactElement } from 'react';
import { render, RenderOptions, RenderResult, screen } from '@testing-library/react';
import { ConfigProvider } from 'antd';
import type {
  User,
  Property,
  TestResponse,
  UserEventMock,
  AccessibilityOptions,
} from '../../src/types/api';

// Types
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  user?: { username: string; role: string; email?: string };
  initialRoute?: string;
  viewport?: { width: number; height: number };
}

interface ProvidersProps {
  children: React.ReactNode;
  user?: User | undefined;
}

// Mock providers wrapper
/* eslint-disable react-refresh/only-export-components */
const AllTheProviders: React.FC<ProvidersProps> = ({ children }) => {
  // Mock authentication context is available but not used in this simple provider

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
};

// Custom render function
export const renderWithProviders = (
  ui: ReactElement,
  options?: CustomRenderOptions
): RenderResult => {
  const { user, viewport, ...renderOptions } = options || {};

  // Set viewport if specified
  if (viewport) {
    window.innerWidth = viewport.width;
    window.innerHeight = viewport.height;
    window.dispatchEvent(new Event('resize'));
  }

  return render(ui, {
    wrapper: ({ children }) => <AllTheProviders user={user}>{children}</AllTheProviders>,
    ...renderOptions,
  });
};

// Performance measurement helpers
export const measureRenderTime = async (
  component: ReactElement,
  options?: CustomRenderOptions
): Promise<number> => {
  const startTime = performance.now();
  renderWithProviders(component, options);
  const endTime = performance.now();
  return endTime - startTime;
};

// Accessibility helpers
export const checkAccessibility = async (
  container: HTMLElement,
  options?: AccessibilityOptions
) => {
  const { axe } = await import('jest-axe');
  const results = await axe(container, options);
  return results;
};

// Mock data generators
export const createMockUser = (overrides?: Partial<User>): User => ({
  username: 'testuser',
  role: 'Admin',
  email: 'test@example.com',
  dashboard_layout: {},
  ...overrides,
});

export const createMockProperty = (overrides?: Partial<Property>): Property => ({
  account_number: '123456789',
  property_address: '123 Test St, Dallas, TX 75201',
  current_assessed_value: 500000,
  market_value: 525000,
  property_type: 'Commercial',
  jurisdiction: 'Dallas County, TX',
  flag_status: 'Over-assessed',
  appeal_potential: 'High',
  ...overrides,
});

// Viewport presets
export const viewports = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1920, height: 1080 },
};

// Wait helpers
export const waitForElementToBeRemoved = async (
  callback: () => HTMLElement | null,
  options = { timeout: 5000 }
) => {
  const startTime = Date.now();
  while (callback() && Date.now() - startTime < options.timeout) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  if (callback()) {
    throw new Error('Element was not removed within timeout');
  }
};

// Form helpers
export const fillForm = async (user: UserEventMock, formData: Record<string, string | number>) => {
  for (const [fieldName, value] of Object.entries(formData)) {
    const field = screen.getByLabelText(fieldName);
    await user.clear(field);
    await user.type(field, value.toString());
  }
};

// API response helpers
export const createSuccessResponse = (data: unknown): TestResponse => ({
  ok: true,
  status: 200,
  json: async () => data,
  text: async () => JSON.stringify(data),
  headers: new Headers({ 'content-type': 'application/json' }),
});

export const createErrorResponse = (status: number, message: string): TestResponse => ({
  ok: false,
  status,
  json: async () => ({ error: message }),
  text: async () => message,
  headers: new Headers({ 'content-type': 'application/json' }),
});

// Drag and drop helpers
export const mockDragAndDrop = (sourceElement: HTMLElement, targetElement: HTMLElement) => {
  const dataTransfer = {
    data: {} as Record<string, string>,
    setData: function (key: string, value: string) {
      this.data[key] = value;
    },
    getData: function (key: string) {
      return this.data[key];
    },
  };

  const dragStartEvent = new DragEvent('dragstart', {
    bubbles: true,
    cancelable: true,
    dataTransfer: dataTransfer as unknown as DataTransfer,
  });

  const dragOverEvent = new DragEvent('dragover', {
    bubbles: true,
    cancelable: true,
    dataTransfer: dataTransfer as unknown as DataTransfer,
  });

  const dropEvent = new DragEvent('drop', {
    bubbles: true,
    cancelable: true,
    dataTransfer: dataTransfer as unknown as DataTransfer,
  });

  sourceElement.dispatchEvent(dragStartEvent);
  targetElement.dispatchEvent(dragOverEvent);
  targetElement.dispatchEvent(dropEvent);
};

// Re-export everything from Testing Library
/* eslint-disable react-refresh/only-export-components */
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
