/**
 * PredictiveAnalyzer - パフォーマンス予測分析システム
 *
 * 統計的手法を用いてパフォーマンスの将来予測を行う
 * ボトルネック検出、最適化推奨、リアルタイム分析機能を提供
 * 移動平均、線形回帰、異常検出アルゴリズムを統合した高度予測システム
 */
class PredictiveAnalyzer {
  constructor(options = {}) {
    const { performanceMonitor, dataProcessor, config = {} } = options;

    // 依存関係の設定（モック可能）
    this.performanceMonitor = performanceMonitor || this._createDefaultPerformanceMonitor();
    this.dataProcessor = dataProcessor || this._createDefaultDataProcessor();

    // 設定の初期化
    this.config = {
      prediction: {
        timeHorizon: 5000, // デフォルト予測時間（5秒）
        algorithms: ['movingAverage', 'linearRegression', 'exponentialSmoothing'],
        confidence: {
          minimum: 0.5, // 最小信頼度
          dataPoints: 10, // 信頼度計算に必要な最小データ点数
        },
        shortTermThreshold: 3000, // 短期予測閾値（3秒）
        longTermThreshold: 10000, // 長期予測閾値（10秒）
      },
      analysis: {
        windowSize: 10, // 移動平均ウィンドウサイズ
        updateInterval: 1000, // 分析更新間隔（1秒）
        anomalyThreshold: 2.0, // 異常検出閾値（標準偏差の倍数）
        bottleneckThresholds: {
          fps: 45, // FPS低下閾値
          memory: 80, // メモリ使用率閾値
          renderTime: 20, // レンダリング時間閾値
          cpu: 70, // CPU使用率閾値
        },
      },
      optimization: {
        priorities: ['critical', 'high', 'medium', 'low'],
        recommendations: {
          immediate: ['particleReduction', 'gc', 'qualityReduction'],
          preventive: ['memoryMonitoring', 'poolOptimization', 'caching'],
        },
      },
      ...config,
    };

    // 状態管理
    this.isAnalyzing = false;
    this.isDestroyed = false;
    this.analysisInterval = null;
    this._performanceUpdateHandler = null;

    // 予測・分析履歴
    this.predictionHistory = [];
    this.analysisHistory = [];
    this.bottleneckHistory = [];

    // 履歴サイズ制限
    this.maxHistorySize = 100;
  }

  /**
   * 将来のパフォーマンス予測を実行
   * @param {number} timeHorizon - 予測時間（ミリ秒）
   * @returns {Promise<Object>} 予測結果
   */
  async predictFuturePerformance(timeHorizon) {
    if (this.isDestroyed) {
      throw new Error('PredictiveAnalyzer has been destroyed');
    }

    if (!timeHorizon || timeHorizon <= 0) {
      throw new Error('Invalid time horizon');
    }

    try {
      const startTime = Date.now();
      const performanceHistory = this.performanceMonitor.getPerformanceHistory();

      // データ不足チェック
      if (performanceHistory.length < this.config.prediction.confidence.dataPoints) {
        return this._createLowConfidencePrediction(timeHorizon, 'Insufficient data');
      }

      // 予測アルゴリズム選択
      const algorithm = this._selectPredictionAlgorithm(timeHorizon);

      // 予測実行（エラー時のフォールバック付き）
      let prediction;
      try {
        prediction = await this._executePrediction(performanceHistory, timeHorizon, algorithm);
      } catch (error) {
        // console.warn('Prediction algorithm failed, using fallback:', error.message);
        return this._createLowConfidencePrediction(
          timeHorizon,
          `Algorithm error: ${error.message}`
        );
      }

      // 信頼度計算
      prediction.confidence = this._calculatePredictionConfidence(performanceHistory, prediction);
      prediction.algorithm = algorithm;
      prediction.timeHorizon = timeHorizon;
      prediction.executionTime = Date.now() - startTime;

      // 履歴に記録
      this._addToPredictionHistory({
        timestamp: startTime,
        prediction: { ...prediction },
      });

      return prediction;
    } catch (error) {
      throw new Error(`Performance prediction failed: ${error.message}`);
    }
  }

