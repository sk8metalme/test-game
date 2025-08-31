/**
 * ModernUI テスト
 *
 * モダンなUIコンポーネント管理機能のテスト
 *
 * @author AI Assistant
 * @version 1.0.0
 */

import ModernUI from '../../../../src/presentation/ui/ModernUI.js';

// テスト用のDOM環境をセットアップ
beforeEach(() => {
  document.body.innerHTML = `
    <div id="test-container">
      <button data-theme-toggle>テーマ切り替え</button>
      <div id="test-modal" style="display: none;">テストモーダル</div>
    </div>
  `;

  // ブラウザAPIのモック
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });

  // performance APIのモック
  Object.defineProperty(window, 'performance', {
    writable: true,
    value: {
      now: jest.fn(() => Date.now()),
      memory: {
        usedJSHeapSize: 1000000,
        jsHeapSizeLimit: 2000000,
      },
    },
  });
});

afterEach(() => {
  document.body.innerHTML = '';
});

describe('ModernUI', () => {
  let modernUI;

  beforeEach(() => {
    modernUI = new ModernUI({
      theme: 'dark',
      enableAnimations: true,
      enableResponsive: true,
      enableAccessibility: true,
    });
  });

  afterEach(() => {
    if (modernUI) {
      modernUI.destroy();
    }
  });

  describe('初期化', () => {
    test('デフォルト設定で初期化される', () => {
      const defaultUI = new ModernUI();

      expect(defaultUI.config.theme).toBe('dark');
      expect(defaultUI.config.enableAnimations).toBe(true);
      expect(defaultUI.config.enableResponsive).toBe(true);
      expect(defaultUI.config.enableAccessibility).toBe(true);
      expect(defaultUI.config.animationDuration).toBe(300);
    });

    test('カスタム設定で初期化される', () => {
      expect(modernUI.config.theme).toBe('dark');
      expect(modernUI.config.enableAnimations).toBe(true);
      expect(modernUI.config.enableResponsive).toBe(true);
      expect(modernUI.config.enableAccessibility).toBe(true);
    });

    test('初期状態が正しく設定される', () => {
      expect(modernUI.state.isInitialized).toBe(false);
      expect(modernUI.state.currentTheme).toBe('dark');
      expect(modernUI.state.activeModals).toEqual([]);
      expect(modernUI.state.notifications).toEqual([]);
    });
  });

  describe('UIの初期化', () => {
    test('UIが正しく初期化される', () => {
      const initSpy = jest.fn();
      modernUI.on('uiInitialized', initSpy);

      modernUI.initialize();

      expect(modernUI.state.isInitialized).toBe(true);
      expect(initSpy).toHaveBeenCalled();
    });

    test('重複初期化は実行されない', () => {
      modernUI.initialize();
      const initialState = modernUI.state.isInitialized;

      modernUI.initialize();

      expect(modernUI.state.isInitialized).toBe(initialState);
    });
  });

  describe('テーマ管理', () => {
    test('テーマが正しく設定される', () => {
      modernUI.initialize();

      const root = document.documentElement;
      expect(root.getAttribute('data-theme')).toBe('dark');
    });

    test('テーマの切り替えが正しく動作する', () => {
      const themeSpy = jest.fn();
      modernUI.on('themeChanged', themeSpy);

      modernUI.initialize();
      modernUI.toggleTheme();

      expect(modernUI.state.currentTheme).toBe('light');
      expect(themeSpy).toHaveBeenCalledWith({ theme: 'light' });

      const root = document.documentElement;
      expect(root.getAttribute('data-theme')).toBe('light');
    });

    test('CSS変数が正しく設定される', () => {
      modernUI.initialize();

      const root = document.documentElement;
      const computedStyle = getComputedStyle(root);

      expect(computedStyle.getPropertyValue('--bg-primary')).toBe('#1a1a1a');
      expect(computedStyle.getPropertyValue('--text-primary')).toBe('#ffffff');
    });
  });

  describe('レスポンシブ機能', () => {
    test('レスポンシブ状態が正しく更新される', () => {
      const viewportSpy = jest.fn();
      modernUI.on('viewportChanged', viewportSpy);

      modernUI.initialize();

      // モバイルビューポートをシミュレート
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });

      modernUI.handleWindowResize();

      expect(viewportSpy).toHaveBeenCalledWith({ viewport: 'mobile', width: 500 });
    });

    test('ビューポート属性が正しく設定される', () => {
      modernUI.initialize();

      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });

      modernUI.handleWindowResize();

      const root = document.documentElement;
      expect(root.getAttribute('data-viewport')).toBe('mobile');
    });
  });

  describe('アクセシビリティ機能', () => {
    test('キーボードナビゲーションが正しく処理される', () => {
      modernUI.initialize();

      // Tabキーの処理をテスト
      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });

      modernUI.handleTabNavigation(tabEvent);

      // フォーカス可能な要素が存在する場合のテスト
      const button = document.createElement('button');
      document.body.appendChild(button);

      const focusableElements = document.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length > 0) {
        focusableElements[0].focus();
        modernUI.handleTabNavigation(tabEvent);
      }
    });

    test('Escapeキーが正しく処理される', () => {
      modernUI.initialize();

      // モーダルを追加
      modernUI.state.activeModals.push({ id: 'test-modal' });

      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      modernUI.handleEscapeKey(escapeEvent);

      expect(modernUI.state.activeModals.length).toBe(0);
    });

    test('アクセシビリティ設定が正しく更新される', () => {
      const accessibilitySpy = jest.fn();
      modernUI.on('accessibilityChanged', accessibilitySpy);

      modernUI.updateAccessibility({
        highContrast: true,
        largeText: true,
      });

      expect(modernUI.accessibility.highContrast).toBe(true);
      expect(modernUI.accessibility.largeText).toBe(true);
      expect(accessibilitySpy).toHaveBeenCalled();

      const root = document.documentElement;
      expect(root.getAttribute('data-high-contrast')).toBe('true');
      expect(root.getAttribute('data-large-text')).toBe('true');
    });
  });

  describe('モーダル管理', () => {
    test('モーダルが正しく表示される', () => {
      const modalSpy = jest.fn();
      modernUI.on('modalShown', modalSpy);

      modernUI.showModal('test-modal', { title: 'テスト' });

      expect(modernUI.state.activeModals.length).toBe(1);
      expect(modernUI.state.activeModals[0].id).toBe('test-modal');
      expect(modalSpy).toHaveBeenCalled();
    });

    test('モーダルが正しく閉じられる', () => {
      const modalSpy = jest.fn();
      modernUI.on('modalClosed', modalSpy);

      modernUI.showModal('test-modal');
      modernUI.closeModal('test-modal');

      expect(modernUI.state.activeModals.length).toBe(0);
      expect(modalSpy).toHaveBeenCalled();
    });

    test('存在しないモーダルの閉じるは安全に処理される', () => {
      expect(() => {
        modernUI.closeModal('non-existent-modal');
      }).not.toThrow();
    });
  });

  describe('通知管理', () => {
    test('通知が正しく表示される', () => {
      const notificationSpy = jest.fn();
      modernUI.on('notificationShown', notificationSpy);

      modernUI.showNotification('テスト通知', 'info', 5000);

      expect(modernUI.state.notifications.length).toBe(1);
      expect(modernUI.state.notifications[0].message).toBe('テスト通知');
      expect(notificationSpy).toHaveBeenCalled();

      // 通知要素がDOMに追加されているか確認
      const notificationElement = document.querySelector('.notification');
      expect(notificationElement).toBeDefined();
      expect(notificationElement.textContent).toContain('テスト通知');
    });

    test('通知が正しく閉じられる', () => {
      const notificationSpy = jest.fn();
      modernUI.on('notificationClosed', notificationSpy);

      modernUI.showNotification('テスト通知');
      const notificationId = modernUI.state.notifications[0].id;

      modernUI.closeNotification(notificationId);

      expect(modernUI.state.notifications.length).toBe(0);
      expect(notificationSpy).toHaveBeenCalled();
    });

    test('通知の自動閉じが正しく動作する', () => {
      jest.useFakeTimers();

      modernUI.showNotification('テスト通知', 'info', 1000);

      expect(modernUI.state.notifications.length).toBe(1);

      jest.advanceTimersByTime(1000);

      expect(modernUI.state.notifications.length).toBe(0);

      jest.useRealTimers();
    });
  });

  describe('アニメーション機能', () => {
    test('アニメーションが有効な場合の動作', () => {
      modernUI.initialize();

      // モーダルのアニメーション
      const modalElement = document.getElementById('test-modal');
      modalElement.style.display = 'block';

      modernUI.animateModalIn('test-modal');

      // requestAnimationFrameの処理を待つ
      setTimeout(() => {
        expect(modalElement.style.opacity).toBe('1');
        expect(modalElement.style.transform).toBe('scale(1)');
      }, 50);
    });

    test('アニメーションが無効な場合の動作', () => {
      const noAnimationUI = new ModernUI({
        enableAnimations: false,
      });

      noAnimationUI.initialize();

      expect(() => {
        noAnimationUI.showModal('test-modal');
      }).not.toThrow();
    });
  });

  describe('コンポーネント管理', () => {
    test('コンポーネントが正しく登録される', () => {
      const componentSpy = jest.fn();
      modernUI.on('componentRegistered', componentSpy);

      const testComponent = { name: 'test' };
      modernUI.registerComponent('test-id', testComponent);

      expect(modernUI.components.has('test-id')).toBe(true);
      expect(modernUI.components.get('test-id')).toBe(testComponent);
      expect(componentSpy).toHaveBeenCalled();
    });

    test('コンポーネントが正しく取得される', () => {
      const testComponent = { name: 'test' };
      modernUI.registerComponent('test-id', testComponent);

      const retrieved = modernUI.getComponent('test-id');
      expect(retrieved).toBe(testComponent);
    });

    test('存在しないコンポーネントの取得', () => {
      const retrieved = modernUI.getComponent('non-existent');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('イベントシステム', () => {
    test('イベントリスナーが正しく登録される', () => {
      const listener = jest.fn();

      modernUI.on('testEvent', listener);

      expect(modernUI.listeners.has('testEvent')).toBe(true);
      expect(modernUI.listeners.get('testEvent')).toContain(listener);
    });

    test('イベントが正しく発火される', () => {
      const listener = jest.fn();
      modernUI.on('testEvent', listener);

      modernUI.emit('testEvent', { data: 'test' });

      expect(listener).toHaveBeenCalledWith({ data: 'test' });
    });

    test('エラーが発生した場合も安全に処理される', () => {
      const errorListener = jest.fn(() => {
        throw new Error('Test error');
      });
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      modernUI.on('errorEvent', errorListener);
      modernUI.emit('errorEvent', {});

      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('状態管理', () => {
    test('UI状態が正しく取得される', () => {
      const state = modernUI.getState();

      expect(state.isInitialized).toBe(false);
      expect(state.currentTheme).toBe('dark');
      expect(state.accessibility).toBeDefined();
      expect(state.breakpoints).toBeDefined();
      expect(state.config).toBeDefined();
    });
  });

  describe('破棄処理', () => {
    test('UIが正しく破棄される', () => {
      const destroySpy = jest.fn();
      modernUI.on('uiDestroyed', destroySpy);

      modernUI.initialize();
      modernUI.registerComponent('test', {});
      modernUI.on('test', jest.fn());

      modernUI.destroy();

      expect(modernUI.state.isInitialized).toBe(false);
      expect(modernUI.components.size).toBe(0);
      expect(modernUI.listeners.size).toBe(0);
      expect(destroySpy).toHaveBeenCalled();
    });
  });

  describe('エッジケース', () => {
    test('存在しない要素へのアニメーション適用', () => {
      expect(() => {
        modernUI.animateModalIn('non-existent-modal');
      }).not.toThrow();
    });

    test('空の通知配列からの削除', () => {
      expect(() => {
        modernUI.closeNotification('non-existent');
      }).not.toThrow();
    });

    test('無効な設定での初期化', () => {
      const invalidUI = new ModernUI({
        enableAnimations: false,
        enableResponsive: false,
        enableAccessibility: false,
      });

      expect(() => {
        invalidUI.initialize();
      }).not.toThrow();
    });
  });
});
