/**
 * ComboAnimationController.js - コンボアニメーション制御コンポーネント
 *
 * TDD Green Phase: テストを通すための最小実装
 *
 * 責任:
 * - 複雑なアニメーション制御とシーケンス管理
 * - パーティクル効果とタイムライン同期
 * - パフォーマンス最適化とキューイング
 * - エラーハンドリングと安全性
 *
 * オニオンアーキテクチャ: Presentation Layer
 */

export class ComboAnimationController {
  /**
   * ComboAnimationController インスタンスを作成
   *
   * @param {string|HTMLElement} container - コンテナ要素またはセレクタ
   * @param {Object} config - 設定オプション
   */
  constructor(container, config = {}) {
    // コンテナ要素の取得と検証
    this.container = this._resolveContainer(container);
    if (!this.container) {
      throw new Error('Animation container not found');
    }

    // 設定の初期化
    this.config = {
      enableParticles: true,
      maxConcurrentAnimations: 5,
      defaultDuration: 600,
      enableTimeline: true,
      performanceMode: 'auto',
      frameRateThreshold: 30,
      memoryLimit: 50, // MB
      ...this._validateConfig(config),
    };

    // 内部状態
    this.isInitialized = false;
    this.isDestroyed = false;
    this.activeAnimations = new Map();
    this.animationQueue = [];
    this.animationIdCounter = 0;

    // パフォーマンス監視
    this.performance = {
      monitoring: false,
      frameRate: 60,
      memoryUsage: 0,
      lastFrameTime: 0,
    };

    // タイムライン
    this.timeline = {
      isRunning: false,
      startTime: null,
      currentTime: 0,
    };

    // UI要素の作成と初期化
    this._createElements();
    this._setupEventListeners();
    this._initializeAnimationSystem();

    this.isInitialized = true;
  }

  /**
   * アニメーションを開始
   *
   * @param {Object} animationData - アニメーションデータ
   * @returns {Promise<string>} アニメーションID
   */
  async startAnimation(animationData) {
    if (this.isDestroyed) {
      throw new Error('Animation controller is destroyed');
    }

    try {
      this._validateAnimationData(animationData);
      const animationId = this._generateAnimationId();
      const animation = await this._createAnimation(animationId, animationData);

      // 最大同時アニメーション数の制限
      this._enforceAnimationLimit();

      // アニメーションを開始
      this.activeAnimations.set(animationId, animation);
      await this._executeAnimation(animation);

      return animationId;
    } catch (error) {
      throw new Error(`Failed to start animation: ${error.message}`);
    }
  }

  /**
   * アニメーションを停止
   *
   * @param {string} animationId - アニメーションID
   */
  stopAnimation(animationId) {
    if (this.isDestroyed) {
      return;
    }

    try {
      const animation = this.activeAnimations.get(animationId);
      if (animation) {
        this._stopAnimation(animation);
        this.activeAnimations.delete(animationId);
      }
    } catch (error) {
      // Fail silently in production
    }
  }

  /**
   * 全てのアニメーションを停止
   */
  stopAllAnimations() {
    if (this.isDestroyed) {
      return;
    }

    try {
      for (const [animationId] of this.activeAnimations) {
        this.stopAnimation(animationId);
      }
      this.activeAnimations.clear();
    } catch (error) {
      // Fail silently in production
    }
  }

  /**
   * アニメーションが再生中かチェック
   *
   * @param {string} animationId - アニメーションID
   * @returns {boolean} 再生中かどうか
   */
  isPlaying(animationId) {
    return this.activeAnimations.has(animationId);
  }

  /**
   * アニメーション情報を取得
   *
   * @param {string} animationId - アニメーションID
   * @returns {Object|null} アニメーション情報
   */
  getAnimation(animationId) {
    return this.activeAnimations.get(animationId) || null;
  }

  /**
   * アニメーションをキューに追加
   *
   * @param {Object} animationData - アニメーションデータ
   */
  queueAnimation(animationData) {
    if (this.isDestroyed) {
      return;
    }

    try {
      this.animationQueue.push({
        ...animationData,
        queuedAt: performance.now(),
      });
    } catch (error) {
      // Fail silently in production
    }
  }

