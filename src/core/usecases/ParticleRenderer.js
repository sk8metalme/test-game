/**
 * パーティクルシステムの描画処理を担当するクラス
 * Canvas APIを最適化し、大量のパーティクルを60FPSで描画することを目標とします
 */
export default class ParticleRenderer {
  constructor(canvas, config = {}) {
    if (!canvas) {
      throw new Error('ParticleRenderer: Canvas要素が必要です');
    }

    // Canvas設定
    this.canvas = canvas;
    this.context = canvas.getContext('2d');

    // 描画設定
    this.batchSize = Math.max(1, config.batchSize || 100);
    this.maxParticles = Math.max(100, config.maxParticles || 1000);
    this.enableBlending = config.enableBlending !== false;
    this.enableLOD = config.enableLOD !== false;

    // パフォーマンス設定
    this.targetFPS = Math.max(30, Math.min(120, config.targetFPS || 60));
    this.frameTime = 1000 / this.targetFPS;
    this.lastFrameTime = 0;

    // 描画統計
    this.stats = {
      totalRendered: 0,
      framesRendered: 0,
      averageFrameTime: 0,
      particlesPerFrame: 0,
      renderCalls: 0,
      fps: 0,
    };

    // 内部状態
    this._isInitialized = true;
    this._lastUpdateTime = Date.now();
    this._renderQueue = [];
    this._activeParticles = new Set();
    this._frameTimeHistory = [];
    this._lastFPSUpdate = Date.now();
  }

  // ==================== 描画処理 ====================

  /**
   * パーティクル配列を描画する
   */
  render(particles, deltaTime) {
    if (!particles || particles.length === 0) return;

    const startTime = performance.now();

    // パフォーマンスチェック
    if (!this._shouldRender(deltaTime)) return;

    // パーティクルを描画キューに追加
    this._addToRenderQueue(particles);

    // バッチ描画の実行
    this._executeBatchRender();

    // 統計の更新
    this._updateStats(particles.length, startTime);
  }

  /**
   * 個別パーティクルを描画する
   */
  renderParticle(particle) {
    if (
      !particle ||
      !particle.isActive ||
      (typeof particle.isDead === 'function' && particle.isDead())
    )
      return;

    const ctx = this.context;

    // 描画状態の保存
    ctx.save();

    // ブレンドモードの設定
    if (this.enableBlending) {
      ctx.globalCompositeOperation = 'source-over';
    }

    // パーティクルの描画
    this._drawParticleShape(particle);

    // 描画状態の復元
    ctx.restore();
  }

  /**
   * パーティクル配列を更新する
   */
  updateParticles(particles) {
    if (!particles || particles.length === 0) return;

    this._activeParticles.clear();
    particles.forEach(particle => {
      if (particle && particle.isActive) {
        this._activeParticles.add(particle);
      }
    });
  }

  // ==================== バッチ処理 ====================

  /**
   * バッチ描画を実行する
   */
  _executeBatchRender() {
    const ctx = this.context;
    const queue = this._renderQueue;

    if (queue.length === 0) return;

    // 描画前の準備
    ctx.save();
    this._setupRenderContext();

    // バッチ単位での描画
    for (let i = 0; i < queue.length; i += this.batchSize) {
      const batch = queue.slice(i, i + this.batchSize);
      this._renderBatch(batch);
    }

    // 描画後のクリーンアップ
    ctx.restore();
    this._renderQueue = [];
  }

  /**
   * バッチ内のパーティクルを描画する
   */
  _renderBatch(batch) {
    // バッチ内のパーティクルを描画
    batch.forEach(particle => {
      if (
        particle &&
        particle.isActive &&
        !(typeof particle.isDead === 'function' && particle.isDead())
      ) {
        this._drawParticleShape(particle);
      }
    });
  }

  /**
   * 描画キューにパーティクルを追加する
   */
  _addToRenderQueue(particles) {
    this._renderQueue = particles.filter(
      particle =>
        particle &&
        particle.isActive &&
        !(typeof particle.isDead === 'function' && particle.isDead())
    );
  }

  // ==================== パーティクル描画 ====================

