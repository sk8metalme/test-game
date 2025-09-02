/**
 * ParticleSystemOptimizer.js - パーティクルシステム最適化クラス
 *
 * オニオンアーキテクチャ: Application Layer (Use Cases)
 *
 * 責任:
 * - パーティクルシステムの動的最適化
 * - メモリ使用量の監視と最適化
 * - 描画パフォーマンスの最適化
 * - 自動品質調整
 *
 * @developer との協力実装
 */

/**
 * パーティクルシステム最適化クラス
 *
 * @class ParticleSystemOptimizer
 * @description パーティクルシステムのパフォーマンスを動的に最適化するユースケース
 */
export default class ParticleSystemOptimizer {
  /**
   * ParticleSystemOptimizer インスタンスを作成
   *
   * @param {Object} [config={}] - 設定
   * @param {number} [config.targetFPS=60] - 目標FPS
   * @param {number} [config.memoryThreshold=0.8] - メモリ使用量閾値
   * @param {number} [config.qualityLevels=5] - 品質レベル数
   * @param {boolean} [config.enableAutoOptimization=true] - 自動最適化の有効/無効
   */
  constructor(config = {}) {
    this.config = {
      targetFPS: config.targetFPS || 60,
      memoryThreshold: config.memoryThreshold || 0.8,
      qualityLevels: config.qualityLevels || 5,
      enableAutoOptimization: config.enableAutoOptimization !== false,
      optimizationInterval: config.optimizationInterval || 1000, // 1秒
      ...config,
    };

    // 最適化状態
    this.currentQualityLevel = this.config.qualityLevels;
    this.optimizationHistory = [];
    this.lastOptimizationTime = 0;

    // パフォーマンス指標
    this.performanceMetrics = {
      fps: 60,
      frameTime: 16.67,
      memoryUsage: 0,
      particleCount: 0,
      renderTime: 0,
      updateTime: 0,
    };

    // 最適化ルール
    this.optimizationRules = [
      {
        name: 'reduce_particle_count',
        condition: metrics => metrics.fps < this.config.targetFPS * 0.8,
        action: this._reduceParticleCount.bind(this),
        priority: 1,
      },
      {
        name: 'reduce_quality',
        condition: metrics => metrics.fps < this.config.targetFPS * 0.6,
        action: this._reduceQuality.bind(this),
        priority: 2,
      },
      {
        name: 'enable_lod',
        condition: metrics => metrics.particleCount > 500,
        action: this._enableLOD.bind(this),
        priority: 3,
      },
      {
        name: 'reduce_update_frequency',
        condition: metrics => metrics.updateTime > 8,
        action: this._reduceUpdateFrequency.bind(this),
        priority: 4,
      },
      {
        name: 'optimize_memory',
        condition: metrics => metrics.memoryUsage > this.config.memoryThreshold,
        action: this._optimizeMemory.bind(this),
        priority: 5,
      },
    ];

    // 最適化統計
    this.stats = {
      totalOptimizations: 0,
      qualityLevelChanges: 0,
      particleCountReductions: 0,
      memoryOptimizations: 0,
      performanceImprovements: 0,
    };

    // 初期化完了フラグ
    this._initialized = true;
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

    // 自動最適化が有効な場合、最適化を実行
    if (this.config.enableAutoOptimization) {
      this._checkAndOptimize();
    }
  }

  /**
   * 最適化を実行する
   *
   * @param {Object} particleSystem - パーティクルシステムインスタンス
   * @returns {Object} 最適化結果
   */
  optimize(particleSystem) {
    if (!particleSystem) {
      throw new Error('ParticleSystemOptimizer: パーティクルシステムが必要です');
    }

    const optimizationResult = {
      applied: [],
      skipped: [],
      performanceGain: 0,
      timestamp: Date.now(),
    };

    // 最適化ルールを優先度順に実行
    const sortedRules = [...this.optimizationRules].sort((a, b) => a.priority - b.priority);

    for (const rule of sortedRules) {
      try {
        if (rule.condition(this.performanceMetrics)) {
          const result = rule.action(particleSystem);
          if (result.success) {
            optimizationResult.applied.push({
              rule: rule.name,
              result: result,
            });
            this.stats.totalOptimizations++;
          } else {
            optimizationResult.skipped.push({
              rule: rule.name,
              reason: result.reason,
            });
          }
        }
      } catch (error) {
        optimizationResult.skipped.push({
          rule: rule.name,
          reason: `エラー: ${error.message}`,
        });
      }
    }

    // 最適化履歴に記録
    this.optimizationHistory.push(optimizationResult);
    this.lastOptimizationTime = Date.now();

    // 履歴サイズ制限
    if (this.optimizationHistory.length > 100) {
      this.optimizationHistory.shift();
    }

    return optimizationResult;
  }

