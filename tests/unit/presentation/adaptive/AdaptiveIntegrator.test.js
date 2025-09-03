/**
 * AdaptiveIntegrator.test.js - AdaptiveIntegrator テスト
 *
 * TDD Red Phase: テストを通すための実装
 *
 * 責任:
 * - 既存システム（Responsive/Accessibility/Performance）の統合管理
 * - システム間のデータ連携と整合性保証
 * - エラーハンドリングと障害分離
 * - 統合ライフサイクル管理
 */

import { AdaptiveIntegrator } from '../../../../src/presentation/adaptive/AdaptiveIntegrator.js';

// モックファクトリー
const createMockResponsiveManager = () => ({
  currentBreakpoint: 'desktop',
  currentOrientation: 'landscape',
  devicePerformance: 'high',
  _breakpointChangeCallbacks: [],
  _orientationChangeCallbacks: [],
  _resizeCallbacks: [],
  integrateComboDisplayUI: jest.fn(),
  integrateComboAnimationController: jest.fn(),
  updateBreakpoint: jest.fn(),
  updateOrientation: jest.fn(),
  destroy: jest.fn(),
});

const createMockAccessibilityEnhancer = () => ({
  isHighContrastEnabled: false,
  isVoiceGuidanceEnabled: false,
  isReducedMotionEnabled: false,
  feedbackLevel: 'normal',
  userSettings: {},
  setAriaAttribute: jest.fn(),
  announce: jest.fn(),
  enableHighContrastMode: jest.fn(),
  destroy: jest.fn(),
});

const createMockPerformanceOptimizer = () => ({
  performanceMetrics: {
    fps: 60,
    frameTime: 16.67,
    memoryUsage: 2.5,
    cpuUsage: 15,
  },
  updateMetrics: jest.fn(),
  optimizePerformance: jest.fn(),
  getStats: jest.fn(() => ({ totalOptimizations: 0 })),
});

