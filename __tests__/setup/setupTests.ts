// LOC_CATEGORY: interface
import '@testing-library/jest-dom';
import { cleanup, waitFor, screen } from '@testing-library/react';
import { toHaveNoViolations } from 'jest-axe';
// MSW imports removed due to module resolution issues
// import { server } from '../api/handlers/server';
// import { mockFetch } from '../api/handlers/server-simple';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
class IntersectionObserverMock {
  observe = jest.fn();
  disconnect = jest.fn();
  unobserve = jest.fn();
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: IntersectionObserverMock,
});

// Mock ResizeObserver
class ResizeObserverMock {
  observe = jest.fn();
  disconnect = jest.fn();
  unobserve = jest.fn();
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  configurable: true,
  value: ResizeObserverMock,
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: localStorageMock,
});

// Mock Response constructor for JSDOM
const MockedResponse = jest.fn().mockImplementation((body: unknown, init?: ResponseInit) => ({
  ok: (init?.status ?? 200) >= 200 && (init?.status ?? 200) < 300,
  status: init?.status ?? 200,
  statusText: init?.statusText ?? 'OK',
  headers: new Map(),
  json: () => Promise.resolve(typeof body === 'string' ? JSON.parse(body) : body),
  text: () => Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body)),
  blob: () => Promise.resolve(new Blob([typeof body === 'string' ? body : JSON.stringify(body)])),
  arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
  url: '',
  redirected: false,
  type: 'basic',
  clone: jest.fn(),
}));

// Add static methods to the mock
type MockedResponseClass = typeof MockedResponse & {
  error: jest.Mock;
  json: jest.Mock;
  redirect: jest.Mock;
};

(MockedResponse as MockedResponseClass).error = jest.fn(() => ({ ok: false, status: 500 }));
(MockedResponse as MockedResponseClass).json = jest.fn(
  (data: unknown) => new MockedResponse(JSON.stringify(data))
);
(MockedResponse as MockedResponseClass).redirect = jest.fn((url: string) => ({
  ok: true,
  url,
  redirected: true,
}));

(global as typeof globalThis).Response = MockedResponse as unknown as typeof Response;

// Simple mock fetch without MSW dependencies
global.fetch = jest.fn().mockImplementation((url: string, options?: RequestInit) => {
  // Login endpoint
  if (url.includes('/auth/login')) {
    const body = options?.body;
    let credentials;

    if (body instanceof FormData) {
      credentials = {
        username: body.get('username'),
        password: body.get('password'),
      };
    } else if (typeof body === 'string') {
      try {
        credentials = JSON.parse(body);
      } catch {
        credentials = {};
      }
    }

    if (credentials?.username === 'admin' && credentials?.password === 'secret') {
      return Promise.resolve(
        new (global.Response as typeof Response)(
          JSON.stringify({
            access_token: 'mock-token-123',
            token_type: 'bearer',
            user: { username: 'admin', role: 'admin' },
          }),
          { status: 200 }
        )
      );
    }

    return Promise.resolve(
      new (global.Response as typeof Response)(
        JSON.stringify({
          detail: 'Invalid credentials',
        }),
        { status: 401 }
      )
    );
  }

  if (url.includes('/sample-properties')) {
    return Promise.resolve(
      new (global.Response as typeof Response)(
        JSON.stringify([
          {
            account_number: '123456789',
            property_address: '123 Test St, Dallas, TX',
            market_value: 250000,
            assessed_value: 275000,
            flag_status: 'Over-assessed',
          },
        ]),
        { status: 200 }
      )
    );
  }

  if (url.includes('/upload')) {
    return Promise.resolve(
      new (global.Response as typeof Response)(
        JSON.stringify({
          success: true,
          filename: 'test.csv',
          records_processed: 100,
          flagged_properties: 25,
        }),
        { status: 200 }
      )
    );
  }

  if (url.includes('/analytics')) {
    return Promise.resolve(
      new (global.Response as typeof Response)(
        JSON.stringify({
          totalProperties: 1000,
          flaggedProperties: 250,
          averageSavings: 15000,
        }),
        { status: 200 }
      )
    );
  }

  return Promise.resolve(new (global.Response as typeof Response)('Not found', { status: 404 }));
});

// Performance timing helpers
global.performance.mark = jest.fn();
global.performance.measure = jest.fn();
global.performance.getEntriesByName = jest.fn(
  () =>
    [
      {
        duration: 100,
        entryType: 'measure',
        name: 'test',
        startTime: 0,
        toJSON: () => ({}),
      },
    ] as PerformanceEntryList
);

// Establish API mocking before all tests
beforeAll(() => {
  // server.listen({ onUnhandledRequest: 'warn' });
});

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests
afterEach(() => {
  // server.resetHandlers();
  cleanup();
  jest.clearAllMocks();
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
});

// Clean up after the tests are finished
afterAll(() => {
  // server.close();
});

// Suppress console errors during tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render') ||
        args[0].includes('Warning: An invalid form control') ||
        args[0].includes('Warning: Failed prop type'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Custom test utilities
export const waitForLoadingToFinish = () =>
  waitFor(() => {
    const loadingElements = screen.queryAllByText(/loading/i);
    expect(loadingElements).toHaveLength(0);
  });
