import AutoOptimizer from '../../../src/core/usecases/AutoOptimizer.js';

describe('AutoOptimizer', () => {
  let autoOptimizer;
  let mockPerformanceController;
  let mockConfigManager;

  beforeEach(() => {
    // PerformanceControllerのモック作成
    mockPerformanceController = {
      applyOptimization: jest.fn(),
      getCurrentMetrics: jest.fn(() => ({
        fps: 60,
        memoryUsage: 50,
        renderTime: 16,
      })),
      isOptimizationActive: jest.fn(() => false),
    };

    // ConfigManagerのモック作成
    mockConfigManager = {
      getOptimizationLevel: jest.fn(() => 'moderate'),
      setOptimizationLevel: jest.fn(),
      getThresholds: jest.fn(() => ({
        minFps: 45,
        maxMemory: 80,
        maxRenderTime: 20,
      })),
    };

    autoOptimizer = new AutoOptimizer(mockPerformanceController, mockConfigManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('コンストラクタ', () => {
    test('正しく初期化される', () => {
      expect(autoOptimizer).toBeInstanceOf(AutoOptimizer);
      expect(autoOptimizer.performanceController).toBe(mockPerformanceController);
      expect(autoOptimizer.configManager).toBe(mockConfigManager);
    });

    test('パフォーマンスコントローラが未定義の場合エラーをスロー', () => {
      expect(() => {
        new AutoOptimizer(undefined, mockConfigManager);
      }).toThrow('PerformanceController is required');
    });

    test('設定マネージャが未定義の場合エラーをスロー', () => {
      expect(() => {
        new AutoOptimizer(mockPerformanceController, undefined);
      }).toThrow('ConfigManager is required');
    });

    test('最適化履歴が空の配列で初期化される', () => {
      expect(autoOptimizer.getOptimizationHistory()).toEqual([]);
    });

    test('初期状態では最適化が非アクティブ', () => {
      expect(autoOptimizer.isOptimizing).toBe(false);
    });
  });

  describe('optimize()', () => {
    test('パフォーマンスデータを受け取って最適化を実行', async () => {
      const performanceData = {
        fps: 30, // 閾値45を下回る
        memoryUsage: 60,
        renderTime: 25,
      };

      await autoOptimizer.optimize(performanceData);

      expect(mockPerformanceController.applyOptimization).toHaveBeenCalled();
      expect(autoOptimizer.getOptimizationHistory()).toHaveLength(1);
    });

    test('FPS低下時にパーティクル数削減最適化を実行', async () => {
      const performanceData = {
        fps: 35, // 閾値45を下回る
        memoryUsage: 50,
        renderTime: 16,
      };

      await autoOptimizer.optimize(performanceData);

      expect(mockPerformanceController.applyOptimization).toHaveBeenCalledWith({
        type: 'particleReduction',
        level: 0.2, // 20%削減
        reason: 'FPS below threshold',
      });
    });

    test('メモリ使用量過多時にエフェクト品質低下を実行', async () => {
      const performanceData = {
        fps: 55,
        memoryUsage: 85, // 閾値80を上回る
        renderTime: 16,
      };

      await autoOptimizer.optimize(performanceData);

      expect(mockPerformanceController.applyOptimization).toHaveBeenCalledWith({
        type: 'effectQuality',
        level: 'medium',
        reason: 'Memory usage above threshold',
      });
    });

    test('重度のパフォーマンス低下時に緊急最適化を実行', async () => {
      const performanceData = {
        fps: 20, // 重度のFPS低下
        memoryUsage: 95, // 重度のメモリ使用
        renderTime: 35,
      };

      await autoOptimizer.optimize(performanceData);

      expect(mockPerformanceController.applyOptimization).toHaveBeenCalledWith({
        type: 'emergency',
        level: 'aggressive',
        actions: ['disableEffects', 'minimumRendering'],
        reason: 'Critical performance degradation',
      });
    });

    test('パフォーマンスが良好な場合は最適化を実行しない', async () => {
      const performanceData = {
        fps: 60,
        memoryUsage: 40,
        renderTime: 14,
      };

      await autoOptimizer.optimize(performanceData);

      expect(mockPerformanceController.applyOptimization).not.toHaveBeenCalled();
      expect(autoOptimizer.getOptimizationHistory()).toHaveLength(0);
    });

    test('無効なパフォーマンスデータでエラーをスロー', async () => {
      await expect(autoOptimizer.optimize(null)).rejects.toThrow('Invalid performance data');
      await expect(autoOptimizer.optimize({})).rejects.toThrow(
        'Performance data missing required fields'
      );
    });
  });

  describe('setOptimizationLevel()', () => {
    test('aggressive設定で強力な最適化を実行', () => {
      autoOptimizer.setOptimizationLevel('aggressive');
      expect(mockConfigManager.setOptimizationLevel).toHaveBeenCalledWith('aggressive');
    });

    test('moderate設定で標準的な最適化を実行', () => {
      autoOptimizer.setOptimizationLevel('moderate');
      expect(mockConfigManager.setOptimizationLevel).toHaveBeenCalledWith('moderate');
    });

    test('conservative設定で控えめな最適化を実行', () => {
      autoOptimizer.setOptimizationLevel('conservative');
      expect(mockConfigManager.setOptimizationLevel).toHaveBeenCalledWith('conservative');
    });

    test('無効な最適化レベルでエラーをスロー', () => {
      expect(() => {
        autoOptimizer.setOptimizationLevel('invalid');
      }).toThrow('Invalid optimization level');
    });
  });

  describe('getOptimizationHistory()', () => {
    test('最適化履歴を正しく記録', async () => {
      const performanceData = {
        fps: 30,
        memoryUsage: 60,
        renderTime: 25,
      };

      await autoOptimizer.optimize(performanceData);

      const history = autoOptimizer.getOptimizationHistory();
      expect(history).toHaveLength(1);
      expect(history[0]).toHaveProperty('timestamp');
      expect(history[0]).toHaveProperty('type');
      expect(history[0]).toHaveProperty('level');
      expect(history[0]).toHaveProperty('reason');
    });

    test('複数の最適化履歴を正しく管理', async () => {
      const performanceData1 = { fps: 30, memoryUsage: 60, renderTime: 25 };
      const performanceData2 = { fps: 55, memoryUsage: 85, renderTime: 16 };

      await autoOptimizer.optimize(performanceData1);
      await autoOptimizer.optimize(performanceData2);

      const history = autoOptimizer.getOptimizationHistory();
      expect(history).toHaveLength(2);
      expect(history[0].type).toBe('particleReduction');
      expect(history[1].type).toBe('effectQuality');
    });

    test('履歴の最大サイズ制限（100件）', async () => {
      // 101回の最適化を実行
      for (let i = 0; i < 101; i++) {
        await autoOptimizer.optimize({ fps: 30, memoryUsage: 60, renderTime: 25 });
      }

      const history = autoOptimizer.getOptimizationHistory();
      expect(history).toHaveLength(100); // 最大100件に制限
    });
  });

  describe('最適化戦略', () => {
    test('aggressive設定での最適化強度テスト', async () => {
      mockConfigManager.getOptimizationLevel.mockReturnValue('aggressive');

      const performanceData = {
        fps: 40, // 軽微な低下
        memoryUsage: 60,
        renderTime: 20,
      };

      await autoOptimizer.optimize(performanceData);

      expect(mockPerformanceController.applyOptimization).toHaveBeenCalledWith({
        type: 'particleReduction',
        level: 0.4, // aggressiveでは40%削減
        reason: 'FPS below threshold',
      });
    });

    test('conservative設定での最適化制限テスト', async () => {
      mockConfigManager.getOptimizationLevel.mockReturnValue('conservative');

      const performanceData = {
        fps: 40, // 軽微な低下
        memoryUsage: 60,
        renderTime: 20,
      };

      await autoOptimizer.optimize(performanceData);

      expect(mockPerformanceController.applyOptimization).toHaveBeenCalledWith({
        type: 'particleReduction',
        level: 0.1, // conservativeでは10%のみ削減
        reason: 'FPS below threshold',
      });
    });
  });

  describe('エラーハンドリング', () => {
    test('PerformanceController エラー時のフォールバック', async () => {
      mockPerformanceController.applyOptimization.mockRejectedValue(new Error('Controller error'));

      const performanceData = {
        fps: 30,
        memoryUsage: 60,
        renderTime: 25,
      };

      await expect(autoOptimizer.optimize(performanceData)).rejects.toThrow('Optimization failed');
    });

    test('非同期最適化の並行実行制限', async () => {
      const performanceData = {
        fps: 30,
        memoryUsage: 60,
        renderTime: 25,
      };

      // 同時に複数の最適化を開始
      const promises = [
        autoOptimizer.optimize(performanceData),
        autoOptimizer.optimize(performanceData),
        autoOptimizer.optimize(performanceData),
      ];

      await Promise.allSettled(promises);

      // 最適化は1つずつ実行されるべき（並行実行されない）
      expect(mockPerformanceController.applyOptimization).toHaveBeenCalledTimes(1);
    });
  });

  describe('統合テスト', () => {
    test('実際のPerformanceControllerとの連携', () => {
      // 実際のPerformanceControllerインスタンスでのテスト（モック使用）
      expect(autoOptimizer.performanceController).toBe(mockPerformanceController);
    });

    test('最適化実行時間が50ms以下', async () => {
      const performanceData = {
        fps: 30,
        memoryUsage: 60,
        renderTime: 25,
      };

      const startTime = performance.now();
      await autoOptimizer.optimize(performanceData);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(50);
    });

    test('メモリ使用量増加が最小限', () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // 大量の最適化履歴を生成
      for (let i = 0; i < 50; i++) {
        autoOptimizer.addToHistory({
          timestamp: Date.now(),
          type: 'test',
          level: 0.1,
          reason: 'test',
        });
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB

      expect(memoryIncrease).toBeLessThan(1); // 1MB未満の増加
    });
  });
});
