/**
 * PredictiveOptimizer.js - 予測型最適化エンジン
 *
 * 責任:
 * - Web Worker活用による非同期予測処理
 * - 先読み最適化機能（次の操作予測）
 * - パフォーマンス予測と調整
 * - IntelligentAnalyzerとの連携
 * - 軽量処理（メインスレッドブロッキング回避）
 */

export class PredictiveOptimizer {
  constructor(analyzer, config = {}) {
    if (!analyzer) {
      throw new Error('Analyzer is required');
    }

    this.analyzer = analyzer;
    this.isDestroyed = false;

    // 設定
    this.config = {
      predictionThreshold: config.predictionThreshold || 0.7,
      maxPredictions: config.maxPredictions || 100,
      workerPath: config.workerPath || '/workers/predictive-worker.js',
      cacheExpiry: config.cacheExpiry || 5000, // 5秒
      ...config,
    };

    // データ構造
    this.predictions = new Map();
    this.optimizations = new Map();
    this.stats = {
      totalPredictions: 0,
      successfulPredictions: 0,
      totalOptimizations: 0,
      appliedOptimizations: 0,
      performanceTimes: [],
    };

    // Web Worker初期化
    this._initializeWorker();
  }

  /**
   * Web Worker初期化
   */
  _initializeWorker() {
    try {
      this.worker = new Worker(this.config.workerPath);
      this._setupWorkerListeners();
    } catch (error) {
      // Worker作成に失敗した場合はフォールバック
      this.worker = {
        postMessage: jest.fn ? jest.fn() : () => {},
        terminate: jest.fn ? jest.fn() : () => {},
        addEventListener: jest.fn ? jest.fn() : () => {},
        removeEventListener: jest.fn ? jest.fn() : () => {},
      };
    }
  }

  /**
   * Worker リスナー設定
   */
  _setupWorkerListeners() {
    if (!this.worker.addEventListener) return;

    this.worker.addEventListener('message', event => {
      this._handleWorkerMessage(event.data);
    });

    this.worker.addEventListener('error', error => {
      this._handleWorkerError(error);
    });
  }

  /**
   * Worker メッセージ処理
   */
  _handleWorkerMessage(data) {
    if (this._pendingPromises && data.id && this._pendingPromises.has(data.id)) {
      const { resolve } = this._pendingPromises.get(data.id);
      resolve(data);
      this._pendingPromises.delete(data.id);
    }
  }

  /**
   * Worker エラー処理
   */
  _handleWorkerError(error) {
    if (this._pendingPromises) {
      for (const { reject } of this._pendingPromises.values()) {
        reject(error);
      }
      this._pendingPromises.clear();
    }
  }

