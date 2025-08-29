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
  
  // Coverage thresholds - Enhanced for TODAY-003
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95
    },
    // Individual file thresholds
    'src/core/entities/Board.js': {
      branches: 95,
      functions: 100,
      lines: 98,
      statements: 98
    },
    'src/core/entities/Tetromino.js': {
      branches: 95,
      functions: 100,
      lines: 98,
      statements: 98
    }
  },
  
  // Coverage reporting - Enhanced for TODAY-003
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'text-summary', 
    'lcov', 
    'html',
    'json',
    'clover'
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