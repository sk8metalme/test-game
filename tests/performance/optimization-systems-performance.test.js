/**
 * optimization-systems-performance.test.js - 最適化システムのパフォーマンステスト
 *
 * テスト内容:
 * - ParticleSystemOptimizerのパフォーマンス
 * - EventSystemOptimizerのパフォーマンス
 * - RenderingOptimizerのパフォーマンス
 * - MemoryOptimizerのパフォーマンス
 * - PerformanceOptimizationManagerの統合パフォーマンス
 */

import { PerformanceTestHelper } from '../utils/test-helpers.js';
import ParticleSystemOptimizer from '../../src/core/usecases/ParticleSystemOptimizer.js';
import EventSystemOptimizer from '../../src/core/usecases/EventSystemOptimizer.js';
import RenderingOptimizer from '../../src/core/usecases/RenderingOptimizer.js';
import MemoryOptimizer from '../../src/core/usecases/MemoryOptimizer.js';
import PerformanceOptimizationManager from '../../src/core/usecases/PerformanceOptimizationManager.js';
import GameEventEmitter from '../../src/core/usecases/GameEventEmitter.js';

describe('最適化システム パフォーマンステスト', () => {
  let particleOptimizer;
  let eventOptimizer;
  let renderingOptimizer;
  let memoryOptimizer;
  let optimizationManager;

  beforeEach(() => {
    // 最適化システムの初期化
    particleOptimizer = new ParticleSystemOptimizer();
    eventOptimizer = new EventSystemOptimizer();
    renderingOptimizer = new RenderingOptimizer();
    memoryOptimizer = new MemoryOptimizer();
    optimizationManager = new PerformanceOptimizationManager();
  });

  afterEach(() => {
    // クリーンアップ
    if (optimizationManager) {
      optimizationManager.destroy();
    }
    if (memoryOptimizer) {
      memoryOptimizer.destroy();
    }
  });

  describe('ParticleSystemOptimizer パフォーマンス', () => {
    test('大量メトリクス更新のパフォーマンス', () => {
      const iterations = 10000;
      const metrics = {
        fps: 30,
        frameTime: 33.33,
        memoryUsage: 0.9,
        particleCount: 1000,
        renderTime: 20,
        updateTime: 10,
      };

      // パフォーマンス測定
      const result = PerformanceTestHelper.benchmarkFunction(
        () => particleOptimizer.updateMetrics(metrics),
        iterations
      );

      // パフォーマンス検証
      expect(result.averageTime).toBeLessThan(0.1); // 平均0.1ms以下
      expect(result.timesPerSecond).toBeGreaterThan(10000); // 1秒間に10000回以上
    });

    test('最適化実行のパフォーマンス', () => {
      const mockParticleSystem = {
        config: { maxParticles: 1000, targetFPS: 60 },
        renderer: { enableLOD: false, batchSize: 100 },
        particlePool: { maxSize: 1000, cleanup: jest.fn() },
      };

      const iterations = 1000;

      // パフォーマンス測定
      const result = PerformanceTestHelper.benchmarkFunction(
        () => particleOptimizer.optimize(mockParticleSystem),
        iterations
      );

      // パフォーマンス検証
      expect(result.averageTime).toBeLessThan(1); // 平均1ms以下
    });

    test('品質レベル設定のパフォーマンス', () => {
      const mockParticleSystem = {
        config: { maxParticles: 1000, targetFPS: 60 },
        renderer: { enableLOD: false, batchSize: 100 },
        particlePool: { maxSize: 1000 },
      };

      const iterations = 1000;

      // パフォーマンス測定
      const result = PerformanceTestHelper.benchmarkFunction(
        () => particleOptimizer.setQualityLevel(3, mockParticleSystem),
        iterations
      );

      // パフォーマンス検証
      expect(result.averageTime).toBeLessThan(0.5); // 平均0.5ms以下
    });
  });

  describe('EventSystemOptimizer パフォーマンス', () => {
    let eventEmitter;

    beforeEach(() => {
      eventEmitter = new GameEventEmitter({ enableValidation: false });
    });

    test('大量イベントエミッター最適化のパフォーマンス', () => {
      const iterations = 1000;

      // パフォーマンス測定
      const result = PerformanceTestHelper.benchmarkFunction(
        () => eventOptimizer.optimizeEventEmitter(eventEmitter),
        iterations
      );

      // パフォーマンス検証
      expect(result.averageTime).toBeLessThan(1); // 平均1ms以下
    });

    test('イベントバッチ処理のパフォーマンス', () => {
      const iterations = 1000;
      const eventData = { test: 'data' };

      // パフォーマンス測定
      const result = PerformanceTestHelper.benchmarkFunction(
        () => eventOptimizer.batchEvent('test.event', eventData, eventEmitter),
        iterations
      );

      // パフォーマンス検証
      expect(result.averageTime).toBeLessThan(0.1); // 平均0.1ms以下
    });

    test('クリーンアップ処理のパフォーマンス', () => {
      const iterations = 100;

      // パフォーマンス測定
      const result = PerformanceTestHelper.benchmarkFunction(
        () => eventOptimizer.performCleanup(eventEmitter),
        iterations
      );

      // パフォーマンス検証
      expect(result.averageTime).toBeLessThan(5); // 平均5ms以下
    });
  });

  describe('RenderingOptimizer パフォーマンス', () => {
    test('フレーム最適化のパフォーマンス', () => {
      const mockRenderFunction = jest.fn(() => ({ rendered: true }));
      const renderData = {
        particles: Array(100)
          .fill()
          .map(() => ({
            position: { x: Math.random() * 800, y: Math.random() * 600 },
            size: 5,
            color: '#ff0000',
          })),
        renderSettings: { alpha: 1.0, scale: 1.0 },
      };

      const iterations = 1000;

      // パフォーマンス測定
      const result = PerformanceTestHelper.benchmarkFunction(
        () => renderingOptimizer.optimizeFrame(mockRenderFunction, renderData),
        iterations
      );

      // パフォーマンス検証
      expect(result.averageTime).toBeLessThan(2); // 平均2ms以下
    });

    test('LODレベル設定のパフォーマンス', () => {
      const iterations = 10000;

      // パフォーマンス測定
      const result = PerformanceTestHelper.benchmarkFunction(
        () => renderingOptimizer.setLODLevel(2, { x: 400, y: 300 }),
        iterations
      );

      // パフォーマンス検証
      expect(result.averageTime).toBeLessThan(0.1); // 平均0.1ms以下
    });

    test('バッチ処理のパフォーマンス', () => {
      const mockRenderFunction = jest.fn(() => ({ rendered: true }));
      const renderData = { test: 'data' };

      const iterations = 1000;

      // パフォーマンス測定
      const result = PerformanceTestHelper.benchmarkFunction(() => {
        renderingOptimizer.addToBatch(renderData);
        return renderingOptimizer.processBatch(mockRenderFunction);
      }, iterations);

      // パフォーマンス検証
      expect(result.averageTime).toBeLessThan(1); // 平均1ms以下
    });
  });

  describe('MemoryOptimizer パフォーマンス', () => {
    test('メモリ監視のパフォーマンス', () => {
      const iterations = 10000;

      // パフォーマンス測定
      const result = PerformanceTestHelper.benchmarkFunction(
        () => memoryOptimizer.monitorMemory(),
        iterations
      );

      // パフォーマンス検証
      expect(result.averageTime).toBeLessThan(0.5); // 平均0.5ms以下
    });

    test('オブジェクトプール操作のパフォーマンス', () => {
      // テスト用オブジェクトプールを作成
      const createFn = () => ({ id: Math.random(), data: 'test' });
      const resetFn = obj => {
        obj.data = 'reset';
      };

      memoryOptimizer.createObjectPool('testPool', createFn, resetFn, 100, 1000);

      const iterations = 1000;

      // パフォーマンス測定
      const result = PerformanceTestHelper.benchmarkFunction(() => {
        const obj = memoryOptimizer.getFromPool('testPool');
        if (obj) {
          memoryOptimizer.returnToPool('testPool', obj);
        }
      }, iterations);

      // パフォーマンス検証
      expect(result.averageTime).toBeLessThan(0.1); // 平均0.1ms以下
    });

    test('メモリ最適化のパフォーマンス', () => {
      const iterations = 100;

      // パフォーマンス測定
      const result = PerformanceTestHelper.benchmarkFunction(
        () => memoryOptimizer.optimizeMemory(),
        iterations
      );

      // パフォーマンス検証
      expect(result.averageTime).toBeLessThan(10); // 平均10ms以下
    });
  });

  describe('PerformanceOptimizationManager 統合パフォーマンス', () => {
    test('統合最適化のパフォーマンス', () => {
      const mockSystems = {
        particleSystem: {
          config: { maxParticles: 1000, targetFPS: 60 },
          renderer: { enableLOD: false, batchSize: 100 },
          particlePool: { maxSize: 1000, cleanup: jest.fn() },
        },
        eventEmitter: new GameEventEmitter({ enableValidation: false }),
        renderer: {
          render: jest.fn(() => ({ rendered: true })),
          data: { particles: [], renderSettings: {} },
        },
      };

      const iterations = 100;

      // パフォーマンス測定
      const result = PerformanceTestHelper.benchmarkFunction(
        () => optimizationManager.optimizeAll(mockSystems),
        iterations
      );

      // パフォーマンス検証
      expect(result.averageTime).toBeLessThan(50); // 平均50ms以下
    });

    test('メトリクス更新のパフォーマンス', () => {
      const metrics = {
        fps: 60,
        frameTime: 16.67,
        memoryUsage: 0.5,
        cpuUsage: 0.3,
        renderTime: 8,
        updateTime: 5,
        particleCount: 500,
        eventCount: 100,
      };

      const iterations = 10000;

      // パフォーマンス測定
      const result = PerformanceTestHelper.benchmarkFunction(
        () => optimizationManager.updateMetrics(metrics),
        iterations
      );

      // パフォーマンス検証
      expect(result.averageTime).toBeLessThan(0.2); // 平均0.2ms以下
    });

    test('レポート生成のパフォーマンス', () => {
      const iterations = 1000;

      // パフォーマンス測定
      const result = PerformanceTestHelper.benchmarkFunction(
        () => optimizationManager.generateReport(),
        iterations
      );

      // パフォーマンス検証
      expect(result.averageTime).toBeLessThan(5); // 平均5ms以下
    });

    test('統計取得のパフォーマンス', () => {
      const iterations = 10000;

      // パフォーマンス測定
      const result = PerformanceTestHelper.benchmarkFunction(
        () => optimizationManager.getStats(),
        iterations
      );

      // パフォーマンス検証
      expect(result.averageTime).toBeLessThan(0.5); // 平均0.5ms以下
    });
  });

  describe('メモリ使用量テスト', () => {
    test('最適化システムのメモリ効率', () => {
      const initialMemory = PerformanceTestHelper.measureMemoryUsage();
      const iterations = 1000;

      // 大量の最適化操作を実行
      for (let i = 0; i < iterations; i++) {
        particleOptimizer.updateMetrics({
          fps: Math.random() * 60,
          frameTime: Math.random() * 33,
          memoryUsage: Math.random(),
          particleCount: Math.floor(Math.random() * 1000),
        });

        if (i % 100 === 0) {
          memoryOptimizer.optimizeMemory();
        }
      }

      // ガベージコレクションを促進
      if (global.gc) {
        global.gc();
      }

      const finalMemory = PerformanceTestHelper.measureMemoryUsage();

      if (initialMemory && finalMemory) {
        const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
        const memoryIncreaseMB = memoryIncrease / 1024 / 1024;

        // メモリ増加量が20MB以下であることを確認
        expect(memoryIncreaseMB).toBeLessThan(20);
      }
    });

    test('オブジェクトプールのメモリ効率', () => {
      const initialMemory = PerformanceTestHelper.measureMemoryUsage();

      // 大量のオブジェクトプール操作
      const createFn = () => ({ id: Math.random(), data: 'test' });
      const resetFn = obj => {
        obj.data = 'reset';
      };

      memoryOptimizer.createObjectPool('testPool', createFn, resetFn, 1000, 5000);

      const iterations = 10000;
      for (let i = 0; i < iterations; i++) {
        const obj = memoryOptimizer.getFromPool('testPool');
        if (obj) {
          memoryOptimizer.returnToPool('testPool', obj);
        }
      }

      const finalMemory = PerformanceTestHelper.measureMemoryUsage();

      if (initialMemory && finalMemory) {
        const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
        const memoryIncreaseMB = memoryIncrease / 1024 / 1024;

        // メモリ増加量が10MB以下であることを確認
        expect(memoryIncreaseMB).toBeLessThan(10);
      }
    });
  });

  describe('スケーラビリティテスト', () => {
    test('大量システムでの最適化パフォーマンス', () => {
      const systems = [];
      const systemCount = 100;

      // 大量のシステムを作成
      for (let i = 0; i < systemCount; i++) {
        systems.push({
          particleSystem: {
            config: { maxParticles: 1000, targetFPS: 60 },
            renderer: { enableLOD: false, batchSize: 100 },
            particlePool: { maxSize: 1000, cleanup: jest.fn() },
          },
          eventEmitter: new GameEventEmitter({ enableValidation: false }),
        });
      }

      const startTime = performance.now();

      // 全システムの最適化を実行
      for (const system of systems) {
        optimizationManager.optimizeAll(system);
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // システムあたりの平均時間が1ms以下であることを確認
      const averageTimePerSystem = totalTime / systemCount;
      expect(averageTimePerSystem).toBeLessThan(1);
    });

    test('長時間実行での安定性', () => {
      const iterations = 10000;
      const metrics = {
        fps: 30,
        frameTime: 33.33,
        memoryUsage: 0.9,
        particleCount: 1000,
        renderTime: 20,
        updateTime: 10,
      };

      // 長時間実行をシミュレート
      const result = PerformanceTestHelper.benchmarkFunction(() => {
        particleOptimizer.updateMetrics(metrics);
        renderingOptimizer.optimizeFrame(() => ({}), { particles: [] });
      }, iterations);

      // パフォーマンス検証
      expect(result.averageTime).toBeLessThan(1); // 平均1ms以下
      expect(result.maxTime).toBeLessThan(10); // 最大10ms以下
    });
  });
});
