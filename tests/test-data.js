/**
 * Test Data and Scenarios
 * Provides predefined test data for consistent testing across components
 */

// Tetromino shape definitions for testing
export const TETROMINO_SHAPES = {
  I: [[1, 1, 1, 1]],
  O: [
    [1, 1],
    [1, 1],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
  ],
};

// Expected colors for each tetromino type
export const TETROMINO_COLORS = {
  I: '#00FFFF', // Cyan
  O: '#FFFF00', // Yellow
  T: '#800080', // Purple
  S: '#00FF00', // Green
  Z: '#FF0000', // Red
  J: '#0000FF', // Blue
  L: '#FFA500', // Orange
};

// Test board configurations
export const BOARD_SCENARIOS = {
  // Completely empty board
  EMPTY: Array(20)
    .fill(null)
    .map(() => Array(10).fill(0)),

  // Board with bottom row completely filled (single line clear)
  SINGLE_LINE: (() => {
    const board = Array(20)
      .fill(null)
      .map(() => Array(10).fill(0));
    for (let col = 0; col < 10; col++) {
      board[19][col] = 1;
    }
    return board;
  })(),

  // Board setup for Tetris (4-line clear)
  TETRIS_SETUP: (() => {
    const board = Array(20)
      .fill(null)
      .map(() => Array(10).fill(0));
    for (let row = 16; row < 20; row++) {
      for (let col = 0; col < 9; col++) {
        // Leave rightmost column empty
        board[row][col] = Math.floor(Math.random() * 7) + 1;
      }
    }
    return board;
  })(),

  // Near game over situation
  NEAR_GAME_OVER: (() => {
    const board = Array(20)
      .fill(null)
      .map(() => Array(10).fill(0));
    for (let row = 0; row < 18; row++) {
      for (let col = 0; col < 10; col++) {
        if (Math.random() > 0.4) {
          board[row][col] = Math.floor(Math.random() * 7) + 1;
        }
      }
    }
    return board;
  })(),

  // Board with scattered filled cells
  SCATTERED: (() => {
    const board = Array(20)
      .fill(null)
      .map(() => Array(10).fill(0));
    for (let row = 10; row < 20; row++) {
      for (let col = 0; col < 10; col++) {
        if (Math.random() > 0.7) {
          board[row][col] = Math.floor(Math.random() * 7) + 1;
        }
      }
    }
    return board;
  })(),

  // T-spin setup scenario
  T_SPIN_SETUP: (() => {
    const board = Array(20)
      .fill(null)
      .map(() => Array(10).fill(0));
    // Create T-spin opportunity
    const pattern = [
      [1, 1, 0, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ];

    pattern.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        board[17 + rowIndex][colIndex] = cell;
      });
    });

    return board;
  })(),
};

// Scoring test scenarios
export const SCORING_SCENARIOS = {
  SINGLE_LINE: {
    linesCleared: 1,
    level: 1,
    expectedScore: 100,
    description: 'Single line clear at level 1',
  },
  DOUBLE_LINE: {
    linesCleared: 2,
    level: 1,
    expectedScore: 300,
    description: 'Double line clear at level 1',
  },
  TRIPLE_LINE: {
    linesCleared: 3,
    level: 1,
    expectedScore: 500,
    description: 'Triple line clear at level 1',
  },
  TETRIS: {
    linesCleared: 4,
    level: 1,
    expectedScore: 800,
    description: 'Tetris (4 lines) at level 1',
  },
  LEVEL_MULTIPLIER: {
    linesCleared: 1,
    level: 5,
    expectedScore: 500, // 100 * 5
    description: 'Single line at level 5 (with multiplier)',
  },
  SOFT_DROP: {
    cells: 10,
    expectedScore: 10, // 1 point per cell
    description: 'Soft drop 10 cells',
  },
  HARD_DROP: {
    cells: 15,
    expectedScore: 30, // 2 points per cell
    description: 'Hard drop 15 cells',
  },
};

// Input sequences for testing
export const INPUT_SEQUENCES = {
  // Basic movement sequence
  BASIC_MOVEMENT: ['ArrowLeft', 'ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowDown'],

  // Rotation sequence
  ROTATION_TEST: [
    'ArrowUp',
    'ArrowUp',
    'ArrowUp',
    'ArrowUp', // Full rotation
  ],

  // Complex gameplay sequence
  COMPLEX_GAMEPLAY: [
    'ArrowLeft',
    'ArrowUp',
    'ArrowRight',
    'ArrowRight',
    'ArrowDown',
    'ArrowDown',
    ' ',
    'ArrowLeft',
    'ArrowUp',
  ],

  // Rapid input test
  RAPID_INPUT: [
    'ArrowLeft',
    'ArrowLeft',
    'ArrowLeft',
    'ArrowRight',
    'ArrowRight',
    'ArrowUp',
    'ArrowUp',
    ' ',
  ],

  // Game control sequence
  GAME_CONTROLS: [
    ' ',
    'KeyP',
    'KeyP',
    'KeyR', // Start, Pause, Unpause, Restart
  ],
};

