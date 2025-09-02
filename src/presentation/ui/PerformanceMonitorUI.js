/**
 * PerformanceMonitorUI - パフォーマンス監視UIコンポーネント
 *
 * リアルタイムFPS、メモリ使用量、パーティクル数の監視表示
 * チャート表示、アラート機能、設定管理を提供
 *
 * @author AI Assistant
 * @version 1.0.0
 */

export default class PerformanceMonitorUI {
  /**
   * PerformanceMonitorUIのコンストラクタ
   *
   * @param {HTMLElement} container - UIコンテナ要素
   * @param {Object} performanceMonitor - パフォーマンス監視システム
   * @param {Object} modernUI - ModernUIインスタンス
   * @param {Object} config - UI設定
   */
  constructor(container, performanceMonitor, modernUI, config = {}) {
    if (!container) {
      throw new Error('Container element is required');
    }

    if (!performanceMonitor) {
      throw new Error('PerformanceMonitor is required');
    }

    this.container = container;
    this.performanceMonitor = performanceMonitor;
    this.modernUI = modernUI;

    // 設定
    this.config = {
      updateInterval: config.updateInterval || 1000,
      position: config.position || 'top-right',
      minimized: config.minimized || false,
      showChart: config.showChart || false,
      warningThreshold: config.warningThreshold || {
        fps: 30,
        memory: 80,
      },
      ...config,
    };

    // 状態
    this.state = {
      isVisible: false,
      isMonitoring: false,
      isMinimized: false,
      updateTimer: null,
    };

    // チャートデータ
    this.chartData = {
      fps: [],
      memory: [],
      maxDataPoints: 60,
    };
  }

  /**
   * パフォーマンス監視UIを表示
   */
  show() {
    if (this.state.isVisible) return;

    try {
      // 既存のUIがあるかチェック
      let monitor = this.container.querySelector('.performance-monitor');

      if (!monitor) {
        this._createUI();
        this._setupEventListeners();
        monitor = this.container.querySelector('.performance-monitor');
      }

      if (monitor) {
        monitor.style.display = '';
      }

      this._updateMetrics();

      this.state.isVisible = true;

      if (this.config.minimized) {
        this._minimize();
      }
    } catch (error) {
      if (this.modernUI && this.modernUI.showNotification) {
        this.modernUI.showNotification('パフォーマンス監視UIの表示に失敗しました', 'error');
      }
    }
  }

  /**
   * パフォーマンス監視UIを隠す
   */
  hide() {
    if (!this.state.isVisible) return;

    this.stopMonitoring();
    this._removeEventListeners();

    const monitor = this.container.querySelector('.performance-monitor');
    if (monitor) {
      monitor.style.display = 'none';
    }

    this.state.isVisible = false;
  }

  /**
   * 監視を開始
   */
  startMonitoring() {
    if (this.state.isMonitoring) return;

    try {
      this.performanceMonitor.startMonitoring();
      this.state.isMonitoring = true;

      this.state.updateTimer = setInterval(() => {
        this._updateMetrics();
      }, this.config.updateInterval);
    } catch (error) {
      // Error logged('Failed to start monitoring:', error);
    }
  }

  /**
   * 監視を停止
   */
  stopMonitoring() {
    if (!this.state.isMonitoring) return;

    try {
      this.performanceMonitor.stopMonitoring();
      this.state.isMonitoring = false;

      if (this.state.updateTimer) {
        clearInterval(this.state.updateTimer);
        this.state.updateTimer = null;
      }
    } catch (error) {
      // Error logged('Failed to stop monitoring:', error);
    }
  }

  /**
   * UIの作成
   * @private
   */
  _createUI() {
    const performanceMonitorHTML = `
      <div class="performance-monitor position-${this.config.position}">
        <div class="performance-header">
          <span class="monitor-title">パフォーマンス監視</span>
          <div class="monitor-controls">
            <button class="toggle-monitoring" aria-label="監視開始/停止">⏸</button>
            <button class="minimize-button" aria-label="最小化">−</button>
            <button class="close-button" aria-label="閉じる">×</button>
          </div>
        </div>
        
        <div class="performance-metrics">
          <!-- FPS表示 -->
          <div class="metric-item">
            <span class="metric-label fps-label">FPS</span>
            <span class="metric-value fps-value">0.0</span>
          </div>
          
          <!-- メモリ使用量表示 -->
          <div class="metric-item">
            <span class="metric-label memory-label">MB</span>
            <span class="metric-value memory-value">0.0</span>
          </div>
          
          <!-- パーティクル数表示 -->
          <div class="metric-item">
            <span class="metric-label">Particles</span>
            <span class="metric-value particle-count">0</span>
          </div>
          
          <!-- アクティブエフェクト数 -->
          <div class="metric-item">
            <span class="metric-label">Effects</span>
            <span class="metric-value active-effects">0</span>
          </div>
        </div>

        ${this.config.showChart ? this._createChartsSection() : ''}

        <div class="performance-footer">
          <button class="reset-button">リセット</button>
          <button class="settings-button">設定</button>
        </div>
      </div>
    `;

    this.container.insertAdjacentHTML('beforeend', performanceMonitorHTML);

    if (this.config.showChart) {
      this._initializeCharts();
    }
  }

