module.exports = {
  // Test environment
  testEnvironment: 'jest-environment-jsdom',
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/test-setup.js'],
  
  // Test file patterns - Include performance tests for optimization
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/tests/**/*.spec.js'
  ],
  
  // Test path ignore patterns - Temporarily include performance tests
  testPathIgnorePatterns: [
    // '<rootDir>/tests/performance/', // 一時的にコメントアウト
    '<rootDir>/node_modules/',
    // CI環境でのE2Eテスト除外
    ...(process.env.CI ? ['<rootDir>/tests/e2e/'] : [])
  ],
  
  // Module paths - updated for new structure
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  
  // Coverage configuration - optimized for performance
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/main.js',
    '!src/**/*.config.js'
  ],
  
  // Coverage thresholds - Adjusted to realistic values
  coverageThreshold: {
    global: {
      branches: 65,
      functions: 75,
      lines: 75,
      statements: 75
    }
  },
  
  // Coverage reporting - Optimized for performance
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text-summary',
    'lcov'
  ],
  
  // Coverage pathIgnorePatterns
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/',
    '/coverage/',
    '/.git/'
  ],
  
  // Transform configuration for ES6 modules
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  
  // Mock configuration
  clearMocks: true,
  restoreMocks: true,
  
  // Test timeout - Increased for performance tests
  testTimeout: 10000,
  
  // Verbose output - Enabled for performance analysis
  verbose: true,
  
  // Performance optimizations
  maxWorkers: '50%',
  bail: false,
  
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