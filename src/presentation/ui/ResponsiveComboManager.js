/**
 * ResponsiveComboManager.js - レスポンシブコンボ管理コンポーネント
 *
 * TDD Green Phase: テストを通すための実装
 *
 * 責任:
 * - レスポンシブデザイン統合管理
 * - ブレークポイント検出と適応
 * - デバイス方向とタッチ最適化
 * - パフォーマンス適応型調整
 * - コンポーネント統合制御
 *
 * オニオンアーキテクチャ: Presentation Layer
 */

export class ResponsiveComboManager {
  /**
   * ResponsiveComboManager インスタンスを作成
   *
   * @param {string|HTMLElement} container - コンテナ要素またはセレクタ
   * @param {Object} config - 設定オプション
   */
  constructor(container, config = {}) {
    // コンテナ要素の取得と検証
    this.container = this._resolveContainer(container);
    if (!this.container) {
      throw new Error('Responsive container not found');
    }

    // 設定の初期化
    this.config = {
      breakpoints: {
        mobile: 768,
        tablet: 1024,
        desktop: 1200,
      },
      enableOrientationDetection: true,
      adaptiveScaling: true,
      touchOptimization: true,
      performanceOptimization: true,
      ...this._validateConfig(config),
    };

    // 内部状態
    this.isInitialized = false;
    this.isDestroyed = false;
    this.isOptimized = false;

    // レスポンシブ状態
    this.currentBreakpoint = 'desktop';
    this.currentOrientation = 'portrait';
    this.devicePerformance = 'medium';

    // 統合コンポーネント
    this.comboDisplayUI = null;
    this.animationController = null;

    // イベントハンドラー
    this._resizeHandler = null;
    this._orientationHandler = null;
    this._mediaQueryHandlers = new Map();

    // コールバック
    this._breakpointChangeCallbacks = [];
    this._orientationChangeCallbacks = [];
    this._resizeCallbacks = [];

    // 初期化
    this._initialize();
    this.isInitialized = true;
  }

  /**
   * ブレークポイントを更新
   */
  updateBreakpoint() {
    if (this.isDestroyed) return;

    try {
      const previousBreakpoint = this.currentBreakpoint;
      const width = window.innerWidth;

      if (width < this.config.breakpoints.mobile) {
        this.currentBreakpoint = 'mobile';
      } else if (width < this.config.breakpoints.desktop) {
        this.currentBreakpoint = 'tablet';
      } else {
        this.currentBreakpoint = 'desktop';
      }

      if (previousBreakpoint !== this.currentBreakpoint) {
        this._fireBreakpointChange(this.currentBreakpoint, previousBreakpoint);
      }
    } catch (error) {
      // Fail silently in production
    }
  }

  /**
   * デバイス方向を更新
   */
  updateOrientation() {
    if (this.isDestroyed || !this.config.enableOrientationDetection) return;

    try {
      const previousOrientation = this.currentOrientation;
      const width = window.innerWidth;
      const height = window.innerHeight;

      this.currentOrientation = width > height ? 'landscape' : 'portrait';

      if (previousOrientation !== this.currentOrientation) {
        this._fireOrientationChange(this.currentOrientation, previousOrientation);
      }
    } catch (error) {
      // Fail silently in production
    }
  }

  /**
   * 全ての状態を更新
   */
  updateAll() {
    if (this.isDestroyed) return;

    try {
      this.updateBreakpoint();
      this.updateOrientation();
      this._updateIntegratedComponents();
    } catch (error) {
      // Fail silently in production
    }
  }

  /**
   * モバイルデバイスかどうか
   * @returns {boolean}
   */
  isMobile() {
    return this.currentBreakpoint === 'mobile';
  }

  /**
   * タブレットデバイスかどうか
   * @returns {boolean}
   */
  isTablet() {
    return this.currentBreakpoint === 'tablet';
  }

