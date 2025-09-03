/**
 * MemoryManager - 高度なメモリ効率化システム
 *
 * 既存のMemoryOptimizerより高度で統合的なメモリ管理を提供
 * リアルタイムメモリ監視、リーク検出、ガベージコレクション制御、
 * WeakMapベースの参照管理を統合した包括的システム
 */
class MemoryManager {
  constructor(options = {}) {
    const { performanceMonitor, objectPool, weakMapRegistry, config = {} } = options;

    // 依存関係の設定（モック可能）
    this.performanceMonitor = performanceMonitor || this._createDefaultPerformanceMonitor();
    this.objectPool = objectPool || this._createDefaultObjectPool();
    this.weakMapRegistry = weakMapRegistry || this._createDefaultWeakMapRegistry();

    // 設定の初期化
    this.config = {
      thresholds: {
        warning: 80, // MB
        critical: 100, // MB
        leakDetection: 3, // 検出するリーク数
        gcInterval: 5000, // GC間隔（ミリ秒）
        poolEfficiency: 0.7, // プール効率閾値
      },
      intervals: {
        monitoring: 1000, // 監視間隔
        cleanup: 15000, // クリーンアップ間隔
        leakScan: 30000, // リークスキャン間隔
      },
      limits: {
        historySize: 20, // 履歴最大サイズ
        maxGCPerMinute: 4, // 1分間の最大GC実行回数
      },
      ...config,
    };

    // 状態管理
    this.isMonitoring = false;
    this.isDestroyed = false;
    this.monitoringInterval = null;
    this.cleanupInterval = null;
    this.leakScanInterval = null;
    this._eventListenersRegistered = false;

    // 統計・履歴データ
    this.leakScanHistory = [];
    this.optimizationStats = {
      totalOptimizations: 0,
      lastOptimization: null,
      totalFreedMemory: 0,
    };
    this.gcStats = {
      totalGCExecutions: 0,
      totalFreedMemory: 0,
      averageFreedMemory: 0,
      lastGCTime: null,
    };
    this.cleanupStats = {
      totalCleanups: 0,
      lastCleanup: null,
      totalActions: 0,
    };

    // GC制御
    this.lastGCTime = null;
    this.gcExecutionsThisMinute = 0;
    this.lastMinuteReset = Date.now();
  }

  /**
   * メモリ監視を開始
   */
  startMemoryMonitoring() {
    if (this.isDestroyed) {
      throw new Error('MemoryManager has been destroyed');
    }

    if (this.isMonitoring) {
      return; // 既に監視中
    }

    this.isMonitoring = true;

    // パフォーマンス監視イベントの登録（重複登録を避ける）
    if (!this._eventListenersRegistered) {
      this.performanceMonitor.addEventListener(
        'memoryWarning',
        this._handleMemoryWarning.bind(this)
      );
      this.performanceMonitor.addEventListener(
        'memoryCritical',
        this._handleMemoryCritical.bind(this)
      );
      this._eventListenersRegistered = true;
    }

    // 定期監視の開始
    this.monitoringInterval = setInterval(() => {
      this._periodicMonitoring();
    }, this.config.intervals.monitoring);

    // 自動クリーンアップの開始
    this.cleanupInterval = setInterval(() => {
      this.autoCleanup();
    }, this.config.intervals.cleanup);

    // リークスキャンの開始
    this.leakScanInterval = setInterval(() => {
      this.scanForLeaks();
    }, this.config.intervals.leakScan);
  }

  /**
   * メモリ監視を停止
   */
  stopMemoryMonitoring() {
    if (!this.isMonitoring) {
      return; // 既に停止済み
    }

    this.isMonitoring = false;

    // イベントリスナーの削除
    this.performanceMonitor.removeEventListener('memoryWarning', this._handleMemoryWarning);
    this.performanceMonitor.removeEventListener('memoryCritical', this._handleMemoryCritical);

    // インターバルのクリア
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    if (this.leakScanInterval) {
      clearInterval(this.leakScanInterval);
      this.leakScanInterval = null;
    }
  }

  /**
   * メモリリークスキャンを実行
   * @returns {Promise<Array>} 検出されたリークの配列
   */
  async scanForLeaks() {
    try {
      const leaks = await this.weakMapRegistry.scanForLeaks();

      // 履歴に記録
      this.addToLeakScanHistory({
        timestamp: Date.now(),
        leaksFound: leaks.length,
        leaks: leaks.slice(0, 5), // 最初の5件のみ記録（メモリ節約）
      });

      return leaks;
    } catch (error) {
      throw new Error(`Memory leak scan failed: ${error.message}`);
    }
  }

