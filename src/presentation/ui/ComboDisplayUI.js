/**
 * ComboDisplayUI.js - コンボ表示UIコンポーネント
 *
 * TDD Green Phase: テストを通すための最小実装
 *
 * 責任:
 * - コンボ情報のリアルタイム表示
 * - レスポンシブ対応とアクセシビリティ
 * - アニメーション制御
 * - テーマ対応
 *
 * オニオンアーキテクチャ: Presentation Layer
 */

export class ComboDisplayUI {
  /**
   * ComboDisplayUI インスタンスを作成
   *
   * @param {string|HTMLElement} container - コンテナ要素またはセレクタ
   * @param {Object} config - 設定オプション
   */
  constructor(container, config = {}) {
    // コンテナ要素の取得と検証
    this.container = this._resolveContainer(container);
    if (!this.container) {
      throw new Error('Container element not found');
    }

    // 設定の初期化
    this.config = {
      theme: 'light',
      animationDuration: 600,
      showMultiplier: true,
      position: 'top-right',
      highContrast: false,
      reduceMotion: false,
      updateThrottle: 16, // 60fps
      ...this._validateConfig(config),
    };

    // 内部状態
    this.isVisible = false;
    this.isDestroyed = false;
    this.currentAnimation = null;
    this._lastUpdateData = null;
    this._lastUpdateTime = 0;
    this._animationFrameId = null;

    // UI要素の作成と初期化
    this._createElements();
    this._setupEventListeners();
    this._applyInitialStyles();
  }

  /**
   * コンボ表示を更新
   *
   * @param {Object} comboData - コンボデータ
   */
  updateDisplay(comboData) {
    if (this.isDestroyed || !this._validateComboData(comboData)) {
      return;
    }

    // スロットル制御
    const now = performance.now();
    if (now - this._lastUpdateTime < this.config.updateThrottle) {
      return;
    }
    this._lastUpdateTime = now;

    // 同一データの重複更新を防ぐ
    if (this._isSameData(comboData, this._lastUpdateData)) {
      return;
    }
    this._lastUpdateData = { ...comboData };

    try {
      this._performUpdate(comboData);
    } catch (error) {
      // Fail silently in production
    }
  }

  /**
   * コンボアニメーションを表示
   *
   * @param {Object} animationData - アニメーションデータ
   */
  showComboAnimation(animationData) {
    if (this.isDestroyed || !animationData) {
      return;
    }

    try {
      this._clearCurrentAnimation();
      this._startAnimation(animationData);
    } catch (error) {
      // Fail silently in production
    }
  }

  /**
   * コンボ表示を非表示
   *
   * @param {Object} hideData - 非表示データ
   */
  hideComboDisplay(hideData = {}) {
    if (this.isDestroyed) {
      return;
    }

    try {
      const fadeOutDuration = hideData.fadeOutDuration || 1000;
      this._startFadeOut(fadeOutDuration);
    } catch (error) {
      // Fail silently in production
    }
  }

  /**
   * 画面サイズ変更への対応
   */
  handleResize() {
    if (this.isDestroyed) {
      return;
    }

    try {
      this._updateResponsiveLayout();
    } catch (error) {
      // Fail silently in production
    }
  }