  /**
   * デスクトップデバイスかどうか
   * @returns {boolean}
   */
  isDesktop() {
    return this.currentBreakpoint === 'desktop';
  }

  /**
   * 縦向きかどうか
   * @returns {boolean}
   */
  isPortrait() {
    return this.currentOrientation === 'portrait';
  }

  /**
   * 横向きかどうか
   * @returns {boolean}
   */
  isLandscape() {
    return this.currentOrientation === 'landscape';
  }

  /**
   * タッチデバイスかどうか
   * @returns {boolean}
   */
  isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  /**
   * スケールファクターを計算
   * @returns {number}
   */
  calculateScaleFactor() {
    if (!this.config.adaptiveScaling) return 1.0;

    const baseWidth = 1920;
    const baseHeight = 1080;
    const currentWidth = window.innerWidth;
    const currentHeight = window.innerHeight;

    const widthScale = currentWidth / baseWidth;
    const heightScale = currentHeight / baseHeight;

    return Math.min(widthScale, heightScale);
  }

  /**
   * 適応型スケールを取得
   * @returns {number}
   */
  getAdaptiveScale() {
    if (!this.config.adaptiveScaling) return 1.0;

    switch (this.currentBreakpoint) {
      case 'mobile':
        return Math.max(this.calculateScaleFactor(), 0.6);
      case 'tablet':
        return Math.max(this.calculateScaleFactor(), 0.8);
      case 'desktop':
      default:
        return 1.0;
    }
  }

  /**
   * カスタム解像度でスケールを計算
   * @param {number} width - 幅
   * @param {number} height - 高さ
   * @returns {number}
   */
  calculateScaleForResolution(width, height) {
    const baseWidth = 1920;
    const baseHeight = 1080;

    const widthScale = width / baseWidth;
    const heightScale = height / baseHeight;

    return Math.min(widthScale, heightScale);
  }

  /**
   * タッチターゲットサイズを取得
   * @returns {number}
   */
  getTouchTargetSize() {
    if (!this.config.touchOptimization || !this.isTouchDevice()) {
      return 32; // デフォルトサイズ
    }

    // iOS推奨サイズ: 44px, Android推奨サイズ: 48px
    return Math.max(44, 32 * this.getAdaptiveScale());
  }

  /**
   * タッチエリアを最適化
   * @param {HTMLElement} element - 最適化する要素
   */
  optimizeTouchArea(element) {
    if (!this.config.touchOptimization || !this.isTouchDevice()) return;

    try {
      const targetSize = this.getTouchTargetSize();
      element.style.minWidth = `${targetSize}px`;
      element.style.minHeight = `${targetSize}px`;
    } catch (error) {
      // Fail silently in production
    }
  }

  /**
   * ComboDisplayUIを統合
   * @param {Object} comboDisplayUI - ComboDisplayUIインスタンス
   */
  integrateComboDisplayUI(comboDisplayUI) {
    this.comboDisplayUI = comboDisplayUI;
  }

  /**
   * ComboAnimationControllerを統合
   * @param {Object} animationController - ComboAnimationControllerインスタンス
   */
  integrateAnimationController(animationController) {
    this.animationController = animationController;
  }

  /**
   * モバイルレイアウトを適用
   */
  applyMobileLayout() {
    try {
      this._removeLayoutClasses();
      this.container.classList.add('combo-mobile-layout');
    } catch (error) {
      // Fail silently in production
    }
  }

  /**
   * タブレットレイアウトを適用
   */
  applyTabletLayout() {
    try {
      this._removeLayoutClasses();
      this.container.classList.add('combo-tablet-layout');
    } catch (error) {
      // Fail silently in production
    }
  }

  /**
   * デスクトップレイアウトを適用
   */
  applyDesktopLayout() {
    try {
      this._removeLayoutClasses();
      this.container.classList.add('combo-desktop-layout');
    } catch (error) {
      // Fail silently in production
    }
  }