// Performance test data
export const PERFORMANCE_BENCHMARKS = {
  TARGET_FPS: 60,
  MAX_FRAME_TIME: 16.67, // milliseconds (1000/60)
  MAX_INPUT_LATENCY: 16, // milliseconds
  MAX_COLLISION_TIME: 1, // milliseconds
  MAX_RENDER_TIME: 10, // milliseconds
  MAX_MEMORY_USAGE: 50 * 1024 * 1024, // 50MB in bytes

  // Test iterations for performance tests
  PERFORMANCE_ITERATIONS: {
    COLLISION_DETECTION: 1000,
    LINE_CLEARING: 100,
    RENDERING: 60,
    INPUT_PROCESSING: 1000,
  },
};

// Game state scenarios
export const GAME_STATE_SCENARIOS = {
  INITIAL_STATE: {
    gameState: 'MENU',
    score: 0,
    level: 1,
    linesCleared: 0,
    isPaused: false,
  },

  ACTIVE_GAME: {
    gameState: 'PLAYING',
    score: 1500,
    level: 2,
    linesCleared: 15,
    isPaused: false,
  },

  PAUSED_GAME: {
    gameState: 'PAUSED',
    score: 2500,
    level: 3,
    linesCleared: 25,
    isPaused: true,
  },

  GAME_OVER: {
    gameState: 'GAME_OVER',
    score: 5000,
    level: 5,
    linesCleared: 50,
    isPaused: false,
  },
};

// Browser compatibility test data
export const BROWSER_FEATURES = {
  REQUIRED_APIS: [
    'HTMLCanvasElement',
    'CanvasRenderingContext2D',
    'requestAnimationFrame',
    'localStorage',
    'JSON',
    'KeyboardEvent',
  ],

  CANVAS_METHODS: ['getContext', 'toDataURL'],

  CONTEXT_2D_METHODS: [
    'fillRect',
    'clearRect',
    'fillText',
    'drawImage',
    'save',
    'restore',
    'translate',
    'rotate',
    'scale',
  ],

  KEYBOARD_EVENTS: ['keydown', 'keyup', 'keypress'],
};

// Visual regression test data
export const VISUAL_TEST_SCENARIOS = {
  // Expected canvas dimensions
  CANVAS_DIMENSIONS: {
    width: 400,
    height: 800,
  },

  // UI element positions (approximate)
  UI_POSITIONS: {
    SCORE_DISPLAY: { x: 10, y: 30 },
    LEVEL_DISPLAY: { x: 10, y: 60 },
    NEXT_PIECE: { x: 320, y: 50 },
    GAME_BOARD: { x: 50, y: 50 },
  },

  // Color validation
  EXPECTED_COLORS: {
    BACKGROUND: '#000000',
    GRID_LINES: '#333333',
    TEXT: '#FFFFFF',
  },
};

// Edge case test scenarios
export const EDGE_CASES = {
  // Boundary conditions
  PIECE_AT_LEFT_EDGE: { x: 0, y: 10 },
  PIECE_AT_RIGHT_EDGE: { x: 7, y: 10 }, // For 3-wide piece
  PIECE_AT_BOTTOM: { x: 4, y: 18 },
  PIECE_AT_TOP: { x: 4, y: 0 },

  // Invalid moves
  INVALID_POSITIONS: [
    { x: -1, y: 10 }, // Too far left
    { x: 11, y: 10 }, // Too far right
    { x: 4, y: -1 }, // Above board
    { x: 4, y: 21 }, // Below board
  ],

  // Collision scenarios
  COLLISION_POSITIONS: [
    { board: 'SINGLE_LINE', piece: 'I', position: { x: 4, y: 19 } },
    { board: 'NEAR_GAME_OVER', piece: 'O', position: { x: 4, y: 0 } },
  ],
};

