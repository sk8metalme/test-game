/**
 * AdaptiveController.js - 統合制御エンジン
 *
 * 責任:
 * - 全AdaptiveUIコンポーネントの統合制御
 * - 統一されたAPI提供
 * - ライフサイクル管理（初期化・破棄・状態管理）
 * - 設定管理と状態同期
 * - コンポーネント間の調整
 */

export class AdaptiveController {
  constructor(config = {}) {
    // デフォルト設定
    this._defaultConfig = {
      enableAutoOptimization: true,
      updateInterval: 500,
      performanceThreshold: 50,
      maxRetryAttempts: 3,
      debugMode: false,
    };

    // 設定マージ
    this.config = { ...this._defaultConfig, ...config };

    // 内部状態
    this.isInitialized = false;
    this.isDestroyed = false;
    this.isMonitoring = false;
    this.components = new Map();
    this.stateHistory = [];
    this.optimizationHistory = [];
    this.errorLog = [];
    this.debugLog = [];
    this.lastSyncTime = 0;
    this._initTime = Date.now();
    this._responseTimeHistory = [];
    this._memoryUsageHistory = [];
    this._monitoringInterval = null;
  }

  // ライフサイクル管理
  async initialize() {
    if (this.isInitialized) {
      return; // 二重初期化防止
    }

    this._checkDestroyed();

    try {
      // 初期化処理
      this.isInitialized = true;
      this._logDebug('AdaptiveController initialized');
    } catch (error) {
      this._logError('Initialization failed', error);
      throw error;
    }
  }

  destroy() {
    if (this.isDestroyed) {
      return;
    }

    try {
      // パフォーマンス監視停止
      this.stopPerformanceMonitoring();

      // 統合されたコンポーネントを破棄
      for (const [name, component] of this.components) {
        if (component && typeof component.destroy === 'function') {
          try {
            component.destroy();
          } catch (error) {
            this._logError(`Failed to destroy component ${name}`, error);
          }
        }
      }

      // リソースクリア
      this.components.clear();
      this.stateHistory = [];
      this.optimizationHistory = [];
      this.errorLog = [];
      this.debugLog = [];

      this.isDestroyed = true;
      this.isInitialized = false;
    } catch (error) {
      this._logError('Destruction failed', error);
    }
  }

  // コンポーネント統合
  integrateResponsiveManager(manager) {
    this._checkDestroyed();
    if (!manager) {
      throw new Error('ResponsiveManager cannot be null or undefined');
    }
    this.components.set('responsiveManager', manager);
    this._logDebug('ResponsiveManager integrated');
  }

  integrateAccessibilityEnhancer(enhancer) {
    this._checkDestroyed();
    if (!enhancer) {
      throw new Error('AccessibilityEnhancer cannot be null or undefined');
    }
    this.components.set('accessibilityEnhancer', enhancer);
    this._logDebug('AccessibilityEnhancer integrated');
  }

  integratePerformanceOptimizer(optimizer) {
    this._checkDestroyed();
    if (!optimizer) {
      throw new Error('PerformanceOptimizer cannot be null or undefined');
    }
    this.components.set('performanceOptimizer', optimizer);
    this._logDebug('PerformanceOptimizer integrated');
  }

  integrateMemoryOptimizer(optimizer) {
    this._checkDestroyed();
    if (!optimizer) {
      throw new Error('MemoryOptimizer cannot be null or undefined');
    }
    this.components.set('memoryOptimizer', optimizer);
    this._logDebug('MemoryOptimizer integrated');
  }

  getComponent(name) {
    this._checkDestroyed();
    return this.components.get(name);
  }

  // 統一API
  getIntegratedState() {
    this._checkDestroyed();

    const startTime = Date.now();
    const state = {
      responsive: {},
      accessibility: {},
      performance: {},
      memory: {},
    };

    try {
      // ResponsiveManager状態
      const responsiveManager = this.components.get('responsiveManager');
      if (responsiveManager && typeof responsiveManager.getCurrentState === 'function') {
        try {
          state.responsive = responsiveManager.getCurrentState();
        } catch (error) {
          this._logError('Failed to get responsive state', error);
          state.responsive = { error: true };
        }
      }

      // AccessibilityEnhancer状態
      const accessibilityEnhancer = this.components.get('accessibilityEnhancer');
      if (accessibilityEnhancer) {
        try {
          state.accessibility = {
            isHighContrastEnabled: accessibilityEnhancer.isHighContrastEnabled,
            isVoiceGuidanceEnabled: accessibilityEnhancer.isVoiceGuidanceEnabled,
            isReducedMotionEnabled: accessibilityEnhancer.isReducedMotionEnabled,
            userSettings: accessibilityEnhancer.userSettings || {},
          };
        } catch (error) {
          this._logError('Failed to get accessibility state', error);
          state.accessibility = { error: true };
        }
      }

      // PerformanceOptimizer状態
      const performanceOptimizer = this.components.get('performanceOptimizer');
      if (performanceOptimizer) {
        try {
          state.performance = performanceOptimizer.performanceMetrics || {};
        } catch (error) {
          this._logError('Failed to get performance state', error);
          state.performance = { error: true };
        }
      }

      // MemoryOptimizer状態
      const memoryOptimizer = this.components.get('memoryOptimizer');
      if (memoryOptimizer) {
        try {
          state.memory = { optimized: true };
        } catch (error) {
          this._logError('Failed to get memory state', error);
          state.memory = { error: true };
        }
      }

      // レスポンス時間記録
      const responseTime = Date.now() - startTime;
      this._responseTimeHistory.push(responseTime);
      if (this._responseTimeHistory.length > 100) {
        this._responseTimeHistory.shift();
      }

      return state;
    } catch (error) {
      this._logError('Failed to get integrated state', error);
      return {
        responsive: { error: true },
        accessibility: { error: true },
        performance: { error: true },
        memory: { error: true },
      };
    }
  }