  /**
   * デバイス性能を評価
   * @returns {string} - 'high', 'medium', 'low'
   */
  evaluateDevicePerformance() {
    try {
      // 簡易的な性能評価（実際の実装ではより詳細な評価を行う）
      const cores = navigator.hardwareConcurrency || 2;
      const memory = navigator.deviceMemory || 2; // GB

      if (cores >= 4 && memory >= 4) {
        return 'high';
      } else if (cores >= 2 && memory >= 2) {
        return 'medium';
      } else {
        return 'low';
      }
    } catch (error) {
      return 'medium';
    }
  }

  /**
   * 最適化された設定を取得
   * @returns {Object}
   */
  getOptimizedSettings() {
    const performance = this.devicePerformance || this.evaluateDevicePerformance();

    switch (performance) {
      case 'low':
        return {
          enableParticles: false,
          maxAnimations: 2,
          reducedMotion: true,
          lowQualityEffects: true,
        };
      case 'medium':
        return {
          enableParticles: true,
          maxAnimations: 3,
          reducedMotion: false,
          lowQualityEffects: false,
        };
      case 'high':
      default:
        return {
          enableParticles: true,
          maxAnimations: 5,
          reducedMotion: false,
          lowQualityEffects: false,
        };
    }
  }

  /**
   * パフォーマンス最適化を適用
   * @param {Object} _settings - 最適化設定（未使用パラメータ）
   */
  applyPerformanceOptimizations(_settings) {
    try {
      this.isOptimized = true;
      // 実際の最適化処理をここに実装
    } catch (error) {
      // Fail silently in production
    }
  }

  /**
   * カスタムメディアクエリを登録
   * @param {string} query - メディアクエリ
   * @param {Function} callback - コールバック関数
   */
  registerMediaQuery(query, callback) {
    try {
      const mediaQuery = window.matchMedia(query);
      this._mediaQueryHandlers.set(query, callback);
      mediaQuery.addEventListener('change', callback);
    } catch (error) {
      // Fail silently in production
    }
  }

  /**
   * prefers-reduced-motionの設定を取得
   * @returns {boolean}
   */
  prefersReducedMotion() {
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (error) {
      return false;
    }
  }

  /**
   * 優先カラースキームを取得
   * @returns {string} - 'light' または 'dark'
   */
  getPreferredColorScheme() {
    try {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
      return 'light';
    } catch (error) {
      return 'light';
    }
  }

  /**
   * ブレークポイント変更コールバックを登録
   * @param {Function} callback - コールバック関数
   */
  onBreakpointChange(callback) {
    if (typeof callback === 'function') {
      this._breakpointChangeCallbacks.push(callback);
    }
  }

  /**
   * 方向変更コールバックを登録
   * @param {Function} callback - コールバック関数
   */
  onOrientationChange(callback) {
    if (typeof callback === 'function') {
      this._orientationChangeCallbacks.push(callback);
    }
  }

  /**
   * リサイズコールバックを登録
   * @param {Function} callback - コールバック関数
   */
  onResize(callback) {
    if (typeof callback === 'function') {
      this._resizeCallbacks.push(callback);
    }
  }

  /**
   * コンポーネントを破棄
   */
  destroy() {
    if (this.isDestroyed) return;

    try {
      this._removeEventListeners();
      this._cleanupMediaQueries();
      this.isDestroyed = true;
    } catch (error) {
      // Fail silently in production
    }
  }

  /**
   * コンテナ要素を解決
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

    return container.nodeType === 1 ? container : null;
  }

  /**
   * 設定を検証
   * @private
   * @param {Object} config - 設定オブジェクト
   * @returns {Object} 検証済み設定
   */
  _validateConfig(config) {
    const validated = { ...config };

    if (!validated.breakpoints || typeof validated.breakpoints !== 'object') {
      validated.breakpoints = {
        mobile: 768,
        tablet: 1024,
        desktop: 1200,
      };
    }

    if (typeof validated.adaptiveScaling !== 'boolean') {
      validated.adaptiveScaling = true;
    }

    return validated;
  }

