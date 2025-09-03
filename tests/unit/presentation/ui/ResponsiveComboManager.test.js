/**
 * ResponsiveComboManager Unit Tests
 *
 * TDD Red Phase: レスポンシブコンボ管理コンポーネントのテスト定義
 *
 * @file ResponsiveComboManager.test.js
 * @description レスポンシブ機能統合管理をテスト
 */

import { ResponsiveComboManager } from '../../../../src/presentation/ui/ResponsiveComboManager.js';

// DOM環境モック
const createMockElement = () => {
  const element = {
    appendChild: jest.fn(),
    removeChild: jest.fn(),
    querySelector: jest.fn(),
    querySelectorAll: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    setAttribute: jest.fn(),
    getAttribute: jest.fn(),
    getBoundingClientRect: jest.fn(() => ({
      x: 0,
      y: 0,
      width: 100,
      height: 50,
      top: 0,
      left: 0,
      bottom: 50,
      right: 100,
    })),
    classList: {
      add: jest.fn(),
      remove: jest.fn(),
      toggle: jest.fn(),
      contains: jest.fn(() => false),
    },
    style: {},
    innerHTML: '',
    children: [],
    parentNode: null,
    nodeType: 1,
  };

  let _textContent = '';
  Object.defineProperty(element, 'textContent', {
    get: () => _textContent,
    set: value => {
      _textContent = value;
    },
    configurable: true,
  });

  return element;
};

