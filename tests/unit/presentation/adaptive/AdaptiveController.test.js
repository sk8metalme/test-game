/**
 * AdaptiveController.test.js - AdaptiveController テスト
 *
 * TDD Red Phase: テストを通すための実装
 *
 * 責任:
 * - 全AdaptiveUIコンポーネントの統合制御
 * - 統一されたAPI提供
 * - ライフサイクル管理（初期化・破棄・状態管理）
 * - 設定管理と状態同期
 * - コンポーネント間の調整
 */

import { AdaptiveController } from '../../../../src/presentation/adaptive/AdaptiveController.js';

// Mock dependencies
const mockResponsiveManager = {
  integrateComboDisplayUI: jest.fn(),
  integrateComboAnimationController: jest.fn(),
  getCurrentState: jest.fn(),
  destroy: jest.fn(),
};

const mockAccessibilityEnhancer = {
  isHighContrastEnabled: false,
  isVoiceGuidanceEnabled: false,
  isReducedMotionEnabled: false,
  userSettings: {},
  destroy: jest.fn(),
};

const mockPerformanceOptimizer = {
  performanceMetrics: { fps: 60, memory: 50 },
  destroy: jest.fn(),
};

const mockMemoryOptimizer = {
  monitorMemory: jest.fn(),
  optimizeMemory: jest.fn(),
  destroy: jest.fn(),
};

