/**
 * PerformanceMonitorUI テスト
 *
 * パフォーマンス監視UIコンポーネントのテスト
 *
 * テスト範囲:
 * - リアルタイムパフォーマンス表示
 * - FPS・メモリ監視
 * - UI表示/非表示制御
 * - パフォーマンス閾値アラート
 */

import PerformanceMonitorUI from '../../../../src/presentation/ui/PerformanceMonitorUI.js';

describe('PerformanceMonitorUI', () => {
  let container;
  let performanceMonitorUI;
  let mockPerformanceMonitor;
  let mockModernUI;

  beforeEach(() => {
    // テスト用DOM環境の設定
    container = document.createElement('div');
    container.id = 'performance-monitor-container';
    document.body.appendChild(container);

    // PerformanceMonitorのモック
    mockPerformanceMonitor = {
      getMetrics: jest.fn(() => ({
        fps: 58.5,
        frameTime: 17.2,
        memoryUsed: 45.6,
        memoryTotal: 100.0,
        renderTime: 12.3,
        updateTime: 4.9,
        particleCount: 1250,
        activeEffects: 3,
      })),
      isMonitoring: jest.fn(() => true),
      startMonitoring: jest.fn(),
      stopMonitoring: jest.fn(),
      reset: jest.fn(),
      getHistory: jest.fn(() => []),
      on: jest.fn(),
      off: jest.fn(),
    };

    // ModernUIのモック
    mockModernUI = {
      showNotification: jest.fn(),
      getState: jest.fn(() => ({ currentTheme: 'dark' })),
      on: jest.fn(),
      emit: jest.fn(),
    };

    // パフォーマンスAPIのモック
    global.performance = {
      now: jest.fn(() => Date.now()),
      memory: {
        usedJSHeapSize: 45600000,
        totalJSHeapSize: 100000000,
        jsHeapSizeLimit: 2000000000,
      },
    };

    global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 16));
  });

  afterEach(() => {
    if (performanceMonitorUI) {
      performanceMonitorUI.destroy();
    }
    document.body.removeChild(container);
    jest.clearAllMocks();
  });

  describe('初期化', () => {
    test('正常に初期化される', () => {
      performanceMonitorUI = new PerformanceMonitorUI(
        container,
        mockPerformanceMonitor,
        mockModernUI
      );

      expect(performanceMonitorUI).toBeDefined();
      expect(performanceMonitorUI.isVisible()).toBe(false);
      expect(performanceMonitorUI.isMonitoring()).toBe(false);
    });

    test('必須パラメータが不足している場合はエラーが発生する', () => {
      expect(() => {
        new PerformanceMonitorUI(null, mockPerformanceMonitor, mockModernUI);
      }).toThrow('Container element is required');

      expect(() => {
        new PerformanceMonitorUI(container, null, mockModernUI);
      }).toThrow('PerformanceMonitor is required');
    });

    test('設定パラメータが正しく適用される', () => {
      const config = {
        updateInterval: 500,
        position: 'bottom-left',
        minimized: true,
        showChart: false,
      };

      performanceMonitorUI = new PerformanceMonitorUI(
        container,
        mockPerformanceMonitor,
        mockModernUI,
        config
      );

      const uiConfig = performanceMonitorUI.getConfig();
      expect(uiConfig.updateInterval).toBe(500);
      expect(uiConfig.position).toBe('bottom-left');
      expect(uiConfig.minimized).toBe(true);
      expect(uiConfig.showChart).toBe(false);
    });
  });

  describe('UI表示', () => {
    beforeEach(() => {
      performanceMonitorUI = new PerformanceMonitorUI(
        container,
        mockPerformanceMonitor,
        mockModernUI
      );
    });

    test('パフォーマンス監視UIが正しく生成される', () => {
      performanceMonitorUI.show();

      expect(performanceMonitorUI.isVisible()).toBe(true);
      expect(container.querySelector('.performance-monitor')).toBeTruthy();
      expect(container.querySelector('.performance-header')).toBeTruthy();
      expect(container.querySelector('.performance-metrics')).toBeTruthy();
    });

    test('FPS表示が正しく生成される', () => {
      performanceMonitorUI.show();

      const fpsDisplay = container.querySelector('.fps-value');
      expect(fpsDisplay).toBeTruthy();
      expect(fpsDisplay.textContent).toBe('58.5');

      const fpsLabel = container.querySelector('.fps-label');
      expect(fpsLabel.textContent).toBe('FPS');
    });

    test('メモリ使用量表示が正しく生成される', () => {
      performanceMonitorUI.show();

      const memoryDisplay = container.querySelector('.memory-value');
      expect(memoryDisplay).toBeTruthy();
      expect(memoryDisplay.textContent).toBe('45.6');

      const memoryLabel = container.querySelector('.memory-label');
      expect(memoryLabel.textContent).toBe('MB');
    });

    test('パーティクル数表示が正しく生成される', () => {
      performanceMonitorUI.show();

      const particleDisplay = container.querySelector('.particle-count');
      expect(particleDisplay).toBeTruthy();
      expect(particleDisplay.textContent).toContain('1250');
    });

    test('制御ボタンが正しく生成される', () => {
      performanceMonitorUI.show();

      const toggleButton = container.querySelector('.toggle-monitoring');
      const minimizeButton = container.querySelector('.minimize-button');
      const resetButton = container.querySelector('.reset-button');

      expect(toggleButton).toBeTruthy();
      expect(minimizeButton).toBeTruthy();
      expect(resetButton).toBeTruthy();
    });
  });

  describe('リアルタイム更新', () => {
    beforeEach(() => {
      performanceMonitorUI = new PerformanceMonitorUI(
        container,
        mockPerformanceMonitor,
        mockModernUI
      );
      performanceMonitorUI.show();
    });

    test('監視開始が正常に動作する', () => {
      performanceMonitorUI.startMonitoring();

      expect(performanceMonitorUI.isMonitoring()).toBe(true);
      expect(mockPerformanceMonitor.startMonitoring).toHaveBeenCalled();
    });

    test('監視停止が正常に動作する', () => {
      performanceMonitorUI.startMonitoring();
      performanceMonitorUI.stopMonitoring();

      expect(performanceMonitorUI.isMonitoring()).toBe(false);
      expect(mockPerformanceMonitor.stopMonitoring).toHaveBeenCalled();
    });

    test('メトリクス更新が正常に動作する', () => {
      const newMetrics = {
        fps: 60.0,
        frameTime: 16.7,
        memoryUsed: 50.2,
        particleCount: 1500,
      };

      mockPerformanceMonitor.getMetrics.mockReturnValue(newMetrics);

      performanceMonitorUI.updateMetrics();

      const fpsDisplay = container.querySelector('.fps-value');
      const memoryDisplay = container.querySelector('.memory-value');
      const particleDisplay = container.querySelector('.particle-count');

      expect(fpsDisplay.textContent).toBe('60.0');
      expect(memoryDisplay.textContent).toBe('50.2');
      expect(particleDisplay.textContent).toContain('1500');
    });

    test('自動更新が正常に動作する', () => {
      jest.useFakeTimers();

      performanceMonitorUI = new PerformanceMonitorUI(
        container,
        mockPerformanceMonitor,
        mockModernUI,
        { updateInterval: 50 }
      );

      // 初期の呼び出し回数を記録
      const initialCallCount = mockPerformanceMonitor.getMetrics.mock.calls.length;

      performanceMonitorUI.show();
      performanceMonitorUI.startMonitoring();

      // 時間を進める
      jest.advanceTimersByTime(100);

      const finalCallCount = mockPerformanceMonitor.getMetrics.mock.calls.length;
      expect(finalCallCount).toBeGreaterThan(initialCallCount); // 自動更新により呼び出し回数が増加

      performanceMonitorUI.stopMonitoring();

      jest.useRealTimers();
    });
  });

  describe('パフォーマンス警告', () => {
    beforeEach(() => {
      performanceMonitorUI = new PerformanceMonitorUI(
        container,
        mockPerformanceMonitor,
        mockModernUI
      );
      performanceMonitorUI.show();
    });

    test('低FPS警告が正常に動作する', () => {
      const lowFpsMetrics = {
        fps: 25.0,
        frameTime: 40.0,
        memoryUsed: 45.6,
        particleCount: 1250,
      };

      mockPerformanceMonitor.getMetrics.mockReturnValue(lowFpsMetrics);
      performanceMonitorUI.updateMetrics();

      const fpsDisplay = container.querySelector('.fps-value');
      expect(fpsDisplay.classList.contains('warning')).toBe(true);

      expect(mockModernUI.showNotification).toHaveBeenCalledWith(
        'FPSが低下しています (25.0 FPS)',
        'warning'
      );
    });

    test('高メモリ使用量警告が正常に動作する', () => {
      const highMemoryMetrics = {
        fps: 60.0,
        frameTime: 16.7,
        memoryUsed: 95.5,
        particleCount: 1250,
      };

      mockPerformanceMonitor.getMetrics.mockReturnValue(highMemoryMetrics);
      performanceMonitorUI.updateMetrics();

      const memoryDisplay = container.querySelector('.memory-value');
      expect(memoryDisplay.classList.contains('critical')).toBe(true);

      expect(mockModernUI.showNotification).toHaveBeenCalledWith(
        'メモリ使用量が高いです (95.5%)',
        'error'
      );
    });

    test('パーティクル数警告が正常に動作する', () => {
      const highParticleMetrics = {
        fps: 45.0,
        frameTime: 22.2,
        memoryUsed: 60.0,
        particleCount: 2500,
      };

      mockPerformanceMonitor.getMetrics.mockReturnValue(highParticleMetrics);
      performanceMonitorUI.updateMetrics();

      expect(mockModernUI.showNotification).toHaveBeenCalledWith(
        'パーティクル数が多すぎます (2500個)',
        'warning'
      );
    });
  });

  describe('UI制御', () => {
    beforeEach(() => {
      performanceMonitorUI = new PerformanceMonitorUI(
        container,
        mockPerformanceMonitor,
        mockModernUI
      );
      performanceMonitorUI.show();
    });

    test('最小化/復元が正常に動作する', () => {
      const minimizeButton = container.querySelector('.minimize-button');

      // 最小化
      minimizeButton.click();

      expect(performanceMonitorUI.isMinimized()).toBe(true);
      expect(container.querySelector('.performance-monitor').classList.contains('minimized')).toBe(
        true
      );

      // 復元
      minimizeButton.click();

      expect(performanceMonitorUI.isMinimized()).toBe(false);
      expect(container.querySelector('.performance-monitor').classList.contains('minimized')).toBe(
        false
      );
    });

    test('位置変更が正常に動作する', () => {
      performanceMonitorUI.setPosition('bottom-left');

      const monitor = container.querySelector('.performance-monitor');
      expect(monitor.classList.contains('position-bottom-left')).toBe(true);

      performanceMonitorUI.setPosition('top-right');

      expect(monitor.classList.contains('position-top-right')).toBe(true);
      expect(monitor.classList.contains('position-bottom-left')).toBe(false);
    });

    test('非表示/表示が正常に動作する', () => {
      expect(performanceMonitorUI.isVisible()).toBe(true);

      performanceMonitorUI.hide();

      expect(performanceMonitorUI.isVisible()).toBe(false);
      expect(container.querySelector('.performance-monitor').style.display).toBe('none');

      performanceMonitorUI.show();

      expect(performanceMonitorUI.isVisible()).toBe(true);
      expect(container.querySelector('.performance-monitor').style.display).not.toBe('none');
    });

    test('リセット機能が正常に動作する', () => {
      const resetButton = container.querySelector('.reset-button');

      resetButton.click();

      expect(mockPerformanceMonitor.reset).toHaveBeenCalled();
      expect(mockModernUI.showNotification).toHaveBeenCalledWith(
        'パフォーマンス統計をリセットしました',
        'info'
      );
    });
  });

  describe('チャート表示', () => {
    beforeEach(() => {
      performanceMonitorUI = new PerformanceMonitorUI(
        container,
        mockPerformanceMonitor,
        mockModernUI,
        { showChart: true }
      );
      performanceMonitorUI.show();
    });

    test('FPSチャートが正しく生成される', () => {
      const chartContainer = container.querySelector('.fps-chart');
      expect(chartContainer).toBeTruthy();

      const canvas = chartContainer.querySelector('canvas');
      expect(canvas).toBeTruthy();
      expect(canvas.width).toBeGreaterThan(0);
      expect(canvas.height).toBeGreaterThan(0);
    });

    test('メモリ使用量チャートが正しく生成される', () => {
      const chartContainer = container.querySelector('.memory-chart');
      expect(chartContainer).toBeTruthy();

      const canvas = chartContainer.querySelector('canvas');
      expect(canvas).toBeTruthy();
    });

    test('チャートデータの更新が正常に動作する', () => {
      const history = [
        { fps: 60, memory: 45, timestamp: Date.now() - 2000 },
        { fps: 58, memory: 47, timestamp: Date.now() - 1000 },
        { fps: 59, memory: 46, timestamp: Date.now() },
      ];

      mockPerformanceMonitor.getHistory.mockReturnValue(history);

      performanceMonitorUI.updateCharts();

      // チャートが更新されたことを確認
      expect(mockPerformanceMonitor.getHistory).toHaveBeenCalled();
    });

    test('チャート表示/非表示切り替えが正常に動作する', () => {
      expect(container.querySelector('.performance-charts')).toBeTruthy();

      performanceMonitorUI.setChartVisible(false);

      expect(container.querySelector('.performance-charts').style.display).toBe('none');

      performanceMonitorUI.setChartVisible(true);

      expect(container.querySelector('.performance-charts').style.display).not.toBe('none');
    });
  });

  describe('設定管理', () => {
    beforeEach(() => {
      performanceMonitorUI = new PerformanceMonitorUI(
        container,
        mockPerformanceMonitor,
        mockModernUI
      );
    });

    test('設定の更新が正常に動作する', () => {
      const newConfig = {
        updateInterval: 2000,
        position: 'top-left',
        showChart: false,
        warningThreshold: { fps: 45, memory: 85 },
      };

      performanceMonitorUI.updateConfig(newConfig);

      const config = performanceMonitorUI.getConfig();
      expect(config.updateInterval).toBe(2000);
      expect(config.position).toBe('top-left');
      expect(config.showChart).toBe(false);
      expect(config.warningThreshold.fps).toBe(45);
    });

    test('設定の保存と復元が正常に動作する', () => {
      const config = {
        position: 'bottom-right',
        minimized: true,
        showChart: false,
      };

      performanceMonitorUI.saveConfig(config);

      // localStorageへの保存を確認
      const saved = JSON.parse(localStorage.getItem('tetris-performance-monitor-config'));
      expect(saved).toEqual(config);

      // 設定の復元
      const restored = performanceMonitorUI.loadConfig();
      expect(restored).toEqual(config);
    });
  });

  describe('エラーハンドリング', () => {
    beforeEach(() => {
      performanceMonitorUI = new PerformanceMonitorUI(
        container,
        mockPerformanceMonitor,
        mockModernUI
      );
    });

    test('PerformanceMonitorエラーが適切に処理される', () => {
      mockPerformanceMonitor.getMetrics.mockImplementation(() => {
        throw new Error('Performance monitor error');
      });

      performanceMonitorUI.show();

      expect(() => {
        performanceMonitorUI.updateMetrics();
      }).not.toThrow();

      expect(mockModernUI.showNotification).toHaveBeenCalledWith(
        'パフォーマンス情報の取得に失敗しました',
        'error'
      );
    });

    test('チャート描画エラーが適切に処理される', () => {
      // Canvas APIのモック（エラーを発生させる）
      const mockCanvas = {
        getContext: jest.fn(() => {
          throw new Error('Canvas error');
        }),
      };

      // querySelector をモックして mockCanvas を返す
      const originalQuerySelector = container.querySelector;
      container.querySelector = jest.fn(selector => {
        if (selector.includes('canvas')) {
          return mockCanvas;
        }
        return originalQuerySelector.call(container, selector);
      });

      performanceMonitorUI = new PerformanceMonitorUI(
        container,
        mockPerformanceMonitor,
        mockModernUI,
        { showChart: true }
      );

      expect(() => {
        performanceMonitorUI.show();
      }).not.toThrow();
    });
  });

  describe('破棄処理', () => {
    test('リソースが正しく解放される', () => {
      performanceMonitorUI = new PerformanceMonitorUI(
        container,
        mockPerformanceMonitor,
        mockModernUI
      );
      performanceMonitorUI.show();
      performanceMonitorUI.startMonitoring();

      expect(performanceMonitorUI.isMonitoring()).toBe(true);
      expect(performanceMonitorUI.isVisible()).toBe(true);

      performanceMonitorUI.destroy();

      expect(performanceMonitorUI.isMonitoring()).toBe(false);
      expect(performanceMonitorUI.isVisible()).toBe(false);
      expect(container.innerHTML).toBe('');
    });
  });
});
