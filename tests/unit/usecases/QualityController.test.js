import QualityController from '../../../src/core/usecases/QualityController.js';

describe('QualityController', () => {
  let qualityController;
  let mockPerformanceController;
  let mockEffectManager;
  let mockParticleSystem;
  let mockConfigManager;

  beforeEach(() => {
    // NODE_ENVをtestに設定
    process.env.NODE_ENV = 'test';

    // PerformanceControllerのモック作成
    mockPerformanceController = {
      getCurrentMetrics: jest.fn(() => ({
        fps: 60,
        memoryUsage: 50,
        renderTime: 16,
        gpuUsage: 30,
      })),
      getPerformanceHistory: jest.fn(() => []),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };

    // EffectManagerのモック作成
    mockEffectManager = {
      setQualityLevel: jest.fn(),
      getQualityLevel: jest.fn(() => 'high'),
      setParticleCount: jest.fn(),
      getParticleCount: jest.fn(() => 1000),
      enableEffect: jest.fn(),
      disableEffect: jest.fn(),
      getEffectSettings: jest.fn(() => ({
        particles: { enabled: true, count: 1000 },
        shadows: { enabled: true, quality: 'high' },
        postProcessing: { enabled: true, effects: ['bloom', 'blur'] },
      })),
    };

    // ParticleSystemのモック作成
    mockParticleSystem = {
      setMaxParticles: jest.fn(),
      getMaxParticles: jest.fn(() => 1000),
      setQuality: jest.fn(),
      getQuality: jest.fn(() => 'high'),
      getActiveParticleCount: jest.fn(() => 800),
    };

    // ConfigManagerのモック作成
    mockConfigManager = {
      getQualitySettings: jest.fn(() => ({
        high: { particles: 1000, shadows: true, postProcessing: true },
        medium: { particles: 500, shadows: true, postProcessing: false },
        low: { particles: 100, shadows: false, postProcessing: false },
      })),
      setQualityLevel: jest.fn(),
      getDeviceCapabilities: jest.fn(() => ({
        gpu: 'high',
        memory: 'high',
        performance: 'high',
      })),
    };

    qualityController = new QualityController({
      performanceController: mockPerformanceController,
      effectManager: mockEffectManager,
      particleSystem: mockParticleSystem,
      configManager: mockConfigManager,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    if (qualityController && !qualityController.isDestroyed) {
      qualityController.destroy();
    }
  });

  describe('コンストラクタ', () => {
    test('正しく初期化される', () => {
      expect(qualityController).toBeInstanceOf(QualityController);
      expect(qualityController.performanceController).toBe(mockPerformanceController);
      expect(qualityController.effectManager).toBe(mockEffectManager);
      expect(qualityController.currentQualityLevel).toBe('high');
    });

    test('デフォルト設定で初期化される', () => {
      const defaultController = new QualityController();
      expect(defaultController).toBeInstanceOf(QualityController);
      expect(defaultController.config).toHaveProperty('qualityLevels');
      expect(defaultController.config).toHaveProperty('autoAdjustment');
    });

    test('カスタム設定で初期化される', () => {
      const customConfig = {
        qualityLevels: {
          ultra: { particles: 2000, shadows: true, postProcessing: true },
          minimal: { particles: 50, shadows: false, postProcessing: false },
        },
        autoAdjustment: {
          enabled: false,
          thresholds: { fps: 30 },
        },
      };

      const customController = new QualityController({
        config: customConfig,
        performanceController: mockPerformanceController,
      });

      expect(customController.config.qualityLevels).toHaveProperty('ultra');
      expect(customController.config.autoAdjustment.enabled).toBe(false);
    });

    test('必須依存関係なしでも動作する', () => {
      const standaloneController = new QualityController();
      expect(standaloneController.performanceController).toBeDefined();
      expect(standaloneController.effectManager).toBeDefined();
    });
  });

  describe('benchmarkDevice()', () => {
    test('デバイス性能ベンチマークを実行できる', async () => {
      const result = await qualityController.benchmarkDevice();

      expect(result).toHaveProperty('gpu');
      expect(result).toHaveProperty('memory');
      expect(result).toHaveProperty('overall');
      expect(result).toHaveProperty('recommendedQuality');
    });

    test('GPU性能を正しく評価する', async () => {
      // 高性能GPUをシミュレート
      mockPerformanceController.getCurrentMetrics.mockReturnValue({
        fps: 60,
        renderTime: 8, // 高速レンダリング
        gpuUsage: 20,
      });

      const result = await qualityController.benchmarkDevice();

      expect(result.gpu).toBeGreaterThan(0.7); // 高評価
      expect(result.recommendedQuality).toBe('high');
    });

    test('低性能デバイスを正しく評価する', async () => {
      // 低性能デバイスをシミュレート
      mockPerformanceController.getCurrentMetrics.mockReturnValue({
        fps: 25,
        renderTime: 35, // 低速レンダリング
        gpuUsage: 90,
      });

      const result = await qualityController.benchmarkDevice();

      expect(result.gpu).toBeLessThan(0.5); // 低評価
      expect(result.recommendedQuality).toBe('low');
    });

    test('メモリ容量を正しく評価する', async () => {
      // メモリ情報をモック
      Object.defineProperty(navigator, 'deviceMemory', {
        value: 8, // 8GB
        configurable: true,
      });

      const result = await qualityController.benchmarkDevice();

      expect(result.memory).toBeGreaterThan(0.5);
    });

    test('ベンチマーク結果が履歴に記録される', async () => {
      await qualityController.benchmarkDevice();

      const history = qualityController.getBenchmarkHistory();
      expect(history).toHaveLength(1);
      expect(history[0]).toHaveProperty('timestamp');
      expect(history[0]).toHaveProperty('results');
    });

    test('ベンチマーク中にエラーが発生した場合の処理', async () => {
      mockPerformanceController.getCurrentMetrics.mockImplementation(() => {
        throw new Error('Metrics error');
      });

      await expect(qualityController.benchmarkDevice()).rejects.toThrow('Device benchmark failed');
    });
  });

  describe('setQualityLevel()', () => {
    test('High品質レベルを設定できる', () => {
      // 最初にmediumに設定してからhighに変更
      qualityController.setQualityLevel('medium');
      jest.clearAllMocks();

      qualityController.setQualityLevel('high');

      expect(mockEffectManager.setQualityLevel).toHaveBeenCalledWith('high');
      expect(mockParticleSystem.setMaxParticles).toHaveBeenCalledWith(1000);
      expect(qualityController.currentQualityLevel).toBe('high');
    });

    test('Medium品質レベルを設定できる', () => {
      qualityController.setQualityLevel('medium');

      expect(mockEffectManager.setQualityLevel).toHaveBeenCalledWith('medium');
      expect(mockParticleSystem.setMaxParticles).toHaveBeenCalledWith(500);
      expect(qualityController.currentQualityLevel).toBe('medium');
    });

    test('Low品質レベルを設定できる', () => {
      qualityController.setQualityLevel('low');

      expect(mockEffectManager.setQualityLevel).toHaveBeenCalledWith('low');
      expect(mockParticleSystem.setMaxParticles).toHaveBeenCalledWith(100);
      expect(qualityController.currentQualityLevel).toBe('low');
    });

    test('無効な品質レベルでエラーをスロー', () => {
      expect(() => {
        qualityController.setQualityLevel('invalid');
      }).toThrow('Invalid quality level');
    });

    test('品質変更が履歴に記録される', () => {
      qualityController.setQualityLevel('medium');

      const history = qualityController.getQualityHistory();
      expect(history).toHaveLength(1);
      expect(history[0]).toHaveProperty('from', 'high');
      expect(history[0]).toHaveProperty('to', 'medium');
      expect(history[0]).toHaveProperty('reason');
    });

    test('同じ品質レベルの重複設定は無視される', () => {
      qualityController.setQualityLevel('high');

      expect(mockEffectManager.setQualityLevel).not.toHaveBeenCalled();
    });
  });

  describe('adjustQualityBasedOnPerformance()', () => {
    test('FPS低下時に品質を下げる', () => {
      const fpsData = { current: 35, average: 30, trend: 'decreasing' };

      const result = qualityController.adjustQualityBasedOnPerformance(fpsData);

      expect(result.adjusted).toBe(true);
      expect(result.newLevel).toBe('medium');
      expect(mockEffectManager.setQualityLevel).toHaveBeenCalledWith('medium');
    });

    test('FPS安定時は品質を維持する', () => {
      const fpsData = { current: 60, average: 58, trend: 'stable' };

      const result = qualityController.adjustQualityBasedOnPerformance(fpsData);

      expect(result.adjusted).toBe(false);
      expect(result.newLevel).toBe('high');
      expect(mockEffectManager.setQualityLevel).not.toHaveBeenCalled();
    });

    test('FPS向上時に品質を上げる', () => {
      // 最初にmediumに設定
      qualityController.setQualityLevel('medium');

      // ヒステリシス時間を過去に設定（即座に次の調整を可能にする）
      qualityController.lastQualityChange = Date.now() - 4000; // 4秒前
      jest.clearAllMocks();

      const fpsData = { current: 60, average: 58, trend: 'increasing' };

      const result = qualityController.adjustQualityBasedOnPerformance(fpsData);

      expect(result.adjusted).toBe(true);
      expect(result.newLevel).toBe('high');
      expect(mockEffectManager.setQualityLevel).toHaveBeenCalledWith('high');
    });

    test('最低品質時はそれ以上下げない', () => {
      qualityController.setQualityLevel('low');
      jest.clearAllMocks();

      const fpsData = { current: 20, average: 18, trend: 'decreasing' };

      const result = qualityController.adjustQualityBasedOnPerformance(fpsData);

      expect(result.adjusted).toBe(false);
      expect(result.newLevel).toBe('low');
    });

    test('最高品質時はそれ以上上げない', () => {
      const fpsData = { current: 60, average: 60, trend: 'stable' };

      const result = qualityController.adjustQualityBasedOnPerformance(fpsData);

      expect(result.adjusted).toBe(false);
      expect(result.newLevel).toBe('high');
    });

    test('自動調整が無効な場合は調整しない', () => {
      qualityController.config.autoAdjustment.enabled = false;

      const fpsData = { current: 30, average: 25, trend: 'decreasing' };

      const result = qualityController.adjustQualityBasedOnPerformance(fpsData);

      expect(result.adjusted).toBe(false);
      expect(mockEffectManager.setQualityLevel).not.toHaveBeenCalled();
    });
  });

  describe('getQualityReport()', () => {
    test('包括的な品質レポートを生成できる', () => {
      const report = qualityController.getQualityReport();

      expect(report).toHaveProperty('currentLevel');
      expect(report).toHaveProperty('performance');
      expect(report).toHaveProperty('settings');
      expect(report).toHaveProperty('recommendations');
      expect(report).toHaveProperty('deviceInfo');
    });

    test('推奨事項が適切に生成される', () => {
      // 低性能シミュレート
      mockPerformanceController.getCurrentMetrics.mockReturnValue({
        fps: 25,
        memoryUsage: 90,
        renderTime: 40,
      });

      const report = qualityController.getQualityReport();

      expect(report.recommendations).toContain('Consider lowering quality level');
      expect(report.recommendations).toContain('High memory usage detected');
    });

    test('パフォーマンス良好時の推奨事項', () => {
      // 高性能シミュレート
      mockPerformanceController.getCurrentMetrics.mockReturnValue({
        fps: 60,
        memoryUsage: 40,
        renderTime: 12,
      });

      qualityController.setQualityLevel('medium'); // 中品質に設定

      const report = qualityController.getQualityReport();

      expect(report.recommendations).toContain('Performance is good, consider increasing quality');
    });
  });

  describe('enableAdaptiveQuality()', () => {
    test('適応品質調整を有効化できる', () => {
      qualityController.enableAdaptiveQuality();

      expect(qualityController.config.autoAdjustment.enabled).toBe(true);
      expect(mockPerformanceController.addEventListener).toHaveBeenCalledWith(
        'performanceUpdate',
        expect.any(Function)
      );
    });

    test('既に有効な場合は重複登録しない', () => {
      qualityController.enableAdaptiveQuality();
      qualityController.enableAdaptiveQuality();

      expect(mockPerformanceController.addEventListener).toHaveBeenCalledTimes(1);
    });
  });

  describe('disableAdaptiveQuality()', () => {
    test('適応品質調整を無効化できる', () => {
      qualityController.enableAdaptiveQuality();
      qualityController.disableAdaptiveQuality();

      expect(qualityController.config.autoAdjustment.enabled).toBe(false);
      expect(mockPerformanceController.removeEventListener).toHaveBeenCalledWith(
        'performanceUpdate',
        expect.any(Function)
      );
    });
  });

  describe('エラーハンドリング', () => {
    test('EffectManagerエラー時の安全な処理', () => {
      mockEffectManager.setQualityLevel.mockImplementation(() => {
        throw new Error('Effect error');
      });

      expect(() => {
        qualityController.setQualityLevel('medium');
      }).not.toThrow();

      // エラー後も状態は一貫している
      expect(qualityController.currentQualityLevel).toBe('high');
    });

    test('ParticleSystemエラー時のフォールバック', () => {
      mockParticleSystem.setMaxParticles.mockImplementation(() => {
        throw new Error('Particle error');
      });

      expect(() => {
        qualityController.setQualityLevel('low');
      }).not.toThrow();
    });

    test('無効なパフォーマンスデータの処理', () => {
      expect(() => {
        qualityController.adjustQualityBasedOnPerformance(null);
      }).not.toThrow();

      expect(() => {
        qualityController.adjustQualityBasedOnPerformance({});
      }).not.toThrow();
    });
  });

  describe('destroy()', () => {
    test('QualityControllerを適切に破棄できる', () => {
      qualityController.enableAdaptiveQuality();
      qualityController.destroy();

      expect(qualityController.isDestroyed).toBe(true);
      expect(mockPerformanceController.removeEventListener).toHaveBeenCalled();
    });

    test('破棄後の操作でエラーが発生する', () => {
      qualityController.destroy();

      expect(() => {
        qualityController.setQualityLevel('medium');
      }).toThrow('QualityController has been destroyed');
    });

    test('重複破棄は安全に処理される', () => {
      qualityController.destroy();

      expect(() => {
        qualityController.destroy();
      }).not.toThrow();
    });
  });

  describe('パフォーマンス', () => {
    test('品質変更が適切な時間内に完了する', () => {
      const startTime = performance.now();
      qualityController.setQualityLevel('low');
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(50); // 50ms以内
    });

    test('ベンチマークが適切な時間内に完了する', async () => {
      const startTime = performance.now();
      await qualityController.benchmarkDevice();
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(200); // 200ms以内
    });

    test('大量の品質調整でもメモリ使用量が制限される', () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // 大量の品質変更を実行
      for (let i = 0; i < 100; i++) {
        const level = ['high', 'medium', 'low'][i % 3];
        qualityController.setQualityLevel(level);
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB

      expect(memoryIncrease).toBeLessThan(1); // 1MB未満の増加
    });
  });
});
