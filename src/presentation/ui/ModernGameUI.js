/**
 * ModernGameUI - GameUIとModernUIを統合したモダンなUI管理システム
 *
 * GameUIの既存機能を保持しながら、ModernUIの先進的な機能を統合
 * レスポンシブデザイン、テーマ管理、アニメーション効果を提供
 *
 * @author AI Assistant
 * @version 1.0.0
 */

import GameUI from './GameUI.js';
import ModernUI from './ModernUI.js';

export default class ModernGameUI extends ModernUI {
  /**
   * ModernGameUIのコンストラクタ
   *
   * @param {HTMLElement} container - UIコンテナ要素
   * @param {Object} config - UI設定
   */
  constructor(container, config = {}) {
    if (!container) {
      throw new Error('Invalid container element');
    }

    // ModernUIを初期化
    super({
      theme: config.theme || 'dark',
      enableAnimations: config.enableAnimations !== false,
      enableResponsive: config.enableResponsive !== false,
      enableAccessibility: config.enableAccessibility !== false,
      ...config,
    });

    // GameUIを初期化
    this.gameUI = new GameUI(container);
    this.container = container;

    // 統合設定
    this.modernConfig = {
      showEffectsSettings: config.showEffectsSettings !== false,
      showPerformanceMonitor: config.showPerformanceMonitor !== false,
      enableAdvancedAnimations: config.enableAdvancedAnimations !== false,
      ...config,
    };

    // UIコンポーネントの統合
    this._integrateComponents();

    // ModernUIを初期化
    this.initialize();

    // イベント統合の設定
    this._setupEventIntegration();

    // UI初期化完了イベントを発火
    this.emit('uiInitialized');
  }

  /**
   * コンポーネントの統合
   * @private
   */
  _integrateComponents() {
    // GameUIのコールバックをModernUIのイベントシステムに統合
    this.gameUI.onMenuSelect(item => {
      this.emit('menuSelect', { item });
    });

    this.gameUI.onSettingChange((key, value) => {
      this.emit('settingChange', { key, value });
    });

    this.gameUI.onKeyPress(key => {
      this.emit('keyPress', { key });
    });

    this.gameUI.onClick(action => {
      this.emit('click', { action });
    });

    this.gameUI.onResize((width, height) => {
      this.emit('resize', { width, height });
    });
  }

  /**
   * イベント統合の設定
   * @private
   */
  _setupEventIntegration() {
    // テーマ変更をGameUIに反映
    this.on('themeChanged', ({ theme }) => {
      this._applyThemeToGameUI(theme);
    });

    // ビューポート変更をGameUIに反映
    this.on('viewportChanged', ({ viewport }) => {
      this._applyResponsiveToGameUI(viewport);
    });

    // アクセシビリティ変更をGameUIに反映
    this.on('accessibilityChanged', settings => {
      this._applyAccessibilityToGameUI(settings);
    });
  }

  /**
   * テーマをGameUIに適用
   * @private
   * @param {string} theme - テーマ名
   */
  _applyThemeToGameUI(theme) {
    const themeConfig = this._getThemeConfig(theme);
    this.gameUI.setTheme(themeConfig);
  }

  /**
   * レスポンシブ設定をGameUIに適用
   * @private
   * @param {string} viewport - ビューポート
   */
  _applyResponsiveToGameUI(viewport) {
    switch (viewport) {
      case 'mobile':
        this.gameUI.setDeviceType('mobile');
        this._applyMobileLayout();
        break;
      case 'tablet':
        this.gameUI.setDeviceType('tablet');
        this._applyTabletLayout();
        break;
      default:
        this.gameUI.setDeviceType('desktop');
        this._applyDesktopLayout();
    }
  }

  /**
   * アクセシビリティ設定をGameUIに適用
   * @private
   * @param {Object} settings - アクセシビリティ設定
   */
  _applyAccessibilityToGameUI(settings) {
    if (settings.largeText) {
      this.gameUI.enableAccessibility();
    }
  }