  /**
   * パフォーマンスボトルネック分析
   * @returns {Object} ボトルネック分析結果
   */
  analyzeBottlenecks() {
    try {
      const currentMetrics = this.performanceMonitor.getCurrentMetrics();
      const thresholds = this.config.analysis.bottleneckThresholds;

      const bottlenecks = {
        detected: false,
        categories: [],
        severity: 0,
        details: {},
        recommendations: [],
        timestamp: Date.now(),
      };

      let totalSeverity = 0;
      let bottleneckCount = 0;

      // FPSボトルネック検出
      if (currentMetrics.fps < thresholds.fps) {
        bottlenecks.categories.push('rendering');
        const fpsScore = (thresholds.fps - currentMetrics.fps) / thresholds.fps;
        bottlenecks.details.fps = { value: currentMetrics.fps, severity: fpsScore };
        totalSeverity += fpsScore;
        bottleneckCount++;
      }

      // メモリボトルネック検出
      if (currentMetrics.memoryUsage > thresholds.memory) {
        bottlenecks.categories.push('memory');
        const memoryScore =
          (currentMetrics.memoryUsage - thresholds.memory) / (100 - thresholds.memory);
        bottlenecks.details.memory = { value: currentMetrics.memoryUsage, severity: memoryScore };
        totalSeverity += memoryScore;
        bottleneckCount++;
      }

      // レンダリング時間ボトルネック検出
      if (currentMetrics.renderTime > thresholds.renderTime) {
        bottlenecks.categories.push('rendering');
        const renderScore =
          (currentMetrics.renderTime - thresholds.renderTime) / thresholds.renderTime;
        bottlenecks.details.renderTime = {
          value: currentMetrics.renderTime,
          severity: renderScore,
        };
        totalSeverity += renderScore;
        bottleneckCount++;
      }

      // CPUボトルネック検出
      if (currentMetrics.cpuUsage > thresholds.cpu) {
        bottlenecks.categories.push('cpu');
        const cpuScore = (currentMetrics.cpuUsage - thresholds.cpu) / (100 - thresholds.cpu);
        bottlenecks.details.cpu = { value: currentMetrics.cpuUsage, severity: cpuScore };
        totalSeverity += cpuScore;
        bottleneckCount++;
      }

      // 総合評価
      if (bottleneckCount > 0) {
        bottlenecks.detected = true;
        bottlenecks.severity = Math.min(1.0, totalSeverity / bottleneckCount);
        bottlenecks.recommendations = this._generateBottleneckRecommendations(bottlenecks);
      }

      // 履歴に記録
      this._addToBottleneckHistory(bottlenecks);

      return bottlenecks;
    } catch (error) {
      // console.error('Bottleneck analysis failed:', error);
      return {
        detected: false,
        categories: [],
        severity: 0,
        error: error.message,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * 最適化推奨事項の生成
   * @returns {Object} 最適化推奨
   */
  getOptimizationRecommendations() {
    const currentMetrics = this.performanceMonitor.getCurrentMetrics();
    const bottlenecks = this.analyzeBottlenecks();

    const recommendations = {
      immediate: [],
      preventive: [],
      priority: 'low',
      confidence: 0.8,
      reasoning: [],
      timestamp: Date.now(),
    };

    // 緊急最適化推奨（critical/high priority）
    if (currentMetrics.fps < 30) {
      recommendations.immediate.push('Reduce particle count');
      recommendations.immediate.push('Lower quality settings');
      recommendations.priority = 'critical';
      recommendations.reasoning.push('Critical FPS degradation detected');
    }

    if (currentMetrics.memoryUsage > 85) {
      recommendations.immediate.push('Trigger garbage collection');
      recommendations.immediate.push('Release unused objects');
      recommendations.priority = this._upgradePriority(recommendations.priority, 'high');
      recommendations.reasoning.push('High memory usage detected');
    }

    if (currentMetrics.renderTime > 25) {
      recommendations.immediate.push('Disable complex effects');
      recommendations.immediate.push('Reduce render resolution');
      recommendations.priority = this._upgradePriority(recommendations.priority, 'high');
      recommendations.reasoning.push('Render time exceeds threshold');
    }

    // 予防的最適化推奨（medium/low priority）
    if (currentMetrics.memoryUsage > 60) {
      recommendations.preventive.push('Monitor memory growth');
      recommendations.preventive.push('Optimize object pools');
      recommendations.priority = this._upgradePriority(recommendations.priority, 'medium');
    }

    if (currentMetrics.fps < 50 && currentMetrics.fps >= 45) {
      recommendations.preventive.push('Pre-emptive quality adjustment');
      recommendations.preventive.push('Cache frequently used objects');
      recommendations.priority = this._upgradePriority(recommendations.priority, 'medium');
    }

    // ボトルネックベースの推奨
    if (bottlenecks.detected) {
      recommendations.immediate.push(...this._getBottleneckSpecificRecommendations(bottlenecks));
      recommendations.priority = this._upgradePriority(recommendations.priority, 'high');
      recommendations.confidence = Math.min(
        recommendations.confidence,
        1 - bottlenecks.severity * 0.3
      );
    }

    // デフォルト推奨（すべて良好な場合）
    if (recommendations.immediate.length === 0 && recommendations.preventive.length === 0) {
      recommendations.preventive.push('Continue monitoring');
      recommendations.preventive.push('Maintain current settings');
      recommendations.confidence = 0.9;
    }

    return recommendations;
  }

  /**
   * 継続分析を開始
   */
  startContinuousAnalysis() {
    if (this.isAnalyzing) {
      return; // 既に分析中
    }

    this.isAnalyzing = true;

    // パフォーマンス更新イベントの監視開始
    this._performanceUpdateHandler = event => {
      this._performContinuousAnalysis(event.data);
    };

    this.performanceMonitor.addEventListener('performanceUpdate', this._performanceUpdateHandler);

    // 定期分析の開始
    this.analysisInterval = setInterval(() => {
      this._performScheduledAnalysis();
    }, this.config.analysis.updateInterval);
  }

  /**
   * 継続分析を停止
   */
  stopContinuousAnalysis() {
    if (!this.isAnalyzing) {
      return; // 既に停止済み
    }

    this.isAnalyzing = false;

    // イベントリスナーの削除
    if (this._performanceUpdateHandler) {
      this.performanceMonitor.removeEventListener(
        'performanceUpdate',
        this._performanceUpdateHandler
      );
      this._performanceUpdateHandler = null;
    }

    // インターバルのクリア
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
      this.analysisInterval = null;
    }
  }

  /**
   * 包括的な分析レポートを生成
   * @returns {Object} 分析レポート
   */
  getAnalysisReport() {
    const currentMetrics = this.performanceMonitor.getCurrentMetrics();
    const bottlenecks = this.analyzeBottlenecks();
    const recommendations = this.getOptimizationRecommendations();

    return {
      currentState: currentMetrics,
      predictions: {
        latest: this.predictionHistory[this.predictionHistory.length - 1] || null,
        history: this.predictionHistory.slice(-5),
      },
      bottlenecks,
      recommendations,
      confidence: {
        overall: this._calculateOverallConfidence(),
        predictions: this._calculateAveragePredictionConfidence(),
        bottlenecks: bottlenecks.detected ? 1 - bottlenecks.severity * 0.5 : 0.9,
      },
      statistics: {
        totalPredictions: this.predictionHistory.length,
        totalBottlenecks: this.bottleneckHistory.filter(b => b.detected).length,
        averageConfidence: this._calculateAverageConfidence(),
      },
      timestamp: Date.now(),
    };
  }

  /**
   * 各種履歴情報を取得するメソッド群
   */
  getPredictionHistory() {
    return [...this.predictionHistory];
  }

  getBottleneckHistory() {
    return [...this.bottleneckHistory];
  }

  /**
   * PredictiveAnalyzerを破棄
   */
  destroy() {
    if (this.isDestroyed) {
      return; // 既に破棄済み
    }

    this.stopContinuousAnalysis();
    this.isDestroyed = true;

    // 履歴データのクリア
    this.predictionHistory = [];
    this.analysisHistory = [];
    this.bottleneckHistory = [];
  }

  /**
   * プライベートメソッド群
   */

  _selectPredictionAlgorithm(timeHorizon) {
    if (timeHorizon <= this.config.prediction.shortTermThreshold) {
      return ['movingAverage'];
    } else if (timeHorizon <= this.config.prediction.longTermThreshold) {
      return ['linearRegression'];
    } else {
      return ['exponentialSmoothing', 'linearRegression'];
    }
  }

  async _executePrediction(history, timeHorizon, algorithms) {
    const predictions = {
      fps: 0,
      memoryUsage: 0,
      renderTime: 0,
      confidence: 0,
    };

    let totalWeight = 0;

    for (const algorithm of algorithms) {
      const weight = this._getAlgorithmWeight(algorithm);
      const algorithmPrediction = await this._executeAlgorithmPrediction(
        history,
        timeHorizon,
        algorithm
      );

      predictions.fps += algorithmPrediction.fps * weight;
      predictions.memoryUsage += algorithmPrediction.memoryUsage * weight;
      predictions.renderTime += algorithmPrediction.renderTime * weight;
      totalWeight += weight;
    }

    // 重み付き平均
    if (totalWeight > 0) {
      predictions.fps /= totalWeight;
      predictions.memoryUsage /= totalWeight;
      predictions.renderTime /= totalWeight;
    }

    return predictions;
  }

  async _executeAlgorithmPrediction(history, timeHorizon, algorithm) {
    const fpsValues = history.map(h => h.fps);
    const memoryValues = history.map(h => h.memoryUsage);
    const renderTimeValues = history.map(h => h.renderTime || 16);

    switch (algorithm) {
      case 'movingAverage': {
        return {
          fps: this.dataProcessor.calculateMovingAverage(
            fpsValues,
            this.config.analysis.windowSize
          ),
          memoryUsage: this.dataProcessor.calculateMovingAverage(
            memoryValues,
            this.config.analysis.windowSize
          ),
          renderTime: this.dataProcessor.calculateMovingAverage(
            renderTimeValues,
            this.config.analysis.windowSize
          ),
        };
      }

      case 'linearRegression': {
        const fpsRegression = this.dataProcessor.calculateLinearRegression(fpsValues);
        const memoryRegression = this.dataProcessor.calculateLinearRegression(memoryValues);
        const futureTime = timeHorizon / 1000; // 秒に変換

        return {
          fps: fpsRegression.slope * futureTime + fpsRegression.intercept,
          memoryUsage: memoryRegression.slope * futureTime + memoryRegression.intercept,
          renderTime: this.dataProcessor.calculateMovingAverage(renderTimeValues, 3), // レンダリング時間は安定しているため移動平均
        };
      }

      case 'exponentialSmoothing': {
        // 簡易指数平滑化
        const alpha = 0.3;
        return {
          fps: this._exponentialSmoothing(fpsValues, alpha),
          memoryUsage: this._exponentialSmoothing(memoryValues, alpha),
          renderTime: this._exponentialSmoothing(renderTimeValues, alpha),
        };
      }

      default:
        throw new Error(`Unknown algorithm: ${algorithm}`);
    }
  }

  _exponentialSmoothing(values, alpha) {
    if (values.length === 0) return 0;
    if (values.length === 1) return values[0];

    let smoothed = values[0];
    for (let i = 1; i < values.length; i++) {
      smoothed = alpha * values[i] + (1 - alpha) * smoothed;
    }
    return smoothed;
  }

  _getAlgorithmWeight(algorithm) {
    const weights = {
      movingAverage: 0.4,
      linearRegression: 0.5,
      exponentialSmoothing: 0.3,
    };
    return weights[algorithm] || 0.3;
  }

  _calculatePredictionConfidence(history, _prediction) {
    if (!history || history.length < this.config.prediction.confidence.dataPoints) {
      return 0.3;
    }

    // データ点数による信頼度
    const dataConfidence = Math.min(1.0, history.length / 50);

    // 変動性による信頼度
    const fpsValues = history.map(h => h.fps);
    const fpsVariance = this._calculateVariance(fpsValues);
    const varianceConfidence = Math.max(0.1, 1 - fpsVariance / 100);

    return (dataConfidence + varianceConfidence) / 2;
  }

  _calculateVariance(values) {
    if (values.length === 0) return 0;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return variance;
  }

  _calculateOverallConfidence() {
    const predictionConfidence = this._calculateAverageConfidence();
    const dataQuality = this.performanceMonitor.getPerformanceHistory().length > 20 ? 0.8 : 0.5;
    return (predictionConfidence + dataQuality) / 2;
  }

  _calculateAverageConfidence() {
    if (this.predictionHistory.length === 0) return 0.5;
    const totalConfidence = this.predictionHistory.reduce(
      (sum, p) => sum + (p.prediction.confidence || 0.5),
      0
    );
    return totalConfidence / this.predictionHistory.length;
  }

  _calculateAveragePredictionConfidence() {
    return this._calculateAverageConfidence();
  }

  _createLowConfidencePrediction(timeHorizon, warning) {
    const currentMetrics = this.performanceMonitor.getCurrentMetrics();
    return {
      fps: currentMetrics.fps,
      memoryUsage: currentMetrics.memoryUsage,
      renderTime: currentMetrics.renderTime || 16,
      confidence: 0.2,
      warning,
      timeHorizon,
      algorithm: ['fallback'],
    };
  }

  _generateBottleneckRecommendations(bottlenecks) {
    const recommendations = [];

    bottlenecks.categories.forEach(category => {
      switch (category) {
        case 'rendering':
          recommendations.push('Reduce rendering complexity');
          recommendations.push('Lower particle count');
          break;
        case 'memory':
          recommendations.push('Trigger garbage collection');
          recommendations.push('Optimize memory usage');
          break;
        case 'cpu':
          recommendations.push('Reduce CPU-intensive operations');
          recommendations.push('Optimize algorithms');
          break;
      }
    });

    return recommendations;
  }

  _getBottleneckSpecificRecommendations(bottlenecks) {
    const specific = [];

    if (bottlenecks.details.fps) {
      specific.push('Immediate FPS optimization required');
    }
    if (bottlenecks.details.memory) {
      specific.push('Memory cleanup required');
    }
    if (bottlenecks.details.cpu) {
      specific.push('CPU optimization required');
    }

    return specific;
  }

  _upgradePriority(currentPriority, newPriority) {
    const priorities = ['low', 'medium', 'high', 'critical'];
    const currentIndex = priorities.indexOf(currentPriority);
    const newIndex = priorities.indexOf(newPriority);
    return newIndex > currentIndex ? newPriority : currentPriority;
  }

  _performContinuousAnalysis(_performanceData) {
    // リアルタイム分析ロジック
    const bottlenecks = this.analyzeBottlenecks();
    if (bottlenecks.detected && bottlenecks.severity > 0.7) {
      // 重大なボトルネック検出時の処理
      // console.warn('Critical bottleneck detected:', bottlenecks);
    }
  }

  _performScheduledAnalysis() {
    // 定期分析ロジック
    try {
      const analysis = {
        timestamp: Date.now(),
        bottlenecks: this.analyzeBottlenecks(),
        recommendations: this.getOptimizationRecommendations(),
      };

      this.analysisHistory.push(analysis);

      // 履歴サイズ制限
      if (this.analysisHistory.length > this.maxHistorySize) {
        this.analysisHistory = this.analysisHistory.slice(-this.maxHistorySize);
      }
    } catch (error) {
      // console.error('Scheduled analysis failed:', error);
    }
  }

  _addToPredictionHistory(entry) {
    this.predictionHistory.push(entry);
    if (this.predictionHistory.length > this.maxHistorySize) {
      this.predictionHistory = this.predictionHistory.slice(-this.maxHistorySize);
    }
  }

  _addToBottleneckHistory(entry) {
    this.bottleneckHistory.push(entry);
    if (this.bottleneckHistory.length > this.maxHistorySize) {
      this.bottleneckHistory = this.bottleneckHistory.slice(-this.maxHistorySize);
    }
  }

  _createDefaultPerformanceMonitor() {
    return {
      getCurrentMetrics: () => ({
        fps: 60,
        memoryUsage: 50,
        renderTime: 16,
        cpuUsage: 30,
      }),
      getPerformanceHistory: () => [],
      addEventListener: () => {},
      removeEventListener: () => {},
    };
  }

  _createDefaultDataProcessor() {
    return {
      calculateMovingAverage: (data, window) => {
        if (!data || data.length === 0) return 0;
        const slice = data.slice(-window);
        return slice.reduce((sum, val) => sum + val, 0) / slice.length;
      },
      calculateLinearRegression: data => {
        if (!data || data.length < 2) {
          return { slope: 0, intercept: data ? data[0] || 0 : 0, rSquared: 0 };
        }

        const n = data.length;
        const sumX = data.reduce((sum, _, i) => sum + i, 0);
        const sumY = data.reduce((sum, val) => sum + val, 0);
        const sumXY = data.reduce((sum, val, i) => sum + i * val, 0);
        const sumXX = data.reduce((sum, _, i) => sum + i * i, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        return { slope, intercept, rSquared: 0.8 };
      },
      detectAnomalies: () => [],
      calculateTrend: () => ({ direction: 'stable', strength: 0.1 }),
    };
  }
}

export default PredictiveAnalyzer;