  /**
   * チャートセクションの作成
   * @private
   * @returns {string} チャートセクションHTML
   */
  _createChartsSection() {
    return `
      <div class="performance-charts">
        <div class="chart-container fps-chart">
          <h4>FPS履歴</h4>
          <canvas width="200" height="60"></canvas>
        </div>
        <div class="chart-container memory-chart">
          <h4>メモリ使用量</h4>
          <canvas width="200" height="60"></canvas>
        </div>
      </div>
    `;
  }

  /**
   * チャートの初期化
   * @private
   */
  _initializeCharts() {
    try {
      const fpsCanvas = this.container.querySelector('.fps-chart canvas');
      const memoryCanvas = this.container.querySelector('.memory-chart canvas');

      if (fpsCanvas) {
        this.fpsChart = {
          canvas: fpsCanvas,
          context: fpsCanvas.getContext('2d'),
        };
      }

      if (memoryCanvas) {
        this.memoryChart = {
          canvas: memoryCanvas,
          context: memoryCanvas.getContext('2d'),
        };
      }
    } catch (error) {
      // Error logged('Failed to initialize charts:', error);
    }
  }

  /**
   * メトリクスの更新
   */
  updateMetrics() {
    this._updateMetrics();
  }

  /**
   * メトリクスの更新（内部）
   * @private
   */
  _updateMetrics() {
    try {
      const metrics = this.performanceMonitor.getMetrics();

      // 値の表示更新
      this._updateMetricDisplay('.fps-value', metrics.fps, 1);
      this._updateMetricDisplay('.memory-value', metrics.memoryUsed, 1);
      this._updateMetricDisplay('.particle-count', metrics.particleCount, 0);
      this._updateMetricDisplay('.active-effects', metrics.activeEffects, 0);

      // 警告の確認
      this._checkPerformanceWarnings(metrics);

      // チャートデータの更新
      if (this.config.showChart) {
        this._updateChartData(metrics);
        this._updateCharts();
      }
    } catch (error) {
      // Error logged('Failed to update metrics:', error);
      if (this.modernUI && this.modernUI.showNotification) {
        this.modernUI.showNotification('パフォーマンス情報の取得に失敗しました', 'error');
      }
    }
  }

  /**
   * メトリクス表示の更新
   * @private
   * @param {string} selector - セレクター
   * @param {number} value - 値
   * @param {number} decimals - 小数点桁数
   */
  _updateMetricDisplay(selector, value, decimals = 1) {
    const element = this.container.querySelector(selector);
    if (element && typeof value === 'number') {
      element.textContent = value.toFixed(decimals);
    }
  }

  /**
   * パフォーマンス警告の確認
   * @private
   * @param {Object} metrics - メトリクス
   */
  _checkPerformanceWarnings(metrics) {
    const fpsElement = this.container.querySelector('.fps-value');
    const memoryElement = this.container.querySelector('.memory-value');

    // FPS警告
    if (metrics.fps < this.config.warningThreshold.fps) {
      if (fpsElement) {
        fpsElement.classList.add('warning');
      }

      if (this.modernUI && this.modernUI.showNotification) {
        this.modernUI.showNotification(
          `FPSが低下しています (${metrics.fps.toFixed(1)} FPS)`,
          'warning'
        );
      }
    } else {
      if (fpsElement) {
        fpsElement.classList.remove('warning');
      }
    }

    // メモリ使用量警告
    if (metrics.memoryUsed > this.config.warningThreshold.memory) {
      if (memoryElement) {
        if (metrics.memoryUsed > 90) {
          memoryElement.classList.add('critical');
        } else {
          memoryElement.classList.add('warning');
        }
      }

      if (this.modernUI && this.modernUI.showNotification) {
        const type = metrics.memoryUsed > 90 ? 'error' : 'warning';
        this.modernUI.showNotification(
          `メモリ使用量が高いです (${metrics.memoryUsed.toFixed(1)}%)`,
          type
        );
      }
    } else {
      if (memoryElement) {
        memoryElement.classList.remove('warning', 'critical');
      }
    }

    // パーティクル数警告
    if (metrics.particleCount > 2000) {
      if (this.modernUI && this.modernUI.showNotification) {
        this.modernUI.showNotification(
          `パーティクル数が多すぎます (${metrics.particleCount}個)`,
          'warning'
        );
      }
    }
  }