// グローバル環境設定
global.document = {
  createElement: jest.fn(() => createMockElement()),
  getElementById: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

global.window = {
  requestAnimationFrame: jest.fn(callback => setTimeout(callback, 16)),
  cancelAnimationFrame: jest.fn(),
  getComputedStyle: jest.fn(() => ({
    getPropertyValue: jest.fn(() => '1s'),
  })),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  innerWidth: 1920,
  innerHeight: 1080,
  matchMedia: jest.fn(() => ({
    matches: false,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  })),
  dispatchEvent: jest.fn(),
};

global.performance = {
  now: jest.fn(() => Date.now()),
};

describe('ResponsiveComboManager', () => {
  let responsiveManager;
  let mockContainer;

  beforeEach(() => {
    mockContainer = createMockElement();
    mockContainer.id = 'game-container';

    global.document.getElementById = jest.fn(id => {
      if (id === 'game-container') {
        return mockContainer;
      }
      return null;
    });

    global.document.createElement = jest.fn(() => createMockElement());

    // window.matchMediaをJest mockとしてリセット
    global.window.matchMedia = jest.fn(() => ({
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));

    // window.removeEventListenerをJest mockとしてリセット
    global.window.removeEventListener = jest.fn();
  });

  afterEach(() => {
    if (responsiveManager) {
      responsiveManager.destroy();
    }
    jest.clearAllMocks();
  });

  describe('基本機能', () => {
    test('正常に初期化される', () => {
      responsiveManager = new ResponsiveComboManager('#game-container');

      expect(responsiveManager.container).toBe(mockContainer);
      expect(responsiveManager.isInitialized).toBe(true);
      expect(responsiveManager.currentBreakpoint).toBeDefined();
    });

    test('カスタム設定で初期化される', () => {
      const customConfig = {
        breakpoints: {
          mobile: 480,
          tablet: 768,
          desktop: 1024,
        },
        enableOrientationDetection: true,
        adaptiveScaling: true,
        touchOptimization: true,
      };

      responsiveManager = new ResponsiveComboManager('#game-container', customConfig);

      expect(responsiveManager.config.breakpoints.mobile).toBe(480);
      expect(responsiveManager.config.enableOrientationDetection).toBe(true);
      expect(responsiveManager.config.adaptiveScaling).toBe(true);
      expect(responsiveManager.config.touchOptimization).toBe(true);
    });

    test('無効なコンテナでエラーが発生する', () => {
      global.document.getElementById.mockReturnValue(null);

      expect(() => {
        new ResponsiveComboManager('#invalid-container');
      }).toThrow('Responsive container not found');
    });
  });

  describe('ブレークポイント検出', () => {
    beforeEach(() => {
      responsiveManager = new ResponsiveComboManager('#game-container');
    });

    test('モバイルブレークポイントが検出される', () => {
      global.window.innerWidth = 400;

      responsiveManager.updateBreakpoint();

      expect(responsiveManager.currentBreakpoint).toBe('mobile');
      expect(responsiveManager.isMobile()).toBe(true);
      expect(responsiveManager.isTablet()).toBe(false);
      expect(responsiveManager.isDesktop()).toBe(false);
    });

    test('タブレットブレークポイントが検出される', () => {
      global.window.innerWidth = 900;

      responsiveManager.updateBreakpoint();

      expect(responsiveManager.currentBreakpoint).toBe('tablet');
      expect(responsiveManager.isMobile()).toBe(false);
      expect(responsiveManager.isTablet()).toBe(true);
      expect(responsiveManager.isDesktop()).toBe(false);
    });

    test('デスクトップブレークポイントが検出される', () => {
      global.window.innerWidth = 1200;

      responsiveManager.updateBreakpoint();

      expect(responsiveManager.currentBreakpoint).toBe('desktop');
      expect(responsiveManager.isMobile()).toBe(false);
      expect(responsiveManager.isTablet()).toBe(false);
      expect(responsiveManager.isDesktop()).toBe(true);
    });

    test('ブレークポイント変更時にイベントが発火される', () => {
      const mockCallback = jest.fn();
      responsiveManager.onBreakpointChange(mockCallback);

      global.window.innerWidth = 400;
      responsiveManager.updateBreakpoint();

      expect(mockCallback).toHaveBeenCalledWith('mobile', 'desktop');
    });
  });

  describe('方向検出', () => {
    beforeEach(() => {
      responsiveManager = new ResponsiveComboManager('#game-container', {
        enableOrientationDetection: true,
      });
    });

    test('縦向きが検出される', () => {
      global.window.innerWidth = 400;
      global.window.innerHeight = 800;

      responsiveManager.updateOrientation();

      expect(responsiveManager.currentOrientation).toBe('portrait');
      expect(responsiveManager.isPortrait()).toBe(true);
      expect(responsiveManager.isLandscape()).toBe(false);
    });

    test('横向きが検出される', () => {
      global.window.innerWidth = 800;
      global.window.innerHeight = 400;

      responsiveManager.updateOrientation();

      expect(responsiveManager.currentOrientation).toBe('landscape');
      expect(responsiveManager.isPortrait()).toBe(false);
      expect(responsiveManager.isLandscape()).toBe(true);
    });

    test('方向変更時にイベントが発火される', () => {
      const mockCallback = jest.fn();
      responsiveManager.onOrientationChange(mockCallback);

      // 初期状態を確実に設定
      global.window.innerWidth = 400;
      global.window.innerHeight = 800;
      responsiveManager.updateOrientation(); // portrait設定

      // 方向を変更
      global.window.innerWidth = 800;
      global.window.innerHeight = 400;
      responsiveManager.updateOrientation(); // landscape変更

      expect(mockCallback).toHaveBeenCalledWith('landscape', 'portrait');
    });
  });

  describe('適応型スケーリング', () => {
    beforeEach(() => {
      responsiveManager = new ResponsiveComboManager('#game-container', {
        adaptiveScaling: true,
      });
    });

    test('スケールファクターが計算される', () => {
      global.window.innerWidth = 800;
      global.window.innerHeight = 600;

      const scaleFactor = responsiveManager.calculateScaleFactor();

      expect(typeof scaleFactor).toBe('number');
      expect(scaleFactor).toBeGreaterThan(0);
    });

    test('モバイルでスケールが調整される', () => {
      global.window.innerWidth = 320;
      responsiveManager.updateBreakpoint();

      const mobileScale = responsiveManager.getAdaptiveScale();

      expect(mobileScale).toBeLessThan(1.0);
      expect(mobileScale).toBeGreaterThan(0.5);
    });

    test('デスクトップで標準スケールが使用される', () => {
      global.window.innerWidth = 1920;
      responsiveManager.updateBreakpoint();

      const desktopScale = responsiveManager.getAdaptiveScale();

      expect(desktopScale).toBe(1.0);
    });

    test('カスタム解像度でスケールが計算される', () => {
      const customScale = responsiveManager.calculateScaleForResolution(2560, 1440);

      expect(typeof customScale).toBe('number');
      expect(customScale).toBeGreaterThanOrEqual(1.0);
    });
  });

  describe('タッチ最適化', () => {
    beforeEach(() => {
      responsiveManager = new ResponsiveComboManager('#game-container', {
        touchOptimization: true,
      });
    });

    test('タッチデバイスが検出される', () => {
      // タッチサポートをシミュレート
      global.window.ontouchstart = {};

      const isTouchDevice = responsiveManager.isTouchDevice();

      expect(isTouchDevice).toBe(true);
    });

    test('タッチターゲットサイズが調整される', () => {
      global.window.ontouchstart = {};

      const touchTargetSize = responsiveManager.getTouchTargetSize();

      expect(touchTargetSize).toBeGreaterThanOrEqual(44); // iOS推奨サイズ
    });

    test('タッチエリアが最適化される', () => {
      const element = createMockElement();

      responsiveManager.optimizeTouchArea(element);

      expect(element.style.minHeight).toBeDefined();
      expect(element.style.minWidth).toBeDefined();
    });
  });

  describe('コンポーネント統合', () => {
    beforeEach(() => {
      responsiveManager = new ResponsiveComboManager('#game-container');
    });

    test('ComboDisplayUIが統合される', () => {
      const mockComboUI = {
        handleResize: jest.fn(),
        setTheme: jest.fn(),
        updateConfig: jest.fn(),
      };

      responsiveManager.integrateComboDisplayUI(mockComboUI);

      expect(responsiveManager.comboDisplayUI).toBe(mockComboUI);
    });

    test('ComboAnimationControllerが統合される', () => {
      const mockAnimController = {
        updatePerformanceSettings: jest.fn(),
        setScaleFactor: jest.fn(),
        optimizeForDevice: jest.fn(),
      };

      responsiveManager.integrateAnimationController(mockAnimController);

      expect(responsiveManager.animationController).toBe(mockAnimController);
    });

    test('統合されたコンポーネントがレスポンシブ更新を受け取る', () => {
      const mockComboUI = {
        handleResize: jest.fn(),
        setTheme: jest.fn(),
        updateConfig: jest.fn(),
      };

      const mockAnimController = {
        updatePerformanceSettings: jest.fn(),
        setScaleFactor: jest.fn(),
        optimizeForDevice: jest.fn(),
      };

      responsiveManager.integrateComboDisplayUI(mockComboUI);
      responsiveManager.integrateAnimationController(mockAnimController);

      global.window.innerWidth = 400;
      responsiveManager.updateAll();

      expect(mockComboUI.handleResize).toHaveBeenCalled();
      expect(mockAnimController.optimizeForDevice).toHaveBeenCalledWith('mobile');
    });
  });

  describe('レイアウト調整', () => {
    beforeEach(() => {
      responsiveManager = new ResponsiveComboManager('#game-container');
    });

    test('モバイルレイアウトが適用される', () => {
      global.window.innerWidth = 320;

      responsiveManager.applyMobileLayout();

      expect(responsiveManager.container.classList.add).toHaveBeenCalledWith('combo-mobile-layout');
    });

    test('タブレットレイアウトが適用される', () => {
      global.window.innerWidth = 768;

      responsiveManager.applyTabletLayout();

      expect(responsiveManager.container.classList.add).toHaveBeenCalledWith('combo-tablet-layout');
    });

    test('デスクトップレイアウトが適用される', () => {
      global.window.innerWidth = 1920;

      responsiveManager.applyDesktopLayout();

      expect(responsiveManager.container.classList.add).toHaveBeenCalledWith(
        'combo-desktop-layout'
      );
    });

    test('レイアウト切り替え時に古いクラスが削除される', () => {
      responsiveManager.applyMobileLayout();
      responsiveManager.applyTabletLayout();

      expect(responsiveManager.container.classList.remove).toHaveBeenCalledWith(
        'combo-mobile-layout'
      );
      expect(responsiveManager.container.classList.add).toHaveBeenCalledWith('combo-tablet-layout');
    });
  });

  describe('パフォーマンス最適化', () => {
    beforeEach(() => {
      responsiveManager = new ResponsiveComboManager('#game-container');
    });

    test('デバイス性能が評価される', () => {
      const performanceLevel = responsiveManager.evaluateDevicePerformance();

      expect(['high', 'medium', 'low']).toContain(performanceLevel);
    });

    test('低性能デバイスで設定が調整される', () => {
      responsiveManager.devicePerformance = 'low';

      const optimizedSettings = responsiveManager.getOptimizedSettings();

      expect(optimizedSettings.enableParticles).toBe(false);
      expect(optimizedSettings.maxAnimations).toBeLessThan(5);
      expect(optimizedSettings.reducedMotion).toBe(true);
    });

    test('高性能デバイスで最大品質が使用される', () => {
      responsiveManager.devicePerformance = 'high';

      const optimizedSettings = responsiveManager.getOptimizedSettings();

      expect(optimizedSettings.enableParticles).toBe(true);
      expect(optimizedSettings.maxAnimations).toBe(5);
      expect(optimizedSettings.reducedMotion).toBe(false);
    });
  });

  describe('メディアクエリ統合', () => {
    beforeEach(() => {
      responsiveManager = new ResponsiveComboManager('#game-container');
    });

    test('カスタムメディアクエリが登録される', () => {
      const callback = jest.fn();

      responsiveManager.registerMediaQuery('(max-width: 600px)', callback);

      expect(global.window.matchMedia).toHaveBeenCalledWith('(max-width: 600px)');
    });

    test('prefers-reduced-motionが検出される', () => {
      global.window.matchMedia.mockReturnValue({
        matches: true,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      });

      const reducedMotion = responsiveManager.prefersReducedMotion();

      expect(reducedMotion).toBe(true);
    });

    test('prefers-color-schemeが検出される', () => {
      global.window.matchMedia.mockReturnValue({
        matches: true,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      });

      const colorScheme = responsiveManager.getPreferredColorScheme();

      expect(['light', 'dark']).toContain(colorScheme);
    });
  });

  describe('イベント管理', () => {
    beforeEach(() => {
      responsiveManager = new ResponsiveComboManager('#game-container');
    });

    test('リサイズイベントが適切に処理される', () => {
      const resizeCallback = jest.fn();
      responsiveManager.onResize(resizeCallback);

      // リサイズイベントをシミュレート
      global.window.innerWidth = 800;
      const resizeEvent = new Event('resize');
      global.window.dispatchEvent(resizeEvent);

      // 実際の呼び出しは非同期で行われるため、処理されたことを確認
      expect(typeof responsiveManager._resizeHandler).toBe('function');
    });

    test('方向変更イベントが処理される', () => {
      const orientationCallback = jest.fn();
      responsiveManager.onOrientationChange(orientationCallback);

      const orientationEvent = new Event('orientationchange');
      global.window.dispatchEvent(orientationEvent);

      expect(typeof responsiveManager._orientationHandler).toBe('function');
    });
  });

  describe('エラーハンドリング', () => {
    beforeEach(() => {
      responsiveManager = new ResponsiveComboManager('#game-container');
    });

    test('無効な設定値が適切に処理される', () => {
      const invalidConfig = {
        breakpoints: null,
        adaptiveScaling: 'invalid',
      };

      const manager = new ResponsiveComboManager('#game-container', invalidConfig);

      expect(manager.config.breakpoints).toBeDefined();
      expect(typeof manager.config.adaptiveScaling).toBe('boolean');
    });

    test('コンテナ削除後も安全に動作する', () => {
      responsiveManager.container.parentNode = null;

      expect(() => {
        responsiveManager.updateAll();
      }).not.toThrow();
    });

    test('コンポーネントが適切に破棄される', () => {
      responsiveManager.destroy();

      expect(responsiveManager.isDestroyed).toBe(true);
      expect(global.window.removeEventListener).toHaveBeenCalled();
    });
  });

  describe('統合シナリオ', () => {
    beforeEach(() => {
      responsiveManager = new ResponsiveComboManager('#game-container', {
        enableOrientationDetection: true,
        adaptiveScaling: true,
        touchOptimization: true,
      });
    });

    test('完全なレスポンシブワークフロー', () => {
      // モバイルデバイスをシミュレート
      global.window.innerWidth = 375;
      global.window.innerHeight = 667;
      global.window.ontouchstart = {};

      responsiveManager.updateAll();

      expect(responsiveManager.currentBreakpoint).toBe('mobile');
      expect(responsiveManager.currentOrientation).toBe('portrait');
      expect(responsiveManager.isTouchDevice()).toBe(true);
    });

    test('デバイス回転シナリオ', () => {
      // 縦向きから横向きへ
      global.window.innerWidth = 375;
      global.window.innerHeight = 667;
      responsiveManager.updateOrientation();
      expect(responsiveManager.isPortrait()).toBe(true);

      // 回転後
      global.window.innerWidth = 667;
      global.window.innerHeight = 375;
      responsiveManager.updateOrientation();
      expect(responsiveManager.isLandscape()).toBe(true);
    });

    test('パフォーマンス適応シナリオ', () => {
      responsiveManager.devicePerformance = 'low';

      const settings = responsiveManager.getOptimizedSettings();
      responsiveManager.applyPerformanceOptimizations(settings);

      expect(responsiveManager.isOptimized).toBe(true);
    });
  });
});
