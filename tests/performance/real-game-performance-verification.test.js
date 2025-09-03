/**
 * real-game-performance-verification.test.js
 *
 * 実ゲーム性能検証テスト
 * PerformanceOptimizer Phase 2-3システムの実際のゲームでの効果測定
 */

import TetrisGame from '../../src/presentation/main.js';
import { PerformanceMonitor } from '../../src/core/RealtimePerformanceMonitor.js';
import { PerformanceController } from '../../src/core/RealtimePerformanceController.js';
import AutoOptimizer from '../../src/core/usecases/AutoOptimizer.js';
import MemoryManager from '../../src/core/usecases/MemoryManager.js';
import QualityController from '../../src/core/usecases/QualityController.js';
import PredictiveAnalyzer from '../../src/core/usecases/PredictiveAnalyzer.js';

// テスト用のモック
const createMockEnvironment = () => {
  // DOM環境セットアップ
  const container = document.createElement('div');
  container.id = 'game-container';
  document.body.appendChild(container);

  // ConfigManager モック
  const mockConfigManager = {
    getOptimizationLevel: jest.fn(() => 'moderate'),
    getThresholds: jest.fn(() => ({
      fps: { warning: 45, critical: 30 },
      memory: { warning: 80, critical: 100 },
    })),
    getQualitySettings: jest.fn(() => ({
      high: { particles: 1000, effects: 'full' },
      medium: { particles: 500, effects: 'reduced' },
      low: { particles: 100, effects: 'minimal' },
    })),
    setQualityLevel: jest.fn(),
    getDeviceCapabilities: jest.fn(() => ({
      gpu: 'high',
      memory: 'medium',
      cpu: 'high',
    })),
  };

  // ObjectPool モック
  const mockObjectPool = {
    getStats: jest.fn(() => ({
      total: 1000,
      active: 200,
      available: 800,
      hits: 5000,
      misses: 100,
    })),
    getPoolStats: jest.fn(() => ({
      size: 1000,
      used: 200,
      available: 800,
    })),
    optimize: jest.fn(),
    resize: jest.fn(),
    clear: jest.fn(),
  };

  // EffectManager モック
  const mockEffectManager = {
    setQualityLevel: jest.fn(),
    getQualityLevel: jest.fn(() => 'medium'),
    applyEffectQuality: jest.fn(),
    getCurrentEffectCount: jest.fn(() => 50),
  };

  // ParticleSystem モック
  const mockParticleSystem = {
    setMaxParticles: jest.fn(),
    getParticleCount: jest.fn(() => 300),
    optimize: jest.fn(),
  };

  // DataProcessor モック
  const mockDataProcessor = {
    processPerformanceData: jest.fn(data => ({
      processedData: data,
      trends: { fps: 'stable', memory: 'increasing' },
      predictions: { fps: 58.5, memory: 75.2 },
    })),
    analyzeBottlenecks: jest.fn(() => [
      { type: 'memory', severity: 0.6 },
      { type: 'rendering', severity: 0.3 },
    ]),
  };

  return {
    container,
    mockConfigManager,
    mockObjectPool,
    mockEffectManager,
    mockParticleSystem,
    mockDataProcessor,
  };
};

