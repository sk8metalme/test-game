/**
 * PerformanceOptimizationManager.js - パフォーマンス最適化管理クラス
 *
 * オニオンアーキテクチャ: Application Layer (Use Cases)
 *
 * 責任:
 * - 全最適化システムの統合管理
 * - パフォーマンス監視と自動最適化
 * - 最適化戦略の調整
 * - パフォーマンスレポートの生成
 *
 * @developer との協力実装
 */

import ParticleSystemOptimizer from './ParticleSystemOptimizer.js';
import EventSystemOptimizer from './EventSystemOptimizer.js';
import RenderingOptimizer from './RenderingOptimizer.js';
import MemoryOptimizer from './MemoryOptimizer.js';

/**
 * パフォーマンス最適化管理クラス
 *
 * @class PerformanceOptimizationManager
 * @description 全最適化システムを統合管理するユースケース
 */
export default class PerformanceOptimizationManager {
  /**
   * PerformanceOptimizationManager インスタンスを作成
   *
   * @param {Object} [config={}] - 設定
   * @param {boolean} [config.enableAutoOptimization=true] - 自動最適化の有効/無効
   * @param {number} [config.optimizationInterval=2000] - 最適化間隔（ミリ秒）
   * @param {number} [config.targetFPS=60] - 目標FPS
   * @param {number} [config.memoryThreshold=0.8] - メモリ使用量閾値
   */
  constructor(config = {}) {
    this.config = {
      enableAutoOptimization: config.enableAutoOptimization !== false,
      optimizationInterval: config.optimizationInterval || 2000,
      targetFPS: config.targetFPS || 60,
      memoryThreshold: config.memoryThreshold || 0.8,
      enableReporting: config.enableReporting !== false,
      ...config,
    };

    // 最適化システムの初期化
    this.optimizers = {
      particleSystem: new ParticleSystemOptimizer({
        targetFPS: this.config.targetFPS,
        memoryThreshold: this.config.memoryThreshold,
      }),
      eventSystem: new EventSystemOptimizer({
        maxListenersPerEvent: 100,
        maxEventHistory: 1000,
        enableBatching: true,
      }),
      rendering: new RenderingOptimizer({
        targetFPS: this.config.targetFPS,
        enableFrameSkipping: true,
        enableLOD: true,
        adaptiveQuality: true,
      }),
      memory: new MemoryOptimizer({
        memoryThreshold: this.config.memoryThreshold,
        enableGC: true,
        enableLeakDetection: true,
      }),
    };

    // 統合パフォーマンス指標
    this.performanceMetrics = {
      fps: 60,
      frameTime: 16.67,
      memoryUsage: 0,
      cpuUsage: 0,
      renderTime: 0,
      updateTime: 0,
      particleCount: 0,
      eventCount: 0,
    };

    // 最適化履歴
    this.optimizationHistory = [];
    this.performanceHistory = [];

    // 統合統計
    this.integratedStats = {
      totalOptimizations: 0,
      performanceImprovements: 0,
      qualityAdjustments: 0,
      memoryOptimizations: 0,
      systemOptimizations: 0,
    };

    // 自動最適化タイマー
    this.optimizationTimer = null;
    this.isOptimizing = false;

    // 初期化完了フラグ
    this._initialized = true;

    // 自動最適化を開始
    if (this.config.enableAutoOptimization) {
      this._startAutoOptimization();
    }
  }

  /**
   * パフォーマンスメトリクスを更新する
   *
   * @param {Object} metrics - パフォーマンスメトリクス
   */
  updateMetrics(metrics) {
    this.performanceMetrics = {
      ...this.performanceMetrics,
      ...metrics,
    };

    // 各最適化システムにメトリクスを配信
    this.optimizers.particleSystem.updateMetrics(metrics);
    this.optimizers.rendering.updateMetrics(metrics);

    // パフォーマンス履歴に記録
    this.performanceHistory.push({
      ...metrics,
      timestamp: Date.now(),
    });

    // 履歴サイズ制限
    if (this.performanceHistory.length > 1000) {
      this.performanceHistory.shift();
    }
  }

