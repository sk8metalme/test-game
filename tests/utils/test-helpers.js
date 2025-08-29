/**
 * test-helpers.js - テストユーティリティ関数集
 *
 * Jest fake timers標準化とテスト支援機能
 * Week 2改善実装: 安定したタイマーテスト環境提供
 */

/**
 * タイマーテスト用ヘルパー
 */
export class TimerTestHelper {
  /**
   * テスト開始時のタイマー初期化
   */
  static setup() {
    jest.useFakeTimers();
    jest.spyOn(global, 'setTimeout');
    jest.spyOn(global, 'clearTimeout');
    jest.spyOn(global, 'setInterval');
    jest.spyOn(global, 'clearInterval');
  }

  /**
   * テスト終了時のタイマークリーンアップ
   */
  static teardown() {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  }

  /**
   * 指定時間進める
   * @param {number} ms - 進める時間（ミリ秒）
   */
  static advanceTime(ms) {
    jest.advanceTimersByTime(ms);
  }

  /**
   * 次のタイマーを実行
   */
  static runNextTimer() {
    jest.runOnlyPendingTimers();
  }

  /**
   * 全てのタイマーを実行
   */
  static runAllTimers() {
    jest.runAllTimers();
  }

  /**
   * ペンディング中のタイマー数を取得
   * @returns {number} ペンディングタイマー数
   */
  static getPendingTimersCount() {
    return jest.getTimerCount();
  }

  /**
   * DAS用のタイマーテストパターン
   * @param {Function} callback - テスト対象の関数
   * @param {number} delay - DAS遅延時間
   * @param {number} repeat - DASリピート間隔
   * @returns {Object} テスト結果
   */
  static testDASPattern(callback, delay = 167, repeat = 33) {
    const callCount = {
      initial: 0,
      afterDelay: 0,
      afterRepeat: 0,
    };

    // 初回呼び出し
    callback();
    callCount.initial = callback.mock.calls.length;

    // 遅延時間経過
    this.advanceTime(delay);
    callCount.afterDelay = callback.mock.calls.length;

    // リピート間隔経過
    this.advanceTime(repeat);
    callCount.afterRepeat = callback.mock.calls.length;

    return callCount;
  }
}

/**
 * モックイベント作成ヘルパー
 */
export class MockEventHelper {
  /**
   * キーボードイベントモック作成
   * @param {string} type - イベントタイプ（keydown/keyup）
   * @param {string} key - キー名
   * @param {Object} options - 追加オプション
   * @returns {Object} モックイベント
   */
  static createKeyboardEvent(type, key, options = {}) {
    return {
      type,
      key,
      code: options.code || `Key${key.toUpperCase()}`,
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      timeStamp: options.timeStamp || Date.now(),
      repeat: options.repeat || false,
      ctrlKey: options.ctrlKey || false,
      shiftKey: options.shiftKey || false,
      altKey: options.altKey || false,
      metaKey: options.metaKey || false,
      ...options,
    };
  }

  /**
   * マウスイベントモック作成
   * @param {string} type - イベントタイプ
   * @param {number} x - X座標
   * @param {number} y - Y座標
   * @param {Object} options - 追加オプション
   * @returns {Object} モックイベント
   */
  static createMouseEvent(type, x, y, options = {}) {
    return {
      type,
      clientX: x,
      clientY: y,
      offsetX: x,
      offsetY: y,
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      button: options.button || 0,
      buttons: options.buttons || 1,
      ...options,
    };
  }
}

/**
 * パフォーマンステスト用ヘルパー
 */
export class PerformanceTestHelper {
  /**
   * 関数実行時間測定
   * @param {Function} fn - 測定対象関数
   * @param {Array} args - 関数引数
   * @returns {Object} 実行時間と結果
   */
  static measureExecutionTime(fn, ...args) {
    const start = performance.now();
    const result = fn(...args);
    const end = performance.now();

    return {
      executionTime: end - start,
      result,
    };
  }

  /**
   * 大量実行パフォーマンステスト
   * @param {Function} fn - テスト対象関数
   * @param {number} iterations - 実行回数
   * @param {Array} args - 関数引数
   * @returns {Object} パフォーマンス統計
   */
  static benchmarkFunction(fn, iterations = 1000, ...args) {
    const times = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      fn(...args);
      const end = performance.now();
      times.push(end - start);
    }

