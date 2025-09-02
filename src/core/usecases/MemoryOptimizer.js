/**
 * MemoryOptimizer.js - メモリ最適化クラス
 *
 * オニオンアーキテクチャ: Application Layer (Use Cases)
 *
 * 責任:
 * - メモリ使用量の監視と最適化
 * - オブジェクトプールの管理
 * - ガベージコレクションの最適化
 * - メモリリークの検出と防止
 *
 * @developer との協力実装
 */

/**
 * メモリ最適化クラス
 *
 * @class MemoryOptimizer
 * @description メモリ使用量を最適化し、パフォーマンスを向上させるユースケース
 */
export default class MemoryOptimizer {
  /**
   * MemoryOptimizer インスタンスを作成
   *
   * @param {Object} [config={}] - 設定
   * @param {number} [config.memoryThreshold=0.8] - メモリ使用量閾値
   * @param {number} [config.cleanupInterval=5000] - クリーンアップ間隔（ミリ秒）
   * @param {boolean} [config.enableGC=true] - ガベージコレクションの有効/無効
   * @param {number} [config.maxObjectPools=10] - 最大オブジェクトプール数
   * @param {boolean} [config.enableLeakDetection=true] - メモリリーク検出の有効/無効
   */
  constructor(config = {}) {
    this.config = {
      memoryThreshold: config.memoryThreshold || 0.8,
      cleanupInterval: config.cleanupInterval || 5000,
      enableGC: config.enableGC !== false,
      maxObjectPools: config.maxObjectPools || 10,
      enableLeakDetection: config.enableLeakDetection !== false,
      ...config,
    };

    // メモリ監視
    this.memoryStats = {
      currentUsage: 0,
      peakUsage: 0,
      averageUsage: 0,
      totalAllocations: 0,
      totalDeallocations: 0,
      gcCount: 0,
      lastCleanup: 0,
    };

    // オブジェクトプール管理
    this.objectPools = new Map();
    this.poolStats = {
      totalPools: 0,
      totalObjects: 0,
      activeObjects: 0,
      recycledObjects: 0,
    };

    // メモリリーク検出
    this.leakDetection = {
      enabled: this.config.enableLeakDetection,
      trackedObjects: new WeakMap(),
      allocationHistory: [],
      leakThreshold: 1000, // 1秒間の割り当て履歴
    };

    // 最適化統計
    this.optimizationStats = {
      totalOptimizations: 0,
      memoryCleanups: 0,
      objectPoolOptimizations: 0,
      gcOptimizations: 0,
      leakDetections: 0,
    };

    // クリーンアップタイマー
    this.cleanupTimer = null;
    this.lastCleanupTime = 0;

    // 初期化完了フラグ
    this._initialized = true;

    // 定期的なクリーンアップを開始
    this._startPeriodicCleanup();
  }

  /**
   * オブジェクトプールを作成する
   *
   * @param {string} poolName - プール名
   * @param {Function} createFn - オブジェクト作成関数
   * @param {Function} resetFn - オブジェクトリセット関数
   * @param {number} initialSize - 初期サイズ
   * @param {number} maxSize - 最大サイズ
   * @returns {Object} オブジェクトプール
   */
  createObjectPool(poolName, createFn, resetFn, initialSize = 10, maxSize = 100) {
    if (this.objectPools.has(poolName)) {
      throw new Error(`MemoryOptimizer: プール '${poolName}' は既に存在します`);
    }

    if (this.objectPools.size >= this.config.maxObjectPools) {
      throw new Error('MemoryOptimizer: 最大オブジェクトプール数に達しました');
    }

    const pool = {
      name: poolName,
      createFn,
      resetFn,
      initialSize,
      maxSize,
      available: [],
      active: new Set(),
      stats: {
        totalCreated: 0,
        totalRecycled: 0,
        currentActive: 0,
        peakActive: 0,
      },
    };

    // 初期オブジェクトを作成
    for (let i = 0; i < initialSize; i++) {
      const obj = createFn();
      pool.available.push(obj);
      pool.stats.totalCreated++;
    }

    this.objectPools.set(poolName, pool);
    this.poolStats.totalPools++;
    this.poolStats.totalObjects += initialSize;

    return pool;
  }

