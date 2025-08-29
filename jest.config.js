module.exports = {
  // Test environment
  testEnvironment: 'jsdom',
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/test-setup.js'],
  
  // Test file patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/tests/**/*.spec.js'
  ],
  
  // Module paths
  roots: ['<rootDir>/js', '<rootDir>/tests'],
  
  // Coverage configuration
  collectCoverageFrom: [
    'js/**/*.js',
    '!js/main.js', // Entry point, covered by integration tests
    '!js/**/*.config.js'
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    // Component-specific thresholds
    'js/game.js': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    'js/board.js': {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90
    },
    'js/tetromino.js': {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90
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