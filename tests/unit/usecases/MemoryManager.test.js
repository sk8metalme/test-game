import MemoryManager from '../../../src/core/usecases/MemoryManager.js';

describe('MemoryManager', () => {
  let memoryManager;
  let mockPerformanceMonitor;
  let mockObjectPool;
  let mockWeakMapRegistry;

  beforeEach(() => {
    // NODE_ENVをtestに設定
    process.env.NODE_ENV = 'test';

    // PerformanceMonitorのモック作成
    mockPerformanceMonitor = {
      getCurrentMemoryUsage: jest.fn(() => 50), // 50MB
      getMemoryTrend: jest.fn(() => ({ trend: 'stable', rate: 0.1 })),
      recordMemoryUsage: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };

    // ObjectPoolのモック作成
    mockObjectPool = {
      getActiveObjectCount: jest.fn(() => 100),
      getUnusedObjectCount: jest.fn(() => 20),
      releaseUnusedObjects: jest.fn(),
      optimizePoolSize: jest.fn(),
      getPoolStats: jest.fn(() => ({
        active: 100,
        unused: 20,
        efficiency: 0.83,
      })),
    };

    // WeakMapRegistryのモック作成
    mockWeakMapRegistry = {
      register: jest.fn(),
      unregister: jest.fn(),
      scanForLeaks: jest.fn(() => []),
      getRegisteredCount: jest.fn(() => 0),
    };

    memoryManager = new MemoryManager({
      performanceMonitor: mockPerformanceMonitor,
      objectPool: mockObjectPool,
      weakMapRegistry: mockWeakMapRegistry,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    if (memoryManager && !memoryManager.isDestroyed) {
      memoryManager.destroy();
    }
  });

  describe('コンストラクタ', () => {
    test('正しく初期化される', () => {
      expect(memoryManager).toBeInstanceOf(MemoryManager);
      expect(memoryManager.performanceMonitor).toBe(mockPerformanceMonitor);
      expect(memoryManager.objectPool).toBe(mockObjectPool);
      expect(memoryManager.isMonitoring).toBe(false);
    });

    test('デフォルト設定で初期化される', () => {
      const defaultManager = new MemoryManager();
      expect(defaultManager).toBeInstanceOf(MemoryManager);
      expect(defaultManager.config).toHaveProperty('thresholds');
      expect(defaultManager.config).toHaveProperty('intervals');
    });

    test('カスタム設定で初期化される', () => {
      const customConfig = {
        thresholds: {
          warning: 70,
          critical: 90,
          leakDetection: 5,
        },
        intervals: {
          monitoring: 2000,
          cleanup: 10000,
          leakScan: 30000,
        },
      };

      const customManager = new MemoryManager({
        config: customConfig,
        performanceMonitor: mockPerformanceMonitor,
      });

      expect(customManager.config.thresholds.warning).toBe(70);
      expect(customManager.config.intervals.monitoring).toBe(2000);
    });

    test('必須依存関係なしでも動作する', () => {
      const standaloneManager = new MemoryManager();
      expect(standaloneManager.performanceMonitor).toBeDefined();
      expect(standaloneManager.objectPool).toBeDefined();
    });
  });

  describe('startMemoryMonitoring()', () => {
    test('メモリ監視を開始できる', () => {
      memoryManager.startMemoryMonitoring();
      expect(memoryManager.isMonitoring).toBe(true);
      expect(mockPerformanceMonitor.addEventListener).toHaveBeenCalled();
    });

    test('既に監視中の場合は重複開始しない', () => {
      // 最初の監視開始
      memoryManager.startMemoryMonitoring();
      expect(mockPerformanceMonitor.addEventListener).toHaveBeenCalledTimes(2); // warning + critical

      // 2回目の監視開始（重複）
      mockPerformanceMonitor.addEventListener.mockClear();
      memoryManager.startMemoryMonitoring();

      expect(mockPerformanceMonitor.addEventListener).toHaveBeenCalledTimes(0); // 重複登録されない
    });

    test('監視間隔が正しく設定される', () => {
      memoryManager.startMemoryMonitoring();
      expect(memoryManager.monitoringInterval).toBeDefined();
    });

    test('破棄後の監視開始はエラーをスロー', () => {
      memoryManager.destroy();
      expect(() => {
        memoryManager.startMemoryMonitoring();
      }).toThrow('MemoryManager has been destroyed');
    });
  });

  describe('stopMemoryMonitoring()', () => {
    test('メモリ監視を停止できる', () => {
      memoryManager.startMemoryMonitoring();
      memoryManager.stopMemoryMonitoring();

      expect(memoryManager.isMonitoring).toBe(false);
      expect(mockPerformanceMonitor.removeEventListener).toHaveBeenCalled();
    });

    test('監視していない状態での停止は安全に処理される', () => {
      expect(() => {
        memoryManager.stopMemoryMonitoring();
      }).not.toThrow();
    });

    test('監視間隔がクリアされる', () => {
      memoryManager.startMemoryMonitoring();
      const intervalId = memoryManager.monitoringInterval;
      memoryManager.stopMemoryMonitoring();

      expect(memoryManager.monitoringInterval).toBeNull();
    });
  });

  describe('scanForLeaks()', () => {
    test('リークスキャンを実行できる', async () => {
      mockWeakMapRegistry.scanForLeaks.mockResolvedValue([
        { type: 'EventListener', count: 3, target: 'canvas' },
        { type: 'WebGLContext', count: 1, target: 'renderer' },
      ]);

      const leaks = await memoryManager.scanForLeaks();

      expect(mockWeakMapRegistry.scanForLeaks).toHaveBeenCalled();
      expect(leaks).toHaveLength(2);
      expect(leaks[0].type).toBe('EventListener');
    });

    test('リークが見つからない場合は空配列を返す', async () => {
      mockWeakMapRegistry.scanForLeaks.mockResolvedValue([]);

      const leaks = await memoryManager.scanForLeaks();

      expect(leaks).toEqual([]);
    });

    test('スキャン中にエラーが発生した場合の処理', async () => {
      mockWeakMapRegistry.scanForLeaks.mockRejectedValue(new Error('Scan failed'));

      await expect(memoryManager.scanForLeaks()).rejects.toThrow('Memory leak scan failed');
    });

    test('スキャン結果が履歴に記録される', async () => {
      mockWeakMapRegistry.scanForLeaks.mockResolvedValue([
        { type: 'EventListener', count: 2, target: 'button' },
      ]);

      await memoryManager.scanForLeaks();

      const history = memoryManager.getLeakScanHistory();
      expect(history).toHaveLength(1);
      expect(history[0].leaksFound).toBe(1);
    });

    test('履歴の最大サイズ制限', async () => {
      mockWeakMapRegistry.scanForLeaks.mockResolvedValue([]);

      // 50回スキャンを実行
      for (let i = 0; i < 50; i++) {
        await memoryManager.scanForLeaks();
      }

      const history = memoryManager.getLeakScanHistory();
      expect(history).toHaveLength(20); // 最大20件に制限
    });
  });

  describe('optimizeObjectPools()', () => {
    test('オブジェクトプール最適化を実行できる', () => {
      const result = memoryManager.optimizeObjectPools();

      expect(mockObjectPool.releaseUnusedObjects).toHaveBeenCalled();
      expect(mockObjectPool.optimizePoolSize).toHaveBeenCalled();
      expect(result).toHaveProperty('released');
      expect(result).toHaveProperty('optimized');
    });

    test('プール効率が低い場合に警告を発行', () => {
      mockObjectPool.getPoolStats.mockReturnValue({
        active: 100,
        unused: 80, // 効率20%
        efficiency: 0.2,
      });

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      memoryManager.optimizeObjectPools();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Low pool efficiency detected')
      );

      consoleSpy.mockRestore();
    });

    test('最適化統計が記録される', () => {
      memoryManager.optimizeObjectPools();

      const stats = memoryManager.getOptimizationStats();
      expect(stats.totalOptimizations).toBe(1);
      expect(stats.lastOptimization).toBeDefined();
    });
  });

  describe('shouldTriggerGC()', () => {
    test('メモリ使用量が閾値を超えた場合にtrueを返す', () => {
      mockPerformanceMonitor.getCurrentMemoryUsage.mockReturnValue(85); // 85MB (warning閾値80を超過)

      const shouldTrigger = memoryManager.shouldTriggerGC();

      expect(shouldTrigger).toBe(true);
    });

    test('メモリ使用量が閾値以下の場合にfalseを返す', () => {
      mockPerformanceMonitor.getCurrentMemoryUsage.mockReturnValue(50); // 50MB

      const shouldTrigger = memoryManager.shouldTriggerGC();

      expect(shouldTrigger).toBe(false);
    });

    test('メモリ増加トレンドが急激な場合にtrueを返す', () => {
      mockPerformanceMonitor.getCurrentMemoryUsage.mockReturnValue(60);
      mockPerformanceMonitor.getMemoryTrend.mockReturnValue({
        trend: 'increasing',
        rate: 2.5, // 急激な増加
      });

      const shouldTrigger = memoryManager.shouldTriggerGC();

      expect(shouldTrigger).toBe(true);
    });

    test('直近でGCが実行された場合はfalseを返す', () => {
      mockPerformanceMonitor.getCurrentMemoryUsage.mockReturnValue(85);

      // 直近でGCを実行したことをシミュレート
      memoryManager.lastGCTime = Date.now() - 1000; // 1秒前

      const shouldTrigger = memoryManager.shouldTriggerGC();

      expect(shouldTrigger).toBe(false);
    });
  });

  describe('forceGarbageCollection()', () => {
    test('手動ガベージコレクションを実行できる', async () => {
      const initialMemory = 80;
      const afterGCMemory = 50;

      mockPerformanceMonitor.getCurrentMemoryUsage
        .mockReturnValueOnce(initialMemory)
        .mockReturnValueOnce(afterGCMemory);

      const result = await memoryManager.forceGarbageCollection();

      expect(result).toHaveProperty('before', initialMemory);
      expect(result).toHaveProperty('after', afterGCMemory);
      expect(result).toHaveProperty('freed', 30);
      expect(memoryManager.lastGCTime).toBeDefined();
    }, 15000);

    test('GC実行後にメモリ使用量が記録される', async () => {
      await memoryManager.forceGarbageCollection();

      expect(mockPerformanceMonitor.recordMemoryUsage).toHaveBeenCalled();
    }, 15000);

    test('GC統計が更新される', async () => {
      // メモリ使用量を変化させるモック設定
      mockPerformanceMonitor.getCurrentMemoryUsage
        .mockReturnValueOnce(80) // GC実行前
        .mockReturnValueOnce(60); // GC実行後

      await memoryManager.forceGarbageCollection();

      const stats = memoryManager.getGCStats();
      expect(stats.totalGCExecutions).toBe(1);
      expect(stats.averageFreedMemory).toBeGreaterThan(0);
      expect(stats.totalFreedMemory).toBe(20);
    }, 15000);
  });

  describe('getMemoryReport()', () => {
    test('包括的なメモリレポートを生成できる', () => {
      const report = memoryManager.getMemoryReport();

      expect(report).toHaveProperty('currentUsage');
      expect(report).toHaveProperty('pools');
      expect(report).toHaveProperty('leaks');
      expect(report).toHaveProperty('gc');
      expect(report).toHaveProperty('recommendations');
    });

    test('推奨事項が適切に生成される', () => {
      mockPerformanceMonitor.getCurrentMemoryUsage.mockReturnValue(85);
      mockObjectPool.getPoolStats.mockReturnValue({
        active: 100,
        unused: 50,
        efficiency: 0.5,
      });

      const report = memoryManager.getMemoryReport();

      expect(report.recommendations).toContain('Consider triggering garbage collection');
      expect(report.recommendations).toContain('Optimize object pools');
    });
  });

  describe('autoCleanup()', () => {
    test('自動クリーンアップが実行される', async () => {
      mockPerformanceMonitor.getCurrentMemoryUsage.mockReturnValue(85);

      const result = await memoryManager.autoCleanup();

      expect(result.actions).toContain('gc');
      expect(result.actions).toContain('poolOptimization');
      expect(mockObjectPool.releaseUnusedObjects).toHaveBeenCalled();
    }, 15000);

    test('メモリ使用量が正常な場合はクリーンアップしない', async () => {
      mockPerformanceMonitor.getCurrentMemoryUsage.mockReturnValue(40);

      const result = await memoryManager.autoCleanup();

      expect(result.actions).toEqual([]);
      expect(mockObjectPool.releaseUnusedObjects).not.toHaveBeenCalled();
    });

    test('クリーンアップ統計が記録される', async () => {
      mockPerformanceMonitor.getCurrentMemoryUsage.mockReturnValue(85);

      await memoryManager.autoCleanup();

      const stats = memoryManager.getCleanupStats();
      expect(stats.totalCleanups).toBe(1);
      expect(stats.lastCleanup).toBeDefined();
    }, 15000);
  });

  describe('registerWeakReference()', () => {
    test('WeakMapに参照を登録できる', () => {
      const obj = { id: 'test' };
      const key = 'test-object';

      memoryManager.registerWeakReference(key, obj);

      expect(mockWeakMapRegistry.register).toHaveBeenCalledWith(key, obj);
    });

    test('null/undefinedオブジェクトは登録されない', () => {
      memoryManager.registerWeakReference('null-test', null);
      memoryManager.registerWeakReference('undefined-test', undefined);

      expect(mockWeakMapRegistry.register).not.toHaveBeenCalled();
    });
  });

  describe('unregisterWeakReference()', () => {
    test('WeakMapから参照を削除できる', () => {
      const key = 'test-object';

      memoryManager.unregisterWeakReference(key);

      expect(mockWeakMapRegistry.unregister).toHaveBeenCalledWith(key);
    });
  });

  describe('エラーハンドリング', () => {
    test('PerformanceMonitorエラー時の安全な処理', () => {
      mockPerformanceMonitor.getCurrentMemoryUsage.mockImplementation(() => {
        throw new Error('Monitor error');
      });

      expect(() => {
        memoryManager.shouldTriggerGC();
      }).not.toThrow();
    });

    test('ObjectPoolエラー時のフォールバック', () => {
      mockObjectPool.releaseUnusedObjects.mockImplementation(() => {
        throw new Error('Pool error');
      });

      expect(() => {
        memoryManager.optimizeObjectPools();
      }).not.toThrow();
    });

    test('非同期エラーの適切な処理', async () => {
      mockWeakMapRegistry.scanForLeaks.mockRejectedValue(new Error('Async error'));

      await expect(memoryManager.scanForLeaks()).rejects.toThrow();
    });
  });

  describe('destroy()', () => {
    test('MemoryManagerを適切に破棄できる', () => {
      memoryManager.startMemoryMonitoring();
      memoryManager.destroy();

      expect(memoryManager.isDestroyed).toBe(true);
      expect(memoryManager.isMonitoring).toBe(false);
      expect(mockPerformanceMonitor.removeEventListener).toHaveBeenCalled();
    });

    test('破棄後の操作でエラーが発生する', () => {
      memoryManager.destroy();

      expect(() => {
        memoryManager.startMemoryMonitoring();
      }).toThrow('MemoryManager has been destroyed');
    });

    test('重複破棄は安全に処理される', () => {
      memoryManager.destroy();

      expect(() => {
        memoryManager.destroy();
      }).not.toThrow();
    });
  });

  describe('パフォーマンス', () => {
    test('メモリスキャンが適切な時間内に完了する', async () => {
      const startTime = performance.now();
      await memoryManager.scanForLeaks();
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // 100ms以内
    });

    test('オブジェクトプール最適化が高速実行される', () => {
      const startTime = performance.now();
      memoryManager.optimizeObjectPools();
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(50); // 50ms以内
    });

    test('大量データでもメモリ使用量が制限される', () => {
      // 大量のリークスキャン履歴を生成
      for (let i = 0; i < 100; i++) {
        memoryManager.addToLeakScanHistory({
          timestamp: Date.now(),
          leaksFound: i % 3,
        });
      }

      const initialMemory = process.memoryUsage().heapUsed;
      const report = memoryManager.getMemoryReport();
      const finalMemory = process.memoryUsage().heapUsed;

      expect(finalMemory - initialMemory).toBeLessThan(1024 * 1024); // 1MB未満
    });
  });
});
