/**
 * PerformanceMonitor - ゲーム全体のパフォーマンス監視
 *
 * フレームレート、メモリ使用量、処理時間などを包括的に監視
 * パフォーマンス問題の早期発見と自動最適化を提供
 *
 * @author AI Assistant
 * @version 1.0.0
 */

export default class PerformanceMonitor {
  /**
   * PerformanceMonitorのコンストラクタ
   *
   * @param {Object} config - 監視設定
   */
  constructor(config = {}) {
    this.config = {
      enableRealTimeMonitoring: config.enableRealTimeMonitoring !== false,
      enableAutoOptimization: config.enableAutoOptimization !== false,
      targetFPS: config.targetFPS || 60,
      memoryThreshold: config.memoryThreshold || 0.8,
      frameTimeThreshold: config.frameTimeThreshold || 16.67,
      ...config,
    };

    // パフォーマンス指標
    this.metrics = {
      fps: 0,
      frameTime: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      renderTime: 0,
      updateTime: 0,
      inputLatency: 0,
    };

    // 履歴データ
    this.history = {
      fps: [],
      frameTime: [],
      memoryUsage: [],
      renderTime: [],
      updateTime: [],
    };

    // 統計情報
    this.stats = {
      minFPS: Infinity,
      maxFPS: 0,
      avgFPS: 0,
      minFrameTime: Infinity,
      maxFrameTime: 0,
      avgFrameTime: 0,
      totalFrames: 0,
      droppedFrames: 0,
    };

    // 監視状態
    this.isMonitoring = false;
    this.monitorInterval = null;
    this.lastFrameTime = 0;
    this.frameCount = 0;

    // 最適化状態
    this.optimizationLevel = 0;
    this.autoOptimizations = [];

    // イベントリスナー
    this.listeners = new Map();
  }

  /**
   * パフォーマンス監視を開始
   */
  startMonitoring() {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.lastFrameTime = performance.now();

    // リアルタイム監視の開始
    if (this.config.enableRealTimeMonitoring) {
      this.monitorInterval = setInterval(() => {
        this.updateMetrics();
        this.checkPerformance();
        this.triggerOptimizations();
      }, 1000); // 1秒ごとに更新
    }

    this.emit('monitoringStarted');
  }

  /**
   * パフォーマンス監視を停止
   */
  stopMonitoring() {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;

    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }

