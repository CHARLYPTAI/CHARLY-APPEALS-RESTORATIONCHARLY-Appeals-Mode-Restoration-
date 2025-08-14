/**
 * Simple Jest Configuration for Mathematical Validation
 * Focused on core calculation testing without complex dependencies
 */

export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  // Focus only on mathematical validation tests
  testMatch: [
    '**/src/validation/**/*.test.ts'
  ],
  
  // TypeScript transformation
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'js'],
  
  // Coverage settings for mathematical accuracy
  collectCoverageFrom: [
    'src/validation/**/*.ts',
    '!src/validation/**/*.test.ts'
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Reporter configuration
  reporters: [
    'default',
    ['jest-junit', { 
      outputDirectory: 'test-results',
      outputName: 'mathematical-validation.xml'
    }]
  ],
  
  // Verbose output to see mathematical calculations
  verbose: true,
  
  // Timeout for mathematical calculations
  testTimeout: 10000
};