  /**
   * 品質レベルを設定する
   *
   * @param {number} level - 品質レベル (1-5)
   * @param {Object} particleSystem - パーティクルシステムインスタンス
   */
  setQualityLevel(level, particleSystem) {
    const clampedLevel = Math.max(1, Math.min(this.config.qualityLevels, level));

    if (clampedLevel !== this.currentQualityLevel) {
      this.currentQualityLevel = clampedLevel;
      this.stats.qualityLevelChanges++;

      // 品質レベルに応じた設定を適用
      this._applyQualitySettings(clampedLevel, particleSystem);
    }
  }

  /**
   * 最適化統計を取得する
   *
   * @returns {Object} 統計情報
   */
  getStats() {
    return {
      ...this.stats,
      currentQualityLevel: this.currentQualityLevel,
      lastOptimizationTime: this.lastOptimizationTime,
      optimizationHistorySize: this.optimizationHistory.length,
      performanceMetrics: { ...this.performanceMetrics },
    };
  }

  /**
   * 最適化履歴を取得する
   *
   * @param {number} [limit=10] - 取得件数制限
   * @returns {Array} 最適化履歴
   */
  getOptimizationHistory(limit = 10) {
    return this.optimizationHistory.slice(-limit);
  }

  /**
   * 最適化をリセットする
   */
  reset() {
    this.currentQualityLevel = this.config.qualityLevels;
    this.optimizationHistory = [];
    this.lastOptimizationTime = 0;
    this.stats = {
      totalOptimizations: 0,
      qualityLevelChanges: 0,
      particleCountReductions: 0,
      memoryOptimizations: 0,
      performanceImprovements: 0,
    };
  }

  // =============================================================================
  // プライベートメソッド
  // =============================================================================

  /**
   * 最適化の必要性をチェックし、実行する
   *
   * @private
   */
  _checkAndOptimize() {
    const now = Date.now();
    if (now - this.lastOptimizationTime < this.config.optimizationInterval) {
      return;
    }

    // 最適化が必要かどうかを判定
    const needsOptimization = this.optimizationRules.some(rule =>
      rule.condition(this.performanceMetrics)
    );

    if (needsOptimization) {
      // 最適化を実行（particleSystemは外部から提供される必要がある）
      // このメソッドは主にメトリクス更新時の自動チェック用
    }
  }

  /**
   * パーティクル数を削減する
   *
   * @private
   * @param {Object} particleSystem - パーティクルシステム
   * @returns {Object} 実行結果
   */
  _reduceParticleCount(particleSystem) {
    try {
      const currentMax = particleSystem.config.maxParticles;
      const newMax = Math.max(100, Math.floor(currentMax * 0.8));

      if (newMax < currentMax) {
        particleSystem.config.maxParticles = newMax;
        this.stats.particleCountReductions++;

        return {
          success: true,
          message: `パーティクル数を ${currentMax} から ${newMax} に削減`,
          oldValue: currentMax,
          newValue: newMax,
        };
      }

      return {
        success: false,
        reason: '既に最小値に達している',
      };
    } catch (error) {
      return {
        success: false,
        reason: `エラー: ${error.message}`,
      };
    }
  }

  /**
   * 品質を削減する
   *
   * @private
   * @param {Object} particleSystem - パーティクルシステム
   * @returns {Object} 実行結果
   */
  _reduceQuality(particleSystem) {
    try {
      if (this.currentQualityLevel > 1) {
        const newLevel = this.currentQualityLevel - 1;
        this.setQualityLevel(newLevel, particleSystem);

        return {
          success: true,
          message: `品質レベルを ${this.currentQualityLevel + 1} から ${newLevel} に削減`,
          oldValue: this.currentQualityLevel + 1,
          newValue: newLevel,
        };
      }

      return {
        success: false,
        reason: '既に最低品質レベル',
      };
    } catch (error) {
      return {
        success: false,
        reason: `エラー: ${error.message}`,
      };
    }
  }

