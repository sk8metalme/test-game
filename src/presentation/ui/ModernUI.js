/**
 * ModernUI - モダンなUIコンポーネント管理
 *
 * レスポンシブデザイン、アニメーション効果、アクセシビリティ対応
 * ユーザー体験の向上を目的としたUIシステム
 *
 * @author AI Assistant
 * @version 1.0.0
 */

export default class ModernUI {
  /**
   * ModernUIのコンストラクタ
   *
   * @param {Object} config - UI設定
   */
  constructor(config = {}) {
    this.config = {
      theme: config.theme || 'dark',
      enableAnimations: config.enableAnimations !== false,
      enableResponsive: config.enableResponsive !== false,
      enableAccessibility: config.enableAccessibility !== false,
      animationDuration: config.animationDuration || 300,
      ...config,
    };

    // UI状態
    this.state = {
      isInitialized: false,
      currentTheme: this.config.theme,
      isAnimating: false,
      activeModals: [],
      notifications: [],
    };

    // UIコンポーネント
    this.components = new Map();

    // イベントリスナー
    this.listeners = new Map();

    // アニメーション管理
    this.animations = new Map();

    // レスポンシブ管理
    this.breakpoints = {
      mobile: 768,
      tablet: 1024,
      desktop: 1200,
    };

    // アクセシビリティ設定
    this.accessibility = {
      highContrast: false,
      largeText: false,
      reducedMotion: false,
    };
  }

  /**
   * UIの初期化
   */
  initialize() {
    if (this.state.isInitialized) return;

    this.setupTheme();
    this.setupResponsive();
    this.setupAccessibility();
    this.setupEventListeners();

    this.state.isInitialized = true;
    this.emit('uiInitialized');
  }

  /**
   * テーマの設定
   */
  setupTheme() {
    const root = document.documentElement;
    root.setAttribute('data-theme', this.state.currentTheme);

    // CSS変数の設定
    const themes = {
      dark: {
        '--bg-primary': '#1a1a1a',
        '--bg-secondary': '#2d2d2d',
        '--text-primary': '#ffffff',
        '--text-secondary': '#b3b3b3',
        '--accent-primary': '#4a9eff',
        '--accent-secondary': '#ff6b6b',
        '--border-color': '#404040',
      },
      light: {
        '--bg-primary': '#ffffff',
        '--bg-secondary': '#f5f5f5',
        '--text-primary': '#1a1a1a',
        '--text-secondary': '#666666',
        '--accent-primary': '#007bff',
        '--accent-secondary': '#dc3545',
        '--border-color': '#dee2e6',
      },
    };

    const currentTheme = themes[this.state.currentTheme];
    Object.entries(currentTheme).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
  }

  /**
   * レスポンシブ設定
   */
  setupResponsive() {
    if (!this.config.enableResponsive) return;

    const mediaQuery = window.matchMedia(`(max-width: ${this.breakpoints.mobile}px)`);

    const handleResize = e => {
      this.updateResponsiveState(e.matches);
    };

    mediaQuery.addListener(handleResize);
    this.updateResponsiveState(mediaQuery.matches);
  }

  /**
   * レスポンシブ状態の更新
   *
   * @param {boolean} isMobile - モバイル表示かどうか
   */
  updateResponsiveState(isMobile) {
    const root = document.documentElement;
    root.setAttribute('data-viewport', isMobile ? 'mobile' : 'desktop');

    this.emit('viewportChanged', { isMobile });
  }

  /**
   * アクセシビリティ設定
   */
  setupAccessibility() {
    if (!this.config.enableAccessibility) return;

    // キーボードナビゲーション
    document.addEventListener('keydown', e => {
      this.handleKeyboardNavigation(e);
    });

    // フォーカス管理
    this.setupFocusManagement();
  }

  /**
   * キーボードナビゲーションの処理
   *
   * @param {KeyboardEvent} e - キーボードイベント
   */
  handleKeyboardNavigation(e) {
    switch (e.key) {
      case 'Tab':
        this.handleTabNavigation(e);
        break;
      case 'Escape':
        this.handleEscapeKey(e);
        break;
      case 'Enter':
      case ' ':
        this.handleActionKey(e);
        break;
    }
  }

  /**
   * Tabキーによるナビゲーション処理
   *
   * @param {KeyboardEvent} e - キーボードイベント
   */
  handleTabNavigation(e) {
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (e.shiftKey) {
      // Shift+Tab: 逆順
      if (document.activeElement === focusableElements[0]) {
        e.preventDefault();
        focusableElements[focusableElements.length - 1].focus();
      }
    } else {
      // Tab: 順方向
      if (document.activeElement === focusableElements[focusableElements.length - 1]) {
        e.preventDefault();
        focusableElements[0].focus();
      }
    }
  }