describe('AdaptiveController', () => {
  let controller;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = null;
  });

  afterEach(() => {
    if (controller) {
      controller.destroy();
    }
  });

  describe('初期化', () => {
    test('デフォルト設定で初期化される', () => {
      controller = new AdaptiveController();

      expect(controller.isInitialized).toBe(false);
      expect(controller.isDestroyed).toBe(false);
      expect(controller.components).toBeInstanceOf(Map);
      expect(controller.config).toBeDefined();
    });

    test('カスタム設定で初期化される', () => {
      const config = {
        enableAutoOptimization: false,
        updateInterval: 1000,
        performanceThreshold: 45,
      };
      controller = new AdaptiveController(config);

      expect(controller.config.enableAutoOptimization).toBe(false);
      expect(controller.config.updateInterval).toBe(1000);
      expect(controller.config.performanceThreshold).toBe(45);
    });

    test('自動初期化が実行される', async () => {
      controller = new AdaptiveController();

      await controller.initialize();

      expect(controller.isInitialized).toBe(true);
      expect(controller.components.size).toBeGreaterThanOrEqual(0);
    });
  });

  describe('コンポーネント統合', () => {
    beforeEach(async () => {
      controller = new AdaptiveController();
      await controller.initialize();
    });

    test('ResponsiveManagerが統合される', () => {
      controller.integrateResponsiveManager(mockResponsiveManager);

      expect(controller.components.has('responsiveManager')).toBe(true);
      expect(controller.getComponent('responsiveManager')).toBe(mockResponsiveManager);
    });

    test('AccessibilityEnhancerが統合される', () => {
      controller.integrateAccessibilityEnhancer(mockAccessibilityEnhancer);

      expect(controller.components.has('accessibilityEnhancer')).toBe(true);
      expect(controller.getComponent('accessibilityEnhancer')).toBe(mockAccessibilityEnhancer);
    });

    test('PerformanceOptimizerが統合される', () => {
      controller.integratePerformanceOptimizer(mockPerformanceOptimizer);

      expect(controller.components.has('performanceOptimizer')).toBe(true);
      expect(controller.getComponent('performanceOptimizer')).toBe(mockPerformanceOptimizer);
    });

    test('MemoryOptimizerが統合される', () => {
      controller.integrateMemoryOptimizer(mockMemoryOptimizer);

      expect(controller.components.has('memoryOptimizer')).toBe(true);
      expect(controller.getComponent('memoryOptimizer')).toBe(mockMemoryOptimizer);
    });

    test('null/undefinedコンポーネントは拒否される', () => {
      expect(() => {
        controller.integrateResponsiveManager(null);
      }).toThrow('ResponsiveManager cannot be null or undefined');
    });
  });

  describe('統一API', () => {
    beforeEach(async () => {
      controller = new AdaptiveController();
      await controller.initialize();
      controller.integrateResponsiveManager(mockResponsiveManager);
      controller.integrateAccessibilityEnhancer(mockAccessibilityEnhancer);
      controller.integratePerformanceOptimizer(mockPerformanceOptimizer);
    });

    test('統合状態が取得される', () => {
      mockResponsiveManager.getCurrentState.mockReturnValue({
        currentBreakpoint: 'desktop',
        currentOrientation: 'landscape',
      });

      const state = controller.getIntegratedState();

      expect(state.responsive).toBeDefined();
      expect(state.accessibility).toBeDefined();
      expect(state.performance).toBeDefined();
      expect(state.responsive.currentBreakpoint).toBe('desktop');
    });

    test('自動最適化が実行される', async () => {
      const result = await controller.executeAutoOptimization();

      expect(result.executed).toBe(true);
      expect(result.optimizations).toBeInstanceOf(Array);
    });

    test('パフォーマンス監視が開始される', () => {
      controller.startPerformanceMonitoring();

      expect(controller.isMonitoring).toBe(true);
    });

    test('パフォーマンス監視が停止される', () => {
      controller.startPerformanceMonitoring();
      controller.stopPerformanceMonitoring();

      expect(controller.isMonitoring).toBe(false);
    });
  });

  describe('ライフサイクル管理', () => {
    test('初期化が正常に実行される', async () => {
      controller = new AdaptiveController();

      await controller.initialize();

      expect(controller.isInitialized).toBe(true);
    });

    test('二重初期化が防止される', async () => {
      controller = new AdaptiveController();

      await controller.initialize();
      await controller.initialize(); // 二回目

      expect(controller.isInitialized).toBe(true);
    });

    test('破棄が正常に実行される', async () => {
      controller = new AdaptiveController();
      await controller.initialize();
      controller.integrateResponsiveManager(mockResponsiveManager);

      controller.destroy();

      expect(controller.isDestroyed).toBe(true);
      expect(mockResponsiveManager.destroy).toHaveBeenCalled();
    });

    test('破棄後の操作でエラーが発生する', async () => {
      controller = new AdaptiveController();
      await controller.initialize();
      controller.destroy();

      expect(() => {
        controller.getIntegratedState();
      }).toThrow('AdaptiveController has been destroyed');
    });
  });

  describe('設定管理', () => {
    beforeEach(async () => {
      controller = new AdaptiveController();
      await controller.initialize();
    });

    test('設定が更新される', () => {
      const newConfig = {
        enableAutoOptimization: false,
        updateInterval: 2000,
      };

      controller.updateConfig(newConfig);

      expect(controller.config.enableAutoOptimization).toBe(false);
      expect(controller.config.updateInterval).toBe(2000);
    });

    test('設定のリセットが実行される', () => {
      controller.updateConfig({ enableAutoOptimization: false });

      controller.resetConfig();

      expect(controller.config.enableAutoOptimization).toBe(true); // デフォルト値
    });

    test('設定の取得が実行される', () => {
      const config = controller.getConfig();

      expect(config).toEqual(controller.config);
      expect(config).not.toBe(controller.config); // コピーであることを確認
    });
  });

  describe('状態同期', () => {
    beforeEach(async () => {
      controller = new AdaptiveController();
      await controller.initialize();
      controller.integrateResponsiveManager(mockResponsiveManager);
      controller.integrateAccessibilityEnhancer(mockAccessibilityEnhancer);
    });

    test('コンポーネント間の状態同期が実行される', async () => {
      await controller.syncComponentStates();

      // 統合されたコンポーネントの状態が同期されることを確認
      expect(controller.lastSyncTime).toBeGreaterThan(0);
    });

    test('状態変更の通知が処理される', () => {
      const changeData = {
        component: 'responsiveManager',
        property: 'currentBreakpoint',
        newValue: 'mobile',
      };

      controller.handleStateChange(changeData);

      // 状態変更が適切に処理されることを確認（timestampが追加されるため部分マッチ）
      expect(controller.stateHistory).toHaveLength(1);
      expect(controller.stateHistory[0]).toMatchObject(changeData);
      expect(controller.stateHistory[0].timestamp).toBeDefined();
    });

    test('コンポーネント状態の検証が実行される', () => {
      const isValid = controller.validateComponentStates();

      expect(typeof isValid).toBe('boolean');
    });
  });

  describe('パフォーマンス最適化', () => {
    beforeEach(async () => {
      controller = new AdaptiveController();
      await controller.initialize();
      controller.integratePerformanceOptimizer(mockPerformanceOptimizer);
    });

    test('パフォーマンス閾値チェックが実行される', () => {
      const performanceData = { fps: 40, memory: 80 };

      const result = controller.checkPerformanceThreshold(performanceData);

      expect(result.belowThreshold).toBe(true);
      expect(result.recommendations).toBeInstanceOf(Array);
    });

    test('自動最適化トリガーが動作する', async () => {
      // パフォーマンス低下をシミュレート
      const performanceData = { fps: 30, memory: 90 };

      const result = await controller.triggerAutoOptimization(performanceData);

      expect(result.triggered).toBe(true);
      expect(result.optimizations).toBeInstanceOf(Array);
    });

    test('最適化履歴が記録される', async () => {
      await controller.executeAutoOptimization();

      const history = controller.getOptimizationHistory();

      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);
    });
  });

  describe('エラーハンドリング', () => {
    beforeEach(async () => {
      controller = new AdaptiveController();
      await controller.initialize();
    });

    test('コンポーネントエラーが隔離される', () => {
      const faultyComponent = {
        getCurrentState: () => {
          throw new Error('Component error');
        },
        destroy: jest.fn(),
      };

      controller.integrateResponsiveManager(faultyComponent);

      // エラーが発生してもコントローラーは動作し続ける
      expect(() => {
        controller.getIntegratedState();
      }).not.toThrow();
    });

    test('エラー状態がトラッキングされる', () => {
      const faultyComponent = {
        getCurrentState: () => {
          throw new Error('Test error');
        },
        destroy: jest.fn(),
      };

      controller.integrateResponsiveManager(faultyComponent);
      controller.getIntegratedState();

      const errorLog = controller.getErrorLog();
      expect(errorLog.length).toBeGreaterThan(0);
    });

    test('エラー回復が試行される', async () => {
      const faultyComponent = {
        getCurrentState: () => {
          throw new Error('Recoverable error');
        },
        destroy: jest.fn(),
        recover: jest.fn(),
      };

      controller.integrateResponsiveManager(faultyComponent);

      await controller.attemptErrorRecovery('responsiveManager');

      expect(faultyComponent.recover).toHaveBeenCalled();
    });
  });

  describe('統計とメトリクス', () => {
    beforeEach(async () => {
      controller = new AdaptiveController();
      await controller.initialize();
    });

    test('統計情報が取得される', () => {
      const stats = controller.getStatistics();

      expect(stats.totalComponents).toBeDefined();
      expect(stats.activeComponents).toBeDefined();
      expect(stats.uptime).toBeDefined();
    });

    test('パフォーマンスメトリクスが取得される', () => {
      const metrics = controller.getPerformanceMetrics();

      expect(metrics.averageResponseTime).toBeDefined();
      expect(metrics.memoryUsage).toBeDefined();
      expect(metrics.errorRate).toBeDefined();
    });

    test('メトリクスのリセットが実行される', () => {
      controller.getStatistics(); // 統計を生成

      controller.resetMetrics();

      const stats = controller.getStatistics();
      expect(stats.uptime).toBeLessThan(100); // リセット後は小さい値
    });
  });

  describe('デバッグ機能', () => {
    beforeEach(async () => {
      controller = new AdaptiveController();
      await controller.initialize();
    });

    test('デバッグモードが有効化される', () => {
      controller.enableDebugMode();

      expect(controller.isDebugMode).toBe(true);
    });

    test('デバッグ情報が取得される', () => {
      controller.enableDebugMode();

      const debugInfo = controller.getDebugInfo();

      expect(debugInfo.components).toBeDefined();
      expect(debugInfo.config).toBeDefined();
      expect(debugInfo.state).toBeDefined();
    });

    test('デバッグログが記録される', () => {
      controller.enableDebugMode();
      controller.getIntegratedState(); // 何らかの操作を実行

      const debugLog = controller.getDebugLog();

      expect(Array.isArray(debugLog)).toBe(true);
    });
  });
});