  /**
   * システム全体の最適化を実行する
   *
   * @param {Object} systems - 最適化対象システム
   * @returns {Object} 最適化結果
   */
  optimizeAll(systems = {}) {
    if (this.isOptimizing) {
      return { success: false, reason: '最適化が既に実行中です' };
    }

    this.isOptimizing = true;
    const startTime = performance.now();

    const optimizationResult = {
      timestamp: Date.now(),
      duration: 0,
      systems: {},
      overall: {
        success: true,
        improvements: 0,
        memoryFreed: 0,
      },
    };

    try {
      // パーティクルシステムの最適化
      if (systems.particleSystem) {
        const result = this.optimizers.particleSystem.optimize(systems.particleSystem);
        optimizationResult.systems.particleSystem = result;
        this._updateOverallStats(result, optimizationResult.overall);
      }

      // イベントシステムの最適化
      if (systems.eventEmitter) {
        const result = this.optimizers.eventSystem.optimizeEventEmitter(systems.eventEmitter);
        optimizationResult.systems.eventSystem = result;
        this._updateOverallStats(result, optimizationResult.overall);
      }

      // レンダリングの最適化
      if (systems.renderer) {
        const result = this.optimizers.rendering.optimizeFrame(
          systems.renderer.render,
          systems.renderer.data
        );
        optimizationResult.systems.rendering = result;
        this._updateOverallStats(result, optimizationResult.overall);
      }

      // メモリの最適化
      const memoryResult = this.optimizers.memory.optimizeMemory();
      optimizationResult.systems.memory = memoryResult;
      this._updateOverallStats(memoryResult, optimizationResult.overall);

      // 統合統計を更新
      this.integratedStats.totalOptimizations++;
      if (optimizationResult.overall.improvements > 0) {
        this.integratedStats.performanceImprovements++;
      }
      if (optimizationResult.overall.memoryFreed > 0) {
        this.integratedStats.memoryOptimizations++;
      }
    } catch (error) {
      optimizationResult.overall.success = false;
      optimizationResult.overall.error = error.message;
    } finally {
      this.isOptimizing = false;
      optimizationResult.duration = performance.now() - startTime;

      // 最適化履歴に記録
      this.optimizationHistory.push(optimizationResult);
      if (this.optimizationHistory.length > 100) {
        this.optimizationHistory.shift();
      }
    }

    return optimizationResult;
  }

  /**
   * 特定のシステムの最適化を実行する
   *
   * @param {string} systemType - システムタイプ
   * @param {Object} system - システムインスタンス
   * @returns {Object} 最適化結果
   */
  optimizeSystem(systemType, system) {
    const optimizer = this.optimizers[systemType];
    if (!optimizer) {
      throw new Error(`PerformanceOptimizationManager: 未知のシステムタイプ '${systemType}'`);
    }

    let result;
    switch (systemType) {
      case 'particleSystem':
        result = optimizer.optimize(system);
        break;
      case 'eventSystem':
        result = optimizer.optimizeEventEmitter(system);
        break;
      case 'rendering':
        result = optimizer.optimizeFrame(system.render, system.data);
        break;
      case 'memory':
        result = optimizer.optimizeMemory();
        break;
      default:
        throw new Error(`PerformanceOptimizationManager: 未対応のシステムタイプ '${systemType}'`);
    }

    this.integratedStats.systemOptimizations++;
    return result;
  }

  /**
   * パフォーマンスレポートを生成する
   *
   * @param {Object} [options={}] - レポートオプション
   * @returns {Object} パフォーマンスレポート
   */
  generateReport(options = {}) {
    const reportOptions = {
      includeHistory: options.includeHistory !== false,
      includeOptimizations: options.includeOptimizations !== false,
      timeRange: options.timeRange || 60000, // 1分
      ...options,
    };

    const now = Date.now();
    const timeThreshold = now - reportOptions.timeRange;

    const report = {
      timestamp: now,
      summary: {
        currentPerformance: { ...this.performanceMetrics },
        averagePerformance: this._calculateAveragePerformance(timeThreshold),
        optimizationStats: { ...this.integratedStats },
      },
      systems: {},
    };

    // 各システムの統計を収集
    for (const [systemType, optimizer] of Object.entries(this.optimizers)) {
      report.systems[systemType] = optimizer.getStats();
    }

    // 履歴を含める場合
    if (reportOptions.includeHistory) {
      report.performanceHistory = this.performanceHistory.filter(
        entry => entry.timestamp >= timeThreshold
      );
    }

    // 最適化履歴を含める場合
    if (reportOptions.includeOptimizations) {
      report.optimizationHistory = this.optimizationHistory.filter(
        entry => entry.timestamp >= timeThreshold
      );
    }

    return report;
  }