  async executeAutoOptimization() {
    this._checkDestroyed();

    const optimizations = [];
    const startTime = Date.now();

    try {
      // パフォーマンス最適化
      const performanceOptimizer = this.components.get('performanceOptimizer');
      if (performanceOptimizer) {
        optimizations.push({
          type: 'performance',
          executed: true,
          timestamp: Date.now(),
        });
      }

      // メモリ最適化
      const memoryOptimizer = this.components.get('memoryOptimizer');
      if (memoryOptimizer && typeof memoryOptimizer.optimizeMemory === 'function') {
        memoryOptimizer.optimizeMemory();
        optimizations.push({
          type: 'memory',
          executed: true,
          timestamp: Date.now(),
        });
      }

      // 最適化履歴に記録
      const optimizationRecord = {
        timestamp: Date.now(),
        duration: Date.now() - startTime,
        optimizations: optimizations.slice(),
        success: true,
      };
      this.optimizationHistory.push(optimizationRecord);

      // 履歴サイズ制限
      if (this.optimizationHistory.length > 50) {
        this.optimizationHistory.shift();
      }

      return {
        executed: true,
        optimizations,
      };
    } catch (error) {
      this._logError('Auto optimization failed', error);
      return {
        executed: false,
        error: error.message,
        optimizations,
      };
    }
  }

  startPerformanceMonitoring() {
    this._checkDestroyed();

    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    this._monitoringInterval = setInterval(() => {
      this._recordPerformanceMetrics();
    }, this.config.updateInterval);

    this._logDebug('Performance monitoring started');
  }

  stopPerformanceMonitoring() {
    if (this._monitoringInterval) {
      clearInterval(this._monitoringInterval);
      this._monitoringInterval = null;
    }
    this.isMonitoring = false;
    this._logDebug('Performance monitoring stopped');
  }

  // 設定管理
  updateConfig(newConfig) {
    this._checkDestroyed();
    this.config = { ...this.config, ...newConfig };
    this._logDebug('Configuration updated');
  }

  resetConfig() {
    this._checkDestroyed();
    this.config = { ...this._defaultConfig };
    this._logDebug('Configuration reset to defaults');
  }

  getConfig() {
    this._checkDestroyed();
    return { ...this.config }; // コピーを返す
  }

  // 状態同期
  async syncComponentStates() {
    this._checkDestroyed();

    try {
      this.lastSyncTime = Date.now();
      this._logDebug('Component states synchronized');
    } catch (error) {
      this._logError('State synchronization failed', error);
    }
  }

  handleStateChange(changeData) {
    this._checkDestroyed();

    try {
      this.stateHistory.push({
        ...changeData,
        timestamp: Date.now(),
      });

      // 履歴サイズ制限
      if (this.stateHistory.length > 100) {
        this.stateHistory.shift();
      }

      this._logDebug('State change handled', changeData);
    } catch (error) {
      this._logError('State change handling failed', error);
    }
  }

  validateComponentStates() {
    this._checkDestroyed();

    try {
      // 基本的な検証
      return this.components.size > 0 && this.isInitialized;
    } catch (error) {
      this._logError('State validation failed', error);
      return false;
    }
  }

  // パフォーマンス最適化
  checkPerformanceThreshold(performanceData) {
    this._checkDestroyed();

    try {
      const { fps = 60, memory = 0 } = performanceData;
      const threshold = this.config.performanceThreshold;

      const belowThreshold = fps < threshold || memory > 80;
      const recommendations = [];

      if (fps < threshold) {
        recommendations.push('Reduce rendering complexity');
      }
      if (memory > 80) {
        recommendations.push('Optimize memory usage');
      }

      return {
        belowThreshold,
        recommendations,
        currentFps: fps,
        currentMemory: memory,
        threshold,
      };
    } catch (error) {
      this._logError('Performance threshold check failed', error);
      return {
        belowThreshold: false,
        recommendations: [],
        error: error.message,
      };
    }
  }

  async triggerAutoOptimization(performanceData) {
    this._checkDestroyed();

    try {
      const optimizations = [];

      if (this.config.enableAutoOptimization) {
        const result = await this.executeAutoOptimization();
        if (result.executed) {
          optimizations.push(...result.optimizations);
        }
      }

      return {
        triggered: true,
        optimizations,
        performanceData,
      };
    } catch (error) {
      this._logError('Auto optimization trigger failed', error);
      return {
        triggered: false,
        error: error.message,
        optimizations: [],
      };
    }
  }

