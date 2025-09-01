import ParticlePool from './ParticlePool';
import ParticleRenderer from './ParticleRenderer';

/**
 * パーティクルシステム全体を統合するアプリケーション層のクラス
 * 全コンポーネントの管理、ライフサイクル制御、パフォーマンス監視を提供
 */
export default class ParticleSystem {
  constructor(canvas, config = {}) {
    if (!canvas) {
      throw new Error('ParticleSystem: Canvas要素が必要です');
    }

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
    this.renderer = new ParticleRenderer(canvas, {
      maxParticles: config.maxParticles || 1000,
      targetFPS: config.targetFPS || 60,
    });
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

    // 時間の更新
    this.lastUpdateTime = currentTime;
    this.totalRunTime += deltaTime;
    this.stats.frameCount++;
  }

  /**
   * 描画を実行する
   */
  render() {
    if (!this.isRunning) return;

    this.renderer.render();
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
  _updateParticles(deltaTime) {
    // パーティクルプールの更新
    this.particlePool.update(deltaTime);

    // レンダラーにパーティクルを渡す
    const activeParticles = this.particlePool.getActiveParticles();
    this.renderer.updateParticles(activeParticles);
  }

  /**
   * 統計を更新する
   */
  _updateStats() {
    const poolStats = this.particlePool.getPoolStats();

    this.stats.totalParticles = poolStats.totalActive;
    this.stats.activeEffects = Array.from(this.effects.values()).filter(
      effect => effect.isActive
    ).length;
    this.stats.memoryUsage = Math.max(1, poolStats.totalActive * 64); // 最小値を1に設定

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
   * 最適化が必要かどうかを判定する
   */
  _shouldOptimize() {
    return (
      this.stats.totalParticles > this.config.maxParticles * 0.8 ||
      this.stats.fps < this.config.targetFPS * 0.8
    );
  }

  /**
   * クリーンアップが必要かどうかを判定する
   */
  _shouldCleanup() {
    return Date.now() - this._lastCleanupTime >= this.config.cleanupInterval;
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
    this.particlePool.reset();
    this.renderer.reset();
    this.totalRunTime = 0;
    this.stats.frameCount = 0;
    this._frameTimeHistory = [];
    this._memoryHistory = [];
  }
}