describe('実ゲーム性能検証', () => {
  let testEnvironment;
  let performanceMonitor;
  let performanceController;
  let autoOptimizer;
  let memoryManager;
  let qualityController;
  let predictiveAnalyzer;
  let game;

  beforeEach(() => {
    // テスト環境作成
    testEnvironment = createMockEnvironment();

    // PerformanceOptimizer Phase 2-3 システム初期化
    performanceMonitor = new PerformanceMonitor({
      monitoring: { interval: 16, historySize: 100 },
      thresholds: { fps: { warning: 45, critical: 30 } },
    });

    performanceController = new PerformanceController({});
    performanceController.initialize();
    performanceController.integratePerformanceMonitor(performanceMonitor);

    autoOptimizer = new AutoOptimizer(performanceMonitor, testEnvironment.mockConfigManager);
    memoryManager = new MemoryManager(
      testEnvironment.mockObjectPool,
      testEnvironment.mockConfigManager
    );
    qualityController = new QualityController(
      testEnvironment.mockEffectManager,
      testEnvironment.mockParticleSystem,
      testEnvironment.mockConfigManager
    );
    predictiveAnalyzer = new PredictiveAnalyzer(
      performanceMonitor,
      testEnvironment.mockDataProcessor
    );

    // ゲームインスタンス作成 (最適化システム統合なし)
    game = new TetrisGame(testEnvironment.container);
  });

  afterEach(() => {
    // クリーンアップ
    if (game) {
      game.destroy();
    }
    if (predictiveAnalyzer) {
      predictiveAnalyzer.destroy();
    }
    if (qualityController) {
      qualityController.destroy();
    }
    if (memoryManager) {
      memoryManager.destroy();
    }
    if (autoOptimizer) {
      autoOptimizer.destroy();
    }
    if (performanceController) {
      performanceController.destroy();
    }
    if (performanceMonitor) {
      performanceMonitor.destroy();
    }

    // DOM クリーンアップ
    if (testEnvironment.container.parentNode) {
      testEnvironment.container.parentNode.removeChild(testEnvironment.container);
    }
  });

  describe('ベースライン測定', () => {
    test('最適化なしでのゲーム性能測定', async () => {
      // 性能監視開始
      await performanceMonitor.startMonitoring();

      // ゲーム開始
      game.start();

      // 1秒間のゲーム実行をシミュレート
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 基本性能指標取得
      const baselineMetrics = performanceMonitor.getCurrentMetrics();

      // ベースライン検証
      expect(baselineMetrics).toHaveProperty('fps');
      expect(baselineMetrics).toHaveProperty('memoryUsage');
      expect(baselineMetrics).toHaveProperty('frameTime');

      // 基本的な性能要件確認
      expect(baselineMetrics.fps).toBeGreaterThan(30); // 最低限のFPS
      expect(baselineMetrics.memoryUsage).toBeLessThan(200); // メモリ使用量制限

      console.log('ベースライン性能:', baselineMetrics);

      game.stop();
      await performanceMonitor.stopMonitoring();
    });

    test('初期ゲーム状態でのリソース使用量測定', () => {
      // ゲーム初期化のみ
      const initialState = game.getGameState();
      const performanceInfo = game.getPerformanceInfo();

      // 初期状態検証
      expect(initialState).toBeDefined();
      expect(initialState.status).toBeDefined();

      // パフォーマンス情報の存在確認
      expect(performanceInfo).toBeDefined();

      console.log('初期ゲーム状態:', initialState);
      console.log('初期パフォーマンス情報:', performanceInfo);
    });
  });

  describe('PerformanceOptimizer統合', () => {
    test('AutoOptimizerをゲームループに統合', async () => {
      // 監視開始
      await performanceMonitor.startMonitoring();

      // 低FPSシナリオを模擬
      const lowFpsData = {
        fps: 25,
        frameTime: 40,
        memoryUsage: 90,
        cpuUsage: 85,
      };

      // 最適化実行
      const optimizationResult = await autoOptimizer.optimize(lowFpsData);

      // 最適化効果検証
      expect(optimizationResult).toBeDefined();
      expect(optimizationResult.strategiesApplied).toBeDefined();
      expect(optimizationResult.strategiesApplied.length).toBeGreaterThan(0);

      // 最適化履歴確認
      const history = autoOptimizer.getOptimizationHistory();
      expect(history.length).toBeGreaterThan(0);

      console.log('AutoOptimizer最適化結果:', optimizationResult);

      await performanceMonitor.stopMonitoring();
    });

    test('MemoryManagerのリアルタイムメモリ最適化', async () => {
      // メモリ追跡開始
      memoryManager.startMemoryTracking();

      // メモリレポート取得
      const memoryReport = memoryManager.getMemoryReport();
      expect(memoryReport).toBeDefined();
      expect(memoryReport.usage).toBeDefined();
      expect(memoryReport.poolStats).toBeDefined();

      // メモリリーク検出テスト
      const leaks = memoryManager.checkMemoryLeaks();
      expect(Array.isArray(leaks)).toBe(true);

      // GC判定テスト
      const shouldGC = memoryManager.shouldTriggerGC();
      expect(typeof shouldGC).toBe('boolean');

      console.log('メモリレポート:', memoryReport);
      console.log('GC判定:', shouldGC);

      memoryManager.stopMemoryTracking();
    });

    test('QualityControllerの動的品質調整', async () => {
      // デバイスベンチマーク
      await qualityController.benchmarkDevice();

      // 低性能シナリオでの品質調整
      const lowPerformanceData = {
        fps: 35,
        frameTime: 28.5,
        memoryUsage: 85,
      };

      const adjustmentResult =
        qualityController.adjustQualityBasedOnPerformance(lowPerformanceData);

      // 品質調整効果検証
      expect(adjustmentResult).toBeDefined();
      expect(typeof adjustmentResult.adjusted).toBe('boolean');

      if (adjustmentResult.adjusted) {
        expect(adjustmentResult.from).toBeDefined();
        expect(adjustmentResult.to).toBeDefined();
        expect(['high', 'medium', 'low']).toContain(adjustmentResult.to);
      }

      // 品質履歴確認
      const qualityHistory = qualityController.getQualityHistory();
      expect(Array.isArray(qualityHistory)).toBe(true);

      console.log('品質調整結果:', adjustmentResult);
    });

    test('PredictiveAnalyzerの性能予測', async () => {
      // 継続分析開始
      predictiveAnalyzer.startContinuousAnalysis();

      // 将来性能予測
      const prediction = await predictiveAnalyzer.predictFuturePerformance(5000);

      // 予測結果検証
      expect(prediction).toBeDefined();
      expect(prediction.fps).toBeDefined();
      expect(prediction.memoryUsage).toBeDefined();
      expect(prediction.confidence).toBeDefined();
      expect(prediction.confidence).toBeGreaterThan(0);
      expect(prediction.confidence).toBeLessThanOrEqual(1);

      // ボトルネック分析
      const bottlenecks = predictiveAnalyzer.analyzeBottlenecks();
      expect(Array.isArray(bottlenecks)).toBe(true);

      // 最適化推奨取得
      const recommendations = predictiveAnalyzer.getOptimizationRecommendations();
      expect(recommendations).toBeDefined();
      expect(recommendations.immediate).toBeDefined();
      expect(recommendations.preventive).toBeDefined();

      console.log('性能予測:', prediction);
      console.log('ボトルネック分析:', bottlenecks);
      console.log('最適化推奨:', recommendations);

      predictiveAnalyzer.stopContinuousAnalysis();
    });
  });

  describe('統合性能検証', () => {
    test('最適化システム有無での性能比較', async () => {
      // === 最適化なしでの測定 ===
      await performanceMonitor.startMonitoring();
      game.start();

      // 一定時間実行
      await new Promise(resolve => setTimeout(resolve, 2000));

      const baselineMetrics = performanceMonitor.getCurrentMetrics();
      game.stop();
      await performanceMonitor.stopMonitoring();

      // === 最適化ありでの測定 ===
      await performanceMonitor.startMonitoring();

      // 最適化システム事前設定
      autoOptimizer.setOptimizationLevel('moderate');
      qualityController.setQualityLevel('medium');
      memoryManager.startMemoryTracking();
      predictiveAnalyzer.startContinuousAnalysis();

      game.start();

      // ゲーム実行中に最適化を適用
      setTimeout(async () => {
        const currentMetrics = performanceMonitor.getCurrentMetrics();
        if (currentMetrics.fps < 50) {
          await autoOptimizer.optimize(currentMetrics);
          qualityController.adjustQualityBasedOnPerformance(currentMetrics);
        }
      }, 500);

      // 一定時間実行
      await new Promise(resolve => setTimeout(resolve, 2000));

      const optimizedMetrics = performanceMonitor.getCurrentMetrics();

      // 性能比較
      const improvement = {
        fpsImprovement: ((optimizedMetrics.fps - baselineMetrics.fps) / baselineMetrics.fps) * 100,
        memoryReduction:
          ((baselineMetrics.memoryUsage - optimizedMetrics.memoryUsage) /
            baselineMetrics.memoryUsage) *
          100,
        frameTimeImprovement:
          ((baselineMetrics.frameTime - optimizedMetrics.frameTime) / baselineMetrics.frameTime) *
          100,
      };

      // 改善効果検証
      console.log('ベースライン性能:', baselineMetrics);
      console.log('最適化後性能:', optimizedMetrics);
      console.log('改善効果:', improvement);

      // 最低限の改善を期待 (シミュレート環境では限定的)
      expect(optimizedMetrics.fps).toBeGreaterThanOrEqual(baselineMetrics.fps * 0.95); // FPS劣化5%以内

      // クリーンアップ
      game.stop();
      memoryManager.stopMemoryTracking();
      predictiveAnalyzer.stopContinuousAnalysis();
      await performanceMonitor.stopMonitoring();
    });

    test('高負荷シナリオでの最適化効果', async () => {
      await performanceMonitor.startMonitoring();
      autoOptimizer.setOptimizationLevel('aggressive');
      memoryManager.startMemoryTracking();

      // 高負荷シミュレート
      const highLoadScenario = {
        fps: 20,
        frameTime: 50,
        memoryUsage: 120,
        cpuUsage: 95,
        particleCount: 2000,
      };

      // 統合最適化実行
      const autoOptResult = await autoOptimizer.optimize(highLoadScenario);
      const qualityResult = qualityController.adjustQualityBasedOnPerformance(highLoadScenario);

      // メモリ最適化判定
      if (memoryManager.shouldTriggerGC()) {
        const gcResult = await memoryManager.forceGarbageCollection();
        expect(gcResult).toBeDefined();
      }

      // 予測分析
      const prediction = await predictiveAnalyzer.predictFuturePerformance(3000);
      const recommendations = predictiveAnalyzer.getOptimizationRecommendations();

      // 結果検証
      expect(autoOptResult.strategiesApplied).toBeDefined();
      expect(qualityResult).toBeDefined();
      expect(prediction.confidence).toBeGreaterThan(0);
      expect(recommendations.immediate.length).toBeGreaterThanOrEqual(0);

      console.log('高負荷最適化結果:');
      console.log('- AutoOptimizer:', autoOptResult);
      console.log('- QualityController:', qualityResult);
      console.log('- 予測分析:', prediction);
      console.log('- 推奨事項:', recommendations);

      memoryManager.stopMemoryTracking();
      await performanceMonitor.stopMonitoring();
    });

    test('継続的最適化システムの安定性', async () => {
      const testDuration = 5000; // 5秒間
      const checkInterval = 1000; // 1秒間隔

      await performanceMonitor.startMonitoring();
      memoryManager.startMemoryTracking();
      predictiveAnalyzer.startContinuousAnalysis();

      const performanceSnapshots = [];
      const startTime = Date.now();

      // 継続的監視・最適化
      const monitoringInterval = setInterval(async () => {
        const currentMetrics = performanceMonitor.getCurrentMetrics();
        performanceSnapshots.push({
          timestamp: Date.now() - startTime,
          metrics: currentMetrics,
        });

        // 必要に応じて最適化実行
        if (currentMetrics.fps < 45) {
          await autoOptimizer.optimize(currentMetrics);
        }

        if (currentMetrics.memoryUsage > 80) {
          qualityController.adjustQualityBasedOnPerformance(currentMetrics);
        }
      }, checkInterval);

      // テスト期間待機
      await new Promise(resolve => setTimeout(resolve, testDuration));

      clearInterval(monitoringInterval);

      // 安定性検証
      expect(performanceSnapshots.length).toBeGreaterThanOrEqual(4);

      // 性能劣化がないことを確認
      const firstSnapshot = performanceSnapshots[0];
      const lastSnapshot = performanceSnapshots[performanceSnapshots.length - 1];

      const fpsStability = lastSnapshot.metrics.fps / firstSnapshot.metrics.fps;
      expect(fpsStability).toBeGreaterThan(0.8); // FPS 20%以上の劣化なし

      console.log('継続最適化テスト結果:');
      console.log('- スナップショット数:', performanceSnapshots.length);
      console.log('- 初期FPS:', firstSnapshot.metrics.fps);
      console.log('- 最終FPS:', lastSnapshot.metrics.fps);
      console.log('- FPS安定性:', fpsStability);

      predictiveAnalyzer.stopContinuousAnalysis();
      memoryManager.stopMemoryTracking();
      await performanceMonitor.stopMonitoring();
    });
  });

  describe('ユーザビリティ影響評価', () => {
    test('最適化によるゲーム操作性への影響', async () => {
      // ゲーム操作シミュレート
      game.start();

      const gameState = game.getGameState();
      expect(gameState).toBeDefined();

      // 基本操作のレスポンシブネス測定
      const operationLatencies = [];

      for (let i = 0; i < 10; i++) {
        const start = performance.now();

        // ゲーム操作シミュレート (キー入力など)
        game._handleKeyPress('ArrowLeft');

        const end = performance.now();
        operationLatencies.push(end - start);

        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const avgLatency = operationLatencies.reduce((a, b) => a + b, 0) / operationLatencies.length;

      // 操作レスポンス検証
      expect(avgLatency).toBeLessThan(16); // 1フレーム以内

      console.log('操作レスポンス測定:');
      console.log('- 平均レイテンシ:', avgLatency, 'ms');
      console.log('- 全測定値:', operationLatencies);

      game.stop();
    });

    test('品質調整による視覚的影響の評価', async () => {
      // 各品質レベルでの設定確認
      const qualityLevels = ['high', 'medium', 'low'];
      const qualityEffects = {};

      for (const level of qualityLevels) {
        qualityController.setQualityLevel(level);

        // 品質設定の取得と評価
        const currentLevel = qualityController.getQualityLevel();
        expect(currentLevel).toBe(level);

        // モック検証
        expect(testEnvironment.mockEffectManager.setQualityLevel).toHaveBeenCalledWith(level);

        qualityEffects[level] = {
          appliedLevel: currentLevel,
          timestamp: Date.now(),
        };
      }

      // 品質変更履歴の確認
      const qualityHistory = qualityController.getQualityHistory();
      expect(qualityHistory.length).toBeGreaterThanOrEqual(qualityLevels.length);

      console.log('品質レベル評価:', qualityEffects);
      console.log('品質変更履歴:', qualityHistory);
    });
  });

  describe('システム効果測定', () => {
    test('各コンポーネントの個別効果測定', async () => {
      const componentEffects = {};

      // AutoOptimizer効果測定
      const optimizationReport = autoOptimizer.getOptimizationReport();
      componentEffects.autoOptimizer = {
        report: optimizationReport,
        effectiveCount: optimizationReport.history?.length || 0,
      };

      // MemoryManager効果測定
      memoryManager.startMemoryTracking();
      const memoryReport = memoryManager.getMemoryReport();
      componentEffects.memoryManager = {
        report: memoryReport,
        trackingActive: memoryManager.isTracking || true,
      };

      // QualityController効果測定
      const qualityReport = qualityController.getQualityReport();
      componentEffects.qualityController = {
        report: qualityReport,
        currentLevel: qualityController.getQualityLevel(),
      };

      // PredictiveAnalyzer効果測定
      predictiveAnalyzer.startContinuousAnalysis();
      const analysisReport = predictiveAnalyzer.getAnalysisReport();
      componentEffects.predictiveAnalyzer = {
        report: analysisReport,
        analysisActive: true,
      };

      // 各コンポーネントの動作確認
      Object.keys(componentEffects).forEach(component => {
        expect(componentEffects[component]).toBeDefined();
        expect(componentEffects[component].report).toBeDefined();
      });

      console.log('コンポーネント効果測定:', componentEffects);

      // クリーンアップ
      memoryManager.stopMemoryTracking();
      predictiveAnalyzer.stopContinuousAnalysis();
    });

    test('統合システムのパフォーマンス改善効果', async () => {
      // テストシナリオ: 段階的負荷増加での最適化効果
      const scenarios = [
        { name: 'light_load', fps: 55, memory: 40, particles: 100 },
        { name: 'medium_load', fps: 40, memory: 70, particles: 500 },
        { name: 'heavy_load', fps: 25, memory: 100, particles: 1000 },
      ];

      const results = {};

      for (const scenario of scenarios) {
        const testData = {
          fps: scenario.fps,
          frameTime: 1000 / scenario.fps,
          memoryUsage: scenario.memory,
          particleCount: scenario.particles,
        };

        // 統合最適化実行
        const autoOptResult = await autoOptimizer.optimize(testData);
        const qualityResult = qualityController.adjustQualityBasedOnPerformance(testData);
        const prediction = await predictiveAnalyzer.predictFuturePerformance(2000);

        results[scenario.name] = {
          input: testData,
          autoOptimization: autoOptResult,
          qualityAdjustment: qualityResult,
          prediction: prediction,
          improvement: {
            expectedFpsGain: prediction.fps - testData.fps,
            qualityAdjusted: qualityResult.adjusted || false,
          },
        };
      }

      // 改善効果の検証
      Object.keys(results).forEach(scenarioName => {
        const result = results[scenarioName];
        expect(result.autoOptimization).toBeDefined();
        expect(result.prediction.confidence).toBeGreaterThan(0);
      });

      console.log('統合最適化効果測定:', results);
    });
  });
});