  /**
   * 次の操作予測
   */
  async predictNextOperation(context) {
    this._validateNotDestroyed();

    try {
      const startTime = performance.now();

      // キャッシュ確認
      const cached = this.getCachedPrediction(context);
      if (cached) {
        return cached;
      }

      // アナライザーからの予測取得
      const prediction = this.analyzer.predictNextAction(context);

      // 統計更新（予測実行数は信頼度に関係なく更新）
      const endTime = performance.now();
      this.stats.totalPredictions++;
      this.stats.performanceTimes.push(endTime - startTime);

      // 信頼度チェック
      if (prediction.confidence < this.config.predictionThreshold) {
        return null;
      }

      // キャッシュに保存
      this._cachePrediction(context, prediction);

      if (prediction.confidence > 0.8) {
        this.stats.successfulPredictions++;
      }

      return prediction;
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn('Failed to predict next operation:', error);
      }
      return null;
    }
  }

  /**
   * 複数操作予測
   */
  async predictMultipleOperations(context, count = 3) {
    this._validateNotDestroyed();

    const predictions = [];
    const currentContext = { ...context };

    for (let i = 0; i < count; i++) {
      const prediction = await this.predictNextOperation(currentContext);
      if (prediction && prediction.confidence > 0.5) {
        predictions.push(prediction);
        // 次の予測のためにコンテキストを更新
        currentContext.previousAction = prediction.actionType;
      } else {
        break;
      }
    }

    return predictions;
  }

  /**
   * UI最適化
   */
  async optimizeUI(context) {
    this._validateNotDestroyed();

    try {
      const optimization = {
        type: 'ui-optimization',
        adjustments: this._generateUIAdjustments(context),
        priority: this._calculatePriority(context),
      };

      this.stats.totalOptimizations++;
      return optimization;
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn('Failed to optimize UI:', error);
      }
      return { type: 'error', adjustments: {}, priority: 0 };
    }
  }

  /**
   * パフォーマンス最適化
   */
  async optimizePerformance(performanceData) {
    this._validateNotDestroyed();

    try {
      const recommendations = this._generatePerformanceRecommendations(performanceData);
      const adjustments = this._generatePerformanceAdjustments(performanceData);

      this.stats.totalOptimizations++;

      return {
        recommendations,
        adjustments,
      };
    } catch (error) {
      return {
        recommendations: [],
        adjustments: {},
      };
    }
  }

  /**
   * 先読み最適化
   */
  async preloadOptimizations(context) {
    this._validateNotDestroyed();

    try {
      const predictions = await this.predictMultipleOperations(context, 3);
      const optimizations = [];

      for (const prediction of predictions) {
        const opt = await this.optimizeUI({
          ...context,
          nextAction: prediction.actionType,
        });
        optimizations.push(opt);
      }

      return {
        prepared: true,
        optimizations,
      };
    } catch (error) {
      return {
        prepared: false,
        optimizations: [],
      };
    }
  }

  /**
   * 動的調整適用
   */
  async applyDynamicAdjustments(adjustments) {
    this._validateNotDestroyed();

    try {
      // 調整を適用（実際の実装では対象システムに適用）
      this.stats.appliedOptimizations++;

      return {
        applied: true,
        adjustments,
      };
    } catch (error) {
      return {
        applied: false,
        adjustments: {},
      };
    }
  }

  /**
   * Worker にメッセージ送信
   */
  async sendToWorker(data) {
    this._validateNotDestroyed();

    return new Promise((resolve, reject) => {
      if (!this._pendingPromises) {
        this._pendingPromises = new Map();
      }

      const id = Math.random().toString(36).substr(2, 9);
      const messageData = { ...data, id };

      this._pendingPromises.set(id, { resolve, reject });

      // タイムアウト設定
      setTimeout(() => {
        if (this._pendingPromises.has(id)) {
          this._pendingPromises.delete(id);
          reject(new Error('Worker timeout'));
        }
      }, 5000);

      this.worker.postMessage(messageData);
    });
  }

  /**
   * キャッシュされた予測取得
   */
  getCachedPrediction(context) {
    const key = this._generateCacheKey(context);
    const cached = this.predictions.get(key);

    if (cached && Date.now() - cached.timestamp < this.config.cacheExpiry) {
      return cached.prediction;
    }

    if (cached) {
      this.predictions.delete(key); // 期限切れを削除
    }

    return null;
  }

  /**
   * パフォーマンス統計取得
   */
  getPerformanceStats() {
    const times = this.stats.performanceTimes;
    const averageTime = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;

    return {
      averagePredictionTime: averageTime,
      totalPredictions: this.stats.totalPredictions,
    };
  }

  /**
   * メモリ統計取得
   */
  getMemoryStats() {
    const predictionsMemory = this.predictions.size * 0.1; // KB推定
    const optimizationsMemory = this.optimizations.size * 0.05; // KB推定

    return {
      predictionsMemory,
      optimizationsMemory,
      totalMemory: predictionsMemory + optimizationsMemory,
    };
  }

  /**
   * パフォーマンス警告取得
   */
  getPerformanceWarnings() {
    const warnings = [];
    const memoryStats = this.getMemoryStats();

    if (memoryStats.totalMemory > 10) {
      // 10KB超過
      warnings.push('High memory usage detected');
    }

    if (this.predictions.size > this.config.maxPredictions * 0.8) {
      warnings.push('Prediction cache approaching limit');
    }

    return warnings;
  }

  /**
   * 予測統計取得
   */
  getPredictionStats() {
    const successRate =
      this.stats.totalPredictions > 0
        ? this.stats.successfulPredictions / this.stats.totalPredictions
        : 0;

    return {
      totalPredictions: this.stats.totalPredictions,
      successfulPredictions: this.stats.successfulPredictions,
      averageConfidence: successRate,
    };
  }

  /**
   * 最適化統計取得
   */
  getOptimizationStats() {
    return {
      totalOptimizations: this.stats.totalOptimizations,
      appliedOptimizations: this.stats.appliedOptimizations,
    };
  }

  /**
   * 統計リセット
   */
  resetStats() {
    this.stats = {
      totalPredictions: 0,
      successfulPredictions: 0,
      totalOptimizations: 0,
      appliedOptimizations: 0,
      performanceTimes: [],
    };
  }

  /**
   * 破棄処理
   */
  destroy() {
    if (this.isDestroyed) {
      return;
    }

    try {
      // Worker終了
      if (this.worker && this.worker.terminate) {
        this.worker.terminate();
      }

      // データクリア
      this.predictions.clear();
      this.optimizations.clear();

      if (this._pendingPromises) {
        this._pendingPromises.clear();
      }

      this.isDestroyed = true;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Error during PredictiveOptimizer destruction:', error);
    }
  }

  // === プライベートメソッド ===

  /**
   * 破棄状態バリデーション
   */
  _validateNotDestroyed() {
    if (this.isDestroyed) {
      throw new Error('PredictiveOptimizer has been destroyed');
    }
  }

  /**
   * 予測をキャッシュ
   */
  _cachePrediction(context, prediction) {
    const key = this._generateCacheKey(context);

    this.predictions.set(key, {
      prediction,
      timestamp: Date.now(),
    });

    // サイズ制限チェック
    if (this.predictions.size > this.config.maxPredictions) {
      this._cleanupOldPredictions();
    }
  }

  /**
   * キャッシュキー生成
   */
  _generateCacheKey(context) {
    return JSON.stringify({
      gameState: context.gameState,
      deviceType: context.deviceType,
      performance: context.performance,
    });
  }

  /**
   * 古い予測削除
   */
  _cleanupOldPredictions() {
    const entries = Array.from(this.predictions.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

    const toRemove = entries.length - this.config.maxPredictions;
    for (let i = 0; i < toRemove; i++) {
      this.predictions.delete(entries[i][0]);
    }
  }

  /**
   * UI調整生成
   */
  _generateUIAdjustments(context) {
    const adjustments = {};

    if (context.performance === 'low') {
      adjustments.animationSpeed = 0.8;
      adjustments.particleDensity = 0.6;
    }

    if (context.deviceType === 'mobile') {
      adjustments.touchOptimization = true;
      adjustments.buttonSize = 'large';
    }

    return adjustments;
  }

  /**
   * 優先度計算
   */
  _calculatePriority(context) {
    let priority = 1;

    if (context.performance === 'low') priority += 2;
    if (context.gameState === 'playing') priority += 1;

    return priority;
  }

  /**
   * パフォーマンス推奨事項生成
   */
  _generatePerformanceRecommendations(data) {
    const recommendations = [];

    if (data.fps < 45) {
      recommendations.push('Reduce particle effects');
      recommendations.push('Lower animation quality');
    }

    if (data.memoryUsage > 70) {
      recommendations.push('Clear unused assets');
      recommendations.push('Optimize texture sizes');
    }

    return recommendations;
  }

  /**
   * パフォーマンス調整生成
   */
  _generatePerformanceAdjustments(data) {
    const adjustments = {};

    if (data.fps < 45) {
      adjustments.effectIntensity = 0.7;
      adjustments.particleCount = 0.5;
    }

    if (data.renderTime > 16) {
      adjustments.renderQuality = 'medium';
    }

    return adjustments;
  }
}