  /**
   * LOD（Level of Detail）を有効にする
   *
   * @private
   * @param {Object} particleSystem - パーティクルシステム
   * @returns {Object} 実行結果
   */
  _enableLOD(particleSystem) {
    try {
      if (particleSystem.renderer && !particleSystem.renderer.enableLOD) {
        particleSystem.renderer.enableLOD = true;

        return {
          success: true,
          message: 'LOD（Level of Detail）を有効化',
          oldValue: false,
          newValue: true,
        };
      }

      return {
        success: false,
        reason: 'LODは既に有効',
      };
    } catch (error) {
      return {
        success: false,
        reason: `エラー: ${error.message}`,
      };
    }
  }

  /**
   * 更新頻度を削減する
   *
   * @private
   * @param {Object} particleSystem - パーティクルシステム
   * @returns {Object} 実行結果
   */
  _reduceUpdateFrequency(particleSystem) {
    try {
      // 更新間隔を調整（実装に依存）
      if (particleSystem.updateInterval) {
        const currentInterval = particleSystem.updateInterval;
        const newInterval = Math.min(100, currentInterval * 1.2);

        if (newInterval > currentInterval) {
          particleSystem.updateInterval = newInterval;

          return {
            success: true,
            message: `更新間隔を ${currentInterval}ms から ${newInterval}ms に増加`,
            oldValue: currentInterval,
            newValue: newInterval,
          };
        }
      }

      return {
        success: false,
        reason: '更新頻度の調整が適用できない',
      };
    } catch (error) {
      return {
        success: false,
        reason: `エラー: ${error.message}`,
      };
    }
  }

  /**
   * メモリを最適化する
   *
   * @private
   * @param {Object} particleSystem - パーティクルシステム
   * @returns {Object} 実行結果
   */
  _optimizeMemory(particleSystem) {
    try {
      // パーティクルプールのクリーンアップ
      if (particleSystem.particlePool && particleSystem.particlePool.cleanup) {
        const beforeCount = particleSystem.particlePool.getActiveCount();
        particleSystem.particlePool.cleanup();
        const afterCount = particleSystem.particlePool.getActiveCount();

        this.stats.memoryOptimizations++;

        return {
          success: true,
          message: `メモリクリーンアップ: ${beforeCount - afterCount} 個のパーティクルを削除`,
          oldValue: beforeCount,
          newValue: afterCount,
        };
      }

      return {
        success: false,
        reason: 'メモリ最適化が適用できない',
      };
    } catch (error) {
      return {
        success: false,
        reason: `エラー: ${error.message}`,
      };
    }
  }

  /**
   * 品質設定を適用する
   *
   * @private
   * @param {number} level - 品質レベル
   * @param {Object} particleSystem - パーティクルシステム
   */
  _applyQualitySettings(level, particleSystem) {
    const qualitySettings = {
      1: {
        // 最低品質
        maxParticles: 100,
        enableLOD: true,
        batchSize: 50,
        targetFPS: 30,
      },
      2: {
        // 低品質
        maxParticles: 250,
        enableLOD: true,
        batchSize: 75,
        targetFPS: 45,
      },
      3: {
        // 中品質
        maxParticles: 500,
        enableLOD: false,
        batchSize: 100,
        targetFPS: 60,
      },
      4: {
        // 高品質
        maxParticles: 750,
        enableLOD: false,
        batchSize: 125,
        targetFPS: 60,
      },
      5: {
        // 最高品質
        maxParticles: 1000,
        enableLOD: false,
        batchSize: 150,
        targetFPS: 60,
      },
    };

    const settings = qualitySettings[level];
    if (settings) {
      // パーティクルシステムの設定を更新
      if (particleSystem.config) {
        particleSystem.config.maxParticles = settings.maxParticles;
        particleSystem.config.targetFPS = settings.targetFPS;
      }

      // レンダラーの設定を更新
      if (particleSystem.renderer) {
        particleSystem.renderer.enableLOD = settings.enableLOD;
        particleSystem.renderer.batchSize = settings.batchSize;
        particleSystem.renderer.targetFPS = settings.targetFPS;
      }

      // パーティクルプールの設定を更新
      if (particleSystem.particlePool) {
        particleSystem.particlePool.maxSize = settings.maxParticles;
      }
    }
  }
}
