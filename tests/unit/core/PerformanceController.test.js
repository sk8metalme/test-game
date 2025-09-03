/**
 * PerformanceController Unit Tests
 * TDD Red Phase - テスト先行開発
 */

import { PerformanceController } from '../../../src/core/RealtimePerformanceController.js';

describe('PerformanceController', () => {
  let controller;
  let mockMonitor;
  let mockAdaptiveUI;
  let mockMonitorUI;

  beforeEach(() => {
    // PerformanceMonitorモック
    mockMonitor = {
      isMonitoring: false,
      isDestroyed: false,
      config: { monitoring: { interval: 100 } },
      startMonitoring: jest.fn(),
      stopMonitoring: jest.fn(),
      pauseMonitoring: jest.fn(),
      resumeMonitoring: jest.fn(),
      getCurrentMetrics: jest.fn(() => ({
        timestamp: Date.now(),
        fps: { current: 60, average: 58 },
        memory: { used: 45.2, percentage: 65 },
        cpu: { usage: 45 },
      })),
      getThresholds: jest.fn(() => ({
        fps: { warning: 45, critical: 30 },
        memory: { warning: 80, critical: 100 },
      })),
      setThresholds: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      destroy: jest.fn(),
    };

    // AdaptiveUIモック
    mockAdaptiveUI = {
      isInitialized: true,
      isDestroyed: false,
      updatePerformanceData: jest.fn(),
      triggerOptimization: jest.fn(),
      getIntegratedState: jest.fn(() => ({ status: 'active' })),
      on: jest.fn(),
      off: jest.fn(),
    };

    // PerformanceMonitorUIモック
    mockMonitorUI = {
      isInitialized: true,
      isDestroyed: false,
      updateMetrics: jest.fn(),
      updateThresholds: jest.fn(),
      updateStatus: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
    };

    // タイマーモック
    jest.useFakeTimers();

    // コンソールモック
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    if (controller && !controller.isDestroyed) {
      controller.destroy();
    }
    jest.clearAllTimers();
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe('初期化', () => {
    it('デフォルト設定で正常に初期化される', () => {
      controller = new PerformanceController();

      expect(controller).toBeDefined();
      expect(controller.isInitialized).toBe(false);
      expect(controller.isDestroyed).toBe(false);
      expect(controller.config).toBeDefined();
    });

    it('カスタム設定で正常に初期化される', () => {
      const customConfig = {
        distribution: { enableAdaptiveUI: false },
        monitoring: { autoStart: false },
      };

      controller = new PerformanceController(customConfig);

      expect(controller.config.distribution.enableAdaptiveUI).toBe(false);
      expect(controller.config.monitoring.autoStart).toBe(false);
    });

    it('無効な設定値でエラーが発生する', () => {
      expect(() => {
        controller = new PerformanceController({
          distribution: { interval: -100 },
        });
      }).toThrow('Invalid configuration');
    });

    it('初期化処理が正常に実行される', () => {
      controller = new PerformanceController();
      controller.initialize();

      expect(controller.isInitialized).toBe(true);
    });

    it('二重初期化が防止される', () => {
      controller = new PerformanceController();
      controller.initialize();

      expect(() => {
        controller.initialize();
      }).toThrow('Already initialized');
    });
  });

  describe('システム統合', () => {
    beforeEach(() => {
      controller = new PerformanceController();
      controller.initialize();
    });

    it('PerformanceMonitorが統合される', () => {
      controller.integratePerformanceMonitor(mockMonitor);

      expect(controller.getIntegratedComponents()).toContain('performanceMonitor');
      expect(mockMonitor.on).toHaveBeenCalled();
    });

    it('AdaptiveUIが統合される', () => {
      controller.integrateAdaptiveUI(mockAdaptiveUI);

      expect(controller.getIntegratedComponents()).toContain('adaptiveUI');
    });

    it('PerformanceMonitorUIが統合される', () => {
      controller.integratePerformanceMonitorUI(mockMonitorUI);

      expect(controller.getIntegratedComponents()).toContain('performanceMonitorUI');
    });

    it('null/undefinedコンポーネントは統合されない', () => {
      expect(() => {
        controller.integratePerformanceMonitor(null);
      }).toThrow('Invalid PerformanceMonitor');

      expect(() => {
        controller.integrateAdaptiveUI(undefined);
      }).toThrow('Invalid AdaptiveUI');
    });

    it('無効なコンポーネントは統合されない', () => {
      const invalidComponent = { someMethod: jest.fn() };

      expect(() => {
        controller.integratePerformanceMonitor(invalidComponent);
      }).toThrow('Invalid PerformanceMonitor');
    });

    it('統合されたコンポーネントが取得される', () => {
      controller.integratePerformanceMonitor(mockMonitor);
      controller.integrateAdaptiveUI(mockAdaptiveUI);

      expect(controller.getPerformanceMonitor()).toBe(mockMonitor);
      expect(controller.getAdaptiveUI()).toBe(mockAdaptiveUI);
    });
  });

  describe('制御機能', () => {
    beforeEach(() => {
      controller = new PerformanceController();
      controller.initialize();
      controller.integratePerformanceMonitor(mockMonitor);
    });

    it('システム監視を開始できる', () => {
      controller.startSystemMonitoring();

      expect(mockMonitor.startMonitoring).toHaveBeenCalled();
      expect(controller.isSystemMonitoring()).toBe(true);
    });

    it('システム監視を停止できる', () => {
      controller.startSystemMonitoring();
      controller.stopSystemMonitoring();

      expect(mockMonitor.stopMonitoring).toHaveBeenCalled();
      expect(controller.isSystemMonitoring()).toBe(false);
    });

    it('システム監視を一時停止できる', () => {
      controller.startSystemMonitoring();
      controller.pauseSystemMonitoring();

      expect(mockMonitor.pauseMonitoring).toHaveBeenCalled();
    });

    it('システム監視を再開できる', () => {
      controller.startSystemMonitoring();
      controller.pauseSystemMonitoring();
      controller.resumeSystemMonitoring();

      expect(mockMonitor.resumeMonitoring).toHaveBeenCalled();
    });

    it('Monitor未統合時は制御でエラーが発生する', () => {
      const controllerWithoutMonitor = new PerformanceController();
      controllerWithoutMonitor.initialize();

      expect(() => {
        controllerWithoutMonitor.startSystemMonitoring();
      }).toThrow('PerformanceMonitor not integrated');
    });

    it('自動開始設定が機能する', () => {
      const autoStartController = new PerformanceController({
        monitoring: { autoStart: true },
      });
      autoStartController.initialize();
      autoStartController.integratePerformanceMonitor(mockMonitor);

      expect(mockMonitor.startMonitoring).toHaveBeenCalled();
    });
  });

  describe('データ配信', () => {
    beforeEach(() => {
      controller = new PerformanceController();
      controller.initialize();
      controller.integratePerformanceMonitor(mockMonitor);
      controller.integrateAdaptiveUI(mockAdaptiveUI);
      controller.integratePerformanceMonitorUI(mockMonitorUI);
    });

    it('AdaptiveUIにメトリクスが配信される', () => {
      const testMetrics = {
        fps: { current: 55 },
        memory: { percentage: 70 },
      };

      controller._distributeToAdaptiveUI(testMetrics);

      expect(mockAdaptiveUI.updatePerformanceData).toHaveBeenCalledWith(
        expect.objectContaining({
          fps: { current: 55 },
          memory: { percentage: 70 },
        })
      );
    });

    it('PerformanceMonitorUIにメトリクスが配信される', () => {
      const testMetrics = {
        timestamp: Date.now(),
        fps: { current: 60 },
        memory: { used: 45.2 },
      };

      controller._distributeToPerformanceMonitorUI(testMetrics);

      expect(mockMonitorUI.updateMetrics).toHaveBeenCalledWith(testMetrics);
    });

    it('購読者にメトリクスが配信される', () => {
      const subscriber = jest.fn();
      controller.subscribe('metrics', subscriber);

      const testMetrics = { fps: { current: 60 } };
      controller._broadcastMetrics(testMetrics);

      expect(subscriber).toHaveBeenCalledWith(testMetrics);
    });

    it('配信間隔が制御される', () => {
      const distributionSpy = jest.spyOn(controller, '_distributeToAdaptiveUI');

      controller.startDistribution();

      jest.advanceTimersByTime(250); // 配信間隔250ms
      expect(distributionSpy).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(250);
      expect(distributionSpy).toHaveBeenCalledTimes(2);
    });

    it('配信フィルタが機能する', () => {
      const heavyMetrics = {
        fps: { current: 25 }, // 危険閾値未満
        memory: { percentage: 95 },
        rendering: { drawCalls: 1000 },
      };

      controller._distributeToAdaptiveUI(heavyMetrics);

      const filteredData = mockAdaptiveUI.updatePerformanceData.mock.calls[0][0];
      expect(filteredData.rendering).toBeUndefined(); // 重いデータは除外
    });

    it('配信エラーが適切に処理される', () => {
      mockAdaptiveUI.updatePerformanceData.mockImplementation(() => {
        throw new Error('Distribution error');
      });

      expect(() => {
        controller._distributeToAdaptiveUI({ fps: { current: 60 } });
      }).not.toThrow();

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('最適化制御', () => {
    beforeEach(() => {
      controller = new PerformanceController();
      controller.initialize();
      controller.integratePerformanceMonitor(mockMonitor);
      controller.integrateAdaptiveUI(mockAdaptiveUI);
    });

    it('最適化要求が正しく処理される', () => {
      const optimizationRequest = {
        type: 'performance',
        priority: 'high',
        targets: ['rendering', 'memory'],
      };

      controller.requestOptimization(optimizationRequest);

      expect(mockAdaptiveUI.triggerOptimization).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'performance',
          targets: ['rendering', 'memory'],
        })
      );
    });

    it('無効な最適化要求が拒否される', () => {
      expect(() => {
        controller.requestOptimization(null);
      }).toThrow('Invalid optimization request');

      expect(() => {
        controller.requestOptimization({ type: 'invalid' });
      }).toThrow('Invalid optimization request');
    });

    it('最適化要求の優先度制御が機能する', () => {
      const lowPriorityRequest = { type: 'ui', priority: 'low' };
      const highPriorityRequest = { type: 'performance', priority: 'high' };

      // 高優先度の要求が先に処理される
      controller.requestOptimization(lowPriorityRequest);
      controller.requestOptimization(highPriorityRequest);

      const calls = mockAdaptiveUI.triggerOptimization.mock.calls;
      // 優先度は数値に変換される
      expect(calls[1][0].priority).toBe(8); // 'high' -> 8
    });

    it('AdaptiveUI未統合時は最適化要求でエラーが発生する', () => {
      const controllerWithoutUI = new PerformanceController();
      controllerWithoutUI.initialize();

      expect(() => {
        controllerWithoutUI.requestOptimization({ type: 'performance' });
      }).toThrow('AdaptiveUI not integrated');
    });

    it('自動最適化が機能する', () => {
      const criticalMetrics = {
        fps: { current: 25 }, // 危険閾値
        memory: { percentage: 105 }, // 危険閾値
      };

      controller._handleMetricsUpdate(criticalMetrics);

      expect(mockAdaptiveUI.triggerOptimization).toHaveBeenCalled();
    });

    it('最適化履歴が記録される', () => {
      const request = { type: 'performance', priority: 'high' };
      controller.requestOptimization(request);

      const history = controller.getOptimizationHistory();
      expect(history).toHaveLength(1);
      expect(history[0]).toMatchObject({
        type: 'performance',
        priority: 8, // 'high' -> 8
      });
    });
  });

  describe('設定管理', () => {
    beforeEach(() => {
      controller = new PerformanceController();
      controller.initialize();
    });

    it('設定が動的に更新される', () => {
      const newConfig = {
        distribution: { interval: 500 },
        optimization: { autoTrigger: false },
      };

      controller.updateConfig(newConfig);

      expect(controller.config.distribution.interval).toBe(500);
      expect(controller.config.optimization.autoTrigger).toBe(false);
    });

    it('設定更新が統合コンポーネントに反映される', () => {
      controller.integratePerformanceMonitor(mockMonitor);

      const newConfig = {
        monitoring: { interval: 200 },
      };

      controller.updateConfig(newConfig);

      // MonitorのsetThresholdsやconfigが更新されることを検証
      expect(controller.config.monitoring.interval).toBe(200);
    });

    it('無効な設定更新が拒否される', () => {
      expect(() => {
        controller.updateConfig({
          distribution: { interval: -100 },
        });
      }).toThrow('Invalid configuration');
    });

    it('設定がリセットされる', () => {
      controller.updateConfig({ distribution: { interval: 500 } });
      controller.resetConfig();

      expect(controller.config.distribution.interval).toBe(250); // デフォルト値
    });

    it('設定取得が正しく動作する', () => {
      const config = controller.getConfig();

      expect(config).toBeDefined();
      expect(config.distribution).toBeDefined();
      expect(config.monitoring).toBeDefined();
    });
  });

  describe('状態同期', () => {
    beforeEach(() => {
      controller = new PerformanceController();
      controller.initialize();
      controller.integratePerformanceMonitor(mockMonitor);
      controller.integrateAdaptiveUI(mockAdaptiveUI);
      controller.integratePerformanceMonitorUI(mockMonitorUI);
    });

    it('コンポーネント間の状態同期が実行される', () => {
      controller.syncComponentStates();

      expect(mockAdaptiveUI.getIntegratedState).toHaveBeenCalled();
      expect(mockMonitor.getCurrentMetrics).toHaveBeenCalled();
    });

    it('状態同期でUIが更新される', () => {
      controller.syncComponentStates();

      expect(mockMonitorUI.updateStatus).toHaveBeenCalled();
    });

    it('状態同期エラーが適切に処理される', () => {
      mockAdaptiveUI.getIntegratedState.mockImplementation(() => {
        throw new Error('State sync error');
      });

      expect(() => {
        controller.syncComponentStates();
      }).not.toThrow();

      expect(console.error).toHaveBeenCalled();
    });

    it('状態変更通知が処理される', () => {
      const changeData = {
        component: 'adaptiveUI',
        type: 'optimization',
        timestamp: Date.now(),
      };

      controller.handleStateChange(changeData);

      expect(controller.getStateHistory()).toContainEqual(expect.objectContaining(changeData));
    });

    it('自動同期が機能する', () => {
      const syncSpy = jest.spyOn(controller, 'syncComponentStates');

      controller.startAutoSync();

      jest.advanceTimersByTime(1000); // 同期間隔1秒
      expect(syncSpy).toHaveBeenCalledTimes(1);
    });

    it('自動同期が停止される', () => {
      const syncSpy = jest.spyOn(controller, 'syncComponentStates');

      controller.startAutoSync();
      controller.stopAutoSync();

      jest.advanceTimersByTime(1000);
      expect(syncSpy).not.toHaveBeenCalled();
    });
  });

  describe('ヘルス監視', () => {
    beforeEach(() => {
      controller = new PerformanceController();
      controller.initialize();
      controller.integratePerformanceMonitor(mockMonitor);
      controller.integrateAdaptiveUI(mockAdaptiveUI);
    });

    it('システムヘルスが評価される', () => {
      const health = controller.getSystemHealth();

      expect(health).toMatchObject({
        overall: expect.any(String),
        components: expect.any(Object),
        score: expect.any(Number),
      });
    });

    it('コンポーネントヘルスが個別に評価される', () => {
      const health = controller.getSystemHealth();

      expect(health.components.performanceMonitor).toBeDefined();
      expect(health.components.adaptiveUI).toBeDefined();
    });

    it('ヘルススコアが正しく計算される', () => {
      const health = controller.getSystemHealth();

      expect(health.score).toBeGreaterThanOrEqual(0);
      expect(health.score).toBeLessThanOrEqual(100);
    });

    it('破棄されたコンポーネントはヘルス評価から除外される', () => {
      mockAdaptiveUI.isDestroyed = true;

      const health = controller.getSystemHealth();

      expect(health.components.adaptiveUI.status).toBe('destroyed');
    });

    it('ヘルス警告が発行される', () => {
      mockMonitor.isDestroyed = true;

      const health = controller.getSystemHealth();

      expect(health.warnings).toContain('performanceMonitor has been destroyed');
    });

    it('ヘルス履歴が記録される', () => {
      controller.getSystemHealth();
      controller.getSystemHealth();

      const history = controller.getHealthHistory();
      expect(history).toHaveLength(2);
    });
  });

  describe('統計とメトリクス', () => {
    beforeEach(() => {
      controller = new PerformanceController();
      controller.initialize();
      controller.integratePerformanceMonitor(mockMonitor);
    });

    it('統計情報が取得される', () => {
      const stats = controller.getStatistics();

      expect(stats).toMatchObject({
        uptime: expect.any(Number),
        distribution: expect.any(Object),
        optimization: expect.any(Object),
        components: expect.any(Object),
      });
    });

    it('配信統計が正しく記録される', () => {
      controller.startDistribution();
      jest.advanceTimersByTime(500); // 2回配信

      const stats = controller.getStatistics();

      expect(stats.distribution.totalDistributions).toBeGreaterThan(0);
    });

    it('最適化統計が正しく記録される', () => {
      controller.integrateAdaptiveUI(mockAdaptiveUI);
      controller.requestOptimization({ type: 'performance' });

      const stats = controller.getStatistics();

      expect(stats.optimization.totalRequests).toBe(1);
    });

    it('パフォーマンスメトリクスが取得される', () => {
      const metrics = controller.getPerformanceMetrics();

      expect(metrics).toMatchObject({
        responseTime: expect.any(Number),
        memoryUsage: expect.any(Number),
        distributionRate: expect.any(Number),
      });
    });

    it('統計がリセットされる', () => {
      controller.integrateAdaptiveUI(mockAdaptiveUI);
      controller.requestOptimization({ type: 'performance' });
      controller.resetStatistics();

      const stats = controller.getStatistics();

      expect(stats.optimization.totalRequests).toBe(0);
    });
  });

  describe('エラーハンドリング', () => {
    beforeEach(() => {
      controller = new PerformanceController();
      controller.initialize();
    });

    it('コンポーネントエラーが隔離される', () => {
      mockMonitor.getCurrentMetrics.mockImplementation(() => {
        throw new Error('Monitor error');
      });

      controller.integratePerformanceMonitor(mockMonitor);

      expect(() => {
        controller._handleMetricsUpdate();
      }).not.toThrow();

      expect(console.error).toHaveBeenCalled();
    });

    it('エラー状態がトラッキングされる', () => {
      mockMonitor.getCurrentMetrics.mockImplementation(() => {
        throw new Error('Monitor error');
      });

      controller.integratePerformanceMonitor(mockMonitor);
      controller._handleMetricsUpdate();

      const errorLog = controller.getErrorLog();
      expect(errorLog).toHaveLength(1);
      expect(errorLog[0]).toMatchObject({
        component: 'performanceMonitor',
        error: expect.stringContaining('Monitor error'),
      });
    });

    it('エラー回復が試行される', () => {
      const errorCount = 3;
      let callCount = 0;

      mockMonitor.getCurrentMetrics.mockImplementation(() => {
        callCount++;
        if (callCount <= errorCount) {
          throw new Error('Temporary error');
        }
        return { fps: { current: 60 } };
      });

      controller.integratePerformanceMonitor(mockMonitor);

      // エラー回復処理をトリガー
      for (let i = 0; i < errorCount + 1; i++) {
        controller._handleMetricsUpdate();
      }

      expect(callCount).toBe(errorCount + 1);
    });

    it('致命的エラー時にコンポーネントが無効化される', () => {
      mockMonitor.getCurrentMetrics.mockImplementation(() => {
        throw new Error('Fatal error');
      });

      controller.integratePerformanceMonitor(mockMonitor);

      // 複数回エラーを発生させる
      for (let i = 0; i < 5; i++) {
        controller._handleMetricsUpdate();
      }

      const health = controller.getSystemHealth();
      expect(health.components.performanceMonitor.status).toBe('error');
    });
  });

  describe('ライフサイクル', () => {
    beforeEach(() => {
      controller = new PerformanceController();
      controller.initialize();
    });

    it('破棄処理が正常に実行される', () => {
      controller.integratePerformanceMonitor(mockMonitor);
      controller.integrateAdaptiveUI(mockAdaptiveUI);

      controller.destroy();

      expect(controller.isDestroyed).toBe(true);
      expect(mockMonitor.off).toHaveBeenCalled();
    });

    it('破棄後の操作でエラーが発生する', () => {
      controller.destroy();

      expect(() => {
        controller.startSystemMonitoring();
      }).toThrow('PerformanceController has been destroyed');
    });

    it('リソースが適切に解放される', () => {
      controller.integratePerformanceMonitor(mockMonitor);
      controller.startDistribution();
      controller.startAutoSync();

      controller.destroy();

      expect(controller._distributionInterval).toBeNull();
      expect(controller._syncInterval).toBeNull();
      expect(controller._subscribers.size).toBe(0);
    });

    it('破棄状態が正確に管理される', () => {
      expect(controller.isDestroyed).toBe(false);

      controller.destroy();

      expect(controller.isDestroyed).toBe(true);
    });

    it('初期化前の破棄が安全に処理される', () => {
      const uninitializedController = new PerformanceController();

      expect(() => {
        uninitializedController.destroy();
      }).not.toThrow();
    });
  });
});
