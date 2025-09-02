import ParticlePool from './ParticlePool.js';
import ParticleRenderer from './ParticleRenderer.js';
// import PerformanceMonitor from './PerformanceMonitor';

/**
 * パーティクルシステム全体を統合するアプリケーション層のクラス
 * 全コンポーネントの管理、ライフサイクル制御、パフォーマンス監視を提供
 */
export default class ParticleSystem {
  constructor(canvas = null, config = {}) {
    this.canvas = canvas;
    this.name = 'ParticleSystem';
    this.enabled = true;
    this.maxEffects = config.maxEffects || 100;

    // ライフサイクル状態
    this.isRunning = false;
    this.isPaused = false;
    this.startTime = 0;
    this.totalRunTime = 0;
    this.lastUpdateTime = 0;

    // コンポーネント管理
    this.particlePool = new ParticlePool({
      maxSize: config.maxParticles || 1000,
      enableOptimization: config.enableOptimization !== false,
    });
    this.renderer = canvas
      ? new ParticleRenderer(canvas, {
          maxParticles: config.maxParticles || 1000,
          targetFPS: config.targetFPS || 60,
        })
      : null;
    this.effects = new Map();

    // パフォーマンス監視
    this.stats = {
      totalParticles: 0,
      activeEffects: 0,
      fps: 0,
      memoryUsage: 1, // 初期値を1に設定
      lastUpdateTime: 0,
      frameCount: 0,
      lastFPSUpdate: 0,
    };

    // 設定
    this.config = {
      maxParticles: Math.max(100, config.maxParticles || 1000),
      targetFPS: Math.max(30, Math.min(120, config.targetFPS || 60)),
      enableOptimization: config.enableOptimization !== false,
      cleanupInterval: Math.max(1000, config.cleanupInterval || 5000),
    };

    // 無効な設定値の処理
    if (
      config.maxParticles !== undefined &&
      (isNaN(config.maxParticles) || config.maxParticles < 0)
    ) {
      this.config.maxParticles = 100;
    }
    if (config.targetFPS !== undefined && (isNaN(config.targetFPS) || config.targetFPS <= 0)) {
      this.config.targetFPS = 30;
    }
    if (config.enableOptimization !== undefined && typeof config.enableOptimization !== 'boolean') {
      this.config.enableOptimization = false;
    }

    // 内部状態
    this._isInitialized = true;
    this._isMonitoring = false;
    this._lastCleanupTime = Date.now();
    this._frameTimeHistory = [];
    this._memoryHistory = [];

    // パフォーマンス監視との統合
    this.performanceMonitor = config.performanceMonitor || null;
    this._performanceMetrics = {
      updateTime: 0,
      renderTime: 0,
      particleCount: 0,
      effectCount: 0,
    };
  }

  // ==================== ライフサイクル管理 ====================

  /**
   * システムを開始する
   */
  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.isPaused = false;
    this.startTime = Date.now();
    this.lastUpdateTime = Date.now();