  /**
   * チャートデータの更新
   * @private
   * @param {Object} metrics - メトリクス
   */
  _updateChartData(metrics) {
    // FPSデータの追加
    this.chartData.fps.push(metrics.fps);
    if (this.chartData.fps.length > this.chartData.maxDataPoints) {
      this.chartData.fps.shift();
    }

    // メモリデータの追加
    this.chartData.memory.push(metrics.memoryUsed);
    if (this.chartData.memory.length > this.chartData.maxDataPoints) {
      this.chartData.memory.shift();
    }
  }

  /**
   * チャートの更新
   */
  updateCharts() {
    this._updateCharts();
  }

  /**
   * チャートの更新（内部）
   * @private
   */
  _updateCharts() {
    try {
      // 履歴データを取得
      this.performanceMonitor.getHistory();

      if (this.fpsChart) {
        this._drawChart(this.fpsChart, this.chartData.fps, 0, 60, '#4a9eff');
      }

      if (this.memoryChart) {
        this._drawChart(this.memoryChart, this.chartData.memory, 0, 100, '#ff6b6b');
      }
    } catch (error) {
      // チャート更新エラーを記録
      if (this.modernUI && this.modernUI.showNotification) {
        this.modernUI.showNotification('チャート更新に失敗しました', 'error');
      }
    }
  }