  /**
   * キューのアニメーションを処理
   */
  processQueue() {
    if (this.isDestroyed || this.animationQueue.length === 0) {
      return;
    }

    try {
      const animations = [...this.animationQueue];
      this.animationQueue = [];

      animations.forEach((animData, index) => {
        const delay = animData.delay || index * 50;
        setTimeout(async () => {
          try {
            await this.startAnimation(animData);
          } catch (error) {
            // Fail silently in production
          }
        }, delay);
      });
    } catch (error) {
      // Fail silently in production
    }
  }

  /**
   * アニメーションキューをクリア
   */
  clearQueue() {
    this.animationQueue = [];
  }

  /**
   * タイムラインを開始
   */
  startTimeline() {
    if (this.isDestroyed || !this.config.enableTimeline) {
      return;
    }

    try {
      this.timeline.isRunning = true;
      this.timeline.startTime = performance.now();
      this.timeline.currentTime = 0;
    } catch (error) {
      // Fail silently in production
    }
  }

  /**
   * タイムラインを停止
   */
  stopTimeline() {
    if (this.isDestroyed) {
      return;
    }

    try {
      this.timeline.isRunning = false;
      this.timeline.startTime = null;
      this.timeline.currentTime = 0;
    } catch (error) {
      // Fail silently in production
    }
  }

  /**
   * パフォーマンス監視を開始
   */
  startPerformanceMonitoring() {
    if (this.isDestroyed) {
      return;
    }

    try {
      this.performance.monitoring = true;
      this.performance.frameRate = 60; // デフォルト値
      this._monitorPerformance();
    } catch (error) {
      // Fail silently in production
    }
  }

  /**
   * コンポーネントを破棄
   */
  destroy() {
    if (this.isDestroyed) {
      return;
    }

    try {
      this.stopAllAnimations();
      this.clearQueue();
      this.stopTimeline();
      this._removeEventListeners();
      this._removeElements();
      this.isDestroyed = true;
    } catch (error) {
      // Fail silently in production
    }
  }

  /**
   * コンテナ要素を解決
   *
   * @private
   * @param {string|HTMLElement} container - コンテナ
   * @returns {HTMLElement} 解決されたコンテナ要素
   */
  _resolveContainer(container) {
    if (!container) return null;

    if (typeof container === 'string') {
      if (container.startsWith('#')) {
        return document.getElementById(container.slice(1));
      } else {
        const parentContainer = document.getElementById('game-container');
        return parentContainer ? parentContainer.querySelector(container) : null;
      }
    }

    return container.nodeType === 1 ? container : null; // 1 = ELEMENT_NODE
  }

  /**
   * 設定を検証
   *
   * @private
   * @param {Object} config - 設定オブジェクト
   * @returns {Object} 検証済み設定
   */
  _validateConfig(config) {
    const validated = { ...config };

    if (validated.maxConcurrentAnimations <= 0) {
      validated.maxConcurrentAnimations = 5;
    }

    if (validated.defaultDuration <= 0) {
      validated.defaultDuration = 600;
    }

    if (validated.frameRateThreshold <= 0) {
      validated.frameRateThreshold = 30;
    }

    return validated;
  }

  /**
   * UI要素を作成
   *
   * @private
   */
  _createElements() {
    // アニメーション要素の作成
    this.elements = {
      animationLayer: document.createElement('div'),
      particleLayer: document.createElement('div'),
      textLayer: document.createElement('div'),
    };

    // 基本構造の設定
    this.elements.animationLayer.className = 'combo-animation-layer';
    this.elements.particleLayer.className = 'combo-particle-layer';
    this.elements.textLayer.className = 'combo-text-layer';

    // DOM構造の構築
    this.elements.animationLayer.appendChild(this.elements.particleLayer);
    this.elements.animationLayer.appendChild(this.elements.textLayer);

    // コンテナに追加
    this.container.appendChild(this.elements.animationLayer);
  }

  /**
   * イベントリスナーを設定
   *
   * @private
   */
  _setupEventListeners() {
    // パフォーマンス監視用
    this._performanceHandler = this._updatePerformance.bind(this);
  }

