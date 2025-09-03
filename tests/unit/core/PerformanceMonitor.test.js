/**
 * PerformanceMonitor Unit Tests
 * TDD Red Phase - テスト先行開発
 */

import { PerformanceMonitor } from '../../../src/core/RealtimePerformanceMonitor.js';

describe('PerformanceMonitor', () => {
  let monitor;
  let originalPerformance;

  beforeEach(() => {
    // performance APIのモック設定
    originalPerformance = global.performance;
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
  });

  afterEach(() => {
    if (monitor) {
      monitor.destroy();
    }
    global.performance = originalPerformance;
    jest.clearAllTimers();
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe('初期化', () => {
    it('デフォルト設定で正常に初期化される', () => {
      monitor = new PerformanceMonitor();

      expect(monitor).toBeDefined();
      expect(monitor.isMonitoring).toBe(false);
      expect(monitor.config).toBeDefined();
      expect(monitor.config.monitoring.interval).toBe(100);
    });

    it('カスタム設定で正常に初期化される', () => {
      const customConfig = {
        monitoring: { interval: 200, bufferSize: 50 },
        thresholds: { fps: { warning: 40, critical: 25 } },
      };

      monitor = new PerformanceMonitor(customConfig);

      expect(monitor.config.monitoring.interval).toBe(200);
      expect(monitor.config.monitoring.bufferSize).toBe(50);
      expect(monitor.config.thresholds.fps.warning).toBe(40);
    });

    it('無効な設定値でエラーが発生する', () => {
      const invalidConfig = {
        monitoring: { interval: -100 },
      };

      expect(() => {
        monitor = new PerformanceMonitor(invalidConfig);
      }).toThrow('Invalid monitoring interval');
    });

    it('イベントエミッター機能が初期化される', () => {
      monitor = new PerformanceMonitor();

      expect(typeof monitor.on).toBe('function');
      expect(typeof monitor.off).toBe('function');
      expect(typeof monitor.emit).toBe('function');
    });

    it('初期状態で監視が停止している', () => {
      monitor = new PerformanceMonitor();

      expect(monitor.isMonitoring).toBe(false);
      expect(monitor.isPaused).toBe(false);
    });

    it('初期化時にメトリクスバッファが空である', () => {
      monitor = new PerformanceMonitor();

      expect(monitor.getMetricsBuffer()).toHaveLength(0);
      expect(monitor.getHistoricalData()).toHaveLength(0);
    });
  });

  describe('監視制御', () => {
    beforeEach(() => {
      monitor = new PerformanceMonitor();
    });

    it('監視を開始できる', () => {
      monitor.startMonitoring();

      expect(monitor.isMonitoring).toBe(true);
      expect(monitor.isPaused).toBe(false);
    });

    it('監視を停止できる', () => {
      monitor.startMonitoring();
      monitor.stopMonitoring();

      expect(monitor.isMonitoring).toBe(false);
    });

    it('監視を一時停止できる', () => {
      monitor.startMonitoring();
      monitor.pauseMonitoring();

      expect(monitor.isMonitoring).toBe(true);
      expect(monitor.isPaused).toBe(true);
    });

    it('監視を再開できる', () => {
      monitor.startMonitoring();
      monitor.pauseMonitoring();
      monitor.resumeMonitoring();

      expect(monitor.isMonitoring).toBe(true);
      expect(monitor.isPaused).toBe(false);
    });

    it('重複開始時にエラーが発生する', () => {
      monitor.startMonitoring();

      expect(() => {
        monitor.startMonitoring();
      }).toThrow('Monitoring is already running');
    });

    it('未開始状態での停止でエラーが発生しない', () => {
      expect(() => {
        monitor.stopMonitoring();
      }).not.toThrow();
    });

    it('監視間隔が正しく設定される', () => {
      const customConfig = { monitoring: { interval: 500 } };
      monitor = new PerformanceMonitor(customConfig);

      monitor.startMonitoring();

      expect(setInterval).toHaveBeenCalledWith(expect.any(Function), 500);
    });

    it('監視状態が正確に取得される', () => {
      const status = monitor.getMonitoringStatus();

      expect(status).toMatchObject({
        isMonitoring: false,
        isPaused: false,
        uptime: expect.any(Number),
      });
    });
  });

  describe('メトリクス収集', () => {
    beforeEach(() => {
      monitor = new PerformanceMonitor();
    });

    it('FPSが正確に測定される', () => {
      const metrics = monitor.getCurrentMetrics();

      expect(metrics.fps).toBeDefined();
      expect(metrics.fps.current).toBeGreaterThanOrEqual(0);
      expect(metrics.fps.average).toBeGreaterThanOrEqual(0);
    });

    it('メモリ使用量が正確に測定される', () => {
      const metrics = monitor.getCurrentMetrics();

      expect(metrics.memory).toBeDefined();
      expect(metrics.memory.used).toBeGreaterThan(0);
      expect(metrics.memory.percentage).toBeGreaterThanOrEqual(0);
      expect(metrics.memory.percentage).toBeLessThanOrEqual(100);
    });

    it('CPU負荷推定が実行される', () => {
      const metrics = monitor.getCurrentMetrics();

      expect(metrics.cpu).toBeDefined();
      expect(metrics.cpu.usage).toBeGreaterThanOrEqual(0);
      expect(metrics.cpu.usage).toBeLessThanOrEqual(100);
    });

    it('レンダリングメトリクスが収集される', () => {
      const metrics = monitor.getCurrentMetrics();

      expect(metrics.rendering).toBeDefined();
      expect(metrics.rendering.drawCalls).toBeGreaterThanOrEqual(0);
      expect(metrics.rendering.triangles).toBeGreaterThanOrEqual(0);
    });

    it('ネットワークメトリクスが収集される', () => {
      const metrics = monitor.getCurrentMetrics();

      expect(metrics.network).toBeDefined();
      expect(metrics.network.latency).toBeGreaterThanOrEqual(0);
      expect(metrics.network.bandwidth).toBeGreaterThanOrEqual(0);
    });

    it('performance.memory未サポート環境で代替値が使用される', () => {
      delete global.performance.memory;

      const metrics = monitor.getCurrentMetrics();

      expect(metrics.memory.supported).toBe(false);
      expect(metrics.memory.used).toBe(0);
      expect(metrics.memory.percentage).toBe(0);
    });

    it('測定エラー時にフォールバック値が使用される', () => {
      global.performance.now.mockImplementation(() => {
        throw new Error('API Error');
      });

      const metrics = monitor.getCurrentMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.timestamp).toBeGreaterThan(0);
    });

    it('メトリクス収集が指定間隔で実行される', () => {
      monitor.startMonitoring();

      jest.advanceTimersByTime(100);

      expect(monitor.getMetricsBuffer()).toHaveLength(1);

      jest.advanceTimersByTime(100);

      expect(monitor.getMetricsBuffer()).toHaveLength(2);
    });

    it('メトリクスデータ構造が正しい', () => {
      const metrics = monitor.getCurrentMetrics();

      expect(metrics).toMatchObject({
        timestamp: expect.any(Number),
        fps: expect.objectContaining({
          current: expect.any(Number),
          average: expect.any(Number),
        }),
        memory: expect.objectContaining({
          used: expect.any(Number),
          percentage: expect.any(Number),
        }),
        cpu: expect.objectContaining({
          usage: expect.any(Number),
        }),
      });
    });

    it('タイムスタンプが正確に設定される', () => {
      const beforeTime = Date.now();
      const metrics = monitor.getCurrentMetrics();
      const afterTime = Date.now();

      expect(metrics.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(metrics.timestamp).toBeLessThanOrEqual(afterTime);
    });

    it('バッファサイズ制限が守られる', () => {
      const config = { monitoring: { bufferSize: 3 } };
      monitor = new PerformanceMonitor(config);

      monitor.startMonitoring();

      // 5回分のメトリクス収集
      for (let i = 0; i < 5; i++) {
        jest.advanceTimersByTime(100);
      }

      expect(monitor.getMetricsBuffer()).toHaveLength(3);
    });

    it('統計計算が正確に実行される', () => {
      monitor.startMonitoring();

      // 複数回メトリクス収集
      jest.advanceTimersByTime(500);

      const avgMetrics = monitor.getAverageMetrics();

      expect(avgMetrics.fps.average).toBeGreaterThanOrEqual(0);
      expect(avgMetrics.memory.averageUsage).toBeGreaterThanOrEqual(0);
    });
  });

  describe('閾値監視', () => {
    beforeEach(() => {
      monitor = new PerformanceMonitor();
    });

    it('FPS警告閾値が正しく検出される', () => {
      const alertSpy = jest.fn();
      monitor.on('threshold-warning', alertSpy);

      // FPSが警告閾値を下回るメトリクスを設定
      const lowFpsMetrics = {
        fps: { current: 40 }, // 警告閾値45未満
        memory: { percentage: 50 },
        cpu: { usage: 50 },
      };

      monitor._checkThresholds(lowFpsMetrics);

      expect(alertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'warning',
          metric: 'fps',
          value: 40,
        })
      );
    });

    it('FPS危険閾値が正しく検出される', () => {
      const alertSpy = jest.fn();
      monitor.on('threshold-critical', alertSpy);

      const criticalFpsMetrics = {
        fps: { current: 25 }, // 危険閾値30未満
        memory: { percentage: 50 },
        cpu: { usage: 50 },
      };

      monitor._checkThresholds(criticalFpsMetrics);

      expect(alertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'critical',
          metric: 'fps',
          value: 25,
        })
      );
    });

    it('メモリ警告閾値が正しく検出される', () => {
      const alertSpy = jest.fn();
      monitor.on('threshold-warning', alertSpy);

      const highMemoryMetrics = {
        fps: { current: 60 },
        memory: { percentage: 85 }, // 警告閾値80超過
        cpu: { usage: 50 },
      };

      monitor._checkThresholds(highMemoryMetrics);

      expect(alertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'warning',
          metric: 'memory',
          value: 85,
        })
      );
    });

    it('メモリ危険閾値が正しく検出される', () => {
      const alertSpy = jest.fn();
      monitor.on('threshold-critical', alertSpy);

      const criticalMemoryMetrics = {
        fps: { current: 60 },
        memory: { percentage: 105 }, // 危険閾値100超過
        cpu: { usage: 50 },
      };

      monitor._checkThresholds(criticalMemoryMetrics);

      expect(alertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'critical',
          metric: 'memory',
          value: 105,
        })
      );
    });

    it('閾値設定を動的に変更できる', () => {
      const newThresholds = {
        fps: { warning: 50, critical: 35 },
        memory: { warning: 70, critical: 90 },
      };

      monitor.setThresholds(newThresholds);

      const currentThresholds = monitor.getThresholds();
      expect(currentThresholds.fps.warning).toBe(50);
      expect(currentThresholds.memory.warning).toBe(70);
    });

    it('複数閾値の同時検出が正しく処理される', () => {
      const warningSpies = jest.fn();
      const criticalSpies = jest.fn();

      monitor.on('threshold-warning', warningSpies);
      monitor.on('threshold-critical', criticalSpies);

      const multipleThresholdMetrics = {
        fps: { current: 25 }, // 危険閾値
        memory: { percentage: 85 }, // 警告閾値
        cpu: { usage: 95 }, // 危険閾値
      };

      monitor._checkThresholds(multipleThresholdMetrics);

      expect(warningSpies).toHaveBeenCalled();
      expect(criticalSpies).toHaveBeenCalled();
    });
  });

  describe('イベント管理', () => {
    beforeEach(() => {
      monitor = new PerformanceMonitor();
    });

    it('metricsイベントが正しく発生する', () => {
      const metricsSpy = jest.fn();
      monitor.on('metrics', metricsSpy);

      monitor.startMonitoring();
      jest.advanceTimersByTime(100);

      expect(metricsSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          timestamp: expect.any(Number),
          fps: expect.any(Object),
          memory: expect.any(Object),
        })
      );
    });

    it('threshold-warningイベントが正しく発生する', () => {
      const warningSpy = jest.fn();
      monitor.on('threshold-warning', warningSpy);

      // 警告を発生させる
      monitor._checkThresholds({
        fps: { current: 40 },
        memory: { percentage: 50 },
        cpu: { usage: 50 },
      });

      expect(warningSpy).toHaveBeenCalled();
    });

    it('threshold-criticalイベントが正しく発生する', () => {
      const criticalSpy = jest.fn();
      monitor.on('threshold-critical', criticalSpy);

      // 危険を発生させる
      monitor._checkThresholds({
        fps: { current: 25 },
        memory: { percentage: 50 },
        cpu: { usage: 50 },
      });

      expect(criticalSpy).toHaveBeenCalled();
    });

    it('イベントリスナーが正しく登録される', () => {
      const callback = jest.fn();

      monitor.on('metrics', callback);

      expect(monitor._eventListeners.get('metrics')).toContain(callback);
    });

    it('イベントリスナーが正しく削除される', () => {
      const callback = jest.fn();

      monitor.on('metrics', callback);
      monitor.off('metrics', callback);

      expect(monitor._eventListeners.get('metrics')).not.toContain(callback);
    });

    it('複数リスナーが正しく処理される', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      monitor.on('metrics', callback1);
      monitor.on('metrics', callback2);

      monitor.emit('metrics', { test: true });

      expect(callback1).toHaveBeenCalledWith({ test: true });
      expect(callback2).toHaveBeenCalledWith({ test: true });
    });

    it('イベントデータが正確に渡される', () => {
      const callback = jest.fn();
      const testData = { timestamp: Date.now(), fps: { current: 60 } };

      monitor.on('metrics', callback);
      monitor.emit('metrics', testData);

      expect(callback).toHaveBeenCalledWith(testData);
    });

    it('エラー時にもイベントが適切に処理される', () => {
      const errorCallback = jest.fn(() => {
        throw new Error('Callback error');
      });
      const normalCallback = jest.fn();

      monitor.on('metrics', errorCallback);
      monitor.on('metrics', normalCallback);

      // エラーが発生してもシステムが継続する
      expect(() => {
        monitor.emit('metrics', { test: true });
      }).not.toThrow();

      expect(normalCallback).toHaveBeenCalled();
    });
  });

  describe('データ管理', () => {
    beforeEach(() => {
      monitor = new PerformanceMonitor();
    });

    it('履歴データが正しく記録される', () => {
      monitor.startMonitoring();

      jest.advanceTimersByTime(300); // 3回分のデータ

      const history = monitor.getHistoricalData();
      expect(history).toHaveLength(3);
      expect(history[0]).toMatchObject({
        timestamp: expect.any(Number),
        fps: expect.any(Object),
      });
    });

    it('履歴サイズ制限が守られる', () => {
      const config = { monitoring: { maxHistorySize: 5 } };
      monitor = new PerformanceMonitor(config);

      monitor.startMonitoring();

      jest.advanceTimersByTime(800); // 8回分のデータ

      const history = monitor.getHistoricalData();
      expect(history).toHaveLength(5);
    });

    it('平均値計算が正確に実行される', () => {
      monitor.startMonitoring();

      jest.advanceTimersByTime(500);

      const avgMetrics = monitor.getAverageMetrics();

      expect(avgMetrics).toMatchObject({
        fps: expect.objectContaining({
          average: expect.any(Number),
        }),
        memory: expect.objectContaining({
          averageUsage: expect.any(Number),
        }),
      });
    });

    it('トレンド分析が正しく実行される', () => {
      monitor.startMonitoring();

      jest.advanceTimersByTime(1000);

      const trend = monitor.getTrendAnalysis();

      expect(trend).toMatchObject({
        fps: expect.objectContaining({
          trend: expect.stringMatching(/stable|increasing|decreasing/),
        }),
        memory: expect.objectContaining({
          trend: expect.stringMatching(/stable|increasing|decreasing/),
        }),
      });
    });

    it('データ取得APIが正しく動作する', () => {
      monitor.startMonitoring();
      jest.advanceTimersByTime(300);

      const timeRange = { start: Date.now() - 1000, end: Date.now() };
      const rangeData = monitor.getHistoricalData(timeRange);

      expect(Array.isArray(rangeData)).toBe(true);
      rangeData.forEach(data => {
        expect(data.timestamp).toBeGreaterThanOrEqual(timeRange.start);
        expect(data.timestamp).toBeLessThanOrEqual(timeRange.end);
      });
    });

    it('データクリア機能が正しく動作する', () => {
      monitor.startMonitoring();
      jest.advanceTimersByTime(300);

      expect(monitor.getHistoricalData()).toHaveLength(3);

      monitor.clearData();

      expect(monitor.getHistoricalData()).toHaveLength(0);
      expect(monitor.getMetricsBuffer()).toHaveLength(0);
    });
  });

  describe('ブラウザ互換性', () => {
    beforeEach(() => {
      monitor = new PerformanceMonitor();
    });

    it('Chrome環境で完全機能が動作する', () => {
      // Chrome環境モック（完全サポート）
      global.performance.memory = {
        usedJSHeapSize: 47185920,
        totalJSHeapSize: 52428800,
        jsHeapSizeLimit: 2172649472,
      };

      const metrics = monitor.getCurrentMetrics();

      expect(metrics.memory.supported).toBe(true);
      expect(metrics.memory.used).toBeGreaterThan(0);
    });

    it('Firefox環境で制限機能が動作する', () => {
      // Firefox環境モック（制限サポート）
      global.performance.memory = {
        usedJSHeapSize: 47185920,
        totalJSHeapSize: 0, // Firefox制限
        jsHeapSizeLimit: 0, // Firefox制限
      };

      const metrics = monitor.getCurrentMetrics();

      expect(metrics.memory.supported).toBe(true);
      expect(metrics.memory.used).toBeGreaterThan(0);
    });

    it('Safari環境でフォールバック機能が動作する', () => {
      // Safari環境モック（未サポート）
      delete global.performance.memory;

      const metrics = monitor.getCurrentMetrics();

      expect(metrics.memory.supported).toBe(false);
      expect(metrics.memory.used).toBe(0);
      expect(metrics.memory.percentage).toBe(0);
    });

    it('Edge環境で完全機能が動作する', () => {
      // Edge環境モック（Chrome同等）
      global.performance.memory = {
        usedJSHeapSize: 47185920,
        totalJSHeapSize: 52428800,
        jsHeapSizeLimit: 2172649472,
      };

      const metrics = monitor.getCurrentMetrics();

      expect(metrics.memory.supported).toBe(true);
      expect(metrics.memory.used).toBeGreaterThan(0);
    });

    it('performance.memory未定義時の処理が正しい', () => {
      delete global.performance.memory;

      expect(() => {
        const metrics = monitor.getCurrentMetrics();
        expect(metrics.memory).toBeDefined();
      }).not.toThrow();
    });

    it('performance.now未定義時の処理が正しい', () => {
      delete global.performance.now;

      expect(() => {
        const metrics = monitor.getCurrentMetrics();
        expect(metrics.timestamp).toBeDefined();
      }).not.toThrow();
    });

    it('古いブラウザでの代替実装が動作する', () => {
      // 古いブラウザ環境モック
      global.performance = undefined;

      expect(() => {
        const metrics = monitor.getCurrentMetrics();
        expect(metrics.timestamp).toBeGreaterThan(0);
      }).not.toThrow();
    });

    it('機能サポート状況が正しく報告される', () => {
      const support = monitor.getBrowserSupport();

      expect(support).toMatchObject({
        memoryAPI: expect.any(Boolean),
        performanceNow: expect.any(Boolean),
        highResolution: expect.any(Boolean),
      });
    });
  });

  describe('エラーハンドリング', () => {
    beforeEach(() => {
      monitor = new PerformanceMonitor();
    });

    it('メトリクス収集エラーが適切に処理される', () => {
      global.performance.now.mockImplementation(() => {
        throw new Error('Performance API Error');
      });

      expect(() => {
        const metrics = monitor.getCurrentMetrics();
        expect(metrics).toBeDefined();
      }).not.toThrow();

      expect(console.warn).toHaveBeenCalled();
    });

    it('イベント発生エラーが適切に処理される', () => {
      const errorCallback = jest.fn(() => {
        throw new Error('Event callback error');
      });

      monitor.on('metrics', errorCallback);

      expect(() => {
        monitor.emit('metrics', { test: true });
      }).not.toThrow();

      expect(console.error).toHaveBeenCalled();
    });

    it('設定検証エラーが適切に処理される', () => {
      expect(() => {
        monitor = new PerformanceMonitor({
          monitoring: { interval: 'invalid' },
        });
      }).toThrow('Invalid configuration');
    });

    it('メモリ不足時の処理が正しい', () => {
      // メモリ不足シミュレーション
      global.performance.memory = {
        usedJSHeapSize: 2000000000,
        totalJSHeapSize: 2000000000,
        jsHeapSizeLimit: 2000000000,
      };

      expect(() => {
        const metrics = monitor.getCurrentMetrics();
        expect(metrics.memory.percentage).toBeGreaterThan(90);
      }).not.toThrow();
    });

    it('例外発生時にもシステムが継続する', () => {
      monitor.startMonitoring();

      // 例外を発生させる
      global.performance.now.mockImplementationOnce(() => {
        throw new Error('Temporary error');
      });

      jest.advanceTimersByTime(100);

      // システムが継続して動作する
      expect(monitor.isMonitoring).toBe(true);
    });

    it('エラーログが適切に出力される', () => {
      global.performance.now.mockImplementation(() => {
        throw new Error('Test error');
      });

      monitor.getCurrentMetrics();

      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Test error'));
    });
  });

  describe('ライフサイクル', () => {
    beforeEach(() => {
      monitor = new PerformanceMonitor();
    });

    it('破棄処理が正しく実行される', () => {
      monitor.startMonitoring();

      monitor.destroy();

      expect(monitor.isDestroyed).toBe(true);
      expect(monitor.isMonitoring).toBe(false);
    });

    it('破棄後の操作でエラーが発生する', () => {
      monitor.destroy();

      expect(() => {
        monitor.startMonitoring();
      }).toThrow('PerformanceMonitor has been destroyed');
    });

    it('リソースが適切に解放される', () => {
      monitor.startMonitoring();
      monitor.on('metrics', jest.fn());

      monitor.destroy();

      expect(monitor._eventListeners.size).toBe(0);
      expect(monitor._metricsBuffer).toHaveLength(0);
      expect(monitor._historyData).toHaveLength(0);
    });

    it('破棄状態が正確に管理される', () => {
      expect(monitor.isDestroyed).toBe(false);

      monitor.destroy();

      expect(monitor.isDestroyed).toBe(true);
    });
  });
});
