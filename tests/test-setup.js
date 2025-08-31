/**
 * Jest Test Setup and Global Utilities
 * Sets up testing environment and provides common utilities for all tests
 */

// Mock Canvas API for jsdom environment
global.HTMLCanvasElement.prototype.getContext = function (type) {
  if (type === '2d') {
    return {
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      font: '',
      textAlign: 'start',
      textBaseline: 'alphabetic',

      // Drawing methods
      fillRect: jest.fn(),
      strokeRect: jest.fn(),
      clearRect: jest.fn(),
      fillText: jest.fn(),
      strokeText: jest.fn(),
      drawImage: jest.fn(),

      // Path methods
      beginPath: jest.fn(),
      closePath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      rect: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn(),
      stroke: jest.fn(),

      // Transform methods
      save: jest.fn(),
      restore: jest.fn(),
      translate: jest.fn(),
      rotate: jest.fn(),
      scale: jest.fn(),

      // Measurement methods
      measureText: jest.fn(() => ({ width: 0 })),

      // Image data methods
      getImageData: jest.fn(),
      putImageData: jest.fn(),
      createImageData: jest.fn(),
    };
  }
  return null;
};

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn(callback => {
  return setTimeout(callback, 16); // Simulate 60fps
});

global.cancelAnimationFrame = jest.fn(id => {
  clearTimeout(id);
});

// Mock performance.now for consistent timing in tests
const mockPerformanceNow = jest.fn(() => Date.now());
Object.defineProperty(global.performance, 'now', {
  value: mockPerformanceNow,
});

// Mock Audio API
global.Audio = jest.fn(() => ({
  play: jest.fn(),
  pause: jest.fn(),
  load: jest.fn(),
  volume: 1,
  currentTime: 0,
  duration: 0,
  paused: true,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

// Global test utilities
global.TestUtils = {
  /**
   * Create a mock canvas with context
   */
  createMockCanvas: (width = 400, height = 800) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    return { canvas, context };
  },

  /**
   * Create a mock game board with specified pattern
   */
  createMockBoard: (pattern = 'empty') => {
    const board = Array(20)
      .fill(null)
      .map(() => Array(10).fill(0));

    switch (pattern) {
      case 'empty':
        // Already initialized as empty
        break;

      case 'full-bottom-row':
        // Fill bottom row
        for (let col = 0; col < 10; col++) {
          board[19][col] = 1;
        }
        break;

      case 'tetris-setup':
        // Setup for 4-line clear
        for (let row = 16; row < 20; row++) {
          for (let col = 0; col < 9; col++) {
            board[row][col] = 1;
          }
        }
        break;

      case 'near-game-over':
        // Fill most of the board
        for (let row = 5; row < 20; row++) {
          for (let col = 0; col < 10; col++) {
            if (Math.random() > 0.3) {
              board[row][col] = Math.floor(Math.random() * 7) + 1;
            }
          }
        }
        break;
    }

    return board;
  },

  /**
   * Create mock tetromino piece
   */
  createMockTetromino: (type = 'I', x = 4, y = 0, rotation = 0) => {
    const shapes = {
      I: [[[1, 1, 1, 1]]],
      O: [
        [
          [1, 1],
          [1, 1],
        ],
      ],
      T: [
        [
          [0, 1, 0],
          [1, 1, 1],
        ],
      ],
      S: [
        [
          [0, 1, 1],
          [1, 1, 0],
        ],
      ],
      Z: [
        [
          [1, 1, 0],
          [0, 1, 1],
        ],
      ],
      J: [
        [
          [1, 0, 0],
          [1, 1, 1],
        ],
      ],
      L: [
        [
          [0, 0, 1],
          [1, 1, 1],
        ],
      ],
    };

    return {
      type,
      shape: shapes[type][0],
      position: { x, y },
      rotation,
      color: '#FFFFFF',
    };
  },

  /**
   * Simulate keyboard events
   */
  simulateKeyPress: (key, type = 'keydown') => {
    const event = new KeyboardEvent(type, {
      key: key,
      code: key,
      keyCode: key.charCodeAt ? key.charCodeAt(0) : 0,
      bubbles: true,
      cancelable: true,
    });

    document.dispatchEvent(event);
    return event;
  },

  /**
   * Wait for specified number of frames
   */
  waitFrames: async (frames = 1) => {
    for (let i = 0; i < frames; i++) {
      await new Promise(resolve => requestAnimationFrame(resolve));
    }
  },

  /**
   * Advance game time for testing time-based mechanics
   */
  advanceTime: milliseconds => {
    jest.advanceTimersByTime(milliseconds);
  },

  /**
   * Create performance measurement spy
   */
  createPerformanceSpy: () => {
    let startTime = 0;
    return {
      start: jest.fn(() => {
        startTime = performance.now();
      }),
      end: jest.fn(() => {
        return performance.now() - startTime;
      }),
      reset: jest.fn(() => {
        startTime = 0;
      }),
    };
  },

  /**
   * Validate game state structure
   */
  validateGameState: state => {
    expect(state).toHaveProperty('board');
    expect(state).toHaveProperty('currentPiece');
    expect(state).toHaveProperty('score');
    expect(state).toHaveProperty('level');
    expect(state).toHaveProperty('linesCleared');
    expect(state).toHaveProperty('gameState');
    expect(['MENU', 'PLAYING', 'PAUSED', 'GAME_OVER']).toContain(state.gameState);
  },

  /**
   * Validate board state
   */
  validateBoard: board => {
    expect(Array.isArray(board)).toBe(true);
    expect(board).toHaveLength(20);
    board.forEach(row => {
      expect(Array.isArray(row)).toBe(true);
      expect(row).toHaveLength(10);
    });
  },

  /**
   * Generate sequence of random test inputs
   */
  generateRandomInputSequence: (length = 10) => {
    const inputs = ['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', ' '];
    return Array(length)
      .fill(null)
      .map(() => inputs[Math.floor(Math.random() * inputs.length)]);
  },

  /**
   * Mock local storage for testing
   */
  mockLocalStorage: () => {
    const storage = {};

    Object.defineProperty(global, 'localStorage', {
      value: {
        getItem: jest.fn(key => storage[key] || null),
        setItem: jest.fn((key, value) => {
          storage[key] = value;
        }),
        removeItem: jest.fn(key => {
          delete storage[key];
        }),
        clear: jest.fn(() => {
          Object.keys(storage).forEach(key => delete storage[key]);
        }),
        key: jest.fn(index => Object.keys(storage)[index] || null),
        get length() {
          return Object.keys(storage).length;
        },
      },
      writable: true,
    });

    return storage;
  },
};

// Setup common test environment - Optimized for performance
beforeEach(() => {
  // Reset all mocks - Only when needed
  if (process.env.NODE_ENV === 'test') {
    jest.clearAllMocks();
  }

  // Reset performance timing
  mockPerformanceNow.mockClear();

  // Use fake timers for consistent testing - Only when needed
  if (process.env.USE_FAKE_TIMERS !== 'false') {
    jest.useFakeTimers();
  }
});

afterEach(() => {
  // Restore real timers after each test - Only when needed
  if (process.env.USE_FAKE_TIMERS !== 'false') {
    jest.useRealTimers();
  }

  // Clean up DOM modifications - Only when needed
  if (document.body.innerHTML !== '') {
    document.body.innerHTML = '';
  }
});

// Global error handling for tests - Optimized
global.console = {
  ...console,
  // Suppress console output in tests for performance
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