    const totalTime = times.reduce((sum, time) => sum + time, 0);
    const avgTime = totalTime / iterations;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    return {
      totalTime,
      averageTime: avgTime,
      minTime,
      maxTime,
      iterations,
      timesPerSecond: 1000 / avgTime,
    };
  }

  /**
   * メモリ使用量測定（Node.js環境）
   * @returns {Object} メモリ使用量情報
   */
  static measureMemoryUsage() {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      return {
        heapUsed: usage.heapUsed,
        heapTotal: usage.heapTotal,
        external: usage.external,
        rss: usage.rss,
        heapUsedMB: (usage.heapUsed / 1024 / 1024).toFixed(2),
        heapTotalMB: (usage.heapTotal / 1024 / 1024).toFixed(2),
      };
    }
    return null;
  }
}

/**
 * DOM要素モック作成ヘルパー
 */
export class DOMTestHelper {
  /**
   * Canvas要素モック作成
   * @param {number} width - Canvas幅
   * @param {number} height - Canvas高さ
   * @returns {Object} モックCanvas
   */
  static createMockCanvas(width = 400, height = 800) {
    const mockContext = {
      fillRect: jest.fn(),
      strokeRect: jest.fn(),
      clearRect: jest.fn(),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      stroke: jest.fn(),
      fill: jest.fn(),
      fillStyle: '#000000',
      strokeStyle: '#000000',
      lineWidth: 1,
    };

    const mockCanvas = {
      width,
      height,
      getContext: jest.fn(() => mockContext),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };

    return { canvas: mockCanvas, context: mockContext };
  }

  /**
   * Document要素モック設定
   */
  static setupDocumentMock() {
    global.document = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      createElement: jest.fn(tagName => {
        if (tagName === 'canvas') {
          return this.createMockCanvas().canvas;
        }
        return {
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        };
      }),
    };
  }

  /**
   * ローカルストレージモック設定
   */
  static setupLocalStorageMock() {
    const store = {};

    global.localStorage = {
      getItem: jest.fn(key => store[key] || null),
      setItem: jest.fn((key, value) => {
        store[key] = value;
      }),
      removeItem: jest.fn(key => {
        delete store[key];
      }),
      clear: jest.fn(() => {
        Object.keys(store).forEach(key => delete store[key]);
      }),
      key: jest.fn(index => Object.keys(store)[index] || null),
      get length() {
        return Object.keys(store).length;
      },
    };
  }
}

/**
 * テスト用定数とデータ
 */
export const TEST_CONSTANTS = {
  // ゲーム設定
  BOARD_WIDTH: 10,
  BOARD_HEIGHT: 20,
  BLOCK_SIZE: 20,

  // DAS設定
  DAS_DELAY: 167,
  DAS_REPEAT: 33,

  // パフォーマンス閾値
  MAX_EXECUTION_TIME: 100, // ms
  MAX_MEMORY_USAGE: 50 * 1024 * 1024, // 50MB
  MIN_FPS: 55,

  // テトロミノ形状テストデータ
  TETROMINO_SHAPES: {
    I: [[[1], [1], [1], [1]], [[1, 1, 1, 1]]],
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
      [
        [1, 0],
        [1, 1],
        [1, 0],
      ],
      [
        [1, 1, 1],
        [0, 1, 0],
      ],
      [
        [0, 1],
        [1, 1],
        [0, 1],
      ],
    ],
  },
};

/**
 * アサーションヘルパー
 */
export class AssertionHelper {
  /**
   * 実行時間アサーション
   * @param {Function} fn - テスト対象関数
   * @param {number} maxTime - 最大許容時間（ms）
   * @param {Array} args - 関数引数
   */
  static expectExecutionTimeLessThan(fn, maxTime, ...args) {
    const { executionTime } = PerformanceTestHelper.measureExecutionTime(fn, ...args);
    expect(executionTime).toBeLessThan(maxTime);
  }

  /**
   * DASパターンアサーション
   * @param {Object} callCount - DASテスト結果
   */
  static expectDASPattern(callCount) {
    expect(callCount.initial).toBe(1); // 初回呼び出し
    expect(callCount.afterDelay).toBe(2); // 遅延後
    expect(callCount.afterRepeat).toBe(3); // リピート後
  }

  /**
   * メモリ使用量アサーション
   * @param {number} maxMemoryMB - 最大許容メモリ（MB）
   */
  static expectMemoryUsageLessThan(maxMemoryMB) {
    const memory = PerformanceTestHelper.measureMemoryUsage();
    if (memory) {
      const usageMB = parseFloat(memory.heapUsedMB);
      expect(usageMB).toBeLessThan(maxMemoryMB);
    }
  }
}
