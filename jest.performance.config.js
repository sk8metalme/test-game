export default {
  // Test environment
  testEnvironment: 'jest-environment-jsdom',
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/test-setup.js'],
  
  // Test file patterns - Only performance tests
  testMatch: [
    '<rootDir>/tests/performance/**/*.test.js'
  ],
  
  // Module paths
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  
  // Coverage configuration - Disabled for performance tests
  collectCoverage: false,
  
  // Transform configuration for ES6 modules
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  
  // Mock configuration
  clearMocks: true,
  restoreMocks: true,
  
  // Test timeout - Extended for performance tests
  testTimeout: 30000,
  
  // Verbose output - Enabled for performance analysis
  verbose: true,
  
  // Performance optimizations
  maxWorkers: 1, // Sequential execution for accurate timing
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
