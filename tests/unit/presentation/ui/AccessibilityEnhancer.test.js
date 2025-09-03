/**
 * AccessibilityEnhancer Unit Tests
 *
 * TDD Red Phase: アクセシビリティ強化コンポーネントのテスト定義
 *
 * @file AccessibilityEnhancer.test.js
 * @description アクセシビリティ機能の包括的テスト
 */

import { AccessibilityEnhancer } from '../../../../src/presentation/ui/AccessibilityEnhancer.js';

// DOM環境モック
const createMockElement = () => {
  const element = {
    appendChild: jest.fn(),
    removeChild: jest.fn(),
    querySelector: jest.fn(),
    querySelectorAll: jest.fn(() => []),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    setAttribute: jest.fn(),
    getAttribute: jest.fn(),
    removeAttribute: jest.fn(),
    hasAttribute: jest.fn(() => false),
    focus: jest.fn(),
    blur: jest.fn(),
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
    tagName: 'DIV',
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
  querySelectorAll: jest.fn(() => []),
  querySelector: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  activeElement: createMockElement(),
  body: createMockElement(),
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
  speechSynthesis: {
    speak: jest.fn(),
    cancel: jest.fn(),
    getVoices: jest.fn(() => []),
  },
  SpeechSynthesisUtterance: jest.fn().mockImplementation(text => ({
    text,
    rate: 1.0,
    pitch: 1.0,
    volume: 0.8,
    voice: null,
  })),
};

global.navigator = {
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
};

global.performance = {
  now: jest.fn(() => Date.now()),
};

global.SpeechSynthesisUtterance = global.window.SpeechSynthesisUtterance;

describe('AccessibilityEnhancer', () => {
  let accessibilityEnhancer;
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
    global.document.querySelectorAll = jest.fn(() => []);
    global.document.addEventListener = jest.fn();
    global.document.removeEventListener = jest.fn();

    // window.matchMediaをJest mockとしてリセット
    global.window.matchMedia = jest.fn(() => ({
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));

    // speechSynthesisをJest mockとしてリセット
    global.window.speechSynthesis = {
      speak: jest.fn(),
      cancel: jest.fn(),
      getVoices: jest.fn(() => []),
    };
  });

  afterEach(() => {
    if (accessibilityEnhancer) {
      accessibilityEnhancer.destroy();
    }
    jest.clearAllMocks();
  });

  describe('基本機能', () => {
    test('正常に初期化される', () => {
      accessibilityEnhancer = new AccessibilityEnhancer('#game-container');

      expect(accessibilityEnhancer.container).toBe(mockContainer);
      expect(accessibilityEnhancer.isInitialized).toBe(true);
      expect(accessibilityEnhancer.isEnabled).toBe(true);
    });

    test('カスタム設定で初期化される', () => {
      const customConfig = {
        enableScreenReader: true,
        enableKeyboardNavigation: true,
        enableHighContrast: true,
        enableFocusManagement: true,
        announceInterval: 1000,
      };

      accessibilityEnhancer = new AccessibilityEnhancer('#game-container', customConfig);

      expect(accessibilityEnhancer.config.enableScreenReader).toBe(true);
      expect(accessibilityEnhancer.config.enableKeyboardNavigation).toBe(true);
      expect(accessibilityEnhancer.config.enableHighContrast).toBe(true);
      expect(accessibilityEnhancer.config.announceInterval).toBe(1000);
    });

    test('無効なコンテナでエラーが発生する', () => {
      global.document.getElementById.mockReturnValue(null);

      expect(() => {
        new AccessibilityEnhancer('#invalid-container');
      }).toThrow('Accessibility container not found');
    });
  });

  describe('ARIA属性管理', () => {
    beforeEach(() => {
      accessibilityEnhancer = new AccessibilityEnhancer('#game-container');
    });

    test('ARIA属性が設定される', () => {
      const element = createMockElement();

      accessibilityEnhancer.setAriaLabel(element, 'Combo display');

      expect(element.setAttribute).toHaveBeenCalledWith('aria-label', 'Combo display');
    });

    test('ARIA説明が設定される', () => {
      const element = createMockElement();

      accessibilityEnhancer.setAriaDescription(element, 'Current combo level is 5');

      expect(element.setAttribute).toHaveBeenCalledWith('aria-describedby', expect.any(String));
    });

    test('ARIAライブリージョンが作成される', () => {
      const liveRegion = accessibilityEnhancer.createLiveRegion('polite');

      expect(liveRegion.setAttribute).toHaveBeenCalledWith('aria-live', 'polite');
      expect(liveRegion.setAttribute).toHaveBeenCalledWith('aria-atomic', 'true');
      expect(liveRegion.setAttribute).toHaveBeenCalledWith('role', 'status');
    });

    test('ARIA状態が更新される', () => {
      const element = createMockElement();

      accessibilityEnhancer.updateAriaState(element, 'expanded', true);

      expect(element.setAttribute).toHaveBeenCalledWith('aria-expanded', 'true');
    });

    test('ARIAプロパティが削除される', () => {
      const element = createMockElement();

      accessibilityEnhancer.removeAriaProperty(element, 'describedby');

      expect(element.removeAttribute).toHaveBeenCalledWith('aria-describedby');
    });
  });

  describe('スクリーンリーダー対応', () => {
    beforeEach(() => {
      accessibilityEnhancer = new AccessibilityEnhancer('#game-container', {
        enableScreenReader: true,
      });
    });

    test('テキストがアナウンスされる', () => {
      accessibilityEnhancer.announce('Combo level 5 achieved');

      expect(typeof accessibilityEnhancer.lastAnnouncement).toBe('string');
    });

    test('ライブリージョンでアナウンスされる', () => {
      accessibilityEnhancer.announceToLiveRegion('Game started');

      expect(accessibilityEnhancer.liveRegion.textContent).toBe('Game started');
    });

    test('緊急アナウンスが即座に再生される', () => {
      accessibilityEnhancer.announceUrgent('Game over');

      expect(typeof accessibilityEnhancer.lastAnnouncement).toBe('string');
    });

    test('アナウンス履歴が管理される', () => {
      accessibilityEnhancer.announce('First message');
      accessibilityEnhancer.announce('Second message');

      const history = accessibilityEnhancer.getAnnouncementHistory();

      expect(history).toHaveLength(2);
      expect(history[0].text).toBe('First message');
      expect(history[1].text).toBe('Second message');
    });

    test('重複アナウンスが防止される', () => {
      accessibilityEnhancer.announce('Same message');
      accessibilityEnhancer.announce('Same message');

      const history = accessibilityEnhancer.getAnnouncementHistory();

      expect(history).toHaveLength(1);
    });
  });

  describe('キーボードナビゲーション', () => {
    beforeEach(() => {
      accessibilityEnhancer = new AccessibilityEnhancer('#game-container', {
        enableKeyboardNavigation: true,
      });
    });

    test('キーボードイベントリスナーが設定される', () => {
      expect(global.document.addEventListener).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      );
    });

    test('フォーカス可能要素が検出される', () => {
      const focusableElements = [createMockElement(), createMockElement()];
      global.document.querySelectorAll.mockReturnValue(focusableElements);

      const elements = accessibilityEnhancer.getFocusableElements();

      expect(elements).toEqual(focusableElements);
    });

    test('タブ順序が設定される', () => {
      const element = createMockElement();

      accessibilityEnhancer.setTabIndex(element, 0);

      expect(element.setAttribute).toHaveBeenCalledWith('tabindex', '0');
    });

    test('フォーカストラップが作動する', () => {
      const firstElement = createMockElement();
      const lastElement = createMockElement();

      accessibilityEnhancer.createFocusTrap([firstElement, lastElement]);

      const mockEvent = {
        key: 'Tab',
        shiftKey: true,
        preventDefault: jest.fn(),
        target: firstElement,
      };

      accessibilityEnhancer._handleKeyDown(mockEvent);

      expect(lastElement.focus).toHaveBeenCalled();
    });

    test('ショートカットキーが処理される', () => {
      const callback = jest.fn();

      accessibilityEnhancer.registerShortcut('Ctrl+Space', callback);

      const mockEvent = {
        key: 'Space',
        ctrlKey: true,
        preventDefault: jest.fn(),
      };

      accessibilityEnhancer._handleKeyDown(mockEvent);

      expect(callback).toHaveBeenCalled();
    });
  });

  describe('フォーカス管理', () => {
    beforeEach(() => {
      accessibilityEnhancer = new AccessibilityEnhancer('#game-container', {
        enableFocusManagement: true,
      });
    });

    test('フォーカスが設定される', () => {
      const element = createMockElement();

      accessibilityEnhancer.setFocus(element);

      expect(element.focus).toHaveBeenCalled();
    });

    test('フォーカス履歴が管理される', () => {
      const element1 = createMockElement();
      const element2 = createMockElement();

      accessibilityEnhancer.setFocus(element1);
      accessibilityEnhancer.setFocus(element2);

      const history = accessibilityEnhancer.getFocusHistory();

      expect(history).toHaveLength(2);
      expect(history[0]).toBe(element1);
      expect(history[1]).toBe(element2);
    });

    test('前のフォーカスに戻る', () => {
      const element1 = createMockElement();
      const element2 = createMockElement();

      accessibilityEnhancer.setFocus(element1);
      accessibilityEnhancer.setFocus(element2);
      accessibilityEnhancer.restorePreviousFocus();

      expect(element1.focus).toHaveBeenCalledTimes(2); // 初回設定 + 復元
    });

    test('フォーカス表示が強化される', () => {
      const element = createMockElement();

      accessibilityEnhancer.enhanceFocusVisibility(element);

      expect(element.classList.add).toHaveBeenCalledWith('accessibility-focus-enhanced');
    });

    test('フォーカスインジケーターが作成される', () => {
      const element = createMockElement();

      accessibilityEnhancer.createFocusIndicator(element);

      expect(global.document.createElement).toHaveBeenCalledWith('div');
    });
  });

  describe('ハイコントラストモード', () => {
    beforeEach(() => {
      accessibilityEnhancer = new AccessibilityEnhancer('#game-container', {
        enableHighContrast: true,
      });
    });

    test('ハイコントラストモードが有効化される', () => {
      accessibilityEnhancer.enableHighContrast();

      expect(mockContainer.classList.add).toHaveBeenCalledWith('high-contrast-mode');
    });

    test('ハイコントラストモードが無効化される', () => {
      accessibilityEnhancer.disableHighContrast();

      expect(mockContainer.classList.remove).toHaveBeenCalledWith('high-contrast-mode');
    });

    test('コントラスト比が計算される', () => {
      const ratio = accessibilityEnhancer.calculateContrastRatio('#ffffff', '#000000');

      expect(ratio).toBeGreaterThan(20);
    });

    test('WCAG適合性がチェックされる', () => {
      const isCompliant = accessibilityEnhancer.checkWCAGCompliance('#ffffff', '#000000', 'AA');

      expect(isCompliant).toBe(true);
    });

    test('色覚異常対応が適用される', () => {
      accessibilityEnhancer.applyColorBlindnessFilter('protanopia');

      expect(mockContainer.classList.add).toHaveBeenCalledWith('colorblind-protanopia');
    });
  });

  describe('音声フィードバック', () => {
    beforeEach(() => {
      accessibilityEnhancer = new AccessibilityEnhancer('#game-container');
    });

    test('音声設定が構成される', () => {
      const voiceConfig = {
        rate: 1.2,
        pitch: 1.0,
        volume: 0.8,
        voice: 'english',
      };

      accessibilityEnhancer.configureVoice(voiceConfig);

      expect(accessibilityEnhancer.voiceConfig.rate).toBe(1.2);
      expect(accessibilityEnhancer.voiceConfig.pitch).toBe(1.0);
    });

    test('サウンドキューが再生される', () => {
      const soundCue = accessibilityEnhancer.playSoundCue('success');

      expect(typeof soundCue).toBe('object');
    });

    test('音声ガイダンスが設定される', () => {
      accessibilityEnhancer.setVoiceGuidance(true);

      expect(accessibilityEnhancer.isVoiceGuidanceEnabled).toBe(true);
    });

    test('音声フィードバックレベルが調整される', () => {
      accessibilityEnhancer.setFeedbackLevel('detailed');

      expect(accessibilityEnhancer.feedbackLevel).toBe('detailed');
    });
  });

  describe('モーション配慮', () => {
    beforeEach(() => {
      accessibilityEnhancer = new AccessibilityEnhancer('#game-container');
    });

    test('モーション削減設定が検出される', () => {
      global.window.matchMedia.mockReturnValue({ matches: true });

      const prefersReducedMotion = accessibilityEnhancer.prefersReducedMotion();

      expect(prefersReducedMotion).toBe(true);
    });

    test('アニメーション設定が調整される', () => {
      accessibilityEnhancer.adjustAnimationsForMotionSensitivity(true);

      expect(mockContainer.classList.add).toHaveBeenCalledWith('reduced-motion');
    });

    test('視差効果が無効化される', () => {
      accessibilityEnhancer.disableParallaxEffects();

      expect(mockContainer.classList.add).toHaveBeenCalledWith('no-parallax');
    });

    test('自動再生が制御される', () => {
      accessibilityEnhancer.controlAutoplay(false);

      expect(accessibilityEnhancer.isAutoplayEnabled).toBe(false);
    });
  });

  describe('テキスト読みやすさ', () => {
    beforeEach(() => {
      accessibilityEnhancer = new AccessibilityEnhancer('#game-container');
    });

    test('テキストサイズが調整される', () => {
      accessibilityEnhancer.adjustTextSize(1.2);

      expect(mockContainer.style.fontSize).toBeDefined();
    });

    test('行間が調整される', () => {
      accessibilityEnhancer.adjustLineHeight(1.5);

      expect(mockContainer.style.lineHeight).toBeDefined();
    });

    test('フォントファミリーが変更される', () => {
      accessibilityEnhancer.setAccessibleFont('OpenDyslexic');

      expect(mockContainer.style.fontFamily).toBeDefined();
    });

    test('テキスト間隔が調整される', () => {
      accessibilityEnhancer.adjustTextSpacing({
        letterSpacing: '0.1em',
        wordSpacing: '0.2em',
      });

      expect(mockContainer.style.letterSpacing).toBeDefined();
      expect(mockContainer.style.wordSpacing).toBeDefined();
    });
  });

  describe('ユーザー設定', () => {
    beforeEach(() => {
      accessibilityEnhancer = new AccessibilityEnhancer('#game-container');
    });

    test('ユーザー設定が保存される', () => {
      const settings = {
        highContrast: true,
        textSize: 1.2,
        reducedMotion: true,
      };

      accessibilityEnhancer.saveUserSettings(settings);

      expect(accessibilityEnhancer.userSettings).toEqual(settings);
    });

    test('ユーザー設定が読み込まれる', () => {
      const mockSettings = { highContrast: true };
      accessibilityEnhancer.userSettings = mockSettings;

      const loadedSettings = accessibilityEnhancer.loadUserSettings();

      expect(loadedSettings).toEqual(mockSettings);
    });

    test('デフォルト設定にリセットされる', () => {
      accessibilityEnhancer.saveUserSettings({ highContrast: true });
      accessibilityEnhancer.resetToDefaults();

      expect(accessibilityEnhancer.userSettings).toEqual({});
    });

    test('設定プロファイルが適用される', () => {
      accessibilityEnhancer.applySettingsProfile('vision-impaired');

      expect(accessibilityEnhancer.isHighContrastEnabled).toBe(true);
    });
  });

  describe('互換性チェック', () => {
    beforeEach(() => {
      accessibilityEnhancer = new AccessibilityEnhancer('#game-container');
    });

    test('スクリーンリーダー互換性がチェックされる', () => {
      const compatibility = accessibilityEnhancer.checkScreenReaderCompatibility();

      expect(typeof compatibility).toBe('object');
      expect(compatibility.nvda).toBeDefined();
      expect(compatibility.jaws).toBeDefined();
      expect(compatibility.voiceOver).toBeDefined();
    });

    test('ブラウザ機能がチェックされる', () => {
      const features = accessibilityEnhancer.checkBrowserFeatures();

      expect(typeof features).toBe('object');
      expect(features.speechSynthesis).toBeDefined();
      expect(features.focusVisible).toBeDefined();
    });

    test('WAI-ARIA準拠がチェックされる', () => {
      const compliance = accessibilityEnhancer.checkAriaCompliance();

      expect(typeof compliance).toBe('object');
      expect(compliance.score).toBeDefined();
      expect(compliance.issues).toBeDefined();
    });
  });

  describe('エラーハンドリング', () => {
    beforeEach(() => {
      accessibilityEnhancer = new AccessibilityEnhancer('#game-container');
    });

    test('無効な設定値が適切に処理される', () => {
      const invalidConfig = {
        announceInterval: -100,
        enableScreenReader: 'invalid',
      };

      const enhancer = new AccessibilityEnhancer('#game-container', invalidConfig);

      expect(enhancer.config.announceInterval).toBeGreaterThan(0);
      expect(typeof enhancer.config.enableScreenReader).toBe('boolean');
    });

    test('アナウンス失敗時も安全に動作する', () => {
      global.window.speechSynthesis.speak.mockImplementation(() => {
        throw new Error('Speech synthesis failed');
      });

      expect(() => {
        accessibilityEnhancer.announce('Test message');
      }).not.toThrow();
    });

    test('コンテナ削除後も安全に動作する', () => {
      accessibilityEnhancer.container.parentNode = null;

      expect(() => {
        accessibilityEnhancer.announce('Test message');
      }).not.toThrow();
    });

    test('コンポーネントが適切に破棄される', () => {
      accessibilityEnhancer.destroy();

      expect(accessibilityEnhancer.isDestroyed).toBe(true);
      expect(global.document.removeEventListener).toHaveBeenCalled();
    });
  });

  describe('統合シナリオ', () => {
    beforeEach(() => {
      accessibilityEnhancer = new AccessibilityEnhancer('#game-container', {
        enableScreenReader: true,
        enableKeyboardNavigation: true,
        enableHighContrast: true,
      });
    });

    test('完全なアクセシビリティワークフロー', () => {
      // ハイコントラストモード有効化
      accessibilityEnhancer.enableHighContrast();

      // ゲーム状態アナウンス
      accessibilityEnhancer.announce('Game started');

      // フォーカス管理
      const element = createMockElement();
      accessibilityEnhancer.setFocus(element);

      expect(mockContainer.classList.add).toHaveBeenCalledWith('high-contrast-mode');
      expect(typeof accessibilityEnhancer.lastAnnouncement).toBe('string');
      expect(element.focus).toHaveBeenCalled();
    });

    test('視覚障害ユーザー向け最適化', () => {
      accessibilityEnhancer.applySettingsProfile('vision-impaired');

      expect(accessibilityEnhancer.isHighContrastEnabled).toBe(true);
      expect(accessibilityEnhancer.isVoiceGuidanceEnabled).toBe(true);
    });

    test('運動障害ユーザー向け最適化', () => {
      accessibilityEnhancer.applySettingsProfile('motor-impaired');

      expect(accessibilityEnhancer.isReducedMotionEnabled).toBe(true);
      expect(accessibilityEnhancer.isKeyboardNavigationOptimized).toBe(true);
    });

    test('認知障害ユーザー向け最適化', () => {
      accessibilityEnhancer.applySettingsProfile('cognitive-impaired');

      expect(accessibilityEnhancer.isSimplifiedInterfaceEnabled).toBe(true);
      expect(accessibilityEnhancer.feedbackLevel).toBe('detailed');
    });
  });
});
