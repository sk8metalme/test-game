/**
 * AutoOptimizer - 自動最適化エンジン
 *
 * パフォーマンス低下検出時に自動的に最適化戦略を実行する
 * FPS、メモリ使用量、レンダリング時間を監視し、
 * 閾値を下回った場合に適切な最適化を実行する。
 */
class AutoOptimizer {
  constructor(performanceController, configManager) {
    if (!performanceController) {
      throw new Error('PerformanceController is required');
    }
    if (!configManager) {
      throw new Error('ConfigManager is required');
    }

    this.performanceController = performanceController;
    this.configManager = configManager;
    this.optimizationHistory = [];
    this.isOptimizing = false;

    // 最適化レベル設定
    this.optimizationLevels = {
      conservative: { particleReduction: 0.1, effectQuality: 0.8 },
      moderate: { particleReduction: 0.2, effectQuality: 0.6 },
      aggressive: { particleReduction: 0.4, effectQuality: 0.3 },
    };

    // 最大履歴サイズ
    this.maxHistorySize = 100;
  }

  /**
   * パフォーマンスデータに基づいて最適化を実行
   * @param {Object} performanceData - FPS、メモリ使用量、レンダリング時間を含むデータ
   * @returns {Promise<void>}
   */
  async optimize(performanceData) {
    if (!performanceData) {
      throw new Error('Invalid performance data');
    }

    // 必須フィールドの検証
    const requiredFields = ['fps', 'memoryUsage', 'renderTime'];
    const missingFields = requiredFields.filter(field => !(field in performanceData));
    if (missingFields.length > 0) {
      throw new Error('Performance data missing required fields');
    }

    // 並行実行の防止
    if (this.isOptimizing) {
      return;
    }

    this.isOptimizing = true;

    try {
      const thresholds = this.configManager.getThresholds();
      const optimizationLevel = this.configManager.getOptimizationLevel();

      // 最適化戦略の決定
      const optimizationStrategy = this._determineOptimizationStrategy(
        performanceData,
        thresholds,
        optimizationLevel
      );

      if (optimizationStrategy) {
        // 最適化実行
        await this.performanceController.applyOptimization(optimizationStrategy);

        // 履歴に記録
        this._addToHistory({
          timestamp: Date.now(),
          type: optimizationStrategy.type,
          level: optimizationStrategy.level,
          reason: optimizationStrategy.reason,
          performanceData: { ...performanceData },
        });
      }
    } catch (error) {
      throw new Error(`Optimization failed: ${error.message}`);
    } finally {
      this.isOptimizing = false;
    }
  }

  /**
   * 最適化レベルを設定
   * @param {string} level - 'aggressive', 'moderate', 'conservative'
   */
  setOptimizationLevel(level) {
    const validLevels = ['aggressive', 'moderate', 'conservative'];
    if (!validLevels.includes(level)) {
      throw new Error('Invalid optimization level');
    }
    this.configManager.setOptimizationLevel(level);
  }

  /**
   * 最適化履歴を取得
   * @returns {Array} 最適化履歴の配列
   */
  getOptimizationHistory() {
    return [...this.optimizationHistory];
  }

  /**
   * テスト用のパブリックメソッド: 履歴に追加
   * @param {Object} entry - 履歴エントリ
   */
  addToHistory(entry) {
    this._addToHistory(entry);
  }

  /**
   * パフォーマンスデータと閾値に基づいて最適化戦略を決定
   * @private
   */
  _determineOptimizationStrategy(performanceData, thresholds, optimizationLevel) {
    const { fps, memoryUsage, renderTime } = performanceData;

    // 重度のパフォーマンス低下（緊急最適化）
    if (fps < 25 && memoryUsage > 90) {
      return {
        type: 'emergency',
        level: 'aggressive',
        actions: ['disableEffects', 'minimumRendering'],
        reason: 'Critical performance degradation',
      };
    }

    // FPS低下対策
    if (fps < thresholds.minFps) {
      const reduction = this.optimizationLevels[optimizationLevel].particleReduction;
      return {
        type: 'particleReduction',
        level: reduction,
        reason: 'FPS below threshold',
      };
    }

    // メモリ使用量対策
    if (memoryUsage > thresholds.maxMemory) {
      const quality = this._getEffectQualityLevel(optimizationLevel);
      return {
        type: 'effectQuality',
        level: quality,
        reason: 'Memory usage above threshold',
      };
    }

    // レンダリング時間対策
    if (renderTime > thresholds.maxRenderTime) {
      return {
        type: 'renderOptimization',
        level: 'medium',
        reason: 'Render time above threshold',
      };
    }

    // 最適化不要
    return null;
  }

  /**
   * 最適化レベルに基づいてエフェクト品質レベルを取得
   * @private
   */
  _getEffectQualityLevel(optimizationLevel) {
    const qualityMap = {
      conservative: 'high',
      moderate: 'medium',
      aggressive: 'low',
    };
    return qualityMap[optimizationLevel] || 'medium';
  }

  /**
   * 履歴に最適化記録を追加
   * @private
   */
  _addToHistory(entry) {
    this.optimizationHistory.push(entry);

    // 履歴サイズ制限
    if (this.optimizationHistory.length > this.maxHistorySize) {
      this.optimizationHistory = this.optimizationHistory.slice(-this.maxHistorySize);
    }
  }
}

export default AutoOptimizer;