  /**
   * 最適化設定を更新する
   *
   * @param {string} systemType - システムタイプ
   * @param {Object} config - 新しい設定
   */
  updateOptimizerConfig(systemType, config) {
    const optimizer = this.optimizers[systemType];
    if (!optimizer) {
      throw new Error(`PerformanceOptimizationManager: 未知のシステムタイプ '${systemType}'`);
    }

    // 各最適化システムの設定更新メソッドを呼び出し
    if (optimizer.updateConfig) {
      optimizer.updateConfig(config);
    } else {
      // 設定を直接更新（実装に依存）
      Object.assign(optimizer.config, config);
    }
  }

  /**
   * 統合統計を取得する
   *
   * @returns {Object} 統計情報
   */
  getStats() {
    return {
      integratedStats: { ...this.integratedStats },
      performanceMetrics: { ...this.performanceMetrics },
      systemStats: Object.fromEntries(
        Object.entries(this.optimizers).map(([type, optimizer]) => [type, optimizer.getStats()])
      ),
      historySize: {
        performance: this.performanceHistory.length,
        optimization: this.optimizationHistory.length,
      },
    };
  }

  /**
   * 最適化をリセットする
   */
  reset() {
    // 各最適化システムをリセット
    for (const optimizer of Object.values(this.optimizers)) {
      if (optimizer.reset) {
        optimizer.reset();
      }
    }

    // 統合統計をリセット
    this.integratedStats = {
      totalOptimizations: 0,
      performanceImprovements: 0,
      qualityAdjustments: 0,
      memoryOptimizations: 0,
      systemOptimizations: 0,
    };

    this.optimizationHistory = [];
    this.performanceHistory = [];
  }

  /**
   * 最適化管理を停止する
   */
  destroy() {
    // 自動最適化タイマーを停止
    if (this.optimizationTimer) {
      clearInterval(this.optimizationTimer);
      this.optimizationTimer = null;
    }

    // 各最適化システムを破棄
    for (const optimizer of Object.values(this.optimizers)) {
      if (optimizer.destroy) {
        optimizer.destroy();
      }
    }
  }

  // =============================================================================
  // プライベートメソッド
  // =============================================================================

  /**
   * 自動最適化を開始する
   *
   * @private
   */
  _startAutoOptimization() {
    this.optimizationTimer = setInterval(() => {
      // パフォーマンスが閾値を下回った場合のみ最適化を実行
      if (this._shouldOptimize()) {
        this.optimizeAll();
      }
    }, this.config.optimizationInterval);
  }

  /**
   * 最適化が必要かどうかを判定する
   *
   * @private
   * @returns {boolean} 最適化が必要かどうか
   */
  _shouldOptimize() {
    const metrics = this.performanceMetrics;

    // FPSが目標の80%以下の場合
    if (metrics.fps < this.config.targetFPS * 0.8) {
      return true;
    }

    // メモリ使用量が閾値を超えた場合
    if (metrics.memoryUsage > this.config.memoryThreshold) {
      return true;
    }

    // フレーム時間が目標の150%を超えた場合
    const targetFrameTime = 1000 / this.config.targetFPS;
    if (metrics.frameTime > targetFrameTime * 1.5) {
      return true;
    }

    return false;
  }

  /**
   * 全体統計を更新する
   *
   * @private
   * @param {Object} result - 最適化結果
   * @param {Object} overall - 全体統計
   */
  _updateOverallStats(result, overall) {
    if (result.applied && result.applied.length > 0) {
      overall.improvements += result.applied.length;
    }

    if (result.memoryFreed) {
      overall.memoryFreed += result.memoryFreed;
    }
  }

  /**
   * 平均パフォーマンスを計算する
   *
   * @private
   * @param {number} timeThreshold - 時間閾値
   * @returns {Object} 平均パフォーマンス
   */
  _calculateAveragePerformance(timeThreshold) {
    const recentHistory = this.performanceHistory.filter(entry => entry.timestamp >= timeThreshold);

    if (recentHistory.length === 0) {
      return {};
    }

    const averages = {};
    const keys = Object.keys(recentHistory[0]).filter(key => key !== 'timestamp');

    for (const key of keys) {
      const values = recentHistory.map(entry => entry[key]).filter(val => typeof val === 'number');
      if (values.length > 0) {
        averages[key] = values.reduce((sum, val) => sum + val, 0) / values.length;
      }
    }

    return averages;
  }
}