  /**
   * テーマ設定を取得
   * @private
   * @param {string} theme - テーマ名
   * @returns {Object} テーマ設定
   */
  _getThemeConfig(theme) {
    const themes = {
      dark: {
        backgroundColor: '#1a1a1a',
        textColor: '#ffffff',
        accentColor: '#4a9eff',
        borderColor: '#404040',
        buttonColor: '#666666',
        buttonHoverColor: '#888888',
      },
      light: {
        backgroundColor: '#ffffff',
        textColor: '#1a1a1a',
        accentColor: '#007bff',
        borderColor: '#dee2e6',
        buttonColor: '#f8f9fa',
        buttonHoverColor: '#e9ecef',
      },
    };

    return themes[theme] || themes.dark;
  }

  /**
   * モバイルレイアウトの適用
   * @private
   */
  _applyMobileLayout() {
    this.container.classList.add('mobile-layout');
    this.container.classList.remove('tablet-layout', 'desktop-layout');
  }

  /**
   * タブレットレイアウトの適用
   * @private
   */
  _applyTabletLayout() {
    this.container.classList.add('tablet-layout');
    this.container.classList.remove('mobile-layout', 'desktop-layout');
  }

  /**
   * デスクトップレイアウトの適用
   * @private
   */
  _applyDesktopLayout() {
    this.container.classList.add('desktop-layout');
    this.container.classList.remove('mobile-layout', 'tablet-layout');
  }

  /**
   * 拡張されたメニュー表示
   * @param {Array<string>} menuItems - メニュー項目
   */
  showMenu(menuItems = ['Start Game', 'Settings', 'High Scores', 'Exit']) {
    this.gameUI.showMenu(menuItems);

    // ModernUIの拡張機能
    if (this.modernConfig.enableAdvancedAnimations) {
      this._animateMenuIn();
    }

    this.emit('menuShown', { menuItems });
  }

  /**
   * 拡張されたゲーム画面表示
   */
  showGame() {
    this.gameUI.showGame();

    // モダンUI機能の追加
    if (this.modernConfig.showPerformanceMonitor) {
      this._showPerformanceIndicator();
    }

    if (this.modernConfig.enableAdvancedAnimations) {
      this._animateGameIn();
    }

    this.emit('gameShown');
  }

  /**
   * 拡張されたゲーム情報更新
   * @param {Object} gameInfo - ゲーム情報
   */
  updateGameInfo(gameInfo) {
    this.gameUI.updateGameInfo(gameInfo);

    // スコア更新アニメーション
    if (this.modernConfig.enableAdvancedAnimations && gameInfo.score) {
      this._animateScoreUpdate();
    }

    this.emit('gameInfoUpdated', gameInfo);
  }

  /**
   * 拡張されたゲーム状態設定
   * @param {string} state - ゲーム状態
   */
  setGameState(state) {
    this.gameUI.setGameState(state);

    // 状態変更通知
    if (state === 'gameOver') {
      this.showNotification('ゲームオーバー', 'error', 5000);
    } else if (state === 'paused') {
      this.showNotification('ゲームを一時停止しました', 'info', 3000);
    }

    this.emit('gameStateChanged', { state });
  }

  /**
   * エフェクト設定画面の表示
   */
  showEffectsSettings() {
    if (!this.effectsSettingsUI) {
      // 遅延読み込み
      import('./EffectsSettingsUI.js').then(({ default: EffectsSettingsUI }) => {
        this.effectsSettingsUI = new EffectsSettingsUI(this.container, null, this);
        this.effectsSettingsUI.show();
      });
    } else {
      this.effectsSettingsUI.show();
    }

    this.emit('effectsSettingsShown');
  }

  /**
   * パフォーマンス監視UIの表示
   */
  showPerformanceMonitor() {
    if (!this.performanceMonitorUI) {
      // 遅延読み込み
      import('./PerformanceMonitorUI.js').then(({ default: PerformanceMonitorUI }) => {
        this.performanceMonitorUI = new PerformanceMonitorUI(this.container, null, this);
        this.performanceMonitorUI.show();
      });
    } else {
      this.performanceMonitorUI.show();
    }

    this.emit('performanceMonitorShown');
  }

