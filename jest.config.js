export default {
  // Test environment
  testEnvironment: 'jest-environment-jsdom',
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/test-setup.js'],
  
  // Test file patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/tests/**/*.spec.js'
  ],
  
  // Module paths - updated for new structure
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  
  // Coverage configuration - updated for new structure
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/main.js',
    '!src/**/*.config.js'
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
  
  // Coverage reporting
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Transform configuration for ES6 modules
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  
  // Mock configuration
  clearMocks: true,
  restoreMocks: true,
  
  // Test timeout
  testTimeout: 10000,
  
  // Verbose output for debugging
  verbose: true,
  
  // Global test variables
  globals: {
    'GAME_CONFIG': {
      BOARD_WIDTH: 10,
      BOARD_HEIGHT: 20,
      CANVAS_WIDTH: 400,
      CANVAS_HEIGHT: 800
    }
  }
};