  /**
   * 初期化処理
   * @private
   */
  _initialize() {
    this._setupEventListeners();
    this._setupMediaQueries();
    this.updateAll();
    this.devicePerformance = this.evaluateDevicePerformance();
  }

  /**
   * イベントリスナーを設定
   * @private
   */
  _setupEventListeners() {
    this._resizeHandler = this._handleResize.bind(this);
    this._orientationHandler = this._handleOrientationChange.bind(this);

    window.addEventListener('resize', this._resizeHandler);
    window.addEventListener('orientationchange', this._orientationHandler);
  }

  /**
   * メディアクエリを設定
   * @private
   */
  _setupMediaQueries() {
    // 基本的なメディアクエリを設定
    this.registerMediaQuery('(prefers-reduced-motion: reduce)', () => {
      // モーション削減設定変更時の処理
    });

    this.registerMediaQuery('(prefers-color-scheme: dark)', () => {
      // カラースキーム変更時の処理
    });
  }

  /**
   * リサイズイベントを処理
   * @private
   */
  _handleResize() {
    this.updateAll();
    this._fireResizeCallbacks();
  }

  /**
   * 方向変更イベントを処理
   * @private
   */
  _handleOrientationChange() {
    // 方向変更後に少し待ってから更新（iOS対応）
    setTimeout(() => {
      this.updateOrientation();
    }, 100);
  }

  /**
   * 統合コンポーネントを更新
   * @private
   */
  _updateIntegratedComponents() {
    if (this.comboDisplayUI && typeof this.comboDisplayUI.handleResize === 'function') {
      this.comboDisplayUI.handleResize();
    }

    if (
      this.animationController &&
      typeof this.animationController.optimizeForDevice === 'function'
    ) {
      this.animationController.optimizeForDevice(this.currentBreakpoint);
    }
  }

  /**
   * ブレークポイント変更イベントを発火
   * @private
   * @param {string} newBreakpoint - 新しいブレークポイント
   * @param {string} oldBreakpoint - 古いブレークポイント
   */
  _fireBreakpointChange(newBreakpoint, oldBreakpoint) {
    this._breakpointChangeCallbacks.forEach(callback => {
      try {
        callback(newBreakpoint, oldBreakpoint);
      } catch (error) {
        // Fail silently in production
      }
    });
  }

  /**
   * 方向変更イベントを発火
   * @private
   * @param {string} newOrientation - 新しい方向
   * @param {string} oldOrientation - 古い方向
   */
  _fireOrientationChange(newOrientation, oldOrientation) {
    this._orientationChangeCallbacks.forEach(callback => {
      try {
        callback(newOrientation, oldOrientation);
      } catch (error) {
        // Fail silently in production
      }
    });
  }

  /**
   * リサイズコールバックを発火
   * @private
   */
  _fireResizeCallbacks() {
    this._resizeCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        // Fail silently in production
      }
    });
  }

  /**
   * レイアウトクラスを削除
   * @private
   */
  _removeLayoutClasses() {
    const layoutClasses = ['combo-mobile-layout', 'combo-tablet-layout', 'combo-desktop-layout'];
    layoutClasses.forEach(className => {
      this.container.classList.remove(className);
    });
  }

  /**
   * イベントリスナーを削除
   * @private
   */
  _removeEventListeners() {
    if (this._resizeHandler) {
      window.removeEventListener('resize', this._resizeHandler);
      this._resizeHandler = null;
    }

    if (this._orientationHandler) {
      window.removeEventListener('orientationchange', this._orientationHandler);
      this._orientationHandler = null;
    }
  }

  /**
   * メディアクエリをクリーンアップ
   * @private
   */
  _cleanupMediaQueries() {
    this._mediaQueryHandlers.clear();
  }
}