  /**
   * オブジェクトプール最適化を実行
   * @returns {Object} 最適化結果
   */
  optimizeObjectPools() {
    try {
      const beforeStats = this.objectPool.getPoolStats();

      // 未使用オブジェクトの解放
      const releasedCount = this.objectPool.releaseUnusedObjects();

      // プールサイズの最適化
      const optimizedPools = this.objectPool.optimizePoolSize();

      const afterStats = this.objectPool.getPoolStats();

      // 効率チェック
      if (afterStats.efficiency < this.config.thresholds.poolEfficiency) {
        console.warn(`Low pool efficiency detected: ${afterStats.efficiency.toFixed(2)}`);
      }

      // 統計更新
      this.optimizationStats.totalOptimizations++;
      this.optimizationStats.lastOptimization = Date.now();

      return {
        released: releasedCount,
        optimized: optimizedPools,
        beforeEfficiency: beforeStats.efficiency,
        afterEfficiency: afterStats.efficiency,
      };
    } catch (error) {
      console.error('Object pool optimization failed:', error);
      return { released: 0, optimized: 0, error: error.message };
    }
  }

  /**
   * ガベージコレクション実行判定
   * @returns {boolean} GCを実行すべきかどうか
   */
  shouldTriggerGC() {
    try {
      // 破棄済みチェック
      if (this.isDestroyed) return false;

      // GC実行回数制限チェック
      this._resetGCCountIfNeeded();
      if (this.gcExecutionsThisMinute >= this.config.limits.maxGCPerMinute) {
        return false;
      }

      // 直近でGCが実行された場合はスキップ
      if (this.lastGCTime && Date.now() - this.lastGCTime < this.config.thresholds.gcInterval) {
        return false;
      }

      const currentMemory = this.performanceMonitor.getCurrentMemoryUsage();

      // 閾値チェック（warningレベルでもGCを検討）
      if (currentMemory >= this.config.thresholds.warning) {
        return true;
      }

      // メモリ増加トレンドチェック
      const trend = this.performanceMonitor.getMemoryTrend();
      if (trend && trend.trend === 'increasing' && trend.rate > 2.0) {
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error in GC trigger check:', error);
      return false;
    }
  }

  /**
   * 手動ガベージコレクションを実行
   * @returns {Promise<Object>} GC実行結果
   */
  async forceGarbageCollection() {
    const beforeMemory = this.performanceMonitor.getCurrentMemoryUsage();

    // GC実行（ブラウザ環境では制限あり）
    if (typeof window !== 'undefined' && window.gc) {
      window.gc();
    } else if (typeof global !== 'undefined' && global.gc) {
      global.gc();
    }

    // 少し待ってからメモリ使用量を確認（テスト環境では同期実行）
    if (process.env.NODE_ENV !== 'test') {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const afterMemory = this.performanceMonitor.getCurrentMemoryUsage();
    const freedMemory = Math.max(0, beforeMemory - afterMemory);

    // 統計更新
    this.gcStats.totalGCExecutions++;
    this.gcStats.totalFreedMemory += freedMemory;
    this.gcStats.averageFreedMemory =
      this.gcStats.totalFreedMemory / this.gcStats.totalGCExecutions;
    this.gcStats.lastGCTime = Date.now();
    this.lastGCTime = Date.now();
    this.gcExecutionsThisMinute++;

    // メモリ使用量記録
    this.performanceMonitor.recordMemoryUsage(afterMemory);

    return {
      before: beforeMemory,
      after: afterMemory,
      freed: freedMemory,
      timestamp: this.lastGCTime,
    };
  }

  /**
   * 自動クリーンアップを実行
   * @returns {Promise<Object>} クリーンアップ結果
   */
  async autoCleanup() {
    const currentMemory = this.performanceMonitor.getCurrentMemoryUsage();
    const actions = [];

    // メモリ使用量が警告レベル以上の場合のみ実行
    if (currentMemory < this.config.thresholds.warning) {
      return { actions, memoryBefore: currentMemory, memoryAfter: currentMemory };
    }

    let memoryAfter = currentMemory;

    try {
      // オブジェクトプール最適化
      this.optimizeObjectPools();
      actions.push('poolOptimization');

      // GC実行判定
      if (this.shouldTriggerGC()) {
        const gcResult = await this.forceGarbageCollection();
        memoryAfter = gcResult.after;
        actions.push('gc');
      }

      // 統計更新
      this.cleanupStats.totalCleanups++;
      this.cleanupStats.lastCleanup = Date.now();
      this.cleanupStats.totalActions += actions.length;

      return {
        actions,
        memoryBefore: currentMemory,
        memoryAfter,
        freedMemory: currentMemory - memoryAfter,
      };
    } catch (error) {
      console.error('Auto cleanup failed:', error);
      return { actions, error: error.message };
    }
  }

  /**
   * WeakMapに参照を登録
   * @param {string} key - 参照キー
   * @param {Object} obj - 登録するオブジェクト
   */
  registerWeakReference(key, obj) {
    if (obj && typeof obj === 'object') {
      this.weakMapRegistry.register(key, obj);
    }
  }

  /**
   * WeakMapから参照を削除
   * @param {string} key - 参照キー
   */
  unregisterWeakReference(key) {
    this.weakMapRegistry.unregister(key);
  }

  /**
   * 包括的なメモリレポートを生成
   * @returns {Object} メモリレポート
   */
  getMemoryReport() {
    const currentMemory = this.performanceMonitor.getCurrentMemoryUsage();
    const poolStats = this.objectPool.getPoolStats();
    const registeredCount = this.weakMapRegistry.getRegisteredCount();

    const recommendations = [];

    // 推奨事項の生成
    if (currentMemory >= this.config.thresholds.warning) {
      recommendations.push('Consider triggering garbage collection');
    }
    if (poolStats.efficiency < this.config.thresholds.poolEfficiency) {
      recommendations.push('Optimize object pools');
    }
    if (registeredCount > 1000) {
      recommendations.push('Review WeakMap registrations');
    }

    return {
      currentUsage: currentMemory,
      thresholds: this.config.thresholds,
      pools: poolStats,
      leaks: {
        lastScan: this.leakScanHistory[this.leakScanHistory.length - 1] || null,
        totalScans: this.leakScanHistory.length,
      },
      gc: this.gcStats,
      recommendations,
      timestamp: Date.now(),
    };
  }

  /**
   * 各種統計情報を取得するメソッド群
   */
  getLeakScanHistory() {
    return [...this.leakScanHistory];
  }

  getOptimizationStats() {
    return { ...this.optimizationStats };
  }

  getGCStats() {
    return { ...this.gcStats };
  }

  getCleanupStats() {
    return { ...this.cleanupStats };
  }

  /**
   * リークスキャン履歴に追加（テスト用パブリックメソッド）
   */
  addToLeakScanHistory(entry) {
    this._addToLeakScanHistory(entry);
  }

  /**
   * MemoryManagerを破棄
   */
  destroy() {
    if (this.isDestroyed) {
      return; // 既に破棄済み
    }

    this.stopMemoryMonitoring();
    this.isDestroyed = true;

    // 統計データのクリア
    this.leakScanHistory = [];
    this.optimizationStats = null;
    this.gcStats = null;
    this.cleanupStats = null;
  }

  /**
   * プライベートメソッド群
   */

  _createDefaultPerformanceMonitor() {
    return {
      getCurrentMemoryUsage: () => {
        // ブラウザ環境でのメモリ使用量推定
        if (performance.memory) {
          return Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
        }
        return 50; // デフォルト値
      },
      getMemoryTrend: () => ({ trend: 'stable', rate: 0.1 }),
      recordMemoryUsage: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
    };
  }

  _createDefaultObjectPool() {
    return {
      getActiveObjectCount: () => 0,
      getUnusedObjectCount: () => 0,
      releaseUnusedObjects: () => 0,
      optimizePoolSize: () => 0,
      getPoolStats: () => ({ active: 0, unused: 0, efficiency: 1.0 }),
    };
  }

  _createDefaultWeakMapRegistry() {
    const registry = new WeakMap();
    return {
      register: (key, obj) => registry.set(key, obj),
      unregister: key => registry.delete(key),
      scanForLeaks: () => Promise.resolve([]),
      getRegisteredCount: () => 0,
    };
  }

  _periodicMonitoring() {
    try {
      const currentMemory = this.performanceMonitor.getCurrentMemoryUsage();

      // 警告レベルチェック
      if (currentMemory >= this.config.thresholds.warning) {
        this._handleMemoryWarning({ memoryUsage: currentMemory });
      }

      // 危険レベルチェック
      if (currentMemory >= this.config.thresholds.critical) {
        this._handleMemoryCritical({ memoryUsage: currentMemory });
      }
    } catch (error) {
      console.error('Error in periodic monitoring:', error);
    }
  }

  _handleMemoryWarning(event) {
    console.warn(`Memory warning: ${event.memoryUsage}MB`);
    // 軽微な最適化を実行
    this.optimizeObjectPools();
  }

  _handleMemoryCritical(event) {
    console.error(`Critical memory usage: ${event.memoryUsage}MB`);
    // 緊急クリーンアップを実行
    this.autoCleanup();
  }

  _addToLeakScanHistory(entry) {
    this.leakScanHistory.push(entry);

    // 履歴サイズ制限
    if (this.leakScanHistory.length > this.config.limits.historySize) {
      this.leakScanHistory = this.leakScanHistory.slice(-this.config.limits.historySize);
    }
  }

  _resetGCCountIfNeeded() {
    const now = Date.now();
    if (now - this.lastMinuteReset >= 60000) {
      // 1分経過
      this.gcExecutionsThisMinute = 0;
      this.lastMinuteReset = now;
    }
  }
}

export default MemoryManager;