  /**
   * チャートの描画
   * @private
   * @param {Object} chart - チャートオブジェクト
   * @param {Array} data - データ配列
   * @param {number} min - 最小値
   * @param {number} max - 最大値
   * @param {string} color - 線の色
   */
  _drawChart(chart, data, min, max, color) {
    const { canvas, context } = chart;
    const width = canvas.width;
    const height = canvas.height;

    // クリア
    context.clearRect(0, 0, width, height);

    if (data.length < 2) return;

    // パスの開始
    context.beginPath();
    context.strokeStyle = color;
    context.lineWidth = 2;

    // データポイントの描画
    const stepX = width / (this.chartData.maxDataPoints - 1);

    data.forEach((value, index) => {
      const x = index * stepX;
      const y = height - ((value - min) / (max - min)) * height;

      if (index === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    });

    context.stroke();
  }

  /**
   * 最小化/復元の切り替え
   */
  toggleMinimize() {
    if (this.state.isMinimized) {
      this._restore();
    } else {
      this._minimize();
    }
  }

  /**
   * 最小化
   * @private
   */
  _minimize() {
    const monitor = this.container.querySelector('.performance-monitor');
    if (monitor) {
      monitor.classList.add('minimized');
      this.state.isMinimized = true;
    }
  }

  /**
   * 復元
   * @private
   */
  _restore() {
    const monitor = this.container.querySelector('.performance-monitor');
    if (monitor) {
      monitor.classList.remove('minimized');
      this.state.isMinimized = false;
    }
  }

  /**
   * 位置の設定
   * @param {string} position - 位置（top-left, top-right, bottom-left, bottom-right）
   */
  setPosition(position) {
    const monitor = this.container.querySelector('.performance-monitor');
    if (monitor) {
      // 既存の位置クラスを削除
      monitor.classList.remove(
        'position-top-left',
        'position-top-right',
        'position-bottom-left',
        'position-bottom-right'
      );

      // 新しい位置クラスを追加
      monitor.classList.add(`position-${position}`);
      this.config.position = position;
    }
  }

  /**
   * チャート表示/非表示の切り替え
   * @param {boolean} visible - 表示フラグ
   */
  setChartVisible(visible) {
    const chartsSection = this.container.querySelector('.performance-charts');
    if (chartsSection) {
      chartsSection.style.display = visible ? '' : 'none';
    }
  }

  /**
   * 設定の更新
   * @param {Object} newConfig - 新しい設定
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };

    if (this.state.isVisible) {
      this._updateUI();
    }
  }

  /**
   * UIの更新
   * @private
   */
  _updateUI() {
    // 位置の更新
    if (this.config.position) {
      this.setPosition(this.config.position);
    }

    // チャート表示の更新
    if (this.config.showChart !== undefined) {
      this.setChartVisible(this.config.showChart);
    }

    // 更新間隔の変更
    if (this.state.isMonitoring && this.config.updateInterval) {
      this.stopMonitoring();
      this.startMonitoring();
    }
  }

  /**
   * イベントリスナーの設定
   * @private
   */
  _setupEventListeners() {
    // 監視開始/停止ボタン
    const toggleButton = this.container.querySelector('.toggle-monitoring');
    if (toggleButton) {
      toggleButton.addEventListener('click', () => {
        if (this.state.isMonitoring) {
          this.stopMonitoring();
          toggleButton.textContent = '▶';
        } else {
          this.startMonitoring();
          toggleButton.textContent = '⏸';
        }
      });
    }

    // 最小化ボタン
    const minimizeButton = this.container.querySelector('.minimize-button');
    if (minimizeButton) {
      minimizeButton.addEventListener('click', () => this.toggleMinimize());
    }

    // 閉じるボタン
    const closeButton = this.container.querySelector('.close-button');
    if (closeButton) {
      closeButton.addEventListener('click', () => this.hide());
    }

    // リセットボタン
    const resetButton = this.container.querySelector('.reset-button');
    if (resetButton) {
      resetButton.addEventListener('click', () => this._handleReset());
    }

    // 設定ボタン
    const settingsButton = this.container.querySelector('.settings-button');
    if (settingsButton) {
      settingsButton.addEventListener('click', () => this._handleSettings());
    }
  }

  /**
   * リセットの処理
   * @private
   */
  _handleReset() {
    try {
      this.performanceMonitor.reset();
      this.chartData.fps = [];
      this.chartData.memory = [];

      if (this.modernUI && this.modernUI.showNotification) {
        this.modernUI.showNotification('パフォーマンス統計をリセットしました', 'info');
      }
    } catch (error) {
      // Error logged('Failed to reset performance monitor:', error);
    }
  }

  /**
   * 設定の処理
   * @private
   */
  _handleSettings() {
    // 設定画面を表示（将来の拡張）
    if (this.modernUI && this.modernUI.showNotification) {
      this.modernUI.showNotification('設定機能は開発中です', 'info');
    }
  }

  /**
   * 設定の保存
   * @param {Object} config - 保存する設定
   */
  saveConfig(config) {
    try {
      localStorage.setItem('tetris-performance-monitor-config', JSON.stringify(config));
    } catch (error) {
      // Error logged('Failed to save config:', error);
    }
  }

  /**
   * 設定の読み込み
   * @returns {Object} 読み込んだ設定
   */
  loadConfig() {
    try {
      const saved = localStorage.getItem('tetris-performance-monitor-config');
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      // Error logged('Failed to load config:', error);
      return null;
    }
  }

  /**
   * イベントリスナーの削除
   * @private
   */
  _removeEventListeners() {
    // DOMが削除されるため、明示的な削除は不要
  }

  /**
   * UIのクリア
   * @private
   */
  _clearUI() {
    if (!this.container) return;

    const monitor = this.container.querySelector('.performance-monitor');
    if (monitor) {
      monitor.remove();
    }
  }

  /**
   * 表示状態の確認
   * @returns {boolean} 表示状態フラグ
   */
  isVisible() {
    return this.state.isVisible;
  }

  /**
   * 監視状態の確認
   * @returns {boolean} 監視状態フラグ
   */
  isMonitoring() {
    return this.state.isMonitoring;
  }

  /**
   * 最小化状態の確認
   * @returns {boolean} 最小化状態フラグ
   */
  isMinimized() {
    return this.state.isMinimized;
  }

  /**
   * 設定の取得
   * @returns {Object} 現在の設定
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * リソース解放
   */
  destroy() {
    this.stopMonitoring();

    // UIを完全に削除
    this._clearUI();

    // コンテナを完全にクリア
    if (this.container) {
      this.container.innerHTML = '';
    }

    this.state.isVisible = false;
    this.performanceMonitor = null;
    this.modernUI = null;
    this.container = null;
  }
}