  /**
   * メニューアニメーション
   * @private
   */
  _animateMenuIn() {
    const menuScreen = this.container.querySelector('.menu-screen');
    if (!menuScreen) return;

    menuScreen.style.opacity = '0';
    menuScreen.style.transform = 'translateY(-20px)';

    requestAnimationFrame(() => {
      menuScreen.style.transition = `all ${this.config.animationDuration}ms ease-out`;
      menuScreen.style.opacity = '1';
      menuScreen.style.transform = 'translateY(0)';
    });
  }

  /**
   * ゲーム画面アニメーション
   * @private
   */
  _animateGameIn() {
    const gameScreen = this.container.querySelector('.game-screen');
    if (!gameScreen) return;

    gameScreen.style.opacity = '0';
    gameScreen.style.transform = 'scale(0.95)';

    requestAnimationFrame(() => {
      gameScreen.style.transition = `all ${this.config.animationDuration}ms ease-out`;
      gameScreen.style.opacity = '1';
      gameScreen.style.transform = 'scale(1)';
    });
  }

  /**
   * スコア更新アニメーション
   * @private
   */
  _animateScoreUpdate() {
    const scoreElement = this.container.querySelector('.game-score');
    if (!scoreElement) return;

    scoreElement.classList.add('score-updated');
    setTimeout(() => {
      scoreElement.classList.remove('score-updated');
    }, 500);
  }

  /**
   * パフォーマンスインジケーターの表示
   * @private
   */
  _showPerformanceIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'performance-indicator';
    indicator.innerHTML = `
      <span class="fps-indicator">60 FPS</span>
      <span class="memory-indicator">45 MB</span>
    `;