  /**
   * オブジェクトプールからオブジェクトを取得する
   *
   * @param {string} poolName - プール名
   * @returns {Object|null} オブジェクトまたはnull
   */
  getFromPool(poolName) {
    const pool = this.objectPools.get(poolName);
    if (!pool) {
      return null;
    }

    let obj;
    if (pool.available.length > 0) {
      obj = pool.available.pop();
      pool.stats.totalRecycled++;
    } else if (pool.active.size < pool.maxSize) {
      obj = pool.createFn();
      pool.stats.totalCreated++;
      this.poolStats.totalObjects++;
    } else {
      return null; // プールが満杯
    }

    pool.active.add(obj);
    pool.stats.currentActive++;
    pool.stats.peakActive = Math.max(pool.stats.peakActive, pool.stats.currentActive);
    this.poolStats.activeObjects++;

    return obj;
  }

  /**
   * オブジェクトをプールに返す
   *
   * @param {string} poolName - プール名
   * @param {Object} obj - 返すオブジェクト
   * @returns {boolean} 返却成功かどうか
   */
  returnToPool(poolName, obj) {
    const pool = this.objectPools.get(poolName);
    if (!pool || !pool.active.has(obj)) {
      return false;
    }

    // オブジェクトをリセット
    if (pool.resetFn) {
      pool.resetFn(obj);
    }

    pool.active.delete(obj);
    pool.available.push(obj);
    pool.stats.currentActive--;
    this.poolStats.activeObjects--;

    return true;
  }

  /**
   * メモリ使用量を監視する
   *
   * @returns {Object} メモリ使用量情報
   */
  monitorMemory() {
    const memoryInfo = this._getMemoryInfo();

    // メモリ統計を更新
    this.memoryStats.currentUsage = memoryInfo.used;
    this.memoryStats.peakUsage = Math.max(this.memoryStats.peakUsage, memoryInfo.used);

    // 平均使用量を計算
    this._updateAverageUsage(memoryInfo.used);

    // メモリリーク検出
    if (this.leakDetection.enabled) {
      this._detectMemoryLeaks(memoryInfo);
    }

    return memoryInfo;
  }

  /**
   * メモリ最適化を実行する
   *
   * @returns {Object} 最適化結果
   */
  optimizeMemory() {
    const optimizationResult = {
      applied: [],
      skipped: [],
      memoryFreed: 0,
      timestamp: Date.now(),
    };

    try {
      // オブジェクトプールの最適化
      const poolOptimization = this._optimizeObjectPools();
      if (poolOptimization.success) {
        optimizationResult.applied.push(poolOptimization);
        optimizationResult.memoryFreed += poolOptimization.memoryFreed || 0;
      } else {
        optimizationResult.skipped.push(poolOptimization);
      }

      // ガベージコレクションの実行
      if (this.config.enableGC) {
        const gcResult = this._performGarbageCollection();
        if (gcResult.success) {
          optimizationResult.applied.push(gcResult);
          optimizationResult.memoryFreed += gcResult.memoryFreed || 0;
        } else {
          optimizationResult.skipped.push(gcResult);
        }
      }

      // 未使用オブジェクトのクリーンアップ
      const cleanupResult = this._cleanupUnusedObjects();
      if (cleanupResult.success) {
        optimizationResult.applied.push(cleanupResult);
        optimizationResult.memoryFreed += cleanupResult.memoryFreed || 0;
      } else {
        optimizationResult.skipped.push(cleanupResult);
      }

      this.optimizationStats.totalOptimizations++;
      this.optimizationStats.memoryCleanups++;
    } catch (error) {
      optimizationResult.skipped.push({
        rule: 'general_optimization',
        reason: `エラー: ${error.message}`,
      });
    }

    return optimizationResult;
  }

