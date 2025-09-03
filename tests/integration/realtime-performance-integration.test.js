/**
 * RealtimePerformance Integration Tests
 * PerformanceMonitor <-> PerformanceController 統合テスト
 */

import { PerformanceMonitor } from '../../src/core/RealtimePerformanceMonitor.js';
import { PerformanceController } from '../../src/core/RealtimePerformanceController.js';

describe('RealtimePerformance Integration Tests', () => {
  let monitor;
  let controller;
  let mockAdaptiveUI;
  let mockPerformanceMonitorUI;

  beforeEach(() => {
    // performance APIのモック設定
    global.performance = {
      memory: {
        usedJSHeapSize: 47185920,
        totalJSHeapSize: 52428800,
        jsHeapSizeLimit: 2172649472,
      },
      now: jest.fn(() => Date.now()),
    };

    // タイマーモック
    jest.useFakeTimers();

    // コンソールモック
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // AdaptiveUIモック
    mockAdaptiveUI = {
      updatePerformanceData: jest.fn(),
      triggerOptimization: jest.fn(),
    };

    // PerformanceMonitorUIモック
    mockPerformanceMonitorUI = {
      updateMetrics: jest.fn(),
      updateStatus: jest.fn(),
    };

    monitor = new PerformanceMonitor();
    controller = new PerformanceController();
  });

  afterEach(() => {
    if (monitor) {
      monitor.destroy();
    }
    if (controller) {
      controller.destroy();
    }
    jest.clearAllTimers();
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('Monitor-Controller統合', () => {
    it('PerformanceMonitorとPerformanceControllerが統合される', () => {
      controller.initialize();
      controller.integratePerformanceMonitor(monitor);

      expect(controller.getPerformanceMonitor()).toBe(monitor);
      expect(controller.getIntegratedComponents()).toContain('performanceMonitor');
    });

    it('統合システムが監視を開始できる', () => {
      controller.initialize();
      controller.integratePerformanceMonitor(monitor);

      controller.startSystemMonitoring();

      expect(controller.isSystemMonitoring()).toBe(true);
      expect(monitor.isMonitoring).toBe(true);
    });

    it('統合システムが監視を停止できる', () => {
      controller.initialize();
      controller.integratePerformanceMonitor(monitor);

      controller.startSystemMonitoring();
      controller.stopSystemMonitoring();

      expect(controller.isSystemMonitoring()).toBe(false);
      expect(monitor.isMonitoring).toBe(false);
    });

    it('メトリクスイベントが正しく連携される', () => {
      controller.initialize();
      controller.integratePerformanceMonitor(monitor);
      controller.integrateAdaptiveUI(mockAdaptiveUI);

      // メトリクス更新をシミュレート
      const testMetrics = {
        timestamp: Date.now(),
        fps: { current: 60, average: 58 },
        memory: { used: 45.2, percentage: 65 },
      };

      monitor.emit('metrics', testMetrics);

      expect(mockAdaptiveUI.updatePerformanceData).toHaveBeenCalledWith(testMetrics);
    });
  });

  describe('AdaptiveUI統合', () => {
    beforeEach(() => {
      controller.initialize();
      controller.integratePerformanceMonitor(monitor);
      controller.integrateAdaptiveUI(mockAdaptiveUI);
    });

    it('データ配信が開始されるとAdaptiveUIにメトリクスが配信される', () => {
      // getCurrentMetricsのモック
      monitor.getCurrentMetrics = jest.fn(() => ({
        timestamp: Date.now(),
        fps: { current: 60, average: 58 },
        memory: { used: 45.2, percentage: 65 },
        cpu: { usage: 45 },
      }));

      controller.startDistribution();

      // 配信間隔を進める
      jest.advanceTimersByTime(250);

      expect(mockAdaptiveUI.updatePerformanceData).toHaveBeenCalled();
    });

    it('パフォーマンス低下時に自動最適化がトリガーされる', () => {
      const criticalMetrics = {
        timestamp: Date.now(),
        fps: { current: 25, average: 28 }, // 危険閾値
        memory: { used: 85.2, percentage: 120 }, // 危険閾値
        cpu: { usage: 95 },
      };

      controller._handleMetricsUpdate(criticalMetrics);

      expect(mockAdaptiveUI.triggerOptimization).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'performance',
          priority: 'critical',
          reason: 'low_fps',
        })
      );
    });
  });

  describe('PerformanceMonitorUI統合', () => {
    beforeEach(() => {
      controller.initialize();
      controller.integratePerformanceMonitor(monitor);
      controller.integratePerformanceMonitorUI(mockPerformanceMonitorUI);
    });

    it('メトリクスがPerformanceMonitorUIに配信される', () => {
      monitor.getCurrentMetrics = jest.fn(() => ({
        timestamp: Date.now(),
        fps: { current: 60, average: 58 },
        memory: { used: 45.2, percentage: 65 },
      }));

      controller.startDistribution();
      jest.advanceTimersByTime(250);

      expect(mockPerformanceMonitorUI.updateMetrics).toHaveBeenCalled();
    });

    it('状態同期時にUIステータスが更新される', () => {
      controller.syncComponentStates();

      expect(mockPerformanceMonitorUI.updateStatus).toHaveBeenCalledWith({
        isMonitoring: false,
        componentsIntegrated: 2,
      });
    });
  });

  describe('フルシステム統合', () => {
    beforeEach(() => {
      controller.initialize();
      controller.integratePerformanceMonitor(monitor);
      controller.integrateAdaptiveUI(mockAdaptiveUI);
      controller.integratePerformanceMonitorUI(mockPerformanceMonitorUI);
    });

    it('完全なパフォーマンス監視ループが機能する', () => {
      // メトリクス取得のモック
      monitor.getCurrentMetrics = jest.fn(() => ({
        timestamp: Date.now(),
        fps: { current: 55, average: 58 },
        memory: { used: 45.2, percentage: 65 },
        cpu: { usage: 45 },
      }));

      // システム開始
      controller.startSystemMonitoring();
      controller.startDistribution();

      // 時間を進める
      jest.advanceTimersByTime(500);

      // 全システムが正常に動作することを確認
      expect(monitor.isMonitoring).toBe(true);
      expect(mockAdaptiveUI.updatePerformanceData).toHaveBeenCalled();
      expect(mockPerformanceMonitorUI.updateMetrics).toHaveBeenCalled();
    });

    it('システムヘルスが統合的に評価される', () => {
      const health = controller.getSystemHealth();

      expect(health).toMatchObject({
        overall: expect.any(String),
        score: expect.any(Number),
        components: expect.objectContaining({
          performanceMonitor: expect.any(Object),
          adaptiveUI: expect.any(Object),
          performanceMonitorUI: expect.any(Object),
        }),
      });
    });

    it('エラー発生時の分離と回復が機能する', () => {
      // AdaptiveUIでエラーを発生させる
      mockAdaptiveUI.updatePerformanceData.mockImplementation(() => {
        throw new Error('AdaptiveUI error');
      });

      monitor.getCurrentMetrics = jest.fn(() => ({
        timestamp: Date.now(),
        fps: { current: 60, average: 58 },
        memory: { used: 45.2, percentage: 65 },
      }));

      // エラーが発生してもシステムが継続することを確認
      expect(() => {
        controller.startDistribution();
        jest.advanceTimersByTime(250);
      }).not.toThrow();

      // エラーが記録されることを確認
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('パフォーマンス統合テスト', () => {
    it('統合システムが高負荷でも安定動作する', () => {
      const startTime = Date.now();

      controller.initialize();
      controller.integratePerformanceMonitor(monitor);
      controller.integrateAdaptiveUI(mockAdaptiveUI);

      // 高頻度でメトリクス更新をシミュレート
      for (let i = 0; i < 100; i++) {
        controller._handleMetricsUpdate({
          timestamp: Date.now(),
          fps: { current: 60 - Math.random() * 10, average: 58 },
          memory: { used: 45 + Math.random() * 10, percentage: 65 + Math.random() * 10 },
        });
      }

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // 100回の処理が50ms以内で完了することを確認
      expect(executionTime).toBeLessThan(50);
    });

    it('メモリ使用量が制限内に収まる', () => {
      controller.initialize();
      controller.integratePerformanceMonitor(monitor);

      const initialMemory = process.memoryUsage().heapUsed;

      // 長期間動作をシミュレート
      for (let i = 0; i < 1000; i++) {
        controller._handleMetricsUpdate({
          timestamp: Date.now(),
          fps: { current: 60, average: 58 },
          memory: { used: 45, percentage: 65 },
        });
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // メモリ増加が10MB以下であることを確認
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });
});