    this.container.appendChild(indicator);
  }

  // GameUIメソッドの委譲とModernUI機能の統合

  /**
   * メニューを隠す
   */
  hideMenu() {
    this.gameUI.hideMenu();
    this.emit('menuHidden');
  }

  /**
   * ゲーム画面を隠す
   */
  hideGame() {
    this.gameUI.hideGame();
    this.emit('gameHidden');
  }

  /**
   * 設定画面を表示
   * @param {Object} settings - 設定データ
   */
  showSettings(settings = {}) {
    this.gameUI.showSettings(settings);

    // ModernUI設定の追加
    this._addModernSettingsToUI();

    this.emit('settingsShown', { settings });
  }

  /**
   * 設定画面を隠す
   */
  hideSettings() {
    this.gameUI.hideSettings();
    this.emit('settingsHidden');
  }

  /**
   * 高スコア画面を表示
   * @param {Array<Object>} highScores - 高スコア配列
   */
  showHighScores(highScores = []) {
    this.gameUI.showHighScores(highScores);
    this.emit('highScoresShown', { highScores });
  }

  /**
   * 高スコア画面を隠す
   */
  hideHighScores() {
    this.gameUI.hideHighScores();
    this.emit('highScoresHidden');
  }

  /**
   * モダン設定をUIに追加
   * @private
   */
  _addModernSettingsToUI() {
    const settingsContent = this.container.querySelector('.settings-content');
    if (!settingsContent) return;

    const modernSettingsHTML = `
      <div class="setting-section modern-settings">
        <h3>外観設定</h3>
        <div class="setting-item">
          <label>テーマ:</label>
          <select class="theme-select">
            <option value="dark" ${this.state.currentTheme === 'dark' ? 'selected' : ''}>ダーク</option>
            <option value="light" ${this.state.currentTheme === 'light' ? 'selected' : ''}>ライト</option>
          </select>
        </div>
        <div class="setting-item">
          <label>アニメーション:</label>
          <input type="checkbox" class="animations-checkbox" ${this.config.enableAnimations ? 'checked' : ''}>
        </div>
        <div class="setting-item">
          <label>高コントラスト:</label>
          <input type="checkbox" class="high-contrast-checkbox" ${this.accessibility.highContrast ? 'checked' : ''}>
        </div>
      </div>
    `;

    settingsContent.insertAdjacentHTML('beforeend', modernSettingsHTML);

    // イベントリスナーの設定
    this._setupModernSettingsEventListeners();
  }

  /**
   * モダン設定のイベントリスナー設定
   * @private
   */
  _setupModernSettingsEventListeners() {
    const themeSelect = this.container.querySelector('.theme-select');
    const animationsCheckbox = this.container.querySelector('.animations-checkbox');
    const highContrastCheckbox = this.container.querySelector('.high-contrast-checkbox');

    if (themeSelect) {
      themeSelect.addEventListener('change', e => {
        this.state.currentTheme = e.target.value;
        this.setupTheme();
        this.emit('themeChanged', { theme: this.state.currentTheme });
      });
    }

    if (animationsCheckbox) {
      animationsCheckbox.addEventListener('change', e => {
        this.config.enableAnimations = e.target.checked;
        this.emit('animationsToggled', { enabled: this.config.enableAnimations });
      });
    }

    if (highContrastCheckbox) {
      highContrastCheckbox.addEventListener('change', e => {
        this.updateAccessibility({ highContrast: e.target.checked });
      });
    }
  }

  // GameUIメソッドの委譲

  /**
   * メニュー項目を選択
   * @param {string} item - 選択されたメニュー項目
   */
  selectMenuItem(item) {
    this.gameUI.selectMenuItem(item);
  }

  /**
   * 設定を変更
   * @param {string} key - 設定キー
   * @param {*} value - 設定値
   */
  changeSetting(key, value) {
    this.gameUI.changeSetting(key, value);
  }

  /**
   * 現在の画面を取得
   * @returns {string} 現在の画面名
   */
  getCurrentScreen() {
    return this.gameUI.getCurrentScreen();
  }

  /**
   * 画面履歴を取得
   * @returns {Array<string>} 画面履歴配列
   */
  getScreenHistory() {
    return this.gameUI.getScreenHistory();
  }

  /**
   * 前の画面に戻る
   */
  goBack() {
    this.gameUI.goBack();
    this.emit('navigationBack');
  }

  /**
   * 現在のテーマを取得（GameUIとの互換性）
   * @returns {Object} 現在のテーマ
   */
  getCurrentTheme() {
    return this.gameUI.getCurrentTheme();
  }

  /**
   * テーマが適用されているか確認（GameUIとの互換性）
   * @returns {boolean} テーマ適用フラグ
   */
  isThemeApplied() {
    return this.gameUI.isThemeApplied();
  }

  /**
   * デバイスタイプを取得（GameUIとの互換性）
   * @returns {string} デバイスタイプ
   */
  getDeviceType() {
    return this.gameUI.getDeviceType();
  }

  /**
   * 設定を取得（GameUIとの互換性）
   * @returns {Object} 現在の設定
   */
  getConfig() {
    return {
      ...this.gameUI.getConfig(),
      ...this.modernConfig,
      modernUI: this.getState(),
    };
  }

  /**
   * 破棄されているか確認（GameUIとの互換性）
   * @returns {boolean} 破棄フラグ
   */
  isDestroyed() {
    return this.gameUI.isDestroyed();
  }

  /**
   * キー入力イベント処理（GameUIとの互換性）
   * @param {KeyboardEvent} event - キーイベント
   */
  handleKeyPress(event) {
    this.gameUI.handleKeyPress(event);
    this.handleKeyboardNavigation(event);
  }

  /**
   * クリックイベント処理（GameUIとの互換性）
   * @param {MouseEvent} event - マウスイベント
   */
  handleClick(event) {
    this.gameUI.handleClick(event);
  }

  /**
   * リサイズイベント処理（GameUIとの互換性）
   * @param {Event} event - リサイズイベント
   */
  handleResize(event) {
    this.gameUI.handleResize(event);
    this.handleWindowResize();
  }

  /**
   * HTMLエスケープ処理（GameUIとの互換性）
   * @param {string} text - エスケープ対象テキスト
   * @returns {string} エスケープ済みテキスト
   */
  escapeHtml(text) {
    return this.gameUI.escapeHtml(text);
  }

  /**
   * リソース解放
   */
  destroy() {
    // 拡張UIコンポーネントの破棄
    if (this.effectsSettingsUI) {
      this.effectsSettingsUI.destroy();
    }

    if (this.performanceMonitorUI) {
      this.performanceMonitorUI.destroy();
    }

    // GameUIの破棄
    if (this.gameUI) {
      this.gameUI.destroy();
    }

    // ModernUIの破棄
    super.destroy();

    this.emit('modernGameUIDestroyed');
  }
}