  /**
   * アニメーションシステムを初期化
   *
   * @private
   */
  _initializeAnimationSystem() {
    // WebGL対応チェック、パフォーマンス設定など
    this._checkWebGLSupport();
    this._setupAnimationFramework();
  }

  /**
   * アニメーションデータを検証
   *
   * @private
   * @param {*} data - 検証するデータ
   */
  _validateAnimationData(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid animation data');
    }

    if (!data.type) {
      throw new Error('Animation type is required');
    }

    const validTypes = ['combo-start', 'combo-continue', 'combo-mega', 'combo-break'];
    if (!validTypes.includes(data.type)) {
      throw new Error(`Unknown animation type: ${data.type}`);
    }

    if (typeof data.comboLevel !== 'number' || data.comboLevel < 0) {
      throw new Error('Invalid combo level');
    }

    if (data.duration && (typeof data.duration !== 'number' || data.duration <= 0)) {
      throw new Error('Invalid duration');
    }
  }

  /**
   * アニメーションIDを生成
   *
   * @private
   * @returns {string} 一意のアニメーションID
   */
  _generateAnimationId() {
    return `anim_${Date.now()}_${++this.animationIdCounter}`;
  }

  /**
   * アニメーションを作成
   *
   * @private
   * @param {string} animationId - アニメーションID
   * @param {Object} animationData - アニメーションデータ
   * @returns {Promise<Object>} アニメーションオブジェクト
   */
  async _createAnimation(animationId, animationData) {
    const animation = {
      id: animationId,
      type: animationData.type,
      data: { ...animationData },
      element: null,
      particles: [],
      timeline: {
        synchronize: this.config.enableTimeline && animationData.timeline?.synchronize !== false,
        delay: animationData.timeline?.delay || 0,
      },
      startTime: performance.now(),
      duration: animationData.duration || this.config.defaultDuration,
      optimized: false,
    };

    // パフォーマンス最適化
    if (this._shouldOptimizeAnimation()) {
      animation.optimized = true;
      animation.data = this._optimizeAnimationData(animation.data);
    }

    // アニメーション要素の作成
    animation.element = this._createAnimationElement(animation);

    // パーティクル効果の作成
    if (this.config.enableParticles && animationData.particles) {
      animation.particles = this._createParticles(animationData.particles);
    }

    return animation;
  }

  /**
   * アニメーションの実行
   *
   * @private
   * @param {Object} animation - アニメーションオブジェクト
   */
  async _executeAnimation(animation) {
    try {
      // タイムライン同期
      if (animation.timeline.synchronize && this.timeline.isRunning) {
        await this._waitForTimelineSync(animation.timeline.delay);
      }

      // アニメーション開始
      this._startAnimationElement(animation);

      // パーティクル開始
      if (animation.particles.length > 0) {
        this._startParticles(animation.particles);
      }
    } catch (error) {
      throw new Error(`Animation execution failed: ${error.message}`);
    }
  }

  /**
   * アニメーションを停止
   *
   * @private
   * @param {Object} animation - アニメーションオブジェクト
   */
  _stopAnimation(animation) {
    try {
      if (animation.element && animation.element.parentNode) {
        animation.element.parentNode.removeChild(animation.element);
      }

      if (animation.particles) {
        animation.particles.forEach(particle => {
          if (particle.element && particle.element.parentNode) {
            particle.element.parentNode.removeChild(particle.element);
          }
        });
      }

      if (animation.animationFrameId) {
        window.cancelAnimationFrame(animation.animationFrameId);
      }
    } catch (error) {
      // Fail silently in production
    }
  }

  /**
   * 最大同時アニメーション数の制限を適用
   *
   * @private
   */
  _enforceAnimationLimit() {
    const limit = this.config.maxConcurrentAnimations;
    if (this.activeAnimations.size >= limit) {
      // 最古のアニメーションを停止
      const oldestId = this.activeAnimations.keys().next().value;
      this.stopAnimation(oldestId);
    }
  }

  /**
   * アニメーション要素を作成
   *
   * @private
   * @param {Object} animation - アニメーションオブジェクト
   * @returns {HTMLElement} アニメーション要素
   */
  _createAnimationElement(animation) {
    const element = document.createElement('div');
    element.className = `combo-animation combo-animation-${animation.type}`;

    if (animation.data.text) {
      element.textContent = animation.data.text;
    }

    this.elements.textLayer.appendChild(element);
    return element;
  }

  /**
   * パーティクルを作成
   *
   * @private
   * @param {Object} particleConfig - パーティクル設定
   * @returns {Array} パーティクル配列
   */
  _createParticles(particleConfig) {
    const particles = [];
    const count = particleConfig.count || 10;

    for (let i = 0; i < count; i++) {
      const particle = {
        element: document.createElement('div'),
        config: { ...particleConfig },
      };

      particle.element.className = 'combo-particle';
      this.elements.particleLayer.appendChild(particle.element);
      particles.push(particle);
    }

    return particles;
  }

  /**
   * アニメーション要素を開始
   *
   * @private
   * @param {Object} animation - アニメーションオブジェクト
   */
  _startAnimationElement(animation) {
    try {
      // CSS アニメーションまたは JS アニメーションを開始
      animation.element.classList.add('combo-animation-active');

      // アニメーション完了時の処理
      setTimeout(() => {
        if (this.activeAnimations.has(animation.id)) {
          this.stopAnimation(animation.id);
        }
      }, animation.duration);
    } catch (error) {
      throw new Error(`Failed to start animation element: ${error.message}`);
    }
  }

  /**
   * パーティクルを開始
   *
   * @private
   * @param {Array} particles - パーティクル配列
   */
  _startParticles(particles) {
    particles.forEach(particle => {
      particle.element.classList.add('combo-particle-active');
    });
  }

  /**
   * パフォーマンス最適化が必要かチェック
   *
   * @private
   * @returns {boolean} 最適化が必要かどうか
   */
  _shouldOptimizeAnimation() {
    return (
      this.performance.monitoring && this.performance.frameRate < this.config.frameRateThreshold
    );
  }

  /**
   * アニメーションデータを最適化
   *
   * @private
   * @param {Object} data - アニメーションデータ
   * @returns {Object} 最適化されたデータ
   */
  _optimizeAnimationData(data) {
    const optimized = { ...data };

    // パーティクル数を削減
    if (optimized.particles) {
      optimized.particles = {
        ...optimized.particles,
        count: Math.min(optimized.particles.count || 10, 5),
      };
    }

    // 複雑なエフェクトを無効化
    if (optimized.effects) {
      optimized.effects = optimized.effects.slice(0, 2);
    }

    return optimized;
  }

  /**
   * タイムライン同期を待つ
   *
   * @private
   * @param {number} delay - 遅延時間
   */
  async _waitForTimelineSync(delay) {
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  /**
   * パフォーマンスを監視
   *
   * @private
   */
  _monitorPerformance() {
    if (!this.performance.monitoring) {
      return;
    }

    const now = performance.now();
    if (this.performance.lastFrameTime > 0) {
      const frameDuration = now - this.performance.lastFrameTime;
      this.performance.frameRate = Math.round(1000 / frameDuration);
    }
    this.performance.lastFrameTime = now;

    // 次のフレームで再帰実行
    window.requestAnimationFrame(() => this._monitorPerformance());
  }

  /**
   * パフォーマンス情報を更新
   *
   * @private
   */
  _updatePerformance() {
    // パフォーマンス更新処理
  }

  /**
   * WebGL対応をチェック
   *
   * @private
   */
  _checkWebGLSupport() {
    // WebGL対応チェック処理
  }

  /**
   * アニメーションフレームワークをセットアップ
   *
   * @private
   */
  _setupAnimationFramework() {
    // アニメーションフレームワーク設定処理
  }

  /**
   * イベントリスナーを削除
   *
   * @private
   */
  _removeEventListeners() {
    // イベントリスナー削除処理
  }

  /**
   * UI要素を削除
   *
   * @private
   */
  _removeElements() {
    if (this.elements && this.elements.animationLayer && this.container) {
      this.container.removeChild(this.elements.animationLayer);
    }
    this.elements = null;
  }
}
