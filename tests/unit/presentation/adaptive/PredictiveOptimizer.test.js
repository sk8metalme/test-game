/**
 * PredictiveOptimizer.test.js - PredictiveOptimizer テスト
 *
 * TDD Red Phase: テストを通すための実装
 *
 * 責任:
 * - Web Worker活用による非同期予測処理
 * - 先読み最適化機能（次の操作予測）
 * - パフォーマンス予測と調整
 * - IntelligentAnalyzerとの連携
 * - 軽量処理（メインスレッドブロッキング回避）
 */

import { PredictiveOptimizer } from '../../../../src/presentation/adaptive/PredictiveOptimizer.js';

// Web Worker のモック
global.Worker = jest.fn().mockImplementation(() => ({
  postMessage: jest.fn(),
  terminate: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

describe('PredictiveOptimizer', () => {
  let optimizer;
  let mockAnalyzer;

  beforeEach(() => {
    jest.clearAllMocks();

    // IntelligentAnalyzer のモック
    mockAnalyzer = {
      predictNextAction: jest.fn(),
      getLearningStats: jest.fn(),
      exportLearningData: jest.fn(),
      analyzeUsageFrequency: jest.fn(),
    };

    optimizer = null;
  });

  afterEach(() => {
    if (optimizer) {
      optimizer.destroy();
    }
  });

  describe('初期化', () => {
    test('デフォルト設定で初期化される', () => {
      optimizer = new PredictiveOptimizer(mockAnalyzer);

      expect(optimizer.analyzer).toBe(mockAnalyzer);
      expect(optimizer.isDestroyed).toBe(false);
      expect(optimizer.predictions).toBeInstanceOf(Map);
      expect(optimizer.optimizations).toBeInstanceOf(Map);
      expect(optimizer.worker).toBeDefined();
    });

    test('カスタム設定で初期化される', () => {
      const config = {
        predictionThreshold: 0.8,
        maxPredictions: 50,
        workerPath: 'custom-worker.js',
      };
      optimizer = new PredictiveOptimizer(mockAnalyzer, config);

      expect(optimizer.config.predictionThreshold).toBe(0.8);
      expect(optimizer.config.maxPredictions).toBe(50);
      expect(optimizer.config.workerPath).toBe('custom-worker.js');
    });

    test('analyzerなしでエラーが発生する', () => {
      expect(() => {
        new PredictiveOptimizer(null);
      }).toThrow('Analyzer is required');
    });
  });

  describe('予測機能', () => {
    beforeEach(() => {
      optimizer = new PredictiveOptimizer(mockAnalyzer);
    });

    test('次の操作が予測される', async () => {
      const context = { gameState: 'playing', deviceType: 'desktop' };
      mockAnalyzer.predictNextAction.mockReturnValue({
        actionType: 'rotate',
        confidence: 0.85,
      });

      const prediction = await optimizer.predictNextOperation(context);

      expect(prediction.actionType).toBe('rotate');
      expect(prediction.confidence).toBe(0.85);
      expect(mockAnalyzer.predictNextAction).toHaveBeenCalledWith(context);
    });

    test('複数の操作が予測される', async () => {
      const context = { gameState: 'playing', deviceType: 'mobile' };

      const predictions = await optimizer.predictMultipleOperations(context, 3);

      expect(Array.isArray(predictions)).toBe(true);
      expect(predictions.length).toBeLessThanOrEqual(3);
    });

    test('信頼度の低い予測は除外される', async () => {
      const context = { gameState: 'unknown', deviceType: 'unknown' };
      mockAnalyzer.predictNextAction.mockReturnValue({
        actionType: 'unknown',
        confidence: 0.1,
      });

      const prediction = await optimizer.predictNextOperation(context);

      expect(prediction).toBeNull();
    });

    test('予測が非同期で実行される', async () => {
      const context = { gameState: 'playing', deviceType: 'tablet' };

      const startTime = performance.now();
      const predictionPromise = optimizer.predictNextOperation(context);
      const immediateTime = performance.now();

      // 非同期実行のため、即座に制御が戻る
      expect(immediateTime - startTime).toBeLessThan(10);

      await predictionPromise;
    });
  });

  describe('最適化機能', () => {
    beforeEach(() => {
      optimizer = new PredictiveOptimizer(mockAnalyzer);
    });

    test('UI最適化が実行される', async () => {
      const context = { gameState: 'playing', performance: 'low' };

      const optimization = await optimizer.optimizeUI(context);

      expect(optimization).toHaveProperty('type');
      expect(optimization).toHaveProperty('adjustments');
      expect(optimization).toHaveProperty('priority');
    });

    test('パフォーマンス最適化が実行される', async () => {
      const performanceData = {
        fps: 45,
        memoryUsage: 80,
        renderTime: 20,
      };

      const optimization = await optimizer.optimizePerformance(performanceData);

      expect(optimization).toHaveProperty('recommendations');
      expect(optimization).toHaveProperty('adjustments');
    });

    test('先読み最適化が実行される', async () => {
      const context = { gameState: 'playing', nextAction: 'rotate' };

      const preloading = await optimizer.preloadOptimizations(context);

      expect(preloading.prepared).toBe(true);
      expect(preloading.optimizations).toBeInstanceOf(Array);
    });

    test('動的調整が適用される', async () => {
      const adjustments = {
        animationSpeed: 0.8,
        particleDensity: 0.6,
        effectIntensity: 0.7,
      };

      const result = await optimizer.applyDynamicAdjustments(adjustments);

      expect(result.applied).toBe(true);
      expect(result.adjustments).toEqual(adjustments);
    });
  });

  describe('Web Worker連携', () => {
    beforeEach(() => {
      optimizer = new PredictiveOptimizer(mockAnalyzer);
    });

    test('Workerが正しく初期化される', () => {
      expect(global.Worker).toHaveBeenCalled();
      expect(optimizer.worker).toBeDefined();
    });

    test('Workerにメッセージが送信される', () => {
      const data = { type: 'predict', context: { test: true } };

      // sendToWorkerを呼び出すとpostMessageが呼ばれることを確認
      optimizer.sendToWorker(data);

      expect(optimizer.worker.postMessage).toHaveBeenCalled();
    });

    test('Workerからの応答が処理される', () => {
      const mockResponse = { type: 'prediction', result: { action: 'move' } };

      // Worker応答をシミュレート
      const messageHandler = optimizer.worker.addEventListener.mock.calls.find(
        call => call[0] === 'message'
      )?.[1];

      if (messageHandler) {
        // Worker メッセージハンドラーが存在することを確認
        expect(typeof messageHandler).toBe('function');

        // ハンドラーを直接呼び出して動作確認
        messageHandler({ data: mockResponse });
      }

      expect(optimizer.worker.addEventListener).toHaveBeenCalledWith(
        'message',
        expect.any(Function)
      );
    });

    test('Workerエラーが適切に処理される', async () => {
      const errorHandler = optimizer.worker.addEventListener.mock.calls.find(
        call => call[0] === 'error'
      )[1];

      const errorPromise = optimizer.sendToWorker({ type: 'error-test' });
      errorHandler(new Error('Worker error'));

      await expect(errorPromise).rejects.toThrow('Worker error');
    });
  });

  describe('キャッシュ管理', () => {
    beforeEach(() => {
      optimizer = new PredictiveOptimizer(mockAnalyzer);
    });

    test('予測結果がキャッシュされる', async () => {
      const context = { gameState: 'playing', deviceType: 'desktop' };
      mockAnalyzer.predictNextAction.mockReturnValue({
        actionType: 'rotate',
        confidence: 0.85,
      });

      // 初回予測
      await optimizer.predictNextOperation(context);

      // キャッシュから取得
      const cachedPrediction = optimizer.getCachedPrediction(context);

      expect(cachedPrediction).toBeDefined();
      expect(cachedPrediction.actionType).toBe('rotate');
    });

    test('古いキャッシュが削除される', () => {
      // 設定でキャッシュ有効期限を短くする
      optimizer.config.cacheExpiry = 100; // 100ms

      const context = { gameState: 'playing', deviceType: 'desktop' };
      mockAnalyzer.predictNextAction.mockReturnValue({
        actionType: 'rotate',
        confidence: 0.85,
      });

      // 予測を実行してキャッシュ
      optimizer.predictNextOperation(context);

      // 手動で古いタイムスタンプを設定
      const key = optimizer._generateCacheKey(context);
      if (optimizer.predictions.has(key)) {
        const cached = optimizer.predictions.get(key);
        cached.timestamp = Date.now() - 200; // 200ms前に設定
        optimizer.predictions.set(key, cached);
      }

      const cachedPrediction = optimizer.getCachedPrediction(context);
      expect(cachedPrediction).toBeNull();
    });

    test('キャッシュサイズ制限が機能する', async () => {
      optimizer.config.maxPredictions = 3;

      // 制限を超える予測を実行
      for (let i = 0; i < 5; i++) {
        await optimizer.predictNextOperation({
          gameState: 'playing',
          index: i,
        });
      }

      expect(optimizer.predictions.size).toBeLessThanOrEqual(3);
    });
  });

  describe('パフォーマンス監視', () => {
    beforeEach(() => {
      optimizer = new PredictiveOptimizer(mockAnalyzer);
    });

    test('予測時間が測定される', async () => {
      const context = { gameState: 'playing', deviceType: 'desktop' };

      await optimizer.predictNextOperation(context);

      const stats = optimizer.getPerformanceStats();
      expect(stats.averagePredictionTime).toBeDefined();
      expect(stats.totalPredictions).toBeGreaterThan(0);
    });

    test('メモリ使用量が監視される', () => {
      const memoryStats = optimizer.getMemoryStats();

      expect(memoryStats.predictionsMemory).toBeDefined();
      expect(memoryStats.optimizationsMemory).toBeDefined();
      expect(memoryStats.totalMemory).toBeDefined();
    });

    test('パフォーマンス警告が発行される', async () => {
      // 多くの予測を実行してメモリ使用量を増やす
      for (let i = 0; i < 100; i++) {
        await optimizer.predictNextOperation({ index: i });
      }

      const warnings = optimizer.getPerformanceWarnings();
      expect(Array.isArray(warnings)).toBe(true);
    });
  });

  describe('統計機能', () => {
    beforeEach(() => {
      optimizer = new PredictiveOptimizer(mockAnalyzer);
    });

    test('予測統計が取得される', async () => {
      await optimizer.predictNextOperation({ gameState: 'playing' });
      await optimizer.predictNextOperation({ gameState: 'menu' });

      const stats = optimizer.getPredictionStats();

      expect(stats.totalPredictions).toBe(2);
      expect(stats.successfulPredictions).toBeDefined();
      expect(stats.averageConfidence).toBeDefined();
    });

    test('最適化統計が取得される', async () => {
      await optimizer.optimizeUI({ performance: 'low' });

      const stats = optimizer.getOptimizationStats();

      expect(stats.totalOptimizations).toBeGreaterThan(0);
      expect(stats.appliedOptimizations).toBeDefined();
    });

    test('統計がリセットされる', async () => {
      await optimizer.predictNextOperation({ gameState: 'playing' });

      optimizer.resetStats();

      const stats = optimizer.getPredictionStats();
      expect(stats.totalPredictions).toBe(0);
    });
  });

  describe('破棄処理', () => {
    beforeEach(() => {
      optimizer = new PredictiveOptimizer(mockAnalyzer);
    });

    test('破棄処理が正常に実行される', () => {
      optimizer.destroy();

      expect(optimizer.isDestroyed).toBe(true);
      expect(optimizer.worker.terminate).toHaveBeenCalled();
      expect(optimizer.predictions.size).toBe(0);
    });

    test('破棄後の操作でエラーが発生する', async () => {
      optimizer.destroy();

      await expect(async () => {
        await optimizer.predictNextOperation({ test: true });
      }).rejects.toThrow('PredictiveOptimizer has been destroyed');
    });
  });
});
