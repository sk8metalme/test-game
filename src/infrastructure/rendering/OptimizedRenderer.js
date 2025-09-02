/**
 * OptimizedRenderer - レンダリングパフォーマンスの最適化
 *
 * 描画の最適化、フレームスキップ、ダブルバッファリングによる
 * レンダリングパフォーマンスの向上
 *
 * @author AI Assistant
 * @version 1.0.0
 */

export default class OptimizedRenderer {
  /**
   * OptimizedRendererのコンストラクタ
   *
   * @param {HTMLCanvasElement} canvas - 描画対象のキャンバス
   * @param {Object} config - レンダリング設定
   */
  constructor(canvas, config = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // 設定の初期化
    this.config = {
      targetFPS: config.targetFPS || 60,
      enableFrameSkip: config.enableFrameSkip !== false,
      enableDoubleBuffering: config.enableDoubleBuffering !== false,
      enableCulling: config.enableCulling !== false,
      batchSize: config.batchSize || 100,
      ...config,
    };

    // パフォーマンス監視
    this.frameCount = 0;
    this.lastFrameTime = 0;
    this.fps = 0;
    this.frameSkipCount = 0;

    // ダブルバッファリング
    if (this.config.enableDoubleBuffering) {
      this.initializeDoubleBuffering();
    }

    // 描画バッチ
    this.renderQueue = [];
    this.isRendering = false;

    // ビューポート情報
    this.viewport = {
      x: 0,
      y: 0,
      width: canvas.width,
      height: canvas.height,
    };
  }

  /**
   * ダブルバッファリングの初期化
   */
  initializeDoubleBuffering() {
    this.backBuffer = document.createElement('canvas');
    this.backBuffer.width = this.canvas.width;
    this.backBuffer.height = this.canvas.height;
    this.backCtx = this.backBuffer.getContext('2d');

    // バックバッファの設定
    this.backCtx.imageSmoothingEnabled = false;
  }

  /**
   * レンダリングの開始
   */
  beginRender() {
    if (this.isRendering) return;

    this.isRendering = true;
    this.renderQueue = [];

    // バックバッファのクリア
    if (this.config.enableDoubleBuffering) {
      this.backCtx.clearRect(0, 0, this.backBuffer.width, this.backBuffer.height);
    } else {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  /**
   * 描画コマンドをキューに追加
   *
   * @param {Function} renderFn - 描画関数
   * @param {number} priority - 描画優先度（高いほど先に描画）
   */
  queueRender(renderFn, priority = 0) {
    this.renderQueue.push({ renderFn, priority });
  }

  /**
   * 描画キューを実行
   */
  executeRenderQueue() {
    if (!this.isRendering) return;

    // 優先度でソート
    this.renderQueue.sort((a, b) => b.priority - a.priority);

    // バッチ処理で描画
    const ctx = this.config.enableDoubleBuffering ? this.backCtx : this.ctx;

    for (let i = 0; i < this.renderQueue.length; i += this.config.batchSize) {
      const batch = this.renderQueue.slice(i, i + this.config.batchSize);

      // 描画状態の保存
      ctx.save();

      // バッチ内の描画を実行
      batch.forEach(({ renderFn }) => {
        try {
          renderFn(ctx);
        } catch (error) {
          // console.error('Render error:', error);
        }
      });

      // 描画状態の復元
      ctx.restore();
    }
  }

  /**
   * レンダリングの完了
   */
  endRender() {
    if (!this.isRendering) return;

    // ダブルバッファリングの場合はフロントバッファにコピー
    if (this.config.enableDoubleBuffering) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.drawImage(this.backBuffer, 0, 0);
    }

    this.isRendering = false;
    this.renderQueue = [];

    // フレーム統計の更新
    this.updateFrameStats();
  }

  /**
   * フレーム統計の更新
   */
  updateFrameStats() {
    const now = performance.now();
    this.frameCount++;

    if (this.lastFrameTime > 0) {
      const deltaTime = now - this.lastFrameTime;
      this.fps = 1000 / deltaTime;
    }

    this.lastFrameTime = now;
  }

  /**
   * フレームスキップの判定
   *
   * @returns {boolean} フレームをスキップするかどうか
   */
  shouldSkipFrame() {
    if (!this.config.enableFrameSkip) return false;

    // 最初のフレームはスキップしない
    if (this.lastFrameTime === 0) return false;

    const targetFrameTime = 1000 / this.config.targetFPS;
    const currentFrameTime = performance.now() - this.lastFrameTime;

    if (currentFrameTime < targetFrameTime) {
      this.frameSkipCount++;
      return true;
    }

    return false;
  }

  /**
   * ビューポートの更新
   *
   * @param {number} x - ビューポートのX座標
   * @param {number} y - ビューポートのY座標
   * @param {number} width - ビューポートの幅
   * @param {number} height - ビューポートの高さ
   */
  updateViewport(x, y, width, height) {
    this.viewport = { x, y, width, height };
  }

  /**
   * ビューポート内の描画かどうかを判定
   *
   * @param {number} x - 描画対象のX座標
   * @param {number} y - 描画対象のY座標
   * @param {number} width - 描画対象の幅
   * @param {number} height - 描画対象の高さ
   * @returns {boolean} ビューポート内かどうか
   */
  isInViewport(x, y, width, height) {
    if (!this.config.enableCulling) return true;

    return !(
      x + width < this.viewport.x ||
      x > this.viewport.x + this.viewport.width ||
      y + height < this.viewport.y ||
      y > this.viewport.y + this.viewport.height
    );
  }

  /**
   * 描画の最適化
   *
   * @param {Object} renderData - 描画データ
   */
  optimizeRender(renderData) {
    // ビューポート外の描画をスキップ
    if (!this.isInViewport(renderData.x, renderData.y, renderData.width, renderData.height)) {
      return false;
    }

    // フレームスキップの判定
    if (this.shouldSkipFrame()) {
      return false;
    }

    return true;
  }

  /**
   * パフォーマンス統計の取得
   *
   * @returns {Object} パフォーマンス統計
   */
  getPerformanceStats() {
    return {
      fps: Math.round(this.fps),
      frameCount: this.frameCount,
      frameSkipCount: this.frameSkipCount,
      frameSkipRate: this.frameCount > 0 ? this.frameSkipCount / this.frameCount : 0,
      renderQueueSize: this.renderQueue.length,
      isRendering: this.isRendering,
    };
  }

  /**
   * レンダラーのリセット
   */
  reset() {
    this.frameCount = 0;
    this.lastFrameTime = 0;
    this.fps = 0;
    this.frameSkipCount = 0;
    this.renderQueue = [];
    this.isRendering = false;
  }

  /**
   * 設定の更新
   *
   * @param {Object} newConfig - 新しい設定
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };

    // ダブルバッファリングの設定変更
    if (newConfig.enableDoubleBuffering !== undefined) {
      if (newConfig.enableDoubleBuffering && !this.backBuffer) {
        this.initializeDoubleBuffering();
      } else if (!newConfig.enableDoubleBuffering && this.backBuffer) {
        this.backBuffer = null;
        this.backCtx = null;
      }
    }
  }

  /**
   * メモリ使用量の最適化
   */
  optimizeMemory() {
    // 描画キューをクリア
    this.renderQueue = [];

    // ガベージコレクションの促進
    if (window.gc) {
      window.gc();
    }
  }
}