// Integration test scenarios for TODAY-003
export const INTEGRATION_SCENARIOS = {
  SIMPLE_PLACEMENT: {
    description: 'Simple piece placement scenario',
    pieces: [
      { type: 'T', position: { x: 4, y: 18 }, rotations: 0 },
      { type: 'O', position: { x: 6, y: 18 }, rotations: 0 },
    ],
    expectedResult: {
      piecesPlaced: 2,
      linesCleared: 0,
    },
  },

  LINE_CLEAR: {
    description: 'Line clearing scenario',
    boardSetup: [{ row: 19, pattern: [1, 1, 1, 1, 0, 1, 1, 1, 1, 1] }],
    pieces: [{ type: 'I', position: { x: 4, y: 16 }, rotations: 1 }],
    expectedResult: {
      piecesPlaced: 1,
      linesCleared: 1,
    },
  },

  COMPLEX_GAME_FLOW: {
    description: 'Complex multi-piece game flow',
    pieces: [
      { type: 'I', position: { x: 0, y: 16 }, rotations: 1 },
      { type: 'O', position: { x: 1, y: 18 }, rotations: 0 },
      { type: 'T', position: { x: 3, y: 17 }, rotations: 0 },
      { type: 'L', position: { x: 6, y: 17 }, rotations: 0 },
      { type: 'S', position: { x: 8, y: 17 }, rotations: 0 },
    ],
    expectedResult: {
      piecesPlaced: 5,
      linesCleared: 0,
      minFillPercentage: 15,
    },
  },
};

// Test utilities for integration and advanced testing
export const TestUtils = {
  // Create board with specific pattern
  createBoardWithPattern(_pattern) {
    // Note: This requires Board to be imported separately by the test file
    throw new Error('createBoardWithPattern requires Board class to be passed as parameter');
  },

  // Create random filled board
  createRandomBoard(_fillPercentage = 0.3) {
    // Note: This requires Board to be imported separately by the test file
    throw new Error('createRandomBoard requires Board class to be passed as parameter');
  },

  // Performance measurement utility
  measurePerformance(operation, iterations = 1) {
    const startTime = performance.now();

    for (let i = 0; i < iterations; i++) {
      operation();
    }

    const endTime = performance.now();
    return {
      totalTime: endTime - startTime,
      averageTime: (endTime - startTime) / iterations,
      iterations,
    };
  },

  // Memory usage measurement
  measureMemoryUsage() {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage();
    }
    // Fallback for browser environment
    return {
      heapUsed: 0,
      heapTotal: 0,
      external: 0,
      rss: 0,
    };
  },

  // Generate test piece sequence
  generatePieceSequence(count = 7) {
    const types = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
    return Array(count)
      .fill(null)
      .map((_, i) => ({
        type: types[i % 7],
        position: { x: 4, y: 0 },
        rotations: i % 4,
      }));
  },

  // Validate test results
  validateIntegrationResult(actual, expected) {
    const errors = [];

    if (expected.piecesPlaced !== undefined && actual.piecesPlaced !== expected.piecesPlaced) {
      errors.push(`Expected ${expected.piecesPlaced} pieces placed, got ${actual.piecesPlaced}`);
    }

    if (expected.linesCleared !== undefined && actual.linesCleared !== expected.linesCleared) {
      errors.push(`Expected ${expected.linesCleared} lines cleared, got ${actual.linesCleared}`);
    }

    if (
      expected.minFillPercentage !== undefined &&
      actual.fillPercentage < expected.minFillPercentage
    ) {
      errors.push(
        `Expected minimum ${expected.minFillPercentage}% fill, got ${actual.fillPercentage}%`
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  // パターン生成のテストデータ
  generateTestPattern(patternType, size = 10) {
    const pattern = this.createPattern(patternType, size);
    const fillPercentage = this.calculateFillPercentage(pattern);

    return {
      pattern,
      fillPercentage,
      size,
    };
  },
};

// Performance thresholds for TODAY-003
export const PERFORMANCE_THRESHOLDS = {
  // Timing thresholds (milliseconds)
  SINGLE_OPERATION: 1,
  BATCH_OPERATIONS: 100,
  LARGE_DATASET: 1000,
  MEMORY_PRESSURE: 2000,

  // Memory thresholds (bytes)
  MEMORY_LEAK_THRESHOLD: 10 * 1024 * 1024, // 10MB
  PEAK_MEMORY_THRESHOLD: 50 * 1024 * 1024, // 50MB

  // Iteration counts
  STRESS_TEST_ITERATIONS: 1000,
  PERFORMANCE_TEST_ITERATIONS: 500,
  MEMORY_TEST_CYCLES: 100,

  // Game performance
  TARGET_FPS: 60,
  FRAME_TIME_MS: 16.67,
  INPUT_LATENCY_MS: 16,
};

// Export all test data as default object
export default {
  TETROMINO_SHAPES,
  TETROMINO_COLORS,
  BOARD_SCENARIOS,
  SCORING_SCENARIOS,
  INPUT_SEQUENCES,
  PERFORMANCE_BENCHMARKS,
  GAME_STATE_SCENARIOS,
  BROWSER_FEATURES,
  VISUAL_TEST_SCENARIOS,
  EDGE_CASES,
  INTEGRATION_SCENARIOS,
  TestUtils,
  PERFORMANCE_THRESHOLDS,
};
