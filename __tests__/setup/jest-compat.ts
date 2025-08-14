// LOC_CATEGORY: interface
import { vi } from 'vitest';

// Create jest compatibility layer
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).jest = {
  fn: vi.fn,
  spyOn: vi.spyOn,
  clearAllMocks: vi.clearAllMocks,
  resetAllMocks: vi.resetAllMocks,
  restoreAllMocks: vi.restoreAllMocks,
  mocked: vi.mocked,
  unmock: vi.unmock,
  mock: vi.mock,
  doMock: vi.doMock,
  isolateModules: vi.isolateModules,
  // Add more jest methods as needed
};