  /**
   * Escapeキーの処理
   */
  handleEscapeKey() {
    // モーダルを閉じる
    if (this.state.activeModals.length > 0) {
      const modal = this.state.activeModals[this.state.activeModals.length - 1];
      this.closeModal(modal.id);
    }

    // 通知を閉じる
    if (this.state.notifications.length > 0) {
      const notification = this.state.notifications[this.state.notifications.length - 1];
      this.closeNotification(notification.id);
    }
  }

  /**
   * アクションキーの処理
   *
   * @param {KeyboardEvent} e - キーボードイベント
   */
  handleActionKey(e) {
    const target = e.target;

    if (target.tagName === 'BUTTON' || target.getAttribute('role') === 'button') {
      e.preventDefault();
      target.click();
    }
  }

  /**
   * フォーカス管理の設定
   */
  setupFocusManagement() {
    // フォーカストラップ
    document.addEventListener('focusin', e => {
      this.handleFocusIn(e);
    });

    document.addEventListener('focusout', e => {
      this.handleFocusOut(e);
    });
  }

  /**
   * フォーカスインの処理
   *
   * @param {FocusEvent} e - フォーカスイベント
   */
  handleFocusIn(e) {
    const target = e.target;

    // フォーカスインジケーターの追加
    target.classList.add('focused');

    // スクリーンリーダー用のアナウンス
    if (this.accessibility.largeText) {
      this.announceToScreenReader(target.textContent || target.getAttribute('aria-label'));
    }
  }

  /**
   * フォーカスアウトの処理
   *
   * @param {FocusEvent} e - フォーカスイベント
   */
  handleFocusOut(e) {
    const target = e.target;

    // フォーカスインジケーターの削除
    target.classList.remove('focused');
  }

  /**
   * スクリーンリーダーへのアナウンス
   *
   * @param {string} message - アナウンスするメッセージ
   */
  announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  /**
   * イベントリスナーの設定
   */
  setupEventListeners() {
    // ウィンドウリサイズ
    window.addEventListener('resize', () => {
      this.handleWindowResize();
    });

    // テーマ切り替え
    document.addEventListener('click', e => {
      if (e.target.matches('[data-theme-toggle]')) {
        this.toggleTheme();
      }
    });
  }

  /**
   * ウィンドウリサイズの処理
   */
  handleWindowResize() {
    if (this.config.enableResponsive) {
      const width = window.innerWidth;
      let viewport = 'desktop';

      if (width <= this.breakpoints.mobile) {
        viewport = 'mobile';
      } else if (width <= this.breakpoints.tablet) {
        viewport = 'tablet';
      }

      const root = document.documentElement;
      root.setAttribute('data-viewport', viewport);

      this.emit('viewportChanged', { viewport, width });
    }
  }

  /**
   * テーマの切り替え
   */
  toggleTheme() {
    this.state.currentTheme = this.state.currentTheme === 'dark' ? 'light' : 'dark';
    this.setupTheme();

    this.emit('themeChanged', { theme: this.state.currentTheme });
  }

  /**
   * モーダルの表示
   *
   * @param {string} id - モーダルのID
   * @param {Object} options - モーダルオプション
   */
  showModal(id, options = {}) {
    const modal = {
      id,
      options,
      timestamp: Date.now(),
    };

    this.state.activeModals.push(modal);

    if (this.config.enableAnimations) {
      this.animateModalIn(id);
    }

    this.emit('modalShown', modal);
  }

  /**
   * モーダルの閉じる
   *
   * @param {string} id - モーダルのID
   */
  closeModal(id) {
    const index = this.state.activeModals.findIndex(modal => modal.id === id);

    if (index !== -1) {
      const modal = this.state.activeModals.splice(index, 1)[0];

      if (this.config.enableAnimations) {
        this.animateModalOut(id);
      }

      this.emit('modalClosed', modal);
    }
  }

  /**
   * モーダルのインアニメーション
   *
   * @param {string} id - モーダルのID
   */
  animateModalIn(id) {
    const modalElement = document.getElementById(id);
    if (!modalElement) return;

    modalElement.style.opacity = '0';
    modalElement.style.transform = 'scale(0.9)';

    requestAnimationFrame(() => {
      modalElement.style.transition = `all ${this.config.animationDuration}ms ease-out`;
      modalElement.style.opacity = '1';
      modalElement.style.transform = 'scale(1)';
    });
  }

  /**
   * モーダルのアウトアニメーション
   *
   * @param {string} id - モーダルのID
   */
  animateModalOut(id) {
    const modalElement = document.getElementById(id);
    if (!modalElement) return;

    modalElement.style.transition = `all ${this.config.animationDuration}ms ease-in`;
    modalElement.style.opacity = '0';
    modalElement.style.transform = 'scale(0.9)';

    setTimeout(() => {
      modalElement.style.display = 'none';
    }, this.config.animationDuration);
  }