  /**
   * パーティクルの形状を描画する
   */
  _drawParticleShape(particle) {
    const ctx = this.context;

    // 位置とサイズの取得
    const x = particle.position?.x || 0;
    const y = particle.position?.y || 0;
    const size = particle.size || 10;
    const alpha = particle.alpha || 1.0;
    const rotation = particle.rotation || 0;

    // 透明度の設定
    ctx.globalAlpha = alpha;

    // 回転の適用
    if (rotation !== 0) {
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.translate(-x, -y);
    }

    // 色の設定
    ctx.fillStyle = particle.color || '#ffffff';

    // 形状の描画（円形パーティクル）
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // ==================== パフォーマンス最適化 ====================

  /**
   * 描画が必要かどうかを判定する
   */
  _shouldRender(_deltaTime) {
    const now = Date.now();

    // フレームレート制限のチェック
    if (this.lastFrameTime > 0 && now - this.lastFrameTime < this.frameTime) {
      return false;
    }

    // パーティクル数の制限
    if (this._activeParticles.size > this.maxParticles) {
      return false;
    }

    this.lastFrameTime = now;
    return true;
  }

  /**
   * 描画コンテキストを最適化する
   */
  _setupRenderContext() {
    const ctx = this.context;

    // アンチエイリアシングの設定
    ctx.imageSmoothingEnabled = false;

    // ブレンドモードの設定
    if (this.enableBlending) {
      ctx.globalCompositeOperation = 'source-over';
    }

    // 描画品質の設定
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }

  /**
   * システムを最適化する
   */
  optimize() {
    // 描画キューの最適化
    if (this._renderQueue.length > this.maxParticles) {
      this._renderQueue = this._renderQueue.slice(0, this.maxParticles);
    }

    // フレーム時間履歴の最適化
    if (this._frameTimeHistory.length > 100) {
      this._frameTimeHistory = this._frameTimeHistory.slice(-100);
    }
  }

  // ==================== 統計・監視 ====================

  /**
   * 統計情報を取得する
   */
  getStats() {
    return {
      ...this.stats,
      activeParticles: this._activeParticles.size,
      renderQueueSize: this._renderQueue.length,
      canvasSize: {
        width: this.canvas.width,
        height: this.canvas.height,
      },
    };
  }

  /**
   * 統計を更新する
   */
  _updateStats(particleCount, startTime) {
    const endTime = performance.now();
    const frameTime = endTime - startTime;

    // 基本統計の更新
    this.stats.totalRendered += particleCount;
    this.stats.framesRendered++;
    this.stats.particlesPerFrame = particleCount;
    this.stats.renderCalls++;

    // フレーム時間の履歴
    this._frameTimeHistory.push(frameTime);

    // 平均フレーム時間の計算
    this.stats.averageFrameTime =
      this._frameTimeHistory.reduce((a, b) => a + b, 0) / this._frameTimeHistory.length;

    // FPS計算
    const currentTime = Date.now();
    if (currentTime - this._lastFPSUpdate >= 1000) {
      this.stats.fps = this.stats.framesRendered;
      this.stats.framesRendered = 0;
      this._lastFPSUpdate = currentTime;
    }

    this._lastUpdateTime = currentTime;
  }

  /**
   * 統計をリセットする
   */
  resetStats() {
    this.stats = {
      totalRendered: 0,
      framesRendered: 0,
      averageFrameTime: 0,
      particlesPerFrame: 0,
      renderCalls: 0,
      fps: 0,
    };
    this._frameTimeHistory = [];
    this._lastFPSUpdate = Date.now();
  }

  // ==================== 設定管理 ====================

  /**
   * 設定を更新する
   */
  updateConfig(newConfig) {
    if (!newConfig || typeof newConfig !== 'object') return this;

    if (newConfig.batchSize !== undefined) {
      this.batchSize = Math.max(1, newConfig.batchSize);
    }

    if (newConfig.maxParticles !== undefined) {
      this.maxParticles = Math.max(100, newConfig.maxParticles);
    }

    if (newConfig.targetFPS !== undefined) {
      this.targetFPS = Math.max(30, Math.min(120, newConfig.targetFPS));
      this.frameTime = 1000 / this.targetFPS;
    }

    if (newConfig.enableBlending !== undefined) {
      this.enableBlending = Boolean(newConfig.enableBlending);
    }

    if (newConfig.enableLOD !== undefined) {
      this.enableLOD = Boolean(newConfig.enableLOD);
    }

    return this;
  }

  /**
   * 現在の設定を取得する
   */
  getConfig() {
    return {
      batchSize: this.batchSize,
      maxParticles: this.maxParticles,
      targetFPS: this.targetFPS,
      enableBlending: this.enableBlending,
      enableLOD: this.enableLOD,
    };
  }

  // ==================== ユーティリティ ====================

  /**
   * システムをリセットする
   */
  reset() {
    this._renderQueue = [];
    this._activeParticles.clear();
    this.lastFrameTime = 0;
    this._lastUpdateTime = Date.now();
    this.resetStats();
  }

  /**
   * システムの妥当性を検証する
   */
  validate() {
    return this.enabled !== false && this._isInitialized && this.canvas && this.context;
  }

  /**
   * 文字列表現を取得する
   */
  toString() {
    return `ParticleRenderer[canvas=${this.canvas?.width}x${this.canvas?.height}, particles=${this._activeParticles.size}, queue=${this._renderQueue.length}]`;
  }
}