    this.emit('monitoringStopped');
  }

  /**
   * フレーム開始時の処理
   */
  beginFrame() {
    if (!this.isMonitoring) return;

    this.lastFrameTime = performance.now();
  }

  /**
   * フレーム終了時の処理
   */
  endFrame() {
    if (!this.isMonitoring) return;

    const currentTime = performance.now();
    const frameTime = currentTime - this.lastFrameTime;

    // フレーム時間の更新
    this.metrics.frameTime = frameTime;
    this.frameCount++;

    // FPS計算
    if (frameTime > 0) {
      this.metrics.fps = 1000 / frameTime;
    }

    // 統計情報の更新
    this.updateStats(frameTime);

    // 履歴データの更新
    this.updateHistory();

    // パフォーマンスチェック
    this.checkPerformance();
  }

  /**
   * レンダリング時間の記録
   *
   * @param {number} renderTime - レンダリング時間（ミリ秒）
   */
  recordRenderTime(renderTime) {
    this.metrics.renderTime = renderTime;
  }

  /**
   * 更新処理時間の記録
   *
   * @param {number} updateTime - 更新処理時間（ミリ秒）
   */
  recordUpdateTime(updateTime) {
    this.metrics.updateTime = updateTime;
  }

  /**
   * 入力遅延の記録
   *
   * @param {number} inputLatency - 入力遅延（ミリ秒）
   */
  recordInputLatency(inputLatency) {
    this.metrics.inputLatency = inputLatency;
  }

  /**
   * メモリ使用量の更新
   */
  updateMemoryUsage() {
    if (performance.memory) {
      this.metrics.memoryUsage =
        performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit;
    }
  }

  /**
   * メトリクスの更新
   */
  updateMetrics() {
    this.updateMemoryUsage();

    // CPU使用率の推定（フレーム時間ベース）
    const targetFrameTime = 1000 / this.config.targetFPS;
    this.metrics.cpuUsage = Math.min(1, this.metrics.frameTime / targetFrameTime);
  }

  /**
   * 統計情報の更新
   *
   * @param {number} frameTime - フレーム時間
   */
  updateStats(frameTime) {
    // FPS統計
    this.stats.minFPS = Math.min(this.stats.minFPS, this.metrics.fps);
    this.stats.maxFPS = Math.max(this.stats.maxFPS, this.metrics.fps);

    // フレーム時間統計
    this.stats.minFrameTime = Math.min(this.stats.minFrameTime, frameTime);
    this.stats.maxFrameTime = Math.max(this.stats.maxFrameTime, frameTime);

    // ドロップフレーム検出
    if (frameTime > this.config.frameTimeThreshold * 1.5) {
      this.stats.droppedFrames++;
    }

    this.stats.totalFrames++;
  }

  /**
   * 履歴データの更新
   */
  updateHistory() {
    const maxHistorySize = 100;

    // FPS履歴
    this.history.fps.push(this.metrics.fps);
    if (this.history.fps.length > maxHistorySize) {
      this.history.fps.shift();
    }

    // フレーム時間履歴
    this.history.frameTime.push(this.metrics.frameTime);
    if (this.history.frameTime.length > maxHistorySize) {
      this.history.frameTime.shift();
    }

    // メモリ使用量履歴
    this.history.memoryUsage.push(this.metrics.memoryUsage);
    if (this.history.memoryUsage.length > maxHistorySize) {
      this.history.memoryUsage.shift();
    }

    // レンダリング時間履歴
    this.history.renderTime.push(this.metrics.renderTime);
    if (this.history.renderTime.length > maxHistorySize) {
      this.history.renderTime.shift();
    }

    // 更新処理時間履歴
    this.history.updateTime.push(this.metrics.updateTime);
    if (this.history.updateTime.length > maxHistorySize) {
      this.history.updateTime.shift();
    }
  }

  /**
   * パフォーマンスチェック
   */
  checkPerformance() {
    const warnings = [];

    // FPS警告
    if (this.metrics.fps < this.config.targetFPS * 0.8) {
      warnings.push({
        type: 'LOW_FPS',
        message: `FPSが低下しています: ${this.metrics.fps.toFixed(1)}`,
        severity: 'warning',
        metric: 'fps',
        value: this.metrics.fps,
        threshold: this.config.targetFPS * 0.8,
      });
    }

    // フレーム時間警告
    if (this.metrics.frameTime > this.config.frameTimeThreshold * 1.5) {
      warnings.push({
        type: 'HIGH_FRAME_TIME',
        message: `フレーム時間が長すぎます: ${this.metrics.frameTime.toFixed(2)}ms`,
        severity: 'warning',
        metric: 'frameTime',
        value: this.metrics.frameTime,
        threshold: this.config.frameTimeThreshold * 1.5,
      });
    }

    // メモリ使用量警告
    if (this.metrics.memoryUsage > this.config.memoryThreshold) {
      warnings.push({
        type: 'HIGH_MEMORY_USAGE',
        message: `メモリ使用量が高いです: ${(this.metrics.memoryUsage * 100).toFixed(1)}%`,
        severity: 'error',
        metric: 'memoryUsage',
        value: this.metrics.memoryUsage,
        threshold: this.config.memoryThreshold,
      });
    }

    // 警告の通知
    warnings.forEach(warning => {
      this.emit('performanceWarning', warning);
    });

    return warnings;
  }

  /**
   * 自動最適化の実行
   */
  triggerOptimizations() {
    if (!this.config.enableAutoOptimization) return;

    const optimizations = [];

    // FPSが低い場合の最適化
    if (this.metrics.fps < this.config.targetFPS * 0.7) {
      optimizations.push({
        type: 'REDUCE_RENDER_QUALITY',
        description: 'レンダリング品質を下げてパフォーマンスを向上',
        priority: 'high',
      });
    }

    // メモリ使用量が高い場合の最適化
    if (this.metrics.memoryUsage > this.config.memoryThreshold * 0.9) {
      optimizations.push({
        type: 'MEMORY_CLEANUP',
        description: 'メモリクリーンアップを実行',
        priority: 'critical',
      });
    }

    // 最適化の実行
    optimizations.forEach(optimization => {
      this.executeOptimization(optimization);
    });
  }

  /**
   * 最適化の実行
   *
   * @param {Object} optimization - 最適化情報
   */
  executeOptimization(optimization) {
    this.autoOptimizations.push({
      ...optimization,
      timestamp: Date.now(),
      executed: true,
    });

    this.emit('optimizationExecuted', optimization);
  }

  /**
   * パフォーマンスレポートの取得
   *
   * @returns {Object} パフォーマンスレポート
   */
  getPerformanceReport() {
    // 平均値の計算
    const avgFPS =
      this.history.fps.length > 0
        ? this.history.fps.reduce((a, b) => a + b, 0) / this.history.fps.length
        : 0;

    const avgFrameTime =
      this.history.frameTime.length > 0
        ? this.history.frameTime.reduce((a, b) => a + b, 0) / this.history.frameTime.length
        : 0;

    return {
      current: this.metrics,
      statistics: {
        ...this.stats,
        avgFPS: avgFPS,
        avgFrameTime: avgFrameTime,
      },
      history: this.history,
      optimizations: this.autoOptimizations,
      recommendations: this.generateRecommendations(),
    };
  }

  /**
   * パフォーマンス改善の推奨事項を生成
   *
   * @returns {Array} 推奨事項の配列
   */
  generateRecommendations() {
    const recommendations = [];

    // FPS改善の推奨
    if (this.stats.avgFPS < this.config.targetFPS * 0.8) {
      recommendations.push({
        type: 'PERFORMANCE',
        title: 'FPS改善の推奨',
        description: 'レンダリング品質の調整や描画オブジェクトの削減を検討してください',
        priority: 'high',
      });
    }

    // メモリ使用量改善の推奨
    if (this.stats.avgFrameTime > this.config.frameTimeThreshold * 1.2) {
      recommendations.push({
        type: 'MEMORY',
        title: 'メモリ使用量の最適化',
        description: 'オブジェクトプールの活用や不要なオブジェクトの削除を検討してください',
        priority: 'medium',
      });
    }

    return recommendations;
  }

  /**
   * イベントリスナーの追加
   *
   * @param {string} event - イベント名
   * @param {Function} listener - リスナー関数
   */
  on(event, listener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(listener);
  }

  /**
   * イベントの発生
   *
   * @param {string} event - イベント名
   * @param {*} data - イベントデータ
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`PerformanceMonitor event error:`, error);
        }
      });
    }
  }

  /**
   * 監視のリセット
   */
  reset() {
    this.stopMonitoring();

    this.metrics = {
      fps: 0,
      frameTime: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      renderTime: 0,
      updateTime: 0,
      inputLatency: 0,
    };

    this.history = {
      fps: [],
      frameTime: [],
      memoryUsage: [],
      renderTime: [],
      updateTime: [],
    };

    this.stats = {
      minFPS: Infinity,
      maxFPS: 0,
      avgFPS: 0,
      minFrameTime: Infinity,
      maxFrameTime: 0,
      avgFrameTime: 0,
      totalFrames: 0,
      droppedFrames: 0,
    };

    this.frameCount = 0;
    this.lastFrameTime = 0;
    this.optimizationLevel = 0;
    this.autoOptimizations = [];
  }
}
