/**
 * KeyboardHandler.test.js - キーボード入力処理システムのユニットテスト
 *
 * @tdd-development-expert との協力実装
 * TDDアプローチ: RED -> GREEN -> REFACTOR
 */

import KeyboardHandler from '../../../../src/infrastructure/input/KeyboardHandler.js';
import { TimerTestHelper } from '../../../utils/test-helpers.js';

// モックイベントヘルパー
const createKeyEvent = (type, key, options = {}) => {
  // 矢印キーの場合は正しいcodeを設定
  let code = options.code;
  if (!code) {
    if (key.startsWith('Arrow')) {
      code = key; // ArrowLeft -> ArrowLeft
    } else if (key === ' ') {
      code = 'Space'; // スペースキー
    } else {
      code = `Key${key.toUpperCase()}`; // その他のキー
    }
  }

  return {
    type,
    key,
    code,
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
    timeStamp: options.timeStamp || Date.now(),
    repeat: options.repeat || false,
    ...options,
  };
};

describe('KeyboardHandler', () => {
  let keyboardHandler;
  let mockCallbacks;

  beforeEach(() => {
    // タイマーテスト環境セットアップ
    TimerTestHelper.setup();

    // jest.now()を設定（DASテスト用）
    let currentTime = 0;
    jest.now = () => currentTime;
    jest.advanceTimersByTime = ms => {
      currentTime += ms;
    };

    // モックコールバック関数
    mockCallbacks = {
      onMoveLeft: jest.fn(),
      onMoveRight: jest.fn(),
      onMoveDown: jest.fn(),
      onRotateClockwise: jest.fn(),
      onRotateCounterClockwise: jest.fn(),
      onHardDrop: jest.fn(),
      onHold: jest.fn(),
      onPause: jest.fn(),
      onReset: jest.fn(),
    };

    keyboardHandler = new KeyboardHandler(mockCallbacks);
  });

  afterEach(() => {
    keyboardHandler.destroy();
    TimerTestHelper.teardown();
  });

  describe('初期化', () => {
    test('KeyboardHandlerが正しく初期化される', () => {
      expect(keyboardHandler).toBeDefined();
      expect(keyboardHandler.isEnabled).toBe(true);
    });

    test('コールバック関数が正しく設定される', () => {
      // コールバック関数は内部で変換されるため、直接比較はできない
      expect(keyboardHandler.callbacks).toBeDefined();
      expect(typeof keyboardHandler.callbacks.moveLeft).toBe('function');
      expect(typeof keyboardHandler.callbacks.moveRight).toBe('function');
    });

    test('デフォルトキーマッピングが設定される', () => {
      const keyMap = keyboardHandler.getKeyMapping();

      expect(keyMap.ArrowLeft).toBe('moveLeft');
      expect(keyMap.ArrowRight).toBe('moveRight');
      expect(keyMap.ArrowDown).toBe('moveDown');
      expect(keyMap.ArrowUp).toBe('rotateClockwise');
      expect(keyMap.Space).toBe('hardDrop');
    });

    test('DAS設定がデフォルト値で初期化される', () => {
      const dasConfig = keyboardHandler.getDASConfig();

      expect(dasConfig.delay).toBe(167); // 10フレーム at 60fps
      expect(dasConfig.repeat).toBe(33); // 2フレーム at 60fps
    });
  });

  describe('基本キー入力処理', () => {
    test('左移動キーが正しく処理される', () => {
      const event = createKeyEvent('keydown', 'ArrowLeft', { timeStamp: 100 });

      // デバッグ情報を確認
      expect(keyboardHandler.callbacks).toBeDefined();
      expect(keyboardHandler.callbacks.moveLeft).toBeDefined();
      expect(keyboardHandler.callbacks.moveLeft).toBe(mockCallbacks.onMoveLeft);

      // 実際のコールバックを直接呼び出してテスト
      keyboardHandler.callbacks.moveLeft();
      expect(mockCallbacks.onMoveLeft).toHaveBeenCalledTimes(1);

      // 入力バッファをクリア
      keyboardHandler.clearInputBuffer();

      // キーマッピングを確認
      const keyMap = keyboardHandler.getKeyMapping();
      expect(keyMap.ArrowLeft).toBe('moveLeft');

      // イベントの正規化を確認
      expect(event.key).toBe('ArrowLeft');
      expect(event.code).toBe('ArrowLeft');

      keyboardHandler.handleKeyDown(event);

      expect(mockCallbacks.onMoveLeft).toHaveBeenCalledTimes(2);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    test('右移動キーが正しく処理される', () => {
      const event = createKeyEvent('keydown', 'ArrowRight', { timeStamp: 200 });

      keyboardHandler.handleKeyDown(event);

      expect(mockCallbacks.onMoveRight).toHaveBeenCalledTimes(1);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    test('下移動キーが正しく処理される', () => {
      const event = createKeyEvent('keydown', 'ArrowDown', { timeStamp: 300 });

      keyboardHandler.handleKeyDown(event);

      expect(mockCallbacks.onMoveDown).toHaveBeenCalledTimes(1);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    test('時計回り回転キーが正しく処理される', () => {
      const event = createKeyEvent('keydown', 'ArrowUp', { timeStamp: 400 });

      keyboardHandler.handleKeyDown(event);

      expect(mockCallbacks.onRotateClockwise).toHaveBeenCalledTimes(1);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    test('ハードドロップキーが正しく処理される', () => {
      const event = createKeyEvent('keydown', ' ');

      keyboardHandler.handleKeyDown(event);

      expect(mockCallbacks.onHardDrop).toHaveBeenCalledTimes(1);
    });

    test('未定義キーは無視される', () => {
      const event = createKeyEvent('keydown', 'KeyG');

      keyboardHandler.handleKeyDown(event);

      expect(Object.values(mockCallbacks).every(callback => callback.mock.calls.length === 0)).toBe(
        true
      );
    });
  });

  describe('キーアップ処理', () => {
    test('キーアップでDASがリセットされる', () => {
      // キーダウン
      const downEvent = createKeyEvent('keydown', 'ArrowLeft', { timeStamp: 100 });
      keyboardHandler.handleKeyDown(downEvent);

      // キーアップ
      const upEvent = createKeyEvent('keyup', 'ArrowLeft');
      keyboardHandler.handleKeyUp(upEvent);

      expect(keyboardHandler.getDASState('ArrowLeft')).toBe(null);
    });

    test('複数キーの独立したアップ処理', () => {
      // 左右両方をダウン
      keyboardHandler.handleKeyDown(createKeyEvent('keydown', 'ArrowLeft', { timeStamp: 100 }));
      keyboardHandler.handleKeyDown(createKeyEvent('keydown', 'ArrowRight', { timeStamp: 200 }));

      // 左だけアップ
      keyboardHandler.handleKeyUp(createKeyEvent('keyup', 'ArrowLeft'));

      expect(keyboardHandler.getDASState('ArrowLeft')).toBe(null);
      expect(keyboardHandler.getDASState('ArrowRight')).not.toBe(null);
    });
  });

  describe('DAS（Delayed Auto Shift）システム', () => {
    beforeEach(() => {
      // テスト用の短いDAS設定
      keyboardHandler.setDASConfig({
        delay: 100, // 100ms
        repeat: 50, // 50ms
      });
    });

    test('DAS遅延後にリピートが開始される', () => {
      const event = createKeyEvent('keydown', 'ArrowLeft', { timeStamp: 100 });

      keyboardHandler.handleKeyDown(event);
      expect(mockCallbacks.onMoveLeft).toHaveBeenCalledTimes(1);

      // DAS遅延期間経過
      TimerTestHelper.advanceTime(120);
      keyboardHandler.update();

      expect(mockCallbacks.onMoveLeft).toHaveBeenCalledTimes(2);
    });

    test('DASリピート間隔が正しく動作する', () => {
      const event = createKeyEvent('keydown', 'ArrowLeft', { timeStamp: 100 });

      keyboardHandler.handleKeyDown(event);
      expect(mockCallbacks.onMoveLeft).toHaveBeenCalledTimes(1); // 初回

      // DAS遅延期間経過
      TimerTestHelper.advanceTime(100);
      keyboardHandler.update();
      expect(mockCallbacks.onMoveLeft).toHaveBeenCalledTimes(2); // 初回 + 1回目のリピート

      // リピート間隔経過
      TimerTestHelper.advanceTime(50);
      keyboardHandler.update();
      expect(mockCallbacks.onMoveLeft).toHaveBeenCalledTimes(3); // 初回 + 1回目のリピート + 2回目のリピート
    });

    test('キーアップでDASが停止される', () => {
      const downEvent = createKeyEvent('keydown', 'ArrowLeft', { timeStamp: 100 });
      const upEvent = createKeyEvent('keyup', 'ArrowLeft');

      keyboardHandler.handleKeyDown(downEvent);

      // DAS遅延期間の途中でキーアップ
      TimerTestHelper.advanceTime(50);
      keyboardHandler.handleKeyUp(upEvent);

      TimerTestHelper.advanceTime(100);
      keyboardHandler.update();
      expect(mockCallbacks.onMoveLeft).toHaveBeenCalledTimes(1); // 初回のみ
    });

    test('異なるキーは独立したDASを持つ', () => {
      keyboardHandler.handleKeyDown(createKeyEvent('keydown', 'ArrowLeft', { timeStamp: 100 }));

      TimerTestHelper.advanceTime(50);
      keyboardHandler.handleKeyDown(createKeyEvent('keydown', 'ArrowRight', { timeStamp: 200 }));

      TimerTestHelper.advanceTime(80);
      keyboardHandler.update();

      // 左は2回（初回 + DAS）、右は1回（初回のみ）
      expect(mockCallbacks.onMoveLeft).toHaveBeenCalledTimes(2);
      expect(mockCallbacks.onMoveRight).toHaveBeenCalledTimes(1);
    });
  });

  describe('入力バッファリング', () => {
    test('フレーム内の重複入力が除去される', () => {
      const event1 = createKeyEvent('keydown', 'ArrowLeft', { timeStamp: 100 });
      const event2 = createKeyEvent('keydown', 'ArrowLeft', { timeStamp: 105 });

      keyboardHandler.handleKeyDown(event1);
      keyboardHandler.handleKeyDown(event2);

      expect(mockCallbacks.onMoveLeft).toHaveBeenCalledTimes(1);
    });

    test('入力バッファが適切にクリアされる', () => {
      keyboardHandler.handleKeyDown(createKeyEvent('keydown', 'ArrowLeft', { timeStamp: 100 }));

      keyboardHandler.clearInputBuffer();

      // 同じキーを再度押下
      keyboardHandler.handleKeyDown(createKeyEvent('keydown', 'ArrowLeft', { timeStamp: 200 }));

      expect(mockCallbacks.onMoveLeft).toHaveBeenCalledTimes(2);
    });

    test('バッファサイズ制限が機能する', () => {
      // 大量の異なるキー入力
      const keys = ['ArrowUp', 'ArrowDown', 'KeyZ', 'KeyX', 'KeyC', 'KeyA', 'KeyS'];

      keys.forEach((key, index) => {
        keyboardHandler.handleKeyDown(createKeyEvent('keydown', key, { timeStamp: index * 10 }));
      });

      const bufferSize = keyboardHandler.getInputBufferSize();
      expect(bufferSize).toBeLessThanOrEqual(10); // 最大バッファサイズ
    });
  });

  describe('キーマッピング設定', () => {
    test('カスタムキーマッピングが設定できる', () => {
      const customMapping = {
        KeyW: 'rotateClockwise',
        KeyA: 'moveLeft',
        KeyS: 'moveDown',
        KeyD: 'moveRight',
      };

      keyboardHandler.setKeyMapping(customMapping);

      const event = createKeyEvent('keydown', 'w');
      keyboardHandler.handleKeyDown(event);

      expect(mockCallbacks.onRotateClockwise).toHaveBeenCalledTimes(1);
    });

    test('キーマッピングが完全に置換される', () => {
      const customMapping = {
        KeyW: 'moveUp',
      };

      keyboardHandler.setKeyMapping(customMapping);

      // 元のマッピングは無効になる
      const event = createKeyEvent('keydown', 'ArrowLeft', { timeStamp: 100 });
      keyboardHandler.handleKeyDown(event);

      expect(mockCallbacks.onMoveLeft).not.toHaveBeenCalled();
    });

    test('無効なマッピングは無視される', () => {
      const invalidMapping = {
        KeyW: 'invalidAction',
        KeyA: null,
        KeyS: undefined,
      };

      expect(() => {
        keyboardHandler.setKeyMapping(invalidMapping);
      }).not.toThrow();
    });
  });

  describe('DAS設定変更', () => {
    test('DAS遅延時間が変更できる', () => {
      keyboardHandler.setDASConfig({ delay: 200 });

      const config = keyboardHandler.getDASConfig();
      expect(config.delay).toBe(200);
    });

    test('DASリピート間隔が変更できる', () => {
      keyboardHandler.setDASConfig({ repeat: 25 });

      const config = keyboardHandler.getDASConfig();
      expect(config.repeat).toBe(25);
    });

    test('部分的な設定変更が可能', () => {
      const originalConfig = keyboardHandler.getDASConfig();

      keyboardHandler.setDASConfig({ delay: 300 });

      const newConfig = keyboardHandler.getDASConfig();
      expect(newConfig.delay).toBe(300);
      expect(newConfig.repeat).toBe(originalConfig.repeat); // 変更なし
    });

    test('無効な設定値は無視される', () => {
      const originalConfig = keyboardHandler.getDASConfig();

      keyboardHandler.setDASConfig({
        delay: -1,
        repeat: null,
        invalid: 'value',
      });

      const config = keyboardHandler.getDASConfig();
      expect(config.delay).toBe(originalConfig.delay);
      expect(config.repeat).toBe(originalConfig.repeat);
    });
  });

  describe('有効/無効制御', () => {
    test('無効化時は入力が処理されない', () => {
      keyboardHandler.disable();

      const event = createKeyEvent('keydown', 'ArrowLeft');
      keyboardHandler.handleKeyDown(event);

      expect(mockCallbacks.onMoveLeft).not.toHaveBeenCalled();
      expect(keyboardHandler.isEnabled).toBe(false);
    });

    test('有効化時は入力が処理される', () => {
      keyboardHandler.disable();
      keyboardHandler.enable();

      const event = createKeyEvent('keydown', 'ArrowLeft');
      keyboardHandler.handleKeyDown(event);

      expect(mockCallbacks.onMoveLeft).toHaveBeenCalledTimes(1);
      expect(keyboardHandler.isEnabled).toBe(true);
    });

    test('無効化時にDASがリセットされる', () => {
      keyboardHandler.handleKeyDown(createKeyEvent('keydown', 'ArrowLeft', { timeStamp: 100 }));

      keyboardHandler.disable();

      expect(keyboardHandler.getDASState('ArrowLeft')).toBe(null);
    });
  });

  describe('統計情報', () => {
    test('入力統計が正しく記録される', () => {
      keyboardHandler.handleKeyDown(createKeyEvent('keydown', 'ArrowLeft', { timeStamp: 100 }));
      keyboardHandler.handleKeyDown(createKeyEvent('keydown', 'ArrowRight', { timeStamp: 200 }));
      keyboardHandler.handleKeyDown(createKeyEvent('keydown', 'ArrowLeft', { timeStamp: 300 }));

      const stats = keyboardHandler.getInputStatistics();

      expect(stats.totalInputs).toBe(3);
      expect(stats.actionCounts.moveLeft).toBe(2);
      expect(stats.actionCounts.moveRight).toBe(1);
    });

    test('統計がリセットできる', () => {
      keyboardHandler.handleKeyDown(createKeyEvent('keydown', 'ArrowLeft', { timeStamp: 100 }));

      keyboardHandler.resetStatistics();

      const stats = keyboardHandler.getInputStatistics();
      expect(stats.totalInputs).toBe(0);
    });

    test('平均入力レートが計算される', () => {
      const baseTime = 1000;

      // 時間間隔を空けて入力
      keyboardHandler.handleKeyDown(
        createKeyEvent('keydown', 'ArrowLeft', { timeStamp: baseTime })
      );
      keyboardHandler.handleKeyDown(
        createKeyEvent('keydown', 'ArrowRight', { timeStamp: baseTime + 1000 })
      );

      const stats = keyboardHandler.getInputStatistics();
      expect(stats.averageInputRate).toBeGreaterThan(0);
      expect(stats.totalInputs).toBe(2);
    });
  });

  describe('エラーハンドリング', () => {
    test('null イベントが安全に処理される', () => {
      expect(() => {
        keyboardHandler.handleKeyDown(null);
      }).not.toThrow();

      expect(Object.values(mockCallbacks).every(callback => callback.mock.calls.length === 0)).toBe(
        true
      );
    });

    test('undefined イベントが安全に処理される', () => {
      expect(() => {
        keyboardHandler.handleKeyDown(undefined);
      }).not.toThrow();
    });

    test('無効なコールバックが安全に処理される', () => {
      const invalidKeyboardHandler = new KeyboardHandler({
        moveLeft: null,
        moveRight: undefined,
        invalidAction: 'not_a_function',
      });

      expect(() => {
        invalidKeyboardHandler.handleKeyDown(
          createKeyEvent('keydown', 'ArrowLeft', { timeStamp: 100 })
        );
      }).not.toThrow();

      invalidKeyboardHandler.destroy();
    });

    test('重複destroy呼び出しが安全', () => {
      keyboardHandler.destroy();

      expect(() => {
        keyboardHandler.destroy();
      }).not.toThrow();
    });
  });

  describe('メモリ管理', () => {
    test('destroyでイベントリスナーが削除される', () => {
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

      keyboardHandler.destroy();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keyup', expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });

    test('destroyでタイマーがクリアされる', () => {
      // DAS用タイマーを開始
      keyboardHandler.handleKeyDown(createKeyEvent('keydown', 'ArrowLeft', { timeStamp: 100 }));

      keyboardHandler.destroy();

      // タイマーがクリアされていることを確認
      expect(keyboardHandler.getDASState('ArrowLeft')).toBe(null);
    });
  });

  describe('パフォーマンス', () => {
    test('大量の入力が効率的に処理される', () => {
      const startTime = performance.now();

      // 1000回の入力処理
      for (let i = 0; i < 1000; i++) {
        const key = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'][i % 4];
        keyboardHandler.handleKeyDown(createKeyEvent('keydown', key, { timeStamp: i }));
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100); // 100ms以内
    });

    test('DAS更新が効率的に実行される', () => {
      // 複数のDASを開始
      ['ArrowLeft', 'ArrowRight', 'ArrowDown'].forEach((key, index) => {
        keyboardHandler.handleKeyDown(
          createKeyEvent('keydown', key, { timeStamp: 100 + index * 100 })
        );
      });

      const startTime = performance.now();

      // 100回のupdate呼び出し
      for (let i = 0; i < 100; i++) {
        keyboardHandler.update();
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(50); // 50ms以内
    });
  });
});