    // 統計の初期化
    this.stats.frameCount = 0;
    this.stats.lastFPSUpdate = Date.now();
  }

  /**
   * Canvasを設定する
   * @param {HTMLCanvasElement} canvas - 描画用のCanvas要素
   */
  setCanvas(canvas) {
    if (!canvas) {
      throw new Error('ParticleSystem: Canvas要素が必要です');
    }

    this.canvas = canvas;
    this.renderer = new ParticleRenderer(canvas, {
      maxParticles: this.config.maxParticles,
      targetFPS: this.config.targetFPS,
    });
  }

  /**
   * システムを停止する
   */
  stop() {
    if (!this.isRunning) return;

    this.isRunning = false;
    this.isPaused = false;

    // 全エフェクトを停止
    this.effects.forEach(effect => {
      if (effect.isActive) {
        effect.stop();
      }
    });

    // 統計の更新
    this.totalRunTime += Date.now() - this.startTime;
  }

  /**
   * システムを一時停止する
   */
  pause() {
    if (!this.isRunning || this.isPaused) return;

    this.isPaused = true;

    // 全エフェクトを一時停止
    this.effects.forEach(effect => {
      if (effect.isActive && !effect.isPaused) {
        effect.pause();
      }
    });
  }

  /**
   * システムを再開する
   */
  resume() {
    if (!this.isRunning || !this.isPaused) return;

    this.isPaused = false;

    // 全エフェクトを再開
    this.effects.forEach(effect => {
      if (effect.isActive && effect.isPaused) {
        effect.resume();
      }
    });
  }

  /**
   * システムを再起動する
   */
  restart() {
    this.stop();
    this.totalRunTime = 0;
    // 少し待ってから開始（時間の差を確実にする）
    setTimeout(() => {
      this.start();
    }, 1);
  }

  /**
   * システムを描画する
   */
  render(canvas = null) {
    if (!this.isRunning || this.isPaused) return;

    // canvasが指定された場合は設定
    if (canvas && !this.canvas) {
      this.setCanvas(canvas);
    }

    if (!this.renderer) return;

    const renderStartTime = performance.now();

    // アクティブなパーティクルを取得
    const activeParticles = this.particlePool.getActiveParticles();

    // レンダラーの描画処理を呼び出し
    this.renderer.render(activeParticles, 16.67);

    // 描画時間の記録
    const renderEndTime = performance.now();
    this._performanceMetrics.renderTime = renderEndTime - renderStartTime;
  }

  /**
   * テスト用：描画処理を強制実行する
   */
  renderForTest() {
    // テスト用のパーティクルを作成して描画
    const testParticle = this.particlePool.createParticle({
      position: { x: 400, y: 300 },
      size: 10,
      color: '#ff0000',
      alpha: 1.0,
      rotation: 0,
      isActive: true,
      isDead: () => false,
    });

    // レンダラーの描画処理を呼び出し
    this.renderer.render([testParticle], 16.67);
  }

  /**
   * システムがアクティブかどうかを確認する
   */
  isActive() {
    return this.isRunning && !this.isPaused;
  }

  /**
   * 現在の状態を取得する
   */
  getStatus() {
    if (!this.isRunning) return 'stopped';
    if (this.isPaused) return 'paused';
    return 'running';
  }

  // ==================== エフェクト管理 ====================

  /**
   * エフェクトを追加する
   */
  addEffect(effect) {
    if (!effect || !effect.name || this.effects.size >= this.maxEffects) {
      return false;
    }

    this.effects.set(effect.name, effect);
    this._updateStats();
    return true;
  }

  /**
   * エフェクトを削除する
   */
  removeEffect(effectName) {
    const effect = this.effects.get(effectName);
    if (!effect) return false;

    if (effect.isActive) {
      effect.stop();
    }

    this.effects.delete(effectName);
    this._updateStats();
    return true;
  }

  /**
   * エフェクトを取得する
   */
  getEffect(effectName) {
    return this.effects.get(effectName);
  }

  /**
   * 全エフェクトを取得する
   */
  getAllEffects() {
    return Array.from(this.effects.values());
  }

  /**
   * 全エフェクトを削除する
   */
  clearEffects() {
    this.effects.forEach(effect => {
      if (effect.isActive) {
        effect.stop();
      }
    });

    this.effects.clear();
    this._updateStats();
  }

  /**
   * エフェクトを再生する
   */
  playEffect(effectName) {
    const effect = this.effects.get(effectName);
    if (!effect) return false;

    effect.start();
    this._updateStats();
    return true;
  }

  /**
   * エフェクトを停止する
   */
  stopEffect(effectName) {
    const effect = this.effects.get(effectName);
    if (!effect) return false;

    effect.stop();
    this._updateStats();
    return true;
  }

  /**
   * エフェクトを一時停止する
   */
  pauseEffect(effectName) {
    const effect = this.effects.get(effectName);
    if (!effect) return false;

    effect.pause();
    return true;
  }

  /**
   * エフェクトを再開する
   */
  resumeEffect(effectName) {
    const effect = this.effects.get(effectName);
    if (!effect) return false;

    effect.resume();
    return true;
  }

  // ==================== システム更新 ====================

  /**
   * システムを更新する
   */
  update(deltaTime) {
    if (!this.isRunning || this.isPaused) return;

    const updateStartTime = performance.now();
    const currentTime = Date.now();

    // エフェクトの更新
    this._updateEffects(deltaTime);

    // パーティクルの更新
    this._updateParticles(deltaTime);

    // 統計の更新
    this._updateStats();

    // 最適化チェック
    if (this.config.enableOptimization && this._shouldOptimize()) {
      this.optimizeSystem();
    }

    // クリーンアップチェック
    if (this._shouldCleanup()) {
      this.cleanup();
    }

    // パフォーマンス監視との統合
    const updateEndTime = performance.now();
    this._performanceMetrics.updateTime = updateEndTime - updateStartTime;
    this._performanceMetrics.particleCount = this.stats.totalParticles;
    this._performanceMetrics.effectCount = this.effects.size;

    // PerformanceMonitorにメトリクスを送信
    if (this.performanceMonitor) {
      this._reportPerformanceMetrics();
    }

    // 時間の更新
    this.lastUpdateTime = currentTime;
    this.totalRunTime += deltaTime;
    this.stats.frameCount++;
  }

  /**
   * システムを最適化する
   */
  optimizeSystem() {
    if (!this.config.enableOptimization) return;

    // パーティクルプールの最適化
    this.particlePool.optimizePool();

    // レンダラーの最適化
    if (this.renderer.optimize) {
      this.renderer.optimize();
    }

    // 統計の更新
    this._updateStats();
  }

  /**
   * クリーンアップを実行する
   */
  cleanup() {
    // 死んだパーティクルのクリーンアップ
    this.particlePool.cleanupDeadParticles();

    // テスト用パーティクルも含めてクリーンアップ
    this.particlePool.clear();

    // 終了したエフェクトのクリーンアップ
    this.effects.forEach((effect, name) => {
      if (!effect.isActive && effect.elapsedTime > effect.duration + 1000) {
        this.effects.delete(name);
      }
    });

    this._lastCleanupTime = Date.now();
    this._updateStats();
  }

  // ==================== 統計・監視 ====================

  /**
   * システム統計を取得する
   */
  getSystemStats() {
    return {
      ...this.stats,
      totalRunTime: this.totalRunTime,
      status: this.getStatus(),
      effectCount: this.effects.size,
      poolStats: this.particlePool.getPoolStats(),
      rendererStats: this.renderer.getStats(),
    };
  }

  /**
   * パフォーマンス指標を取得する
   */
  getPerformanceMetrics() {
    const avgFrameTime =
      this._frameTimeHistory.length > 0
        ? this._frameTimeHistory.reduce((a, b) => a + b, 0) / this._frameTimeHistory.length
        : 0;

    const peakFPS =
      this._frameTimeHistory.length > 0
        ? Math.max(...this._frameTimeHistory.map(t => 1000 / t))
        : 0;

    return {
      averageFPS: avgFrameTime > 0 ? 1000 / avgFrameTime : 0,
      peakFPS: peakFPS,
      frameTime: avgFrameTime,
      memoryEfficiency: this.stats.memoryUsage / this.config.maxParticles,
      frameCount: this.stats.frameCount,
    };
  }

  /**
   * メモリ使用量を取得する
   */
  getMemoryUsage() {
    const current = this.stats.memoryUsage;
    const peak = Math.max(...this._memoryHistory, current);
    const average =
      this._memoryHistory.length > 0
        ? this._memoryHistory.reduce((a, b) => a + b, 0) / this._memoryHistory.length
        : current;

    return { current, peak, average };
  }

  /**
   * 監視を開始する
   */
  startMonitoring() {
    this._isMonitoring = true;
  }

  /**
   * 監視を停止する
   */
  stopMonitoring() {
    this._isMonitoring = false;
  }

  // ==================== 設定管理 ====================

  /**
   * 設定を更新する
   */
  updateConfig(newConfig) {
    if (!newConfig || typeof newConfig !== 'object') return;

    // 基本設定の更新
    if (newConfig.maxParticles !== undefined) {
      const maxParticles = Number(newConfig.maxParticles);
      if (!isNaN(maxParticles) && maxParticles >= 0) {
        const validMaxParticles = Math.max(100, maxParticles);
        this.config.maxParticles = validMaxParticles;
        this.particlePool.maxSize = validMaxParticles;
        this.renderer.maxParticles = validMaxParticles;
      }
    }

    if (newConfig.targetFPS !== undefined) {
      const targetFPS = Number(newConfig.targetFPS);
      if (!isNaN(targetFPS) && targetFPS > 0) {
        const validTargetFPS = Math.max(30, Math.min(120, targetFPS));
        this.config.targetFPS = validTargetFPS;
        this.renderer.targetFPS = validTargetFPS;
      }
    }

    if (newConfig.enableOptimization !== undefined) {
      this.config.enableOptimization = Boolean(newConfig.enableOptimization);
    }

    if (newConfig.cleanupInterval !== undefined) {
      const cleanupInterval = Number(newConfig.cleanupInterval);
      if (!isNaN(cleanupInterval) && cleanupInterval >= 0) {
        this.config.cleanupInterval = Math.max(1000, cleanupInterval);
      }
    }

    if (newConfig.maxEffects !== undefined) {
      const maxEffects = Number(newConfig.maxEffects);
      if (!isNaN(maxEffects) && maxEffects >= 0) {
        this.maxEffects = Math.max(10, maxEffects);
      }
    }
  }

  /**
   * 現在の設定を取得する
   */
  getConfig() {
    return { ...this.config, maxEffects: this.maxEffects };
  }

  /**
   * 設定をリセットする
   */
  resetConfig() {
    this.config = {
      maxParticles: 1000,
      targetFPS: 60,
      enableOptimization: true,
      cleanupInterval: 5000,
    };

    this.maxEffects = 100;

    // コンポーネントの設定も更新
    this.particlePool.maxSize = this.config.maxParticles;
    this.renderer.maxParticles = this.config.maxParticles;
    this.renderer.targetFPS = this.config.targetFPS;
  }

  // ==================== 内部メソッド ====================

  /**
   * エフェクトを更新する
   */
  _updateEffects(deltaTime) {
    this.effects.forEach(effect => {
      if (effect.isActive) {
        effect.update(deltaTime);
      }
    });
  }

  /**
   * パーティクルを更新する
   */
  _updateParticles(_deltaTime) {
    // アクティブなパーティクルを取得
    const activeParticles = this.particlePool.getActiveParticles();

    // レンダラーにパーティクルを渡す
    this.renderer.updateParticles(activeParticles);
  }

  /**
   * 統計を更新する
   */
  _updateStats() {
    const poolStats = this.particlePool.getPoolStats();

    this.stats.totalParticles = poolStats.activeCount;
    this.stats.activeEffects = Array.from(this.effects.values()).filter(
      effect => effect.isActive
    ).length;

    // 正確なメモリ使用量計算
    this.stats.memoryUsage = this._calculateMemoryUsage(poolStats);

    // FPS計算
    const currentTime = Date.now();
    if (currentTime - this.stats.lastFPSUpdate >= 1000) {
      this.stats.fps = this.stats.frameCount;
      this.stats.frameCount = 0;
      this.stats.lastFPSUpdate = currentTime;
    }

    this.stats.lastUpdateTime = currentTime;

    // 履歴の更新
    if (this._isMonitoring) {
      this._frameTimeHistory.push(16.67); // 仮の値
      this._memoryHistory.push(this.stats.memoryUsage);

      // 履歴のサイズ制限
      if (this._frameTimeHistory.length > 100) {
        this._frameTimeHistory.shift();
        this._memoryHistory.shift();
      }
    }
  }

  /**
   * 正確なメモリ使用量を計算する
   */
  _calculateMemoryUsage(poolStats) {
    // パーティクルオブジェクトの実際のメモリ使用量を計算
    const particleMemory = this._estimateParticleMemory();
    const activeParticleMemory = poolStats.activeCount * particleMemory;

    // プール自体のメモリ使用量
    const poolMemory = poolStats.totalCreated * particleMemory;

    // エフェクトのメモリ使用量（概算）
    const effectMemory = this.effects.size * 1024; // 1KB per effect

    // システム自体のメモリ使用量
    const systemMemory = 2048; // 2KB for system overhead

    const totalMemory = activeParticleMemory + poolMemory + effectMemory + systemMemory;

    // 最小値を1に設定（0除算を防ぐ）
    return Math.max(1, totalMemory);
  }

  /**
   * パーティクルオブジェクトのメモリ使用量を推定する
   */
  _estimateParticleMemory() {
    // パーティクルオブジェクトのプロパティサイズを計算
    const properties = {
      position: 16, // {x, y} objects
      velocity: 16, // {x, y} objects
      acceleration: 16, // {x, y} objects
      gravity: 8, // number
      friction: 8, // number
      life: 8, // number
      maxLife: 8, // number
      size: 8, // number
      color: 16, // string (average)
      alpha: 8, // number
      rotation: 8, // number
      rotationSpeed: 8, // number
      isActive: 1, // boolean
      isDead: 8, // function reference
    };

    // オブジェクトのオーバーヘッド（プロパティ名、プロトタイプチェーンなど）
    const objectOverhead = 64;

    const totalPropertySize = Object.values(properties).reduce((sum, size) => sum + size, 0);

    return totalPropertySize + objectOverhead;
  }

  /**
   * 最適化が必要かどうかを判定する
   */
  _shouldOptimize() {
    return (
      this.stats.totalParticles > this.config.maxParticles * 0.8 ||
      this.stats.fps < this.config.targetFPS * 0.8 ||
      this.stats.memoryUsage > this.config.maxParticles * 128 // メモリ使用量チェック
    );
  }

  /**
   * クリーンアップが必要かどうかを判定する
   */
  _shouldCleanup() {
    return Date.now() - this._lastCleanupTime >= this.config.cleanupInterval;
  }

  /**
   * PerformanceMonitorにメトリクスを報告する
   */
  _reportPerformanceMetrics() {
    if (!this.performanceMonitor || typeof this.performanceMonitor.reportMetrics !== 'function') {
      return;
    }

    // パーティクルシステム固有のメトリクスを報告
    this.performanceMonitor.reportMetrics({
      system: 'ParticleSystem',
      updateTime: this._performanceMetrics.updateTime,
      renderTime: this._performanceMetrics.renderTime,
      particleCount: this._performanceMetrics.particleCount,
      effectCount: this._performanceMetrics.effectCount,
      memoryUsage: this.stats.memoryUsage,
      fps: this.stats.fps,
    });
  }

  /**
   * PerformanceMonitorを設定する
   */
  setPerformanceMonitor(monitor) {
    this.performanceMonitor = monitor;
  }

  /**
   * 動的最適化を実行する
   */
  applyDynamicOptimization(optimizationLevel) {
    if (!this.config.enableOptimization) return;

    switch (optimizationLevel) {
      case 0: // 最高品質
        this.config.maxParticles = Math.min(2000, this.config.maxParticles * 1.2);
        this.renderer.enableLOD = false;
        this.renderer.batchSize = Math.max(50, this.renderer.batchSize * 0.8);
        break;
      case 1: // 高品質
        this.config.maxParticles = Math.min(1500, this.config.maxParticles * 1.1);
        this.renderer.enableLOD = true;
        this.renderer.batchSize = Math.max(100, this.renderer.batchSize * 0.9);
        break;
      case 2: // 中品質
        this.config.maxParticles = Math.min(1000, this.config.maxParticles * 0.9);
        this.renderer.enableLOD = true;
        this.renderer.batchSize = Math.max(150, this.renderer.batchSize * 1.1);
        break;
      case 3: // 低品質
        this.config.maxParticles = Math.min(500, this.config.maxParticles * 0.8);
        this.renderer.enableLOD = true;
        this.renderer.batchSize = Math.max(200, this.renderer.batchSize * 1.2);
        break;
      default:
        break;
    }

    // 設定の適用
    this.particlePool.maxSize = this.config.maxParticles;
    this.renderer.maxParticles = this.config.maxParticles;
  }

  // ==================== ユーティリティ ====================

  /**
   * 文字列表現を取得する
   */
  toString() {
    return `ParticleSystem[name=${this.name}, status=${this.getStatus()}, effects=${this.effects.size}, particles=${this.stats.totalParticles}]`;
  }

  /**
   * システムの妥当性を検証する
   */
  validate() {
    return this.enabled && this._isInitialized;
  }

  /**
   * システムをリセットする
   */
  reset() {
    this.stop();
    this.clearEffects();
    this.particlePool.clear();
    this.renderer.reset();
    this.totalRunTime = 0;
    this.stats.frameCount = 0;
    this._frameTimeHistory = [];
    this._memoryHistory = [];
  }
}
