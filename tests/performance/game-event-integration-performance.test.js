/**
 * game-event-integration-performance.test.js - ゲームイベント統合システムのパフォーマンステスト
 *
 * テスト内容:
 * - GameEventEmitterのパフォーマンス
 * - GameEventIntegratorのパフォーマンス
 * - 大量イベント処理の効率性
 * - メモリ使用量の監視
 * - イベント履歴管理の効率性
 */

import { PerformanceTestHelper } from '../utils/test-helpers.js';
import GameEventEmitter from '../../src/core/usecases/GameEventEmitter.js';
import GameEventIntegrator from '../../src/core/usecases/GameEventIntegrator.js';
import GameLogic from '../../src/core/usecases/GameLogic.js';
import { GameState } from '../../src/core/entities/GameState.js';
import Board from '../../src/core/entities/Board.js';
import EffectManager from '../../src/core/usecases/EffectManager.js';

// モックの設定
jest.mock('../../src/core/usecases/EffectManager');

describe('ゲームイベント統合システム パフォーマンステスト', () => {
  let gameEventEmitter;
  let gameEventIntegrator;
  let gameLogic;
  let gameState;
  let board;
  let effectManager;
  let mockCanvas;

  beforeEach(() => {
    // モックのリセット
    jest.clearAllMocks();

    // モックCanvasの作成
    mockCanvas = {
      getContext: jest.fn().mockReturnValue({
        fillRect: jest.fn(),
        clearRect: jest.fn(),
        fillText: jest.fn(),
        setTransform: jest.fn(),
        translate: jest.fn(),
        scale: jest.fn(),
        save: jest.fn(),
        restore: jest.fn(),
      }),
      width: 800,
      height: 600,
    };

    // モックEffectManagerの設定
    EffectManager.mockImplementation(() => ({
      playEffect: jest.fn(),
      getStats: jest.fn().mockReturnValue({
        totalEffectsPlayed: 0,
        activeEffectsCount: 0,
      }),
    }));

    // インスタンスの作成（検証を無効にしてテスト用イベントを許可）
    gameEventEmitter = new GameEventEmitter({ enableValidation: false });
    board = new Board();
    gameState = new GameState();
    gameLogic = new GameLogic(board, gameState);
    effectManager = new EffectManager(mockCanvas);
    gameEventIntegrator = new GameEventIntegrator(gameLogic, effectManager);
  });

  afterEach(() => {
    if (gameEventIntegrator) {
      gameEventIntegrator.disconnect();
    }
  });

  describe('GameEventEmitter パフォーマンス', () => {
    test('大量イベント発行のパフォーマンス', () => {
      const iterations = 10000;
      const eventName = 'test.event';
      const eventData = { test: 'data' };

      // リスナーを登録
      const listener = jest.fn();
      gameEventEmitter.on(eventName, listener);

      // パフォーマンス測定
      const result = PerformanceTestHelper.benchmarkFunction(
        () => gameEventEmitter.emit(eventName, eventData),
        iterations
      );

      // パフォーマンス検証
      expect(result.averageTime).toBeLessThan(0.1); // 平均0.1ms以下
      expect(result.timesPerSecond).toBeGreaterThan(10000); // 1秒間に10000回以上
      expect(listener).toHaveBeenCalledTimes(iterations);
    });

    test('大量リスナー登録のパフォーマンス', () => {
      const iterations = 1000;
      const eventName = 'test.event';
      const listeners = [];

      // パフォーマンス測定
      const result = PerformanceTestHelper.benchmarkFunction(() => {
        const listener = jest.fn();
        listeners.push(listener);
        gameEventEmitter.on(eventName, listener);
      }, iterations);

      // パフォーマンス検証
      expect(result.averageTime).toBeLessThan(0.5); // 平均0.5ms以下
      expect(gameEventEmitter.listenerCount(eventName)).toBe(iterations);
    });

    test('イベント履歴管理のパフォーマンス', () => {
      const iterations = 5000;
      const eventName = 'test.event';
      const eventData = { test: 'data' };

      // パフォーマンス測定
      const result = PerformanceTestHelper.benchmarkFunction(
        () => gameEventEmitter.emit(eventName, eventData),
        iterations
      );

      // 履歴の取得パフォーマンス
      const historyResult = PerformanceTestHelper.measureExecutionTime(() => {
        return gameEventEmitter.getEventHistory({ limit: 1000 });
      });

      // パフォーマンス検証
      expect(result.averageTime).toBeLessThan(0.2); // 平均0.2ms以下
      expect(historyResult.executionTime).toBeLessThan(1); // 履歴取得1ms以下
      expect(gameEventEmitter.getEventHistory()).toHaveLength(
        Math.min(iterations, gameEventEmitter.config.maxHistorySize)
      );
    });

    test('統計情報更新のパフォーマンス', () => {
      const iterations = 10000;
      const eventName = 'test.event';
      const eventData = { test: 'data' };

      // パフォーマンス測定
      const result = PerformanceTestHelper.benchmarkFunction(
        () => gameEventEmitter.emit(eventName, eventData),
        iterations
      );

      // 統計取得のパフォーマンス
      const statsResult = PerformanceTestHelper.measureExecutionTime(() => {
        return gameEventEmitter.getStats();
      });

      // パフォーマンス検証
      expect(result.averageTime).toBeLessThan(0.1); // 平均0.1ms以下
      expect(statsResult.executionTime).toBeLessThan(0.5); // 統計取得0.5ms以下
    });
  });

  describe('GameEventIntegrator パフォーマンス', () => {
    beforeEach(() => {
      gameEventIntegrator.integrate();
    });

    test('大量イベント処理のパフォーマンス', () => {
      const iterations = 1000;
      const eventData = {
        data: {
          count: 1,
          type: 'single',
          score: 40,
        },
      };

      // パフォーマンス測定
      const result = PerformanceTestHelper.benchmarkFunction(
        () => gameEventIntegrator.handleLineClear(eventData),
        iterations
      );

      // パフォーマンス検証
      expect(result.averageTime).toBeLessThan(1); // 平均1ms以下
      expect(effectManager.playEffect).toHaveBeenCalledTimes(iterations);
    });

    test('統合・切断のパフォーマンス', () => {
      // 統合のパフォーマンス
      const integrateResult = PerformanceTestHelper.measureExecutionTime(() => {
        gameEventIntegrator.integrate();
      });

      // 切断のパフォーマンス
      const disconnectResult = PerformanceTestHelper.measureExecutionTime(() => {
        gameEventIntegrator.disconnect();
      });

      // パフォーマンス検証
      expect(integrateResult.executionTime).toBeLessThan(5); // 統合5ms以下
      expect(disconnectResult.executionTime).toBeLessThan(5); // 切断5ms以下
    });

    test('統計情報収集のパフォーマンス', () => {
      // いくつかのイベントを処理
      for (let i = 0; i < 100; i++) {
        gameEventIntegrator.handleLineClear({
          data: { count: 1, type: 'single', score: 40 },
        });
        gameEventIntegrator.handleLevelUp({
          data: { newLevel: 2, oldLevel: 1 },
        });
      }

      // 統計取得のパフォーマンス
      const result = PerformanceTestHelper.measureExecutionTime(() => {
        return gameEventIntegrator.getStats();
      });

      // パフォーマンス検証
      expect(result.executionTime).toBeLessThan(1); // 統計取得1ms以下
      expect(result.result.totalEventsProcessed).toBe(200);
      expect(result.result.totalEffectsTriggered).toBe(200);
    });
  });

  describe('メモリ使用量テスト', () => {
    test('大量イベント発行でのメモリリーク検出', () => {
      const initialMemory = PerformanceTestHelper.measureMemoryUsage();
      const iterations = 10000;

      // 大量のイベントを発行
      for (let i = 0; i < iterations; i++) {
        gameEventEmitter.emit('test.event', { iteration: i });
      }

      // ガベージコレクションを促進
      if (global.gc) {
        global.gc();
      }

      const finalMemory = PerformanceTestHelper.measureMemoryUsage();

      if (initialMemory && finalMemory) {
        const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
        const memoryIncreaseMB = memoryIncrease / 1024 / 1024;

        // メモリ増加量が10MB以下であることを確認
        expect(memoryIncreaseMB).toBeLessThan(10);
      }
    });

    test('大量リスナー登録でのメモリ使用量', () => {
      const initialMemory = PerformanceTestHelper.measureMemoryUsage();
      const iterations = 1000;

      // 大量のリスナーを登録
      for (let i = 0; i < iterations; i++) {
        gameEventEmitter.on(`test.event.${i}`, jest.fn());
      }

      const finalMemory = PerformanceTestHelper.measureMemoryUsage();

      if (initialMemory && finalMemory) {
        const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
        const memoryIncreaseMB = memoryIncrease / 1024 / 1024;

        // メモリ増加量が6MB以下であることを確認
        expect(memoryIncreaseMB).toBeLessThan(6);
      }
    });

    test('イベント履歴のメモリ効率', () => {
      const initialMemory = PerformanceTestHelper.measureMemoryUsage();
      const iterations = 10000;

      // 大量のイベントを発行（履歴に記録）
      for (let i = 0; i < iterations; i++) {
        gameEventEmitter.emit('test.event', { iteration: i });
      }

      const finalMemory = PerformanceTestHelper.measureMemoryUsage();

      if (initialMemory && finalMemory) {
        const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
        const memoryIncreaseMB = memoryIncrease / 1024 / 1024;

        // 履歴サイズ制限により、メモリ増加量が制限されることを確認
        expect(memoryIncreaseMB).toBeLessThan(20);
      }
    });
  });

  describe('統合システムパフォーマンス', () => {
    beforeEach(() => {
      gameEventIntegrator.integrate();
    });

    test('実際のゲームシナリオでのパフォーマンス', () => {
      const iterations = 100;

      // 実際のゲームシナリオをシミュレート
      const result = PerformanceTestHelper.measureExecutionTime(() => {
        for (let i = 0; i < iterations; i++) {
          // ライン削除イベント
          gameEventIntegrator.handleLineClear({
            data: { count: 1, type: 'single', score: 40 },
          });

          // レベルアップイベント
          gameEventIntegrator.handleLevelUp({
            data: { newLevel: 2, oldLevel: 1 },
          });

          // ゲームオーバーイベント
          gameEventIntegrator.handleGameOver({
            data: { score: 1000, level: 5, lines: 50, time: 60000 },
          });
        }
      });

      // パフォーマンス検証
      expect(result.executionTime).toBeLessThan(100); // 100ms以下
      expect(effectManager.playEffect).toHaveBeenCalledTimes(iterations * 3);
    });

    test('並行イベント処理のパフォーマンス', () => {
      const iterations = 50;
      const concurrentEvents = 10;

      // 並行イベント処理をシミュレート
      const result = PerformanceTestHelper.measureExecutionTime(() => {
        for (let i = 0; i < iterations; i++) {
          const promises = [];

          for (let j = 0; j < concurrentEvents; j++) {
            promises.push(
              new Promise(resolve => {
                gameEventIntegrator.handleLineClear({
                  data: { count: 1, type: 'single', score: 40 },
                });
                resolve();
              })
            );
          }

          Promise.all(promises);
        }
      });

      // パフォーマンス検証
      expect(result.executionTime).toBeLessThan(200); // 200ms以下
    });
  });

  describe('スケーラビリティテスト', () => {
    test('大量エフェクト同時実行のパフォーマンス', () => {
      gameEventIntegrator.integrate();
      const iterations = 500;

      // 大量のエフェクトを同時実行
      const result = PerformanceTestHelper.measureExecutionTime(() => {
        for (let i = 0; i < iterations; i++) {
          gameEventIntegrator.handleLineClear({
            data: { count: 4, type: 'tetris', score: 1200 },
          });
        }
      });

      // パフォーマンス検証
      expect(result.executionTime).toBeLessThan(500); // 500ms以下
      expect(effectManager.playEffect).toHaveBeenCalledTimes(iterations);
    });

    test('長時間実行での安定性', () => {
      gameEventIntegrator.integrate();
      const iterations = 10000;

      // 長時間実行をシミュレート
      const result = PerformanceTestHelper.benchmarkFunction(() => {
        gameEventIntegrator.handleLineClear({
          data: { count: 1, type: 'single', score: 40 },
        });
      }, iterations);

      // パフォーマンス検証
      expect(result.averageTime).toBeLessThan(1); // 平均1ms以下
      expect(result.maxTime).toBeLessThan(10); // 最大10ms以下
    });
  });
});