  /**
   * 通知の表示
   *
   * @param {string} message - 通知メッセージ
   * @param {string} type - 通知タイプ（success, warning, error, info）
   * @param {number} duration - 表示時間（ミリ秒）
   */
  showNotification(message, type = 'info', duration = 5000) {
    const notification = {
      id: `notification-${Date.now()}`,
      message,
      type,
      timestamp: Date.now(),
    };

    this.state.notifications.push(notification);

    this.createNotificationElement(notification);

    if (duration > 0) {
      setTimeout(() => {
        this.closeNotification(notification.id);
      }, duration);
    }

    this.emit('notificationShown', notification);
  }

  /**
   * 通知要素の作成
   *
   * @param {Object} notification - 通知オブジェクト
   */
  createNotificationElement(notification) {
    const notificationElement = document.createElement('div');
    notificationElement.id = notification.id;
    notificationElement.className = `notification notification-${notification.type}`;
    notificationElement.setAttribute('role', 'alert');

    notificationElement.innerHTML = `
      <div class="notification-content">
        <span class="notification-message">${notification.message}</span>
        <button class="notification-close" aria-label="閉じる">×</button>
      </div>
    `;

    // 閉じるボタンのイベント
    const closeButton = notificationElement.querySelector('.notification-close');
    closeButton.addEventListener('click', () => {
      this.closeNotification(notification.id);
    });

    // 通知コンテナに追加
    let container = document.querySelector('.notification-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'notification-container';
      document.body.appendChild(container);
    }

    container.appendChild(notificationElement);

    // アニメーション
    if (this.config.enableAnimations) {
      this.animateNotificationIn(notificationElement);
    }
  }

  /**
   * 通知のインアニメーション
   *
   * @param {HTMLElement} element - 通知要素
   */
  animateNotificationIn(element) {
    element.style.opacity = '0';
    element.style.transform = 'translateX(100%)';

    requestAnimationFrame(() => {
      element.style.transition = `all ${this.config.animationDuration}ms ease-out`;
      element.style.opacity = '1';
      element.style.transform = 'translateX(0)';
    });
  }

  /**
   * 通知の閉じる
   *
   * @param {string} id - 通知のID
   */
  closeNotification(id) {
    const index = this.state.notifications.findIndex(n => n.id === id);

    if (index !== -1) {
      const notification = this.state.notifications.splice(index, 1)[0];
      const element = document.getElementById(id);

      if (element) {
        if (this.config.enableAnimations) {
          this.animateNotificationOut(element);
        } else {
          element.remove();
        }
      }

      this.emit('notificationClosed', notification);
    }
  }

  /**
   * 通知のアウトアニメーション
   *
   * @param {HTMLElement} element - 通知要素
   */
  animateNotificationOut(element) {
    element.style.transition = `all ${this.config.animationDuration}ms ease-in`;
    element.style.opacity = '0';
    element.style.transform = 'translateX(100%)';

    setTimeout(() => {
      element.remove();
    }, this.config.animationDuration);
  }

  /**
   * アクセシビリティ設定の更新
   *
   * @param {Object} settings - アクセシビリティ設定
   */
  updateAccessibility(settings) {
    this.accessibility = { ...this.accessibility, ...settings };

    const root = document.documentElement;

    if (this.accessibility.highContrast) {
      root.setAttribute('data-high-contrast', 'true');
    } else {
      root.removeAttribute('data-high-contrast');
    }

    if (this.accessibility.largeText) {
      root.setAttribute('data-large-text', 'true');
    } else {
      root.removeAttribute('data-large-text');
    }

    if (this.accessibility.reducedMotion) {
      root.setAttribute('data-reduced-motion', 'true');
    } else {
      root.removeAttribute('data-reduced-motion');
    }

    this.emit('accessibilityChanged', this.accessibility);
  }

  /**
   * UIコンポーネントの登録
   *
   * @param {string} id - コンポーネントID
   * @param {Object} component - コンポーネントオブジェクト
   */
  registerComponent(id, component) {
    this.components.set(id, component);
    this.emit('componentRegistered', { id, component });
  }

  /**
   * UIコンポーネントの取得
   *
   * @param {string} id - コンポーネントID
   * @returns {Object} コンポーネントオブジェクト
   */
  getComponent(id) {
    return this.components.get(id);
  }

  /**
   * UI状態の取得
   *
   * @returns {Object} UI状態
   */
  getState() {
    return {
      ...this.state,
      accessibility: this.accessibility,
      breakpoints: this.breakpoints,
      config: this.config,
    };
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
          // console.error(`ModernUI event error:`, error);
        }
      });
    }
  }

  /**
   * UIの破棄
   */
  destroy() {
    // 破棄イベントを先に発火
    this.emit('uiDestroyed');

    // イベントリスナーの削除
    this.listeners.clear();

    // コンポーネントの破棄
    this.components.clear();

    // 状態のリセット
    this.state.isInitialized = false;
  }
}