describe('AdaptiveIntegrator', () => {
  let integrator;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (integrator) {
      integrator.destroy();
    }
  });

  describe('初期化', () => {
    test('正常に初期化される', () => {
      integrator = new AdaptiveIntegrator();

      expect(integrator.systemIntegrations).toBeInstanceOf(Map);
      expect(integrator.dataStreams).toBeInstanceOf(Map);
      expect(integrator.syncQueue).toEqual([]);
      expect(integrator.isDestroyed).toBe(false);
    });

    test('設定オプションが正しく適用される', () => {
      const config = {
        enableAutoSync: false,
        syncInterval: 2000,
        maxRetries: 5,
      };
      integrator = new AdaptiveIntegrator(config);

      expect(integrator.config.enableAutoSync).toBe(false);
      expect(integrator.config.syncInterval).toBe(2000);
      expect(integrator.config.maxRetries).toBe(5);
    });

    test('デフォルト設定が正しく適用される', () => {
      integrator = new AdaptiveIntegrator();

      expect(integrator.config.enableAutoSync).toBe(true);
      expect(integrator.config.syncInterval).toBe(1000);
      expect(integrator.config.maxRetries).toBe(3);
    });
  });

  describe('ResponsiveComboManager統合', () => {
    beforeEach(() => {
      integrator = new AdaptiveIntegrator();
    });

    test('ResponsiveComboManagerが正常に統合される', async () => {
      const mockResponsiveManager = createMockResponsiveManager();

      await integrator.integrateResponsiveManager(mockResponsiveManager);

      expect(integrator.systemIntegrations.has('responsive')).toBe(true);
      expect(mockResponsiveManager._breakpointChangeCallbacks).toHaveLength(1);
      expect(mockResponsiveManager._orientationChangeCallbacks).toHaveLength(1);
    });

    test('ブレークポイント変更がキャプチャされる', async () => {
      const mockManager = createMockResponsiveManager();
      await integrator.integrateResponsiveManager(mockManager);

      // ブレークポイント変更をシミュレート
      mockManager.currentBreakpoint = 'mobile';
      mockManager._breakpointChangeCallbacks[0]('mobile');

      const state = integrator.getIntegratedState();
      expect(state.responsive.breakpoint).toBe('mobile');
    });

    test('方向変更がキャプチャされる', async () => {
      const mockManager = createMockResponsiveManager();
      await integrator.integrateResponsiveManager(mockManager);

      // 方向変更をシミュレート
      mockManager.currentOrientation = 'portrait';
      mockManager._orientationChangeCallbacks[0]('portrait');

      const state = integrator.getIntegratedState();
      expect(state.responsive.orientation).toBe('portrait');
    });

    test('null/undefinedの統合でエラーが発生する', async () => {
      await expect(integrator.integrateResponsiveManager(null)).rejects.toThrow(
        'ResponsiveManager cannot be null or undefined'
      );
    });
  });

  describe('AccessibilityEnhancer統合', () => {
    beforeEach(() => {
      integrator = new AdaptiveIntegrator();
    });

    test('AccessibilityEnhancerが正常に統合される', async () => {
      const mockAccessibilityEnhancer = createMockAccessibilityEnhancer();

      await integrator.integrateAccessibilityEnhancer(mockAccessibilityEnhancer);

      expect(integrator.systemIntegrations.has('accessibility')).toBe(true);
    });

    test('アクセシビリティ状態が正しく取得される', async () => {
      const mockEnhancer = createMockAccessibilityEnhancer();
      mockEnhancer.isHighContrastEnabled = true;
      mockEnhancer.isVoiceGuidanceEnabled = true;

      await integrator.integrateAccessibilityEnhancer(mockEnhancer);

      const state = integrator.getIntegratedState();
      expect(state.accessibility.highContrast).toBe(true);
      expect(state.accessibility.voiceGuidance).toBe(true);
    });

    test('null/undefinedの統合でエラーが発生する', async () => {
      await expect(integrator.integrateAccessibilityEnhancer(null)).rejects.toThrow(
        'AccessibilityEnhancer cannot be null or undefined'
      );
    });
  });

  describe('PerformanceOptimizer統合', () => {
    beforeEach(() => {
      integrator = new AdaptiveIntegrator();
    });

    test('PerformanceOptimizerが正常に統合される', async () => {
      const mockPerformanceOptimizer = createMockPerformanceOptimizer();

      await integrator.integratePerformanceOptimizer(mockPerformanceOptimizer);

      expect(integrator.systemIntegrations.has('performance')).toBe(true);
    });

    test('パフォーマンス指標が正しく取得される', async () => {
      const mockOptimizer = createMockPerformanceOptimizer();
      mockOptimizer.performanceMetrics.fps = 45;
      mockOptimizer.performanceMetrics.memoryUsage = 5.2;

      await integrator.integratePerformanceOptimizer(mockOptimizer);

      const state = integrator.getIntegratedState();
      expect(state.performance.currentFPS).toBe(45);
      expect(state.performance.memoryUsage).toBe(5.2);
    });
  });

  describe('統合状態管理', () => {
    beforeEach(() => {
      integrator = new AdaptiveIntegrator();
    });

    test('統合状態が正しく同期される', async () => {
      const mockResponsive = createMockResponsiveManager();
      const mockAccessibility = createMockAccessibilityEnhancer();

      await integrator.integrateResponsiveManager(mockResponsive);
      await integrator.integrateAccessibilityEnhancer(mockAccessibility);

      const state = integrator.getIntegratedState();

      expect(state).toHaveProperty('responsive');
      expect(state).toHaveProperty('accessibility');
      expect(state.responsive.breakpoint).toBeDefined();
      expect(state.accessibility.highContrast).toBeDefined();
    });

    test('システム状態の同期が機能する', async () => {
      const mockResponsive = createMockResponsiveManager();
      await integrator.integrateResponsiveManager(mockResponsive);

      await integrator.syncSystemStates();

      const state = integrator.getIntegratedState();
      expect(state.responsive).toBeDefined();
    });

    test('エラー時の分離処理が機能する', async () => {
      const mockResponsive = createMockResponsiveManager();
      // エラーを発生させるモック
      mockResponsive.updateBreakpoint = jest.fn(() => {
        throw new Error('Mock error');
      });

      await integrator.integrateResponsiveManager(mockResponsive);

      // エラーが発生しても他のシステムに影響しないことを確認
      expect(() => integrator.syncSystemStates()).not.toThrow();
      expect(integrator.isDestroyed).toBe(false);
    });
  });

  describe('パフォーマンス', () => {
    beforeEach(() => {
      integrator = new AdaptiveIntegrator();
    });

    test('統合処理が性能要件内で完了する', async () => {
      const mockResponsive = createMockResponsiveManager();

      const startTime = performance.now();
      await integrator.integrateResponsiveManager(mockResponsive);
      await integrator.syncSystemStates();
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(50); // 50ms以内
    });

    test('メモリ使用量が制限内に収まる', async () => {
      const initialMemory = process.memoryUsage ? process.memoryUsage().heapUsed : 0;

      // 複数システムを統合
      await integrator.integrateResponsiveManager(createMockResponsiveManager());
      await integrator.integrateAccessibilityEnhancer(createMockAccessibilityEnhancer());
      await integrator.integratePerformanceOptimizer(createMockPerformanceOptimizer());

      const finalMemory = process.memoryUsage ? process.memoryUsage().heapUsed : 0;
      const memoryIncrease = (finalMemory - initialMemory) / (1024 * 1024);

      // メモリ増加が1MB以下であることを確認
      expect(memoryIncrease).toBeLessThan(1.0);
    });
  });

  describe('破棄処理', () => {
    beforeEach(() => {
      integrator = new AdaptiveIntegrator();
    });

    test('破棄処理が正常に実行される', async () => {
      const mockResponsive = createMockResponsiveManager();
      const mockAccessibility = createMockAccessibilityEnhancer();

      await integrator.integrateResponsiveManager(mockResponsive);
      await integrator.integrateAccessibilityEnhancer(mockAccessibility);

      integrator.destroy();

      expect(integrator.isDestroyed).toBe(true);
      expect(integrator.systemIntegrations.size).toBe(0);
      expect(integrator.dataStreams.size).toBe(0);
    });

    test('破棄後の操作でエラーが発生する', async () => {
      integrator.destroy();

      await expect(
        integrator.integrateResponsiveManager(createMockResponsiveManager())
      ).rejects.toThrow('AdaptiveIntegrator has been destroyed');
    });
  });
});
