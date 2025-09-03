/**
 * QualityController - 動的品質調整システム
 *
 * デバイス性能に応じてゲーム品質レベルを動的に調整する
 * FPS監視、デバイスベンチマーク、自動品質調整機能を提供
 * EffectManagerとParticleSystemとの統合により包括的な品質制御を実現
 */
class QualityController {
  constructor(options = {}) {
    const {
      performanceController,
      effectManager,
      particleSystem,
      configManager,
      config = {},
    } = options;

    // 依存関係の設定（モック可能）
    this.performanceController =
      performanceController || this._createDefaultPerformanceController();
    this.effectManager = effectManager || this._createDefaultEffectManager();
    this.particleSystem = particleSystem || this._createDefaultParticleSystem();
    this.configManager = configManager || this._createDefaultConfigManager();

    // 設定の初期化
    this.config = {
      qualityLevels: {
        high: {
          particles: 1000,
          shadows: true,
          postProcessing: true,
          textureQuality: 'high',
          effectDensity: 1.0,
        },
        medium: {
          particles: 500,
          shadows: true,
          postProcessing: false,
          textureQuality: 'medium',
          effectDensity: 0.7,
        },
        low: {
          particles: 100,
          shadows: false,
          postProcessing: false,
          textureQuality: 'low',
          effectDensity: 0.3,
        },
      },
      autoAdjustment: {
        enabled: true,
        thresholds: {
          fpsLow: 45, // FPS低下閾値
          fpsHigh: 55, // FPS向上閾値
          memoryHigh: 80, // メモリ使用量高閾値
          renderTimeHigh: 20, // レンダリング時間高閾値
        },
        hysteresis: 3000, // 品質変更間隔（ミリ秒）
        sensitivity: 'medium', // 調整感度
      },
      benchmarking: {
        duration: 5000, // ベンチマーク時間
        samples: 10, // サンプル数
        stabilization: 1000, // 安定化時間
      },
      ...config,
    };

    // 状態管理
    this.currentQualityLevel = 'high';
    this.isDestroyed = false;
    this.adaptiveEnabled = false;
    this.lastQualityChange = 0;
    this._performanceUpdateHandler = null;

    // 履歴・統計データ
    this.qualityHistory = [];
    this.benchmarkHistory = [];
    this.performanceLog = [];

    // 履歴サイズ制限
    this.maxHistorySize = 50;
  }

  /**
   * デバイス性能ベンチマークを実行
   * @returns {Promise<Object>} ベンチマーク結果
   */
  async benchmarkDevice() {
    try {
      const startTime = Date.now();
      const results = {
        gpu: 0,
        memory: 0,
        overall: 0,
        recommendedQuality: 'medium',
        timestamp: startTime,
      };

      // GPU性能評価
      results.gpu = await this._benchmarkGPU();

      // メモリ評価
      results.memory = this._benchmarkMemory();

      // 総合評価
      results.overall = results.gpu * 0.7 + results.memory * 0.3;

      // 推奨品質レベル決定
      results.recommendedQuality = this._determineRecommendedQuality(results.overall);

      // 履歴に記録
      this._addToBenchmarkHistory({
        timestamp: startTime,
        duration: Date.now() - startTime,
        results: { ...results },
      });

      return results;
    } catch (error) {
      throw new Error(`Device benchmark failed: ${error.message}`);
    }
  }