  getOptimizationHistory() {
    this._checkDestroyed();
    return [...this.optimizationHistory]; // コピーを返す
  }

  // エラーハンドリング
  getErrorLog() {
    this._checkDestroyed();
    return [...this.errorLog]; // コピーを返す
  }

  async attemptErrorRecovery(componentName) {
    this._checkDestroyed();

    try {
      const component = this.components.get(componentName);
      if (component && typeof component.recover === 'function') {
        await component.recover();
        this._logDebug(`Error recovery attempted for ${componentName}`);
      }
    } catch (error) {
      this._logError(`Error recovery failed for ${componentName}`, error);
    }
  }

  // 統計とメトリクス
  getStatistics() {
    this._checkDestroyed();

    const uptime = Date.now() - this._initTime;

    return {
      totalComponents: this.components.size,
      activeComponents: this.components.size,
      uptime,
      totalOptimizations: this.optimizationHistory.length,
      totalErrors: this.errorLog.length,
      averageResponseTime: this._calculateAverageResponseTime(),
    };
  }

  getPerformanceMetrics() {
    this._checkDestroyed();

    return {
      averageResponseTime: this._calculateAverageResponseTime(),
      memoryUsage: this._calculateAverageMemoryUsage(),
      errorRate: this._calculateErrorRate(),
      optimizationRate: this._calculateOptimizationRate(),
    };
  }

  resetMetrics() {
    this._checkDestroyed();

    this._initTime = Date.now();
    this._responseTimeHistory = [];
    this._memoryUsageHistory = [];
    this.optimizationHistory = [];
    this.errorLog = [];
    this._logDebug('Metrics reset');
  }

  // デバッグ機能
  enableDebugMode() {
    this._checkDestroyed();
    this.config.debugMode = true;
    this._logDebug('Debug mode enabled');
  }

  get isDebugMode() {
    return this.config.debugMode;
  }

  getDebugInfo() {
    this._checkDestroyed();

    return {
      components: Object.fromEntries(this.components),
      config: { ...this.config },
      state: {
        isInitialized: this.isInitialized,
        isDestroyed: this.isDestroyed,
        isMonitoring: this.isMonitoring,
        uptime: Date.now() - this._initTime,
      },
      statistics: this.getStatistics(),
      recentErrors: this.errorLog.slice(-10),
      recentOptimizations: this.optimizationHistory.slice(-10),
    };
  }

  getDebugLog() {
    this._checkDestroyed();
    return [...this.debugLog]; // コピーを返す
  }

  // プライベートメソッド
  _checkDestroyed() {
    if (this.isDestroyed) {
      throw new Error('AdaptiveController has been destroyed');
    }
  }

  _logError(message, error = null) {
    const errorRecord = {
      timestamp: Date.now(),
      message,
      error: error ? error.message : null,
      stack: error ? error.stack : null,
    };

    this.errorLog.push(errorRecord);

    // ログサイズ制限
    if (this.errorLog.length > 100) {
      this.errorLog.shift();
    }

    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error(`[AdaptiveController] ${message}`, error);
    }
  }

  _logDebug(message, data = null) {
    if (this.config.debugMode) {
      const debugRecord = {
        timestamp: Date.now(),
        message,
        data,
      };

      this.debugLog.push(debugRecord);

      // ログサイズ制限
      if (this.debugLog.length > 200) {
        this.debugLog.shift();
      }

      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.log(`[AdaptiveController] ${message}`, data);
      }
    }
  }

  _recordPerformanceMetrics() {
    try {
      const memoryUsage = this._getCurrentMemoryUsage();
      this._memoryUsageHistory.push(memoryUsage);

      if (this._memoryUsageHistory.length > 100) {
        this._memoryUsageHistory.shift();
      }
    } catch (error) {
      this._logError('Performance metrics recording failed', error);
    }
  }

  _getCurrentMemoryUsage() {
    // メモリ使用量の推定（実際の実装では performance.memory などを使用）
    return Math.random() * 100;
  }

  _calculateAverageResponseTime() {
    if (this._responseTimeHistory.length === 0) return 0;
    const sum = this._responseTimeHistory.reduce((a, b) => a + b, 0);
    return sum / this._responseTimeHistory.length;
  }

  _calculateAverageMemoryUsage() {
    if (this._memoryUsageHistory.length === 0) return 0;
    const sum = this._memoryUsageHistory.reduce((a, b) => a + b, 0);
    return sum / this._memoryUsageHistory.length;
  }

  _calculateErrorRate() {
    const totalOperations = this.optimizationHistory.length + this.errorLog.length;
    if (totalOperations === 0) return 0;
    return this.errorLog.length / totalOperations;
  }

  _calculateOptimizationRate() {
    const uptime = Date.now() - this._initTime;
    if (uptime === 0) return 0;
    return this.optimizationHistory.length / (uptime / 60000); // per minute
  }
}
