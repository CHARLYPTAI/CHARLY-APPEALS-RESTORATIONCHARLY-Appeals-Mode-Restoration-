import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80
      }
    },
    alias: {
      '@charly/llm-router': new URL('./src/test/__mocks__/@charly/llm-router.ts', import.meta.url).pathname,
      '@charly/contracts': new URL('./src/test/__mocks__/@charly/contracts.ts', import.meta.url).pathname
    }
  }
});