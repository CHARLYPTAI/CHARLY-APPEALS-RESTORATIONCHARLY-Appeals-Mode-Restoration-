/**
 * Production Jest Configuration for CHARLY
 * Tests core functionality with proper coverage
 */

export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  
  // Focus on production-relevant tests
  testMatch: [
    '**/src/validation/**/*.test.ts',
    '**/src/**/*.production.test.ts'
  ],
  
  // TypeScript transformation
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  
  // Module name mapping for production assets
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  
  // Coverage settings for production-ready components
  collectCoverageFrom: [
    'src/validation/**/*.ts',
    'src/App.simple.tsx',
    'src/main.simple.tsx',
    'src/design-system/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/*.test.tsx'
  ],
  
  // Coverage thresholds for production
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup/setupTests.ts'],
  
  // Reporter configuration
  reporters: [
    'default',
    ['jest-junit', { 
      outputDirectory: 'test-results',
      outputName: 'production-validation.xml'
    }]
  ],
  
  // Verbose output
  verbose: true,
  
  // Timeout for tests
  testTimeout: 15000,
  
  // Clear mocks
  clearMocks: true
};