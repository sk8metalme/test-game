/**
 * ComboState Entity Unit Tests
 *
 * TDD Red Phase: コンボ状態管理エンティティのテスト定義
 *
 * @file ComboState.test.js
 * @description コンボ状態管理の全機能をテスト
 */

import { ComboState } from '../../../src/core/entities/ComboState.js';

describe('ComboState Entity', () => {
  let comboState;

  beforeEach(() => {
    comboState = new ComboState();
  });

  afterEach(() => {
    comboState = null;
  });

  describe('初期化', () => {
    test('デフォルト値で正しく初期化される', () => {
      expect(comboState.currentCombo).toBe(0);
      expect(comboState.maxCombo).toBe(0);
      expect(comboState.totalCombos).toBe(0);
      expect(comboState.comboHistory).toEqual([]);
      expect(comboState.comboStartTime).toBeNull();
      expect(comboState.lastComboTime).toBeNull();
    });

    test('カスタム設定で初期化される', () => {
      const customComboState = new ComboState({
        maxHistorySize: 50,
        enableStatistics: false,
      });

      expect(customComboState.maxHistorySize).toBe(50);
      expect(customComboState.enableStatistics).toBe(false);
    });

    test('無効な設定値は適切に処理される', () => {
      const invalidComboState = new ComboState({
        maxHistorySize: -10,
        enableStatistics: 'invalid',
      });

      expect(invalidComboState.maxHistorySize).toBe(100); // デフォルト値
      expect(invalidComboState.enableStatistics).toBe(true); // デフォルト値
    });
  });

  describe('コンボ増加', () => {
    test('コンボが正しく増加する', () => {
      comboState.incrementCombo();

      expect(comboState.currentCombo).toBe(1);
      expect(comboState.maxCombo).toBe(1);
      expect(comboState.totalCombos).toBe(1);
      expect(comboState.comboStartTime).toBeDefined();
      expect(comboState.lastComboTime).toBeDefined();
    });

    test('連続コンボで最大値が更新される', () => {
      comboState.incrementCombo();
      comboState.incrementCombo();
      comboState.incrementCombo();

      expect(comboState.currentCombo).toBe(3);
      expect(comboState.maxCombo).toBe(3);
      expect(comboState.totalCombos).toBe(3);
    });

    test('コンボリセット後に再開始で最大値が維持される', () => {
      comboState.incrementCombo();
      comboState.incrementCombo();
      comboState.incrementCombo();

      const firstMaxCombo = comboState.maxCombo;
      comboState.resetCombo();

      comboState.incrementCombo();

      expect(comboState.currentCombo).toBe(1);
      expect(comboState.maxCombo).toBe(firstMaxCombo); // 前の最大値を維持
    });

    test('コンボ間隔が記録される', () => {
      const startTime = Date.now();

      comboState.incrementCombo();
      const firstTime = comboState.lastComboTime;

      // 時間を進める
      jest.advanceTimersByTime(100);

      comboState.incrementCombo();
      const secondTime = comboState.lastComboTime;

      expect(secondTime).toBeGreaterThan(firstTime);
    });
  });

  describe('コンボリセット', () => {
    test('コンボが正しくリセットされる', () => {
      comboState.incrementCombo();
      comboState.incrementCombo();

      const resetResult = comboState.resetCombo();

      expect(comboState.currentCombo).toBe(0);
      expect(comboState.comboStartTime).toBeNull();
      expect(comboState.lastComboTime).toBeNull();
      expect(resetResult.wasActive).toBe(true);
      expect(resetResult.finalCombo).toBe(2);
    });

    test('非アクティブ状態でのリセットは影響なし', () => {
      const resetResult = comboState.resetCombo();

      expect(resetResult.wasActive).toBe(false);
      expect(resetResult.finalCombo).toBe(0);
    });

    test('リセット時に履歴が記録される', () => {
      comboState.incrementCombo();
      comboState.incrementCombo();

      const initialHistoryLength = comboState.comboHistory.length;
      comboState.resetCombo();

      expect(comboState.comboHistory.length).toBe(initialHistoryLength + 1);

      const lastHistory = comboState.comboHistory[comboState.comboHistory.length - 1];
      expect(lastHistory.maxCombo).toBe(2);
      expect(lastHistory.duration).toBeDefined();
      expect(lastHistory.timestamp).toBeDefined();
    });
  });

  describe('履歴管理', () => {
    test('履歴が正しく記録される', () => {
      const historyEntry = {
        maxCombo: 5,
        duration: 2000,
        timestamp: Date.now(),
        averageInterval: 400,
      };

      comboState.addToHistory(historyEntry);

      expect(comboState.comboHistory).toContainEqual(historyEntry);
    });

    test('履歴サイズが制限される', () => {
      const smallComboState = new ComboState({ maxHistorySize: 3 });

      // 制限を超える履歴を追加
      for (let i = 0; i < 5; i++) {
        smallComboState.addToHistory({
          maxCombo: i + 1,
          duration: 1000,
          timestamp: Date.now(),
        });
      }

      expect(smallComboState.comboHistory.length).toBe(3);
      // 最新の3つが保持されている
      expect(smallComboState.comboHistory[0].maxCombo).toBe(3);
      expect(smallComboState.comboHistory[2].maxCombo).toBe(5);
    });

    test('無効な履歴エントリは追加されない', () => {
      const initialLength = comboState.comboHistory.length;

      comboState.addToHistory(null);
      comboState.addToHistory(undefined);
      comboState.addToHistory({});
      comboState.addToHistory({ maxCombo: -1 });

      expect(comboState.comboHistory.length).toBe(initialLength);
    });

    test('履歴をクリアできる', () => {
      comboState.addToHistory({ maxCombo: 5, duration: 1000, timestamp: Date.now() });
      comboState.clearHistory();

      expect(comboState.comboHistory).toEqual([]);
    });
  });

  describe('統計計算', () => {
    beforeEach(() => {
      // テスト用履歴データを準備
      comboState.addToHistory({ maxCombo: 5, duration: 2000, timestamp: Date.now() - 3000 });
      comboState.addToHistory({ maxCombo: 3, duration: 1500, timestamp: Date.now() - 2000 });
      comboState.addToHistory({ maxCombo: 8, duration: 4000, timestamp: Date.now() - 1000 });
    });

    test('平均コンボが正しく計算される', () => {
      const stats = comboState.getComboStats();

      expect(stats.averageCombo).toBeCloseTo(5.33, 1); // (5+3+8)/3
    });

    test('最大コンボが正しく取得される', () => {
      const stats = comboState.getComboStats();

      expect(stats.maxCombo).toBe(8);
    });

    test('平均継続時間が正しく計算される', () => {
      const stats = comboState.getComboStats();

      expect(stats.averageDuration).toBeCloseTo(2500, 0); // (2000+1500+4000)/3
    });

    test('コンボ効率が正しく計算される', () => {
      const stats = comboState.getComboStats();

      // コンボ数/秒 = 平均コンボ / (平均継続時間/1000)
      const expectedEfficiency = 5.33 / 2.5; // 約2.13
      expect(stats.comboPerSecond).toBeCloseTo(expectedEfficiency, 1);
    });

    test('統計が無効化されている場合は空のオブジェクトを返す', () => {
      const noStatsComboState = new ComboState({ enableStatistics: false });
      const stats = noStatsComboState.getComboStats();

      expect(Object.keys(stats)).toEqual([]);
    });

    test('履歴が空の場合は0値の統計を返す', () => {
      const emptyComboState = new ComboState();
      const stats = emptyComboState.getComboStats();

      expect(stats.averageCombo).toBe(0);
      expect(stats.maxCombo).toBe(0);
      expect(stats.averageDuration).toBe(0);
      expect(stats.comboPerSecond).toBe(0);
    });
  });

  describe('状態チェック', () => {
    test('アクティブ状態を正しく判定する', () => {
      expect(comboState.isActive()).toBe(false);

      comboState.incrementCombo();
      expect(comboState.isActive()).toBe(true);

      comboState.resetCombo();
      expect(comboState.isActive()).toBe(false);
    });

    test('コンボレベルを正しく取得する', () => {
      expect(comboState.getComboLevel()).toBe(0);

      comboState.incrementCombo();
      comboState.incrementCombo();
      expect(comboState.getComboLevel()).toBe(2);
    });

    test('コンボ継続時間を正しく計算する', () => {
      const startTime = Date.now();
      comboState.incrementCombo();

      jest.advanceTimersByTime(1500);

      const duration = comboState.getCurrentDuration();
      expect(duration).toBeGreaterThanOrEqual(1500);
    });

    test('非アクティブ時の継続時間は0', () => {
      const duration = comboState.getCurrentDuration();
      expect(duration).toBe(0);
    });
  });

  describe('シリアライゼーション', () => {
    test('状態をJSONにシリアライズできる', () => {
      comboState.incrementCombo();
      comboState.incrementCombo();
      comboState.addToHistory({ maxCombo: 3, duration: 1000, timestamp: Date.now() });

      const serialized = comboState.toJSON();

      expect(serialized).toHaveProperty('currentCombo', 2);
      expect(serialized).toHaveProperty('maxCombo', 2);
      expect(serialized).toHaveProperty('totalCombos', 2);
      expect(serialized).toHaveProperty('comboHistory');
      expect(Array.isArray(serialized.comboHistory)).toBe(true);
    });

    test('JSONから状態を復元できる', () => {
      const data = {
        currentCombo: 3,
        maxCombo: 5,
        totalCombos: 10,
        comboHistory: [{ maxCombo: 5, duration: 2000, timestamp: Date.now() }],
      };

      const restoredComboState = ComboState.fromJSON(data);

      expect(restoredComboState.currentCombo).toBe(3);
      expect(restoredComboState.maxCombo).toBe(5);
      expect(restoredComboState.totalCombos).toBe(10);
      expect(restoredComboState.comboHistory).toEqual(data.comboHistory);
    });

    test('無効なJSONデータは適切に処理される', () => {
      const invalidData = { invalidField: 'test' };
      const restoredComboState = ComboState.fromJSON(invalidData);

      // デフォルト値で初期化される
      expect(restoredComboState.currentCombo).toBe(0);
      expect(restoredComboState.maxCombo).toBe(0);
    });
  });

  describe('パフォーマンス', () => {
    test('大量のコンボ操作が効率的に処理される', () => {
      const startTime = performance.now();

      for (let i = 0; i < 1000; i++) {
        comboState.incrementCombo();
      }

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100); // 100ms以内
    });

    test('大量の履歴データでも統計計算が高速', () => {
      // 大量の履歴データを追加
      for (let i = 0; i < 100; i++) {
        comboState.addToHistory({
          maxCombo: Math.floor(Math.random() * 20) + 1,
          duration: Math.floor(Math.random() * 5000) + 1000,
          timestamp: Date.now() - i * 1000,
        });
      }

      const startTime = performance.now();
      const stats = comboState.getComboStats();
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(10); // 10ms以内
      expect(stats.averageCombo).toBeGreaterThan(0);
    });
  });

  describe('エラーハンドリング', () => {
    test('不正な操作でもエラーが発生しない', () => {
      expect(() => {
        comboState.incrementCombo();
        comboState.resetCombo();
        comboState.incrementCombo();
        comboState.getComboStats();
      }).not.toThrow();
    });

    test('メモリリークが発生しない', () => {
      const initialMemory = process.memoryUsage ? process.memoryUsage().heapUsed : 0;

      // 大量のコンボ操作とリセットを繰り返す
      for (let i = 0; i < 100; i++) {
        for (let j = 0; j < 10; j++) {
          comboState.incrementCombo();
        }
        comboState.resetCombo();
      }

      // ガベージコレクションを促進（可能な場合）
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage ? process.memoryUsage().heapUsed : 0;
      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB

      expect(memoryIncrease).toBeLessThan(1); // 1MB以内
    });
  });
});