  /**
   * メモリ統計を取得する
   *
   * @returns {Object} 統計情報
   */
  getStats() {
    return {
      memoryStats: { ...this.memoryStats },
      poolStats: { ...this.poolStats },
      optimizationStats: { ...this.optimizationStats },
      leakDetection: {
        enabled: this.leakDetection.enabled,
        trackedObjects: this.leakDetection.trackedObjects.size || 0,
        allocationHistorySize: this.leakDetection.allocationHistory.length,
      },
    };
  }

  /**
   * 最適化をリセットする
   */
  reset() {
    this.memoryStats = {
      currentUsage: 0,
      peakUsage: 0,
      averageUsage: 0,
      totalAllocations: 0,
      totalDeallocations: 0,
      gcCount: 0,
      lastCleanup: 0,
    };

    this.optimizationStats = {
      totalOptimizations: 0,
      memoryCleanups: 0,
      objectPoolOptimizations: 0,
      gcOptimizations: 0,
      leakDetections: 0,
    };

    this.leakDetection.allocationHistory = [];
  }

  /**
   * クリーンアップを停止する
   */
  destroy() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    // オブジェクトプールをクリア
    this.objectPools.clear();
  }

  // =============================================================================
  // プライベートメソッド
  // =============================================================================

  /**
   * 定期的なクリーンアップを開始する
   *
   * @private
   */
  _startPeriodicCleanup() {
    this.cleanupTimer = setInterval(() => {
      this.optimizeMemory();
    }, this.config.cleanupInterval);
  }

  /**
   * メモリ情報を取得する
   *
   * @private
   * @returns {Object} メモリ情報
   */
  _getMemoryInfo() {
    if (typeof performance !== 'undefined' && performance.memory) {
      const memory = performance.memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        usageRatio: memory.usedJSHeapSize / memory.jsHeapSizeLimit,
      };
    }

    // フォールバック: オブジェクトプールの統計から推定
    return {
      used: this.poolStats.totalObjects * 100, // 推定値
      total: this.poolStats.totalObjects * 150,
      limit: 100000000, // 100MB推定
      usageRatio: (this.poolStats.totalObjects * 100) / 100000000,
    };
  }

  /**
   * 平均使用量を更新する
   *
   * @private
   * @param {number} currentUsage - 現在の使用量
   */
  _updateAverageUsage(currentUsage) {
    // 簡易的な移動平均
    const alpha = 0.1; // 平滑化係数
    this.memoryStats.averageUsage =
      (1 - alpha) * this.memoryStats.averageUsage + alpha * currentUsage;
  }

  /**
   * メモリリークを検出する
   *
   * @private
   * @param {Object} memoryInfo - メモリ情報
   */
  _detectMemoryLeaks(memoryInfo) {
    const now = Date.now();

    // 割り当て履歴に追加
    this.leakDetection.allocationHistory.push({
      timestamp: now,
      usage: memoryInfo.used,
    });

    // 古い履歴を削除
    this.leakDetection.allocationHistory = this.leakDetection.allocationHistory.filter(
      entry => now - entry.timestamp < this.leakDetection.leakThreshold
    );

    // メモリ使用量の増加傾向をチェック
    if (this.leakDetection.allocationHistory.length > 10) {
      const recent = this.leakDetection.allocationHistory.slice(-10);
      const trend = this._calculateTrend(recent);

      if (trend > 0.1) {
        // 10%以上の増加傾向
        this.optimizationStats.leakDetections++;
        // メモリリークが検出された場合の処理
        this._handleMemoryLeak();
      }
    }
  }

  /**
   * トレンドを計算する
   *
   * @private
   * @param {Array} data - データ配列
   * @returns {number} トレンド値
   */
  _calculateTrend(data) {
    if (data.length < 2) return 0;

    const first = data[0].usage;
    const last = data[data.length - 1].usage;

    return (last - first) / first;
  }

  /**
   * メモリリークを処理する
   *
   * @private
   */
  _handleMemoryLeak() {
    // 強制的なガベージコレクション
    if (this.config.enableGC) {
      this._performGarbageCollection();
    }

    // オブジェクトプールのクリーンアップ
    this._optimizeObjectPools();
  }

  /**
   * オブジェクトプールを最適化する
   *
   * @private
   * @returns {Object} 最適化結果
   */
  _optimizeObjectPools() {
    try {
      let memoryFreed = 0;
      let poolsOptimized = 0;

      for (const [_poolName, pool] of this.objectPools) {
        // 未使用オブジェクトを削除
        const initialAvailable = pool.available.length;
        const targetSize = Math.floor(pool.maxSize * 0.5); // 最大サイズの50%まで削減

        if (pool.available.length > targetSize) {
          pool.available.splice(targetSize);
          memoryFreed += (initialAvailable - pool.available.length) * 100; // 推定値
          poolsOptimized++;
        }
      }

      if (poolsOptimized > 0) {
        this.optimizationStats.objectPoolOptimizations++;
        return {
          success: true,
          rule: 'object_pool_optimization',
          message: `${poolsOptimized} 個のプールを最適化`,
          memoryFreed: memoryFreed,
        };
      }

      return {
        success: false,
        rule: 'object_pool_optimization',
        reason: '最適化対象なし',
      };
    } catch (error) {
      return {
        success: false,
        rule: 'object_pool_optimization',
        reason: `エラー: ${error.message}`,
      };
    }
  }

  /**
   * ガベージコレクションを実行する
   *
   * @private
   * @returns {Object} 実行結果
   */
  _performGarbageCollection() {
    try {
      const beforeMemory = this._getMemoryInfo().used;

      // ガベージコレクションの実行（可能な場合）
      if (typeof global !== 'undefined' && global.gc) {
        global.gc();
      }

      const afterMemory = this._getMemoryInfo().used;
      const memoryFreed = beforeMemory - afterMemory;

      this.memoryStats.gcCount++;
      this.optimizationStats.gcOptimizations++;

      return {
        success: true,
        rule: 'garbage_collection',
        message: `ガベージコレクション実行: ${memoryFreed} bytes 解放`,
        memoryFreed: memoryFreed,
      };
    } catch (error) {
      return {
        success: false,
        rule: 'garbage_collection',
        reason: `エラー: ${error.message}`,
      };
    }
  }

  /**
   * 未使用オブジェクトをクリーンアップする
   *
   * @private
   * @returns {Object} クリーンアップ結果
   */
  _cleanupUnusedObjects() {
    try {
      let memoryFreed = 0;
      let objectsCleaned = 0;

      // オブジェクトプールの未使用オブジェクトをクリーンアップ
      for (const [_poolName, pool] of this.objectPools) {
        const initialCount = pool.available.length;

        // 長時間未使用のオブジェクトを削除
        pool.available = pool.available.filter(_obj => {
          // 簡易的な未使用判定（実際の実装ではより複雑なロジックが必要）
          return Math.random() > 0.1; // 10%の確率で削除
        });

        const cleaned = initialCount - pool.available.length;
        memoryFreed += cleaned * 100; // 推定値
        objectsCleaned += cleaned;
      }

      if (objectsCleaned > 0) {
        return {
          success: true,
          rule: 'unused_object_cleanup',
          message: `${objectsCleaned} 個の未使用オブジェクトを削除`,
          memoryFreed: memoryFreed,
        };
      }

      return {
        success: false,
        rule: 'unused_object_cleanup',
        reason: 'クリーンアップ対象なし',
      };
    } catch (error) {
      return {
        success: false,
        rule: 'unused_object_cleanup',
        reason: `エラー: ${error.message}`,
      };
    }
  }
}