  /**
   * 品質レベルを設定
   * @param {string} level - 'high', 'medium', 'low'
   * @param {string} reason - 変更理由
   */
  setQualityLevel(level, reason = 'manual') {
    if (this.isDestroyed) {
      throw new Error('QualityController has been destroyed');
    }

    const validLevels = Object.keys(this.config.qualityLevels);
    if (!validLevels.includes(level)) {
      throw new Error(`Invalid quality level: ${level}`);
    }

    // 同じレベルの場合はスキップ
    if (this.currentQualityLevel === level) {
      return;
    }

    const previousLevel = this.currentQualityLevel;

    try {
      // 品質設定の適用
      this._applyQualitySettings(level);

      // 状態更新
      this.currentQualityLevel = level;
      this.lastQualityChange = Date.now();

      // 履歴に記録
      this._addToQualityHistory({
        timestamp: this.lastQualityChange,
        from: previousLevel,
        to: level,
        reason,
        success: true,
      });
    } catch (error) {
      // console.error(`Failed to set quality level to ${level}:`, error);

      // エラー時は履歴に記録して元の状態を維持
      this._addToQualityHistory({
        timestamp: Date.now(),
        from: previousLevel,
        to: level,
        reason,
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * パフォーマンスデータに基づく動的品質調整
   * @param {Object} fpsData - FPS データ
   * @returns {Object} 調整結果
   */
  adjustQualityBasedOnPerformance(fpsData) {
    if (!fpsData || typeof fpsData !== 'object') {
      return { adjusted: false, newLevel: this.currentQualityLevel, reason: 'Invalid data' };
    }

    if (!this.config.autoAdjustment.enabled) {
      return {
        adjusted: false,
        newLevel: this.currentQualityLevel,
        reason: 'Auto adjustment disabled',
      };
    }

    // ヒステリシス制御（頻繁な変更を防止）
    const timeSinceLastChange = Date.now() - this.lastQualityChange;
    if (timeSinceLastChange < this.config.autoAdjustment.hysteresis) {
      return { adjusted: false, newLevel: this.currentQualityLevel, reason: 'Hysteresis' };
    }

    const { current: fps, trend } = fpsData;
    const thresholds = this.config.autoAdjustment.thresholds;

    let targetLevel = this.currentQualityLevel;
    let reason = '';

    // FPS低下時の品質ダウン判定
    if (fps < thresholds.fpsLow && trend === 'decreasing') {
      targetLevel = this._getNextLowerQuality(this.currentQualityLevel);
      reason = 'FPS degradation';
    }
    // FPS向上時の品質アップ判定
    else if (fps > thresholds.fpsHigh && trend === 'increasing') {
      targetLevel = this._getNextHigherQuality(this.currentQualityLevel);
      reason = 'FPS improvement';
    }

    // 品質変更の実行
    if (targetLevel !== this.currentQualityLevel) {
      this.setQualityLevel(targetLevel, reason);
      return { adjusted: true, newLevel: targetLevel, reason };
    }

    return { adjusted: false, newLevel: this.currentQualityLevel, reason: 'No adjustment needed' };
  }

  /**
   * 包括的な品質レポートを生成
   * @returns {Object} 品質レポート
   */
  getQualityReport() {
    const currentMetrics = this.performanceController.getCurrentMetrics();
    const currentSettings = this.config.qualityLevels[this.currentQualityLevel];
    const deviceCapabilities = this.configManager.getDeviceCapabilities();

    const recommendations = this._generateRecommendations(currentMetrics);

    return {
      currentLevel: this.currentQualityLevel,
      performance: {
        fps: currentMetrics.fps,
        memoryUsage: currentMetrics.memoryUsage,
        renderTime: currentMetrics.renderTime,
        gpuUsage: currentMetrics.gpuUsage,
      },
      settings: currentSettings,
      deviceInfo: deviceCapabilities,
      recommendations,
      history: {
        qualityChanges: this.qualityHistory.slice(-5),
        benchmarks: this.benchmarkHistory.slice(-3),
      },
      timestamp: Date.now(),
    };
  }

  /**
   * 適応品質調整を有効化
   */
  enableAdaptiveQuality() {
    if (this.adaptiveEnabled) {
      return; // 既に有効
    }

    this.config.autoAdjustment.enabled = true;
    this.adaptiveEnabled = true;

    // パフォーマンス更新イベントの監視開始
    this._performanceUpdateHandler = event => {
      this.adjustQualityBasedOnPerformance(event.data);
    };

    this.performanceController.addEventListener(
      'performanceUpdate',
      this._performanceUpdateHandler
    );
  }

  /**
   * 適応品質調整を無効化
   */
  disableAdaptiveQuality() {
    if (!this.adaptiveEnabled) {
      return; // 既に無効
    }

    this.config.autoAdjustment.enabled = false;
    this.adaptiveEnabled = false;

    // イベントリスナーの削除
    if (this._performanceUpdateHandler) {
      this.performanceController.removeEventListener(
        'performanceUpdate',
        this._performanceUpdateHandler
      );
      this._performanceUpdateHandler = null;
    }
  }

  /**
   * 各種履歴・統計情報を取得するメソッド群
   */
  getQualityHistory() {
    return [...this.qualityHistory];
  }

  getBenchmarkHistory() {
    return [...this.benchmarkHistory];
  }

  getCurrentQualityLevel() {
    return this.currentQualityLevel;
  }

  getQualitySettings() {
    return this.config.qualityLevels[this.currentQualityLevel];
  }

  /**
   * QualityControllerを破棄
   */
  destroy() {
    if (this.isDestroyed) {
      return; // 既に破棄済み
    }

    this.disableAdaptiveQuality();
    this.isDestroyed = true;

    // 履歴データのクリア
    this.qualityHistory = [];
    this.benchmarkHistory = [];
    this.performanceLog = [];
  }

  /**
   * プライベートメソッド群
   */

  async _benchmarkGPU() {
    // GPU性能の簡易ベンチマーク
    const metrics = this.performanceController.getCurrentMetrics();
    const renderTime = metrics.renderTime || 16;
    const fps = metrics.fps || 60;

    // レンダリング時間とFPSから GPU性能を推定
    let gpuScore = 0;

    if (renderTime < 10 && fps >= 60) {
      gpuScore = 1.0; // 高性能
    } else if (renderTime < 20 && fps >= 45) {
      gpuScore = 0.7; // 中性能
    } else if (renderTime < 30 && fps >= 30) {
      gpuScore = 0.4; // 低性能
    } else {
      gpuScore = 0.2; // 非常に低性能
    }

    return Math.min(1.0, Math.max(0.0, gpuScore));
  }

  _benchmarkMemory() {
    // メモリ容量の評価
    let memoryScore = 0.5; // デフォルト

    // navigator.deviceMemory が利用可能な場合
    if (navigator.deviceMemory) {
      const memoryGB = navigator.deviceMemory;
      if (memoryGB >= 8) {
        memoryScore = 1.0;
      } else if (memoryGB >= 4) {
        memoryScore = 0.7;
      } else if (memoryGB >= 2) {
        memoryScore = 0.4;
      } else {
        memoryScore = 0.2;
      }
    }

    return memoryScore;
  }

  _determineRecommendedQuality(overallScore) {
    if (overallScore >= 0.8) {
      return 'high';
    } else if (overallScore >= 0.5) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  _applyQualitySettings(level) {
    const settings = this.config.qualityLevels[level];

    // EffectManagerに品質設定を適用
    this.effectManager.setQualityLevel(level);

    // ParticleSystemにパーティクル数を設定
    this.particleSystem.setMaxParticles(settings.particles);

    // その他の設定適用
    if (settings.shadows !== undefined) {
      this.effectManager.enableEffect('shadows', settings.shadows);
    }

    if (settings.postProcessing !== undefined) {
      this.effectManager.enableEffect('postProcessing', settings.postProcessing);
    }
  }

  _getNextLowerQuality(currentLevel) {
    const levels = ['high', 'medium', 'low'];
    const currentIndex = levels.indexOf(currentLevel);
    return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : currentLevel;
  }

  _getNextHigherQuality(currentLevel) {
    const levels = ['high', 'medium', 'low'];
    const currentIndex = levels.indexOf(currentLevel);
    return currentIndex > 0 ? levels[currentIndex - 1] : currentLevel;
  }

  _generateRecommendations(metrics) {
    const recommendations = [];
    const thresholds = this.config.autoAdjustment.thresholds;

    if (metrics.fps < thresholds.fpsLow) {
      recommendations.push('Consider lowering quality level');
    }

    if (metrics.memoryUsage > thresholds.memoryHigh) {
      recommendations.push('High memory usage detected');
    }

    if (metrics.renderTime > thresholds.renderTimeHigh) {
      recommendations.push('Reduce rendering complexity');
    }

    if (metrics.fps > thresholds.fpsHigh && this.currentQualityLevel !== 'high') {
      recommendations.push('Performance is good, consider increasing quality');
    }

    if (recommendations.length === 0) {
      recommendations.push('Performance is optimal');
    }

    return recommendations;
  }

  _addToQualityHistory(entry) {
    this.qualityHistory.push(entry);
    if (this.qualityHistory.length > this.maxHistorySize) {
      this.qualityHistory = this.qualityHistory.slice(-this.maxHistorySize);
    }
  }

  _addToBenchmarkHistory(entry) {
    this.benchmarkHistory.push(entry);
    if (this.benchmarkHistory.length > this.maxHistorySize) {
      this.benchmarkHistory = this.benchmarkHistory.slice(-this.maxHistorySize);
    }
  }

  _createDefaultPerformanceController() {
    return {
      getCurrentMetrics: () => ({
        fps: 60,
        memoryUsage: 50,
        renderTime: 16,
        gpuUsage: 30,
      }),
      getPerformanceHistory: () => [],
      addEventListener: () => {},
      removeEventListener: () => {},
    };
  }

  _createDefaultEffectManager() {
    return {
      setQualityLevel: () => {},
      getQualityLevel: () => 'high',
      enableEffect: () => {},
      disableEffect: () => {},
      getEffectSettings: () => ({}),
    };
  }

  _createDefaultParticleSystem() {
    return {
      setMaxParticles: () => {},
      getMaxParticles: () => 1000,
      setQuality: () => {},
      getQuality: () => 'high',
    };
  }

  _createDefaultConfigManager() {
    return {
      getQualitySettings: () => this.config.qualityLevels,
      setQualityLevel: () => {},
      getDeviceCapabilities: () => ({
        gpu: 'unknown',
        memory: 'unknown',
        performance: 'unknown',
      }),
    };
  }
}

export default QualityController;
