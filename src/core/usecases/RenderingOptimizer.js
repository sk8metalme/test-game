/**
 * RenderingOptimizer.js - レンダリング最適化クラス
 *
 * オニオンアーキテクチャ: Application Layer (Use Cases)
 *
 * 責任:
 * - レンダリングパフォーマンスの最適化
 * - バッチ処理の管理
 * - LOD（Level of Detail）の制御
 * - フレームスキップの実装
 *
 * @developer との協力実装
 */

/**
 * レンダリング最適化クラス
 *
 * @class RenderingOptimizer
 * @description レンダリングパフォーマンスを最適化するユースケース
 */
export default class RenderingOptimizer {
  /**
   * RenderingOptimizer インスタンスを作成
   *
   * @param {Object} [config={}] - 設定
   * @param {number} [config.targetFPS=60] - 目標FPS
   * @param {number} [config.maxFrameTime=16.67] - 最大フレーム時間（ミリ秒）
   * @param {boolean} [config.enableFrameSkipping=true] - フレームスキップの有効/無効
   * @param {boolean} [config.enableLOD=true] - LODの有効/無効
   * @param {number} [config.lodLevels=3] - LODレベル数
   * @param {boolean} [config.enableBatching=true] - バッチ処理の有効/無効
   */
  constructor(config = {}) {
    this.config = {
      targetFPS: config.targetFPS || 60,
      maxFrameTime: config.maxFrameTime || 16.67,
      enableFrameSkipping: config.enableFrameSkipping !== false,
      enableLOD: config.enableLOD !== false,
      lodLevels: config.lodLevels || 3,
      enableBatching: config.enableBatching !== false,
      adaptiveQuality: config.adaptiveQuality !== false,
      ...config,
    };

    // フレーム管理
    this.frameStats = {
      currentFPS: 0,
      averageFPS: 0,
      frameTime: 0,
      skippedFrames: 0,
      renderedFrames: 0,
      lastFrameTime: 0,
    };

    // LOD管理
    this.lodSettings = {
      currentLevel: this.config.lodLevels - 1,
      cameraPosition: { x: 0, y: 0 },
      lodDistances: [100, 200, 400, 800],
    };

    // LODレベルを生成（lodDistancesの後に実行）
    this.lodSettings.levels = this._generateLODLevels();

    // バッチ処理
    this.batchSettings = {
      maxBatchSize: 100,
      currentBatchSize: 0,
      batchQueue: [],
      renderQueue: [],
    };

    // 適応的品質調整
    this.adaptiveSettings = {
      qualityLevel: 1.0,
      performanceHistory: [],
      adjustmentThreshold: 0.1,
      minQuality: 0.3,
      maxQuality: 1.0,
    };

    // 最適化統計
    this.optimizationStats = {
      totalOptimizations: 0,
      framesSkipped: 0,
      lodAdjustments: 0,
      batchOptimizations: 0,
      qualityAdjustments: 0,
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
    if (metrics.fps !== undefined) {
      this.frameStats.currentFPS = metrics.fps;
    }
    if (metrics.frameTime !== undefined) {
      this.frameStats.frameTime = metrics.frameTime;
    }
    if (metrics.renderTime !== undefined) {
      this.frameStats.renderTime = metrics.renderTime;
    }
  }

  /**
   * フレームレンダリングを最適化する
   *
   * @param {Function} renderFunction - レンダリング関数
   * @param {Object} renderData - レンダリングデータ
   * @returns {Object} レンダリング結果
   */
  optimizeFrame(renderFunction, renderData) {
    const startTime = performance.now();

    // フレームスキップの判定
    if (this._shouldSkipFrame()) {
      this.frameStats.skippedFrames++;
      this.optimizationStats.framesSkipped++;
      return {
        rendered: false,
        reason: 'frame_skipped',
        frameTime: performance.now() - startTime,
      };
    }

    // レンダリングデータの最適化
    const optimizedData = this._optimizeRenderData(renderData);

    // レンダリングの実行
    let renderResult;
    try {
      renderResult = renderFunction(optimizedData);
      this.frameStats.renderedFrames++;
    } catch (error) {
      return {
        rendered: false,
        reason: 'render_error',
        error: error.message,
        frameTime: performance.now() - startTime,
      };
    }

    // フレーム統計の更新
    const frameTime = performance.now() - startTime;
    this._updateFrameStats(frameTime);

    // 適応的品質調整
    if (this.config.adaptiveQuality) {
      this._adjustQualityBasedOnPerformance(frameTime);
    }

    return {
      rendered: true,
      result: renderResult,
      frameTime: frameTime,
      lodLevel: this.lodSettings.currentLevel,
      qualityLevel: this.adaptiveSettings.qualityLevel,
    };
  }

  /**
   * LODレベルを設定する
   *
   * @param {number} level - LODレベル (0-最大レベル)
   * @param {Object} cameraPosition - カメラ位置
   */
  setLODLevel(level, cameraPosition = null) {
    const clampedLevel = Math.max(0, Math.min(this.config.lodLevels - 1, level));

    if (clampedLevel !== this.lodSettings.currentLevel) {
      this.lodSettings.currentLevel = clampedLevel;
      this.optimizationStats.lodAdjustments++;
    }

    if (cameraPosition) {
      this.lodSettings.cameraPosition = { ...cameraPosition };
    }
  }

  /**
   * レンダリングデータをバッチに追加する
   *
   * @param {Object} renderData - レンダリングデータ
   * @returns {boolean} バッチに追加されたかどうか
   */
  addToBatch(renderData) {
    if (!this.config.enableBatching) {
      return false;
    }

    this.batchSettings.batchQueue.push({
      data: renderData,
      timestamp: Date.now(),
    });

    // バッチサイズに達した場合、処理を実行
    if (this.batchSettings.batchQueue.length >= this.batchSettings.maxBatchSize) {
      this._processBatch();
      return true;
    }

    return false;
  }

  /**
   * バッチを処理する
   *
   * @param {Function} renderFunction - レンダリング関数
   * @returns {Object} バッチ処理結果
   */
  processBatch(renderFunction) {
    if (this.batchSettings.batchQueue.length === 0) {
      return { processed: false, items: 0 };
    }

    const startTime = performance.now();
    const batchItems = [...this.batchSettings.batchQueue];
    this.batchSettings.batchQueue = [];

    // バッチ内のアイテムを最適化
    const optimizedItems = batchItems.map(item => ({
      ...item,
      data: this._optimizeRenderData(item.data),
    }));

    // バッチレンダリングの実行
    let renderResults = [];
    try {
      renderResults = optimizedItems.map(item => renderFunction(item.data));
      this.optimizationStats.batchOptimizations++;
    } catch (error) {
      return {
        processed: false,
        error: error.message,
        items: batchItems.length,
      };
    }

    const batchTime = performance.now() - startTime;

    return {
      processed: true,
      items: batchItems.length,
      results: renderResults,
      batchTime: batchTime,
      averageTimePerItem: batchTime / batchItems.length,
    };
  }

  /**
   * パフォーマンス統計を取得する
   *
   * @returns {Object} 統計情報
   */
  getStats() {
    return {
      frameStats: { ...this.frameStats },
      lodSettings: { ...this.lodSettings },
      adaptiveSettings: { ...this.adaptiveSettings },
      optimizationStats: { ...this.optimizationStats },
      batchSettings: {
        queueSize: this.batchSettings.batchQueue.length,
        maxBatchSize: this.batchSettings.maxBatchSize,
      },
    };
  }

  /**
   * 最適化をリセットする
   */
  reset() {
    this.frameStats = {
      currentFPS: 0,
      averageFPS: 0,
      frameTime: 0,
      skippedFrames: 0,
      renderedFrames: 0,
      lastFrameTime: 0,
    };

    this.optimizationStats = {
      totalOptimizations: 0,
      framesSkipped: 0,
      lodAdjustments: 0,
      batchOptimizations: 0,
      qualityAdjustments: 0,
    };

    this.adaptiveSettings.qualityLevel = 1.0;
    this.adaptiveSettings.performanceHistory = [];
    this.batchSettings.batchQueue = [];
  }

  // =============================================================================
  // プライベートメソッド
  // =============================================================================

  /**
   * LODレベルを生成する
   *
   * @private
   * @returns {Array} LODレベル設定
   */
  _generateLODLevels() {
    const levels = [];
    for (let i = 0; i < this.config.lodLevels; i++) {
      const quality = 1.0 - i * 0.2; // 各レベルで20%品質を下げる
      levels.push({
        level: i,
        quality: Math.max(0.2, quality),
        maxDistance: this.lodSettings.lodDistances[i] || 1000,
        batchSize: Math.max(10, 100 - i * 20),
      });
    }
    return levels;
  }

  /**
   * フレームをスキップすべきかどうかを判定する
   *
   * @private
   * @returns {boolean} スキップすべきかどうか
   */
  _shouldSkipFrame() {
    if (!this.config.enableFrameSkipping) {
      return false;
    }

    // 現在のFPSが目標FPSの80%以下の場合、フレームをスキップ
    if (this.frameStats.currentFPS < this.config.targetFPS * 0.8) {
      return true;
    }

    // フレーム時間が最大フレーム時間を超えている場合
    if (this.frameStats.frameTime > this.config.maxFrameTime * 1.5) {
      return true;
    }

    return false;
  }

  /**
   * レンダリングデータを最適化する
   *
   * @private
   * @param {Object} renderData - レンダリングデータ
   * @returns {Object} 最適化されたレンダリングデータ
   */
  _optimizeRenderData(renderData) {
    if (!renderData) {
      return renderData;
    }

    const optimized = { ...renderData };

    // LODに基づく最適化
    if (this.config.enableLOD && renderData.particles) {
      optimized.particles = this._applyLODToParticles(renderData.particles);
    }

    // 品質レベルに基づく最適化
    if (this.adaptiveSettings.qualityLevel < 1.0) {
      return this._applyQualityReduction(optimized);
    }

    return optimized;
  }

  /**
   * パーティクルにLODを適用する
   *
   * @private
   * @param {Array} particles - パーティクル配列
   * @returns {Array} LOD適用後のパーティクル配列
   */
  _applyLODToParticles(particles) {
    if (!particles || particles.length === 0) {
      return particles;
    }

    const currentLOD = this.lodSettings.levels[this.lodSettings.currentLevel];
    const maxDistance = currentLOD.maxDistance;

    return particles.filter(particle => {
      if (!particle.position) {
        return true;
      }

      // カメラからの距離を計算
      const distance = Math.sqrt(
        Math.pow(particle.position.x - this.lodSettings.cameraPosition.x, 2) +
          Math.pow(particle.position.y - this.lodSettings.cameraPosition.y, 2)
      );

      return distance <= maxDistance;
    });
  }

  /**
   * 品質削減を適用する
   *
   * @private
   * @param {Object} renderData - レンダリングデータ
   * @returns {Object} 品質削減適用後のデータ
   */
  _applyQualityReduction(renderData) {
    const quality = this.adaptiveSettings.qualityLevel;
    const optimized = { ...renderData };

    // パーティクル数の削減
    if (optimized.particles && Array.isArray(optimized.particles)) {
      const targetCount = Math.floor(optimized.particles.length * quality);
      optimized.particles = optimized.particles.slice(0, targetCount);
    }

    // 描画品質の調整
    if (optimized.renderSettings) {
      optimized.renderSettings = {
        ...optimized.renderSettings,
        alpha: (optimized.renderSettings.alpha || 1.0) * quality,
        scale: (optimized.renderSettings.scale || 1.0) * quality,
      };
    }

    return optimized;
  }

  /**
   * フレーム統計を更新する
   *
   * @private
   * @param {number} frameTime - フレーム時間
   */
  _updateFrameStats(frameTime) {
    this.frameStats.frameTime = frameTime;
    this.frameStats.lastFrameTime = frameTime;

    // FPS計算
    if (frameTime > 0) {
      this.frameStats.currentFPS = 1000 / frameTime;
    }

    // 平均FPS計算
    this.adaptiveSettings.performanceHistory.push(this.frameStats.currentFPS);
    if (this.adaptiveSettings.performanceHistory.length > 60) {
      // 1秒分の履歴
      this.adaptiveSettings.performanceHistory.shift();
    }

    const sum = this.adaptiveSettings.performanceHistory.reduce((a, b) => a + b, 0);
    this.frameStats.averageFPS = sum / this.adaptiveSettings.performanceHistory.length;
  }

  /**
   * パフォーマンスに基づいて品質を調整する
   *
   * @private
   * @param {number} frameTime - フレーム時間
   */
  _adjustQualityBasedOnPerformance(frameTime) {
    const targetFrameTime = 1000 / this.config.targetFPS;
    const performanceRatio = frameTime / targetFrameTime;

    let newQuality = this.adaptiveSettings.qualityLevel;

    // パフォーマンスが悪い場合、品質を下げる
    if (performanceRatio > 1.2) {
      newQuality = Math.max(
        this.adaptiveSettings.minQuality,
        this.adaptiveSettings.qualityLevel * 0.9
      );
    }
    // パフォーマンスが良い場合、品質を上げる
    else if (performanceRatio < 0.8) {
      newQuality = Math.min(
        this.adaptiveSettings.maxQuality,
        this.adaptiveSettings.qualityLevel * 1.05
      );
    }

    // 品質レベルの変更が閾値を超えた場合のみ適用
    if (
      Math.abs(newQuality - this.adaptiveSettings.qualityLevel) >
      this.adaptiveSettings.adjustmentThreshold
    ) {
      this.adaptiveSettings.qualityLevel = newQuality;
      this.optimizationStats.qualityAdjustments++;
    }
  }

  /**
   * バッチを処理する（内部用）
   *
   * @private
   */
  _processBatch() {
    // バッチ処理の実装は外部のrenderFunctionに依存するため、
    // ここではキューをクリアするのみ
    this.batchSettings.batchQueue = [];
  }
}
