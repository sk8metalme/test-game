/**
 * ModernGameUI統合テスト
 *
 * GameUIとModernUIを統合したModernGameUIクラスのテスト
 *
 * テスト範囲:
 * - 基本的な統合機能
 * - テーマ切り替え
 * - レスポンシブ対応
 * - 既存機能の後方互換性
 */

import ModernGameUI from '../../../../src/presentation/ui/ModernGameUI.js';

describe('ModernGameUI', () => {
  let container;
  let modernGameUI;

  beforeEach(() => {
    // テスト用DOM環境の設定
    container = document.createElement('div');
    container.id = 'game-container';
    document.body.appendChild(container);

    // ブラウザAPI のモック
    global.matchMedia = jest.fn(() => ({
      matches: false,
      addListener: jest.fn(),
      removeListener: jest.fn(),
    }));

    global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 16));
  });

  afterEach(() => {
    if (modernGameUI) {
      modernGameUI.destroy();
    }
    document.body.removeChild(container);
    jest.clearAllMocks();
  });

  describe('初期化', () => {
    test('正常に初期化される', () => {
      modernGameUI = new ModernGameUI(container);

      expect(modernGameUI).toBeDefined();
      expect(modernGameUI.getState().isInitialized).toBe(true);
      expect(modernGameUI.getCurrentTheme()).toBeDefined();
    });

    test('設定パラメータが正しく適用される', () => {
      const config = {
        theme: 'light',
        enableAnimations: false,
        enableResponsive: true,
      };

      modernGameUI = new ModernGameUI(container, config);

      expect(modernGameUI.getState().currentTheme).toBe('light');
      expect(modernGameUI.config.enableAnimations).toBe(false);
      expect(modernGameUI.config.enableResponsive).toBe(true);
    });

    test('無効なcontainerでエラーが発生する', () => {
      expect(() => {
        new ModernGameUI(null);
      }).toThrow('Invalid container element');
    });
  });

  describe('GameUI機能の互換性', () => {
    beforeEach(() => {
      modernGameUI = new ModernGameUI(container);
    });

    test('メニュー表示機能が正常に動作する', () => {
      modernGameUI.showMenu(['Start Game', 'Settings', 'Exit']);

      expect(modernGameUI.getCurrentScreen()).toBe('menu');
      expect(container.querySelector('.menu-screen')).toBeTruthy();
      expect(container.querySelector('.menu-title').textContent).toBe('TETRIS');
    });

    test('ゲーム画面表示機能が正常に動作する', () => {
      modernGameUI.showGame();

      expect(modernGameUI.getCurrentScreen()).toBe('game');
      expect(container.querySelector('.game-screen')).toBeTruthy();
      expect(container.querySelector('#main-canvas')).toBeTruthy();
    });

    test('ゲーム情報更新機能が正常に動作する', () => {
      modernGameUI.showGame();

      const gameInfo = {
        score: 12345,
        level: 5,
        lines: 23,
        nextPiece: 'T',
      };

      modernGameUI.updateGameInfo(gameInfo);

      expect(container.querySelector('.game-score').textContent).toBe('12,345');
      expect(container.querySelector('.game-level').textContent).toBe('Level 5');
      expect(container.querySelector('.game-lines').textContent).toBe('Lines: 23');
    });
  });

  describe('ModernUI機能の統合', () => {
    beforeEach(() => {
      modernGameUI = new ModernGameUI(container);
    });

    test('テーマ切り替えが正常に動作する', () => {
      // 初期テーマ確認
      expect(modernGameUI.getState().currentTheme).toBe('dark');

      // テーマ切り替え
      modernGameUI.toggleTheme();

      expect(modernGameUI.getState().currentTheme).toBe('light');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    test('CSS変数が正しく適用される', () => {
      modernGameUI.toggleTheme(); // lightテーマに切り替え

      const root = document.documentElement;
      const bgPrimary = getComputedStyle(root).getPropertyValue('--bg-primary');

      // lightテーマの背景色が適用されているか確認
      expect(bgPrimary).toBeTruthy();
    });

    test('通知機能が正常に動作する', () => {
      modernGameUI.showNotification('Test message', 'success', 3000);

      expect(modernGameUI.getState().notifications.length).toBe(1);
      expect(document.querySelector('.notification')).toBeTruthy();
      expect(document.querySelector('.notification-message').textContent).toBe('Test message');
    });

    test('モーダル機能が正常に動作する', () => {
      modernGameUI.showModal('test-modal');

      expect(modernGameUI.getState().activeModals.length).toBe(1);
      expect(modernGameUI.getState().activeModals[0].id).toBe('test-modal');
    });
  });

  describe('レスポンシブ対応', () => {
    beforeEach(() => {
      modernGameUI = new ModernGameUI(container, { enableResponsive: true });
    });

    test('ビューポート変更が正常に処理される', () => {
      // モバイルビューポートのシミュレーション
      modernGameUI.updateResponsiveState(true);

      expect(document.documentElement.getAttribute('data-viewport')).toBe('mobile');
    });

    test('デスクトップビューポートが正常に処理される', () => {
      modernGameUI.updateResponsiveState(false);

      expect(document.documentElement.getAttribute('data-viewport')).toBe('desktop');
    });

    test('ビューポート変更イベントが発火される', () => {
      const mockCallback = jest.fn();
      modernGameUI.on('viewportChanged', mockCallback);

      modernGameUI.updateResponsiveState(true);

      expect(mockCallback).toHaveBeenCalledWith({ isMobile: true });
    });
  });

  describe('アクセシビリティ', () => {
    beforeEach(() => {
      modernGameUI = new ModernGameUI(container, { enableAccessibility: true });
    });

    test('キーボードナビゲーションが正常に動作する', () => {
      modernGameUI.showMenu();

      const menuItems = container.querySelectorAll('.menu-item');
      const firstItem = menuItems[0];
      const lastItem = menuItems[menuItems.length - 1];

      // Tabキーのシミュレーション
      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
      firstItem.focus();
      modernGameUI.handleKeyboardNavigation(tabEvent);

      // フォーカス管理の確認
      expect(document.activeElement).toBeTruthy();
    });

    test('Escapeキーでモーダルが閉じる', () => {
      modernGameUI.showModal('test-modal');

      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      modernGameUI.handleKeyboardNavigation(escapeEvent);

      expect(modernGameUI.getState().activeModals.length).toBe(0);
    });

    test('アクセシビリティ設定が正しく適用される', () => {
      const settings = {
        highContrast: true,
        largeText: true,
        reducedMotion: true,
      };

      modernGameUI.updateAccessibility(settings);

      const root = document.documentElement;
      expect(root.getAttribute('data-high-contrast')).toBe('true');
      expect(root.getAttribute('data-large-text')).toBe('true');
      expect(root.getAttribute('data-reduced-motion')).toBe('true');
    });
  });

  describe('イベントシステム', () => {
    beforeEach(() => {
      modernGameUI = new ModernGameUI(container);
    });

    test('イベントリスナーの登録と発火が正常に動作する', () => {
      const mockCallback = jest.fn();
      modernGameUI.on('testEvent', mockCallback);

      modernGameUI.emit('testEvent', { data: 'test' });

      expect(mockCallback).toHaveBeenCalledWith({ data: 'test' });
    });

    test('テーマ変更イベントが正常に発火される', () => {
      const mockCallback = jest.fn();
      modernGameUI.on('themeChanged', mockCallback);

      modernGameUI.toggleTheme();

      expect(mockCallback).toHaveBeenCalledWith({ theme: 'light' });
    });

    test('UI初期化イベントが正常に発火される', () => {
      const mockCallback = jest.fn();

      const newModernGameUI = new ModernGameUI(container);
      newModernGameUI.on('uiInitialized', mockCallback);

      expect(mockCallback).toHaveBeenCalled();

      newModernGameUI.destroy();
    });
  });

  describe('エラーハンドリング', () => {
    beforeEach(() => {
      modernGameUI = new ModernGameUI(container);
    });

    test('無効なモーダルIDの処理が安全', () => {
      expect(() => {
        modernGameUI.closeModal('non-existent-modal');
      }).not.toThrow();
    });

    test('無効な通知IDの処理が安全', () => {
      expect(() => {
        modernGameUI.closeNotification('non-existent-notification');
      }).not.toThrow();
    });

    test('イベントリスナーエラーが他の処理に影響しない', () => {
      const errorCallback = jest.fn(() => {
        throw new Error('Test error');
      });
      const normalCallback = jest.fn();

      modernGameUI.on('testEvent', errorCallback);
      modernGameUI.on('testEvent', normalCallback);

      expect(() => {
        modernGameUI.emit('testEvent');
      }).not.toThrow();

      expect(normalCallback).toHaveBeenCalled();
    });
  });

  describe('破棄処理', () => {
    test('リソースが正しく解放される', () => {
      modernGameUI = new ModernGameUI(container);

      expect(modernGameUI.getState().isInitialized).toBe(true);

      modernGameUI.destroy();

      expect(modernGameUI.getState().isInitialized).toBe(false);
      expect(modernGameUI.components.size).toBe(0);
      expect(modernGameUI.listeners.size).toBe(0);
    });
  });
});
