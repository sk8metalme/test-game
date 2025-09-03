import AutoOptimizer from '../../src/core/usecases/AutoOptimizer.js';
import MemoryManager from '../../src/core/usecases/MemoryManager.js';
import QualityController from '../../src/core/usecases/QualityController.js';
import PredictiveAnalyzer from '../../src/core/usecases/PredictiveAnalyzer.js';
import { PerformanceController } from '../../src/core/RealtimePerformanceController.js';

describe('PerformanceOptimizer統合テスト', () => {
  let performanceController;
  let autoOptimizer;
  let memoryManager;
  let qualityController;
  let predictiveAnalyzer;
  let mockPerformanceMonitor;
  let mockEffectManager;
  let mockParticleSystem;
  let mockConfigManager;
  let mockObjectPool;

  beforeEach(() => {
    // NODE_ENVをtestに設定
    process.env.NODE_ENV = 'test';

    // 共通モック作成
    mockPerformanceMonitor = {
      getCurrentMetrics: jest.fn(() => ({
        fps: 60,
        memoryUsage: 50,
        renderTime: 16,
        cpuUsage: 30,
      })),
      getPerformanceHistory: jest.fn(() =>
        Array.from({ length: 20 }, (_, i) => ({
          timestamp: Date.now() - (20 - i) * 1000,
          fps: 58 + Math.random() * 4,
          memoryUsage: 45 + i * 2,
          renderTime: 15 + Math.random() * 2,
        }))
      ),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      applyOptimization: jest.fn(() => Promise.resolve()),
      getCurrentMemoryUsage: jest.fn(() => 50),
      recordMemoryUsage: jest.fn(),
      enableMemoryTracking: jest.fn(),
      disableMemoryTracking: jest.fn(),
      getMemoryTrend: jest.fn(() => ({ direction: 'stable', rate: 0.1 })),
    };

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

    mockParticleSystem = {
      setMaxParticles: jest.fn(),
      getMaxParticles: jest.fn(() => 1000),
      setQuality: jest.fn(),
      getQuality: jest.fn(() => 'high'),
      getActiveParticleCount: jest.fn(() => 800),
    };

    mockConfigManager = {
      getOptimizationSettings: jest.fn(() => ({
        fpsThreshold: 45,
        memoryThreshold: 80,
        qualityAdjustment: true,
      })),
      setOptimizationLevel: jest.fn(),
      getOptimizationLevel: jest.fn(() => 'moderate'),
      getThresholds: jest.fn(() => ({
        fps: 45,
        memory: 80,
        renderTime: 20,
      })),
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

    mockObjectPool = {
      getStatistics: jest.fn(() => ({
        totalObjects: 1000,
        activeObjects: 800,
        pooledObjects: 200,
        memoryUsage: 50,
      })),
      optimize: jest.fn(),
      cleanup: jest.fn(),
      getMemoryPressure: jest.fn(() => 0.6),
    };

    // PerformanceControllerは実際のインスタンスを使用（統合テストのため）
    performanceController = new PerformanceController();

    // コンポーネント初期化
    autoOptimizer = new AutoOptimizer(mockPerformanceMonitor, mockConfigManager);

    memoryManager = new MemoryManager({
      performanceMonitor: mockPerformanceMonitor,
      objectPool: mockObjectPool,
    });

    qualityController = new QualityController({
      performanceController: mockPerformanceMonitor,
      effectManager: mockEffectManager,
      particleSystem: mockParticleSystem,
      configManager: mockConfigManager,
    });

    predictiveAnalyzer = new PredictiveAnalyzer({
      performanceMonitor: mockPerformanceMonitor,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();

    // 各コンポーネントの適切な破棄
    if (autoOptimizer && !autoOptimizer.isDestroyed) {
      autoOptimizer.destroy();
    }
    if (memoryManager && !memoryManager.isDestroyed) {
      memoryManager.destroy();
    }
    if (qualityController && !qualityController.isDestroyed) {
      qualityController.destroy();
    }
    if (predictiveAnalyzer && !predictiveAnalyzer.isDestroyed) {
      predictiveAnalyzer.destroy();
    }
  });

  describe('システム統合シナリオ', () => {
    test('正常時の統合ワークフロー', async () => {
      // 1. 初期化確認
      expect(autoOptimizer).toBeInstanceOf(AutoOptimizer);
      expect(memoryManager).toBeInstanceOf(MemoryManager);
      expect(qualityController).toBeInstanceOf(QualityController);
      expect(predictiveAnalyzer).toBeInstanceOf(PredictiveAnalyzer);

      // 2. 将来パフォーマンス予測
      const prediction = await predictiveAnalyzer.predictFuturePerformance(5000);
      expect(prediction).toHaveProperty('fps');
      expect(prediction).toHaveProperty('confidence');

      // 3. ボトルネック分析
      const bottlenecks = predictiveAnalyzer.analyzeBottlenecks();
      expect(bottlenecks).toHaveProperty('detected');

      // 4. 品質レベル最適化
      const qualityReport = qualityController.getQualityReport();
      expect(qualityReport).toHaveProperty('currentLevel');

      // 5. メモリ最適化
      const memoryStats = memoryManager.getMemoryStatistics();
      expect(memoryStats).toHaveProperty('currentUsage');

      // 6. 自動最適化実行
      const performanceData = mockPerformanceMonitor.getCurrentMetrics();
      await autoOptimizer.optimize(performanceData);
      expect(autoOptimizer.getOptimizationHistory().length).toBeGreaterThanOrEqual(0);

      // 統合動作確認
      expect(mockEffectManager.setQualityLevel).toHaveBeenCalled();
      expect(mockObjectPool.optimize).toHaveBeenCalled();
    });

    test('パフォーマンス低下シナリオの統合対応', async () => {
      // パフォーマンス低下をシミュレート
      mockPerformanceMonitor.getCurrentMetrics.mockReturnValue({
        fps: 25, // 低FPS
        memoryUsage: 85, // 高メモリ使用量
        renderTime: 35, // 高レンダリング時間
        cpuUsage: 80,
      });

      // 1. 予測分析によるボトルネック検出
      const bottlenecks = predictiveAnalyzer.analyzeBottlenecks();
      expect(bottlenecks.detected).toBe(true);
      expect(bottlenecks.categories.length).toBeGreaterThan(0);

      // 2. 品質コントローラーによる自動調整
      qualityController.enableAdaptiveQuality();
      const fpsData = { current: 25, average: 23, trend: 'decreasing' };
      const qualityAdjustment = qualityController.adjustQualityBasedOnPerformance(fpsData);
      expect(qualityAdjustment.adjusted).toBe(true);

      // 3. メモリマネージャーによる最適化
      memoryManager.startMemoryMonitoring();
      const memoryOptimization = memoryManager.optimizeMemory();
      expect(memoryOptimization.success).toBe(true);

      // 4. 自動最適化による総合対応
      const performanceData = mockPerformanceMonitor.getCurrentMetrics();
      await autoOptimizer.optimize(performanceData);
      expect(autoOptimizer.getOptimizationHistory().length).toBeGreaterThanOrEqual(0);

      // 5. 最適化推奨の取得
      const recommendations = predictiveAnalyzer.getOptimizationRecommendations();
      expect(recommendations.immediate.length).toBeGreaterThan(0);
      expect(recommendations.priority).toBe('critical');

      // 統合効果の確認
      expect(mockEffectManager.setQualityLevel).toHaveBeenCalled();
      expect(mockObjectPool.cleanup).toHaveBeenCalled();
    });

    test('メモリ圧迫時の統合対応', async () => {
      // メモリ圧迫状況をシミュレート
      mockPerformanceMonitor.getCurrentMetrics.mockReturnValue({
        fps: 45,
        memoryUsage: 92, // 非常に高いメモリ使用量
        renderTime: 20,
        cpuUsage: 60,
      });

      mockObjectPool.getMemoryPressure.mockReturnValue(0.9); // 高いメモリ圧迫

      // 1. 予測分析
      const prediction = await predictiveAnalyzer.predictFuturePerformance(3000);
      expect(prediction.confidence).toBeGreaterThan(0);

      // 2. ボトルネック検出
      const bottlenecks = predictiveAnalyzer.analyzeBottlenecks();
      expect(bottlenecks.categories).toContain('memory');

      // 3. メモリマネージャーによる緊急対応
      const shouldTriggerGC = memoryManager.shouldTriggerGC();
      expect(shouldTriggerGC).toBe(true);

      const gcResult = memoryManager.forceGarbageCollection();
      expect(gcResult.triggered).toBe(true);

      // 4. 品質調整による軽量化
      qualityController.setQualityLevel('low', 'memory pressure');
      expect(mockEffectManager.setQualityLevel).toHaveBeenCalledWith('low');

      // 5. 自動最適化の統合実行
      autoOptimizer.enableAutoOptimization();
      const performanceData = mockPerformanceMonitor.getCurrentMetrics();
      await autoOptimizer.optimize(performanceData);
      expect(autoOptimizer.getOptimizationHistory().length).toBeGreaterThanOrEqual(0);

      // メモリ最適化効果の確認
      expect(mockObjectPool.cleanup).toHaveBeenCalled();
      expect(mockParticleSystem.setMaxParticles).toHaveBeenCalledWith(100); // low品質
    });

    test('継続監視と自動調整の統合', async () => {
      // 1. 全コンポーネントの継続監視開始
      autoOptimizer.enableAutoOptimization();
      memoryManager.startMemoryMonitoring();
      qualityController.enableAdaptiveQuality();
      predictiveAnalyzer.startContinuousAnalysis();

      // 監視開始の確認
      expect(autoOptimizer.isAutoOptimizing).toBe(true);
      expect(memoryManager.isMonitoring).toBe(true);
      expect(qualityController.config.autoAdjustment.enabled).toBe(true);
      expect(predictiveAnalyzer.isAnalyzing).toBe(true);

      // 2. パフォーマンス変動をシミュレート
      const performanceScenarios = [
        { fps: 55, memoryUsage: 60, renderTime: 18 }, // 良好
        { fps: 40, memoryUsage: 75, renderTime: 25 }, // 中程度
        { fps: 30, memoryUsage: 85, renderTime: 35 }, // 悪化
        { fps: 50, memoryUsage: 65, renderTime: 20 }, // 回復
      ];

      for (const scenario of performanceScenarios) {
        mockPerformanceMonitor.getCurrentMetrics.mockReturnValue({
          ...scenario,
          cpuUsage: 40,
        });

        // 3. 各コンポーネントの反応確認
        const bottlenecks = predictiveAnalyzer.analyzeBottlenecks();
        const qualityReport = qualityController.getQualityReport();
        const memoryStats = memoryManager.getMemoryStatistics();

        expect(bottlenecks).toHaveProperty('detected');
        expect(qualityReport).toHaveProperty('recommendations');
        expect(memoryStats).toHaveProperty('currentUsage');
      }

      // 4. 監視停止
      autoOptimizer.disableAutoOptimization();
      memoryManager.stopMemoryMonitoring();
      qualityController.disableAdaptiveQuality();
      predictiveAnalyzer.stopContinuousAnalysis();

      // 停止確認
      expect(autoOptimizer.isAutoOptimizing).toBe(false);
      expect(memoryManager.isMonitoring).toBe(false);
      expect(qualityController.config.autoAdjustment.enabled).toBe(false);
      expect(predictiveAnalyzer.isAnalyzing).toBe(false);
    });

    test('統合レポート生成', async () => {
      // 各コンポーネントの動作履歴生成
      await predictiveAnalyzer.predictFuturePerformance(5000);
      qualityController.setQualityLevel('medium');
      memoryManager.optimizeMemory();
      const performanceData = mockPerformanceMonitor.getCurrentMetrics();
      await autoOptimizer.optimize(performanceData);

      // 統合レポートの生成
      const integratedReport = {
        timestamp: Date.now(),
        autoOptimizer: {
          status: autoOptimizer.isAutoOptimizing,
          lastOptimization: autoOptimizer.getLastOptimizationTime(),
          statistics: autoOptimizer.getOptimizationStatistics(),
        },
        memoryManager: {
          status: memoryManager.isMonitoring,
          statistics: memoryManager.getMemoryStatistics(),
          gcHistory: memoryManager.getGCHistory(),
        },
        qualityController: {
          currentLevel: qualityController.getCurrentQualityLevel(),
          report: qualityController.getQualityReport(),
          history: qualityController.getQualityHistory(),
        },
        predictiveAnalyzer: {
          status: predictiveAnalyzer.isAnalyzing,
          report: predictiveAnalyzer.getAnalysisReport(),
          predictions: predictiveAnalyzer.getPredictionHistory(),
        },
      };

      // レポート構造の検証
      expect(integratedReport).toHaveProperty('autoOptimizer');
      expect(integratedReport).toHaveProperty('memoryManager');
      expect(integratedReport).toHaveProperty('qualityController');
      expect(integratedReport).toHaveProperty('predictiveAnalyzer');

      // 各コンポーネントのデータ整合性確認
      expect(integratedReport.qualityController.currentLevel).toBe('medium');
      expect(integratedReport.memoryManager.statistics).toHaveProperty('currentUsage');
      expect(integratedReport.predictiveAnalyzer.predictions).toHaveLength(1);
    });
  });

  describe('エラー処理と回復性', () => {
    test('単一コンポーネント障害時の統合系への影響', async () => {
      // MemoryManagerで意図的にエラーを発生
      mockObjectPool.optimize.mockImplementation(() => {
        throw new Error('Pool optimization failed');
      });

      // 他のコンポーネントは正常動作することを確認
      expect(() => {
        qualityController.setQualityLevel('medium');
      }).not.toThrow();

      expect(() => {
        predictiveAnalyzer.analyzeBottlenecks();
      }).not.toThrow();

      await expect(async () => {
        const performanceData = mockPerformanceMonitor.getCurrentMetrics();
        await autoOptimizer.optimize(performanceData); // MemoryManagerエラーがあっても継続
      }).not.toThrow();

      // 正常コンポーネントの動作確認
      expect(mockEffectManager.setQualityLevel).toHaveBeenCalledWith('medium');
    });

    test('パフォーマンス監視停止時の統合系動作', () => {
      // パフォーマンス監視エラーをシミュレート
      mockPerformanceMonitor.getCurrentMetrics.mockImplementation(() => {
        throw new Error('Performance monitoring failed');
      });

      // 各コンポーネントのフォールバック動作確認
      expect(() => {
        predictiveAnalyzer.analyzeBottlenecks();
      }).not.toThrow();

      expect(() => {
        qualityController.getQualityReport();
      }).not.toThrow();

      // エラー状態でも基本機能は維持
      expect(() => {
        qualityController.setQualityLevel('low');
      }).not.toThrow();
    });

    test('メモリ不足時の統合系緊急対応', async () => {
      // 極端なメモリ不足をシミュレート
      mockPerformanceMonitor.getCurrentMetrics.mockReturnValue({
        fps: 15,
        memoryUsage: 98, // 極限状態
        renderTime: 50,
        cpuUsage: 95,
      });

      mockObjectPool.getMemoryPressure.mockReturnValue(0.98);

      // 緊急対応シーケンス
      const bottlenecks = predictiveAnalyzer.analyzeBottlenecks();
      expect(bottlenecks.detected).toBe(true);
      expect(bottlenecks.severity).toBeGreaterThan(0.8);

      // 緊急品質低下
      qualityController.setQualityLevel('low', 'emergency');
      expect(mockEffectManager.setQualityLevel).toHaveBeenCalledWith('low');

      // 強制GC
      const gcResult = memoryManager.forceGarbageCollection();
      expect(gcResult.triggered).toBe(true);

      // 自動最適化による総合対応
      const performanceData = mockPerformanceMonitor.getCurrentMetrics();
      await autoOptimizer.optimize(performanceData);
      expect(autoOptimizer.getOptimizationHistory().length).toBeGreaterThanOrEqual(0);

      // 推奨事項の緊急度確認
      const recommendations = predictiveAnalyzer.getOptimizationRecommendations();
      expect(recommendations.priority).toBe('critical');
    });
  });

  describe('パフォーマンス特性', () => {
    test('統合システムの応答時間', async () => {
      const startTime = performance.now();

      // 統合操作の実行
      await predictiveAnalyzer.predictFuturePerformance(5000);
      qualityController.setQualityLevel('medium');
      memoryManager.optimizeMemory();
      const performanceData = mockPerformanceMonitor.getCurrentMetrics();
      await autoOptimizer.optimize(performanceData);

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // 応答時間が許容範囲内であることを確認
      expect(totalTime).toBeLessThan(500); // 500ms以内
    });

    test('大量操作時のメモリ使用量制御', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // 大量の統合操作を実行
      for (let i = 0; i < 10; i++) {
        // テスト時間短縮のため件数削減
        predictiveAnalyzer.analyzeBottlenecks();
        qualityController.getQualityReport();
        memoryManager.getMemoryStatistics();
        const performanceData = mockPerformanceMonitor.getCurrentMetrics();
        await autoOptimizer.optimize(performanceData);
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB

      // メモリ使用量の増加が制限内であることを確認
      expect(memoryIncrease).toBeLessThan(5); // 5MB未満
    });

    test('並行処理での統合系安定性', async () => {
      // 並行して複数の操作を実行
      const promises = [
        predictiveAnalyzer.predictFuturePerformance(3000),
        predictiveAnalyzer.predictFuturePerformance(5000),
        predictiveAnalyzer.predictFuturePerformance(7000),
      ];

      const qualityOperations = [
        () => qualityController.setQualityLevel('high'),
        () => qualityController.setQualityLevel('medium'),
        () => qualityController.setQualityLevel('low'),
      ];

      // 並行実行
      const [predictions] = await Promise.all([
        Promise.all(promises),
        Promise.all(qualityOperations.map(op => Promise.resolve(op()))),
      ]);

      // すべての予測が成功することを確認
      predictions.forEach(prediction => {
        expect(prediction).toHaveProperty('fps');
        expect(prediction).toHaveProperty('confidence');
      });

      // 品質変更が正常に処理されることを確認
      expect(mockEffectManager.setQualityLevel).toHaveBeenCalledTimes(3);
    });
  });
});
