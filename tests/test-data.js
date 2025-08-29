/**
 * Test Data and Scenarios
 * Provides predefined test data for consistent testing across components
 */

// Tetromino shape definitions for testing
export const TETROMINO_SHAPES = {
  I: [
    [1, 1, 1, 1]
  ],
  O: [
    [1, 1],
    [1, 1]
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1]
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0]
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1]
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1]
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1]
  ]
};

// Expected colors for each tetromino type
export const TETROMINO_COLORS = {
  I: '#00FFFF', // Cyan
  O: '#FFFF00', // Yellow
  T: '#800080', // Purple
  S: '#00FF00', // Green
  Z: '#FF0000', // Red
  J: '#0000FF', // Blue
  L: '#FFA500'  // Orange
};

// Test board configurations
export const BOARD_SCENARIOS = {
  // Completely empty board
  EMPTY: Array(20).fill(null).map(() => Array(10).fill(0)),
  
  // Board with bottom row completely filled (single line clear)
  SINGLE_LINE: (() => {
    const board = Array(20).fill(null).map(() => Array(10).fill(0));
    for (let col = 0; col < 10; col++) {
      board[19][col] = 1;
    }
    return board;
  })(),
  
  // Board setup for Tetris (4-line clear)
  TETRIS_SETUP: (() => {
    const board = Array(20).fill(null).map(() => Array(10).fill(0));
    for (let row = 16; row < 20; row++) {
      for (let col = 0; col < 9; col++) { // Leave rightmost column empty
        board[row][col] = Math.floor(Math.random() * 7) + 1;
      }
    }
    return board;
  })(),
  
  // Near game over situation
  NEAR_GAME_OVER: (() => {
    const board = Array(20).fill(null).map(() => Array(10).fill(0));
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
    const board = Array(20).fill(null).map(() => Array(10).fill(0));
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
    const board = Array(20).fill(null).map(() => Array(10).fill(0));
    // Create T-spin opportunity
    const pattern = [
      [1, 1, 0, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ];
    
    pattern.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        board[17 + rowIndex][colIndex] = cell;
      });
    });
    
    return board;
  })()
};

// Scoring test scenarios
export const SCORING_SCENARIOS = {
  SINGLE_LINE: {
    linesCleared: 1,
    level: 1,
    expectedScore: 100,
    description: 'Single line clear at level 1'
  },
  DOUBLE_LINE: {
    linesCleared: 2,
    level: 1,
    expectedScore: 300,
    description: 'Double line clear at level 1'
  },
  TRIPLE_LINE: {
    linesCleared: 3,
    level: 1,
    expectedScore: 500,
    description: 'Triple line clear at level 1'
  },
  TETRIS: {
    linesCleared: 4,
    level: 1,
    expectedScore: 800,
    description: 'Tetris (4 lines) at level 1'
  },
  LEVEL_MULTIPLIER: {
    linesCleared: 1,
    level: 5,
    expectedScore: 500, // 100 * 5
    description: 'Single line at level 5 (with multiplier)'
  },
  SOFT_DROP: {
    cells: 10,
    expectedScore: 10, // 1 point per cell
    description: 'Soft drop 10 cells'
  },
  HARD_DROP: {
    cells: 15,
    expectedScore: 30, // 2 points per cell
    description: 'Hard drop 15 cells'
  }
};

// Input sequences for testing
export const INPUT_SEQUENCES = {
  // Basic movement sequence
  BASIC_MOVEMENT: [
    'ArrowLeft', 'ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowDown'
  ],
  
  // Rotation sequence
  ROTATION_TEST: [
    'ArrowUp', 'ArrowUp', 'ArrowUp', 'ArrowUp' // Full rotation
  ],
  
  // Complex gameplay sequence
  COMPLEX_GAMEPLAY: [
    'ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowRight', 
    'ArrowDown', 'ArrowDown', ' ', 'ArrowLeft', 'ArrowUp'
  ],
  
  // Rapid input test
  RAPID_INPUT: [
    'ArrowLeft', 'ArrowLeft', 'ArrowLeft', 'ArrowRight', 
    'ArrowRight', 'ArrowUp', 'ArrowUp', ' '
  ],
  
  // Game control sequence
  GAME_CONTROLS: [
    ' ', 'KeyP', 'KeyP', 'KeyR' // Start, Pause, Unpause, Restart
  ]
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
    INPUT_PROCESSING: 1000
  }
};

// Game state scenarios
export const GAME_STATE_SCENARIOS = {
  INITIAL_STATE: {
    gameState: 'MENU',
    score: 0,
    level: 1,
    linesCleared: 0,
    isPaused: false
  },
  
  ACTIVE_GAME: {
    gameState: 'PLAYING',
    score: 1500,
    level: 2,
    linesCleared: 15,
    isPaused: false
  },
  
  PAUSED_GAME: {
    gameState: 'PAUSED',
    score: 2500,
    level: 3,
    linesCleared: 25,
    isPaused: true
  },
  
  GAME_OVER: {
    gameState: 'GAME_OVER',
    score: 5000,
    level: 5,
    linesCleared: 50,
    isPaused: false
  }
};

// Browser compatibility test data
export const BROWSER_FEATURES = {
  REQUIRED_APIS: [
    'HTMLCanvasElement',
    'CanvasRenderingContext2D',
    'requestAnimationFrame',
    'localStorage',
    'JSON',
    'KeyboardEvent'
  ],
  
  CANVAS_METHODS: [
    'getContext',
    'toDataURL'
  ],
  
  CONTEXT_2D_METHODS: [
    'fillRect',
    'clearRect',
    'fillText',
    'drawImage',
    'save',
    'restore',
    'translate',
    'rotate',
    'scale'
  ],
  
  KEYBOARD_EVENTS: [
    'keydown',
    'keyup',
    'keypress'
  ]
};

// Visual regression test data
export const VISUAL_TEST_SCENARIOS = {
  // Expected canvas dimensions
  CANVAS_DIMENSIONS: {
    width: 400,
    height: 800
  },
  
  // UI element positions (approximate)
  UI_POSITIONS: {
    SCORE_DISPLAY: { x: 10, y: 30 },
    LEVEL_DISPLAY: { x: 10, y: 60 },
    NEXT_PIECE: { x: 320, y: 50 },
    GAME_BOARD: { x: 50, y: 50 }
  },
  
  // Color validation
  EXPECTED_COLORS: {
    BACKGROUND: '#000000',
    GRID_LINES: '#333333',
    TEXT: '#FFFFFF'
  }
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
    { x: 4, y: -1 },  // Above board
    { x: 4, y: 21 }   // Below board
  ],
  
  // Collision scenarios
  COLLISION_POSITIONS: [
    { board: 'SINGLE_LINE', piece: 'I', position: { x: 4, y: 19 } },
    { board: 'NEAR_GAME_OVER', piece: 'O', position: { x: 4, y: 0 } }
  ]
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
  EDGE_CASES
};