  /**
   * テーマを設定
   *
   * @param {string} theme - テーマ名
   */
  setTheme(theme) {
    if (this.isDestroyed || !theme) {
      return;
    }

    try {
      this._removeThemeClasses();
      this.config.theme = theme;
      this.elements.comboDisplay.classList.add(`combo-theme-${theme}`);
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
      this._removeEventListeners();
      this._clearCurrentAnimation();
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

    if (validated.animationDuration <= 0) {
      validated.animationDuration = 600;
    }

    const validPositions = [
      'top-left',
      'top-center',
      'top-right',
      'bottom-left',
      'bottom-center',
      'bottom-right',
      'auto',
    ];
    if (!validPositions.includes(validated.position)) {
      validated.position = 'top-right';
    }

    if (validated.theme === null || validated.theme === undefined) {
      validated.theme = 'light';
    }

    return validated;
  }

  /**
   * UI要素を作成
   *
   * @private
   */
  _createElements() {
    // メインコンテナ
    this.elements = {
      comboDisplay: document.createElement('div'),
      comboLevel: document.createElement('span'),
      comboBonus: document.createElement('span'),
      comboMultiplier: document.createElement('span'),
      comboProgress: document.createElement('div'),
    };

    // 基本構造の設定
    this.elements.comboDisplay.className = 'combo-display';
    this.elements.comboLevel.className = 'combo-level';
    this.elements.comboBonus.className = 'combo-bonus';
    this.elements.comboMultiplier.className = 'combo-multiplier';
    this.elements.comboProgress.className = 'combo-progress';

    // DOM構造の構築
    this.elements.comboDisplay.appendChild(this.elements.comboLevel);
    this.elements.comboDisplay.appendChild(this.elements.comboBonus);
    if (this.config.showMultiplier) {
      this.elements.comboDisplay.appendChild(this.elements.comboMultiplier);
    }
    this.elements.comboDisplay.appendChild(this.elements.comboProgress);

    // コンテナに追加
    this.container.appendChild(this.elements.comboDisplay);
  }

  /**
   * イベントリスナーを設定
   *
   * @private
   */
  _setupEventListeners() {
    this._resizeHandler = this.handleResize.bind(this);
    window.addEventListener('resize', this._resizeHandler);
  }

  /**
   * 初期スタイルを適用
   *
   * @private
   */
  _applyInitialStyles() {
    // アクセシビリティ属性
    this.elements.comboDisplay.setAttribute('role', 'status');
    this.elements.comboDisplay.setAttribute('aria-live', 'polite');

    // テーマ適用
    this.elements.comboDisplay.classList.add(`combo-theme-${this.config.theme}`);

    // ハイコントラスト対応
    if (this.config.highContrast) {
      this.elements.comboDisplay.classList.add('combo-high-contrast');
    }

    // レスポンシブ対応
    this._updateResponsiveLayout();

    // 初期状態は非表示
    this.elements.comboDisplay.style.display = 'none';
  }

  /**
   * コンボデータを検証
   *
   * @private
   * @param {*} data - 検証するデータ
   * @returns {boolean} 有効かどうか
   */
  _validateComboData(data) {
    return (
      data &&
      typeof data === 'object' &&
      typeof data.comboLevel === 'number' &&
      data.comboLevel >= 0
    );
  }

  /**
   * データが同一かチェック
   *
   * @private
   * @param {Object} data1 - データ1
   * @param {Object} data2 - データ2
   * @returns {boolean} 同一かどうか
   */
  _isSameData(data1, data2) {
    if (!data1 || !data2) return false;

    return (
      data1.comboLevel === data2.comboLevel &&
      data1.bonus === data2.bonus &&
      data1.multiplier === data2.multiplier &&
      data1.isActive === data2.isActive &&
      data1.progress === data2.progress
    );
  }

  /**
   * 表示更新を実行
   *
   * @private
   * @param {Object} comboData - コンボデータ
   */
  _performUpdate(comboData) {
    // コンテナの存在チェック
    if (!this.container.parentNode) {
      this.isDestroyed = true;
      return;
    }

    const { comboLevel, bonus, multiplier, isActive, progress } = comboData;

    // 表示状態の更新
    if (comboLevel === 0 || !isActive) {
      this.isVisible = false;
      this.elements.comboDisplay.style.display = 'none';
      return;
    }

    // 表示開始
    if (!this.isVisible) {
      this.isVisible = true;
      this.elements.comboDisplay.style.display = 'block';
      this._clearFadeOut();
    }

    // コンテンツ更新
    this.elements.comboLevel.textContent = comboLevel.toString();
    this.elements.comboBonus.textContent = `+${bonus || 0}`;

    if (this.config.showMultiplier) {
      this.elements.comboMultiplier.textContent = `${multiplier || 1.0}x`;
    } else {
      this.elements.comboMultiplier.style.display = 'none';
    }

    // プログレスバー更新
    if (typeof progress === 'number') {
      this.elements.comboProgress.style.width = `${Math.min(progress * 100, 100)}%`;
    }

    // スタイルクラス更新
    this._updateStyleClasses(comboLevel);

    // アクセシビリティ更新
    this._updateAriaLabel(comboData);
  }

  /**
   * スタイルクラスを更新
   *
   * @private
   * @param {number} comboLevel - コンボレベル
   */
  _updateStyleClasses(comboLevel) {
    // 既存のコンボクラスを削除
    this.elements.comboDisplay.classList.remove('combo-high', 'combo-mega');

    if (comboLevel >= 20) {
      this.elements.comboDisplay.classList.add('combo-mega');
    } else if (comboLevel >= 10) {
      this.elements.comboDisplay.classList.add('combo-high');
    }
  }

  /**
   * ARIA ラベルを更新
   *
   * @private
   * @param {Object} comboData - コンボデータ
   */
  _updateAriaLabel(comboData) {
    const { comboLevel, bonus, multiplier } = comboData;
    const label = `コンボレベル ${comboLevel}, ボーナス ${bonus}, 倍率 ${multiplier}倍`;
    this.elements.comboDisplay.setAttribute('aria-label', label);
  }

  /**
   * アニメーションを開始
   *
   * @private
   * @param {Object} animationData - アニメーションデータ
   */
  _startAnimation(animationData) {
    const { animationType, intensity } = animationData;

    // モーション削減設定の確認
    if (this.config.reduceMotion) {
      this.elements.comboDisplay.classList.add('combo-no-animation');
      return;
    }

    // アニメーションクラスの適用
    const animationClass = `${animationType}-animation`;
    this.elements.comboDisplay.classList.add(animationClass);
    this.currentAnimation = animationType;

    // アニメーション強度の適用
    if (typeof intensity === 'number') {
      const duration = Math.max(this.config.animationDuration * intensity, 100);
      this.elements.comboDisplay.style.animationDuration = `${duration}ms`;
    }

    // アニメーション完了後のクリーンアップ
    this._animationFrameId = window.requestAnimationFrame(() => {
      setTimeout(() => {
        if (!this.isDestroyed && this.currentAnimation === animationType) {
          this.elements.comboDisplay.classList.remove(animationClass);
          this.currentAnimation = null;
        }
      }, this.config.animationDuration);
    });
  }

  /**
   * 現在のアニメーションをクリア
   *
   * @private
   */
  _clearCurrentAnimation() {
    if (this._animationFrameId) {
      window.cancelAnimationFrame(this._animationFrameId);
      this._animationFrameId = null;
    }

    if (this.currentAnimation) {
      this.elements.comboDisplay.classList.remove(`${this.currentAnimation}-animation`);
      this.currentAnimation = null;
    }
  }

  /**
   * フェードアウトを開始
   *
   * @private
   * @param {number} duration - フェードアウト時間
   */
  _startFadeOut(duration) {
    this.elements.comboDisplay.classList.add('combo-fadeout');
    this.elements.comboDisplay.style.animationDuration = `${duration}ms`;

    setTimeout(() => {
      if (!this.isDestroyed && this.elements.comboDisplay.classList.contains('combo-fadeout')) {
        this.isVisible = false;
        this.elements.comboDisplay.style.display = 'none';
        this._clearFadeOut();
      }
    }, duration);
  }

  /**
   * フェードアウトをクリア
   *
   * @private
   */
  _clearFadeOut() {
    this.elements.comboDisplay.classList.remove('combo-fadeout');
  }

  /**
   * レスポンシブレイアウトを更新
   *
   * @private
   */
  _updateResponsiveLayout() {
    const width = window.innerWidth;

    // 既存のレスポンシブクラスを削除
    this.elements.comboDisplay.classList.remove('combo-mobile', 'combo-compact');

    if (width <= 320) {
      this.elements.comboDisplay.classList.add('combo-compact');
    } else if (width <= 768) {
      this.elements.comboDisplay.classList.add('combo-mobile');

      // モバイルでの自動位置調整
      if (this.config.position === 'auto') {
        this.config.position = 'top-center';
      }
    } else {
      // デスクトップでの自動位置調整
      if (this.config.position === 'auto') {
        this.config.position = 'top-right';
      }
    }
  }

  /**
   * テーマクラスを削除
   *
   * @private
   */
  _removeThemeClasses() {
    const themes = ['light', 'dark', 'neon'];
    themes.forEach(theme => {
      this.elements.comboDisplay.classList.remove(`combo-theme-${theme}`);
    });
  }

  /**
   * イベントリスナーを削除
   *
   * @private
   */
  _removeEventListeners() {
    if (this._resizeHandler) {
      window.removeEventListener('resize', this._resizeHandler);
      this._resizeHandler = null;
    }
  }

  /**
   * UI要素を削除
   *
   * @private
   */
  _removeElements() {
    if (this.elements && this.elements.comboDisplay && this.container) {
      this.container.removeChild(this.elements.comboDisplay);
    }
    this.elements = null;
  }
}
