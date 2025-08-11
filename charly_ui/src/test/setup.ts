// Apple-Standard QA Test Setup
import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll, vi } from 'vitest'

// Setup jest-axe for accessibility testing
import { toHaveNoViolations } from 'jest-axe'
expect.extend(toHaveNoViolations)

// Global cleanup after each test
afterEach(() => {
  cleanup()
})

// Global mocks for browser APIs
beforeAll(() => {
  // Mock localStorage
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    },
    writable: true,
  })

  // Mock sessionStorage
  Object.defineProperty(window, 'sessionStorage', {
    value: {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    },
    writable: true,
  })

  // Mock matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })

  // Mock IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
    root: null,
    rootMargin: '',
    thresholds: [],
  }))

  // Mock ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))

  // Mock Canvas for charts
  HTMLCanvasElement.prototype.getContext = vi.fn()

  // Mock URL.createObjectURL for file operations
  global.URL.createObjectURL = vi.fn(() => 'mocked-url')
  global.URL.revokeObjectURL = vi.fn()

  // Mock File API
  global.File = class MockFile extends Blob {
    name: string;
    lastModified: number;
    
    constructor(fileBits: BlobPart[], fileName: string, options: FilePropertyBag = {}) {
      super(fileBits, options);
      this.name = fileName;
      this.lastModified = options.lastModified || Date.now();
    }
  } as unknown as typeof File

  // Mock FileReader
  global.FileReader = class MockFileReader {
    readAsText = vi.fn()
    readAsDataURL = vi.fn()
    readAsArrayBuffer = vi.fn()
    result: string | ArrayBuffer | null = null
    error: DOMException | null = null
    onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => unknown) | null = null
    onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => unknown) | null = null
    readyState = 0
    
    static readonly EMPTY = 0
    static readonly LOADING = 1
    static readonly DONE = 2
    onabort = null
    onloadstart = null
    onloadend = null
    onprogress = null
    addEventListener = vi.fn()
    removeEventListener = vi.fn()
    dispatchEvent = vi.fn()
    abort = vi.fn()
    EMPTY = 0
    LOADING = 1
    DONE = 2
    readyState = 0
  } as Partial<XMLHttpRequest>

  // Mock fetch
  global.fetch = vi.fn()

  // Mock window.location
  delete (window as unknown as Record<string, unknown>).location
  window.location = {
    href: 'http://localhost:5173',
    origin: 'http://localhost:5173',
    protocol: 'http:',
    host: 'localhost:5173',
    hostname: 'localhost',
    port: '5173',
    pathname: '/',
    search: '',
    hash: '',
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn(),
  } as Partial<Location>
})

// Global error handler for uncaught errors in tests
window.addEventListener('error', (event) => {
  console.error('Uncaught error in test:', event.error)
})

// Global promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection in test:', event.reason)
})

// Console override for test environment
const originalError = console.error
console.error = (...args: unknown[]) => {
  // Filter out known non-critical React warnings in test environment
  const message = args[0]
  if (
    typeof message === 'string' &&
    (message.includes('Warning: ReactDOM.render is deprecated') ||
     message.includes('Warning: Each child in a list should have a unique "key" prop'))
  ) {
    return
  }
  originalError(...args)
}