/**
 * EventSystemOptimizer.js - イベントシステム最適化クラス
 *
 * オニオンアーキテクチャ: Application Layer (Use Cases)
 *
 * 責任:
 * - イベントシステムのパフォーマンス最適化
 * - リスナー管理の効率化
 * - メモリリークの防止
 * - イベント配信の最適化
 *
 * @developer との協力実装
 */

/**
 * イベントシステム最適化クラス
 *
 * @class EventSystemOptimizer
 * @description イベントシステムのパフォーマンスを最適化するユースケース
 */
export default class EventSystemOptimizer {
  /**
   * EventSystemOptimizer インスタンスを作成
   *
   * @param {Object} [config={}] - 設定
   * @param {number} [config.maxListenersPerEvent=100] - イベントあたりの最大リスナー数
   * @param {number} [config.maxEventHistory=1000] - 最大イベント履歴数
   * @param {number} [config.cleanupInterval=5000] - クリーンアップ間隔（ミリ秒）
   * @param {boolean} [config.enableBatching=true] - イベントバッチングの有効/無効
   * @param {number} [config.batchSize=10] - バッチサイズ
   */
  constructor(config = {}) {
    this.config = {
      maxListenersPerEvent: config.maxListenersPerEvent || 100,
      maxEventHistory: config.maxEventHistory || 1000,
      cleanupInterval: config.cleanupInterval || 5000,
      enableBatching: config.enableBatching !== false,
      batchSize: config.batchSize || 10,
      enableMemoryOptimization: config.enableMemoryOptimization !== false,
      ...config,
    };

    // 最適化状態
    this.isOptimizing = false;
    this.lastCleanupTime = 0;
    this.optimizationStats = {
      totalOptimizations: 0,
      listenersRemoved: 0,
      eventsBatched: 0,
      memoryCleanups: 0,
      performanceImprovements: 0,
    };

    // バッチング用キュー
    this.eventBatch = [];
    this.batchTimer = null;

    // メモリ監視
    this.memoryStats = {
      totalListeners: 0,
      totalEvents: 0,
      memoryUsage: 0,
      lastCleanup: 0,
    };

    // 初期化完了フラグ
    this._initialized = true;
  }

  /**
   * イベントエミッターを最適化する
   *
   * @param {Object} eventEmitter - イベントエミッターインスタンス
   * @returns {Object} 最適化結果
   */
  optimizeEventEmitter(eventEmitter) {
    if (!eventEmitter) {
      throw new Error('EventSystemOptimizer: イベントエミッターが必要です');
    }

    const optimizationResult = {
      applied: [],
      skipped: [],
      performanceGain: 0,
      timestamp: Date.now(),
    };

    try {
      // リスナー数の最適化
      const listenerOptimization = this._optimizeListeners(eventEmitter);
      if (listenerOptimization.success) {
        optimizationResult.applied.push(listenerOptimization);
      } else {
        optimizationResult.skipped.push(listenerOptimization);
      }

      // イベント履歴の最適化
      const historyOptimization = this._optimizeEventHistory(eventEmitter);
      if (historyOptimization.success) {
        optimizationResult.applied.push(historyOptimization);
      } else {
        optimizationResult.skipped.push(historyOptimization);
      }

      // メモリ最適化
      const memoryOptimization = this._optimizeMemory(eventEmitter);
      if (memoryOptimization.success) {
        optimizationResult.applied.push(memoryOptimization);
      } else {
        optimizationResult.skipped.push(memoryOptimization);
      }

      this.optimizationStats.totalOptimizations++;
    } catch (error) {
      optimizationResult.skipped.push({
        rule: 'general_optimization',
        reason: `エラー: ${error.message}`,
      });
    }

    return optimizationResult;
  }

  /**
   * イベントをバッチ処理する
   *
   * @param {string} eventName - イベント名
   * @param {Object} eventData - イベントデータ
   * @param {Object} eventEmitter - イベントエミッター
   */
  batchEvent(eventName, eventData, eventEmitter) {
    if (!this.config.enableBatching) {
      // バッチングが無効な場合は即座に発行
      eventEmitter.emit(eventName, eventData);
      return;
    }

    // バッチに追加
    this.eventBatch.push({
      name: eventName,
      data: eventData,
      emitter: eventEmitter,
      timestamp: Date.now(),
    });

    // バッチサイズに達した場合は即座に処理
    if (this.eventBatch.length >= this.config.batchSize) {
      this._processBatch();
    } else if (!this.batchTimer) {
      // タイマーを設定（次のフレームで処理）
      this.batchTimer = setTimeout(() => {
        this._processBatch();
      }, 16); // 約60FPS
    }
  }

  /**
   * 定期的なクリーンアップを実行する
   *
   * @param {Object} eventEmitter - イベントエミッター
   */
  performCleanup(eventEmitter) {
    const now = Date.now();
    if (now - this.lastCleanupTime < this.config.cleanupInterval) {
      return;
    }

    this.lastCleanupTime = now;

    try {
      // 未使用のリスナーを削除
      this._removeUnusedListeners(eventEmitter);

      // 古いイベント履歴を削除
      this._cleanupEventHistory(eventEmitter);

      // メモリ統計を更新
      this._updateMemoryStats(eventEmitter);

      this.optimizationStats.memoryCleanups++;
    } catch (error) {
      // クリーンアップエラーはログに記録するが、処理は継続
      // console.error('EventSystemOptimizer: クリーンアップエラー:', error);
    }
  }

  /**
   * 最適化統計を取得する
   *
   * @returns {Object} 統計情報
   */
  getStats() {
    return {
      ...this.optimizationStats,
      memoryStats: { ...this.memoryStats },
      isOptimizing: this.isOptimizing,
      lastCleanupTime: this.lastCleanupTime,
      batchQueueSize: this.eventBatch.length,
    };
  }

  /**
   * 最適化をリセットする
   */
  reset() {
    this.optimizationStats = {
      totalOptimizations: 0,
      listenersRemoved: 0,
      eventsBatched: 0,
      memoryCleanups: 0,
      performanceImprovements: 0,
    };

    this.memoryStats = {
      totalListeners: 0,
      totalEvents: 0,
      memoryUsage: 0,
      lastCleanup: 0,
    };

    this.eventBatch = [];
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
  }

  // =============================================================================
  // プライベートメソッド
  // =============================================================================

  /**
   * リスナーを最適化する
   *
   * @private
   * @param {Object} eventEmitter - イベントエミッター
   * @returns {Object} 最適化結果
   */
  _optimizeListeners(eventEmitter) {
    try {
      let totalRemoved = 0;

      // 各イベントのリスナー数をチェック
      if (eventEmitter.listeners && eventEmitter.listeners instanceof Map) {
        for (const [eventName, listeners] of eventEmitter.listeners) {
          if (listeners.length > this.config.maxListenersPerEvent) {
            // 古いリスナーを削除（優先度の低いものから）
            const sortedListeners = [...listeners].sort((a, b) => a.priority - b.priority);
            const toRemove = sortedListeners.slice(
              0,
              listeners.length - this.config.maxListenersPerEvent
            );

            for (const listener of toRemove) {
              eventEmitter.off(eventName, listener.callback);
              totalRemoved++;
            }
          }
        }
      }

      if (totalRemoved > 0) {
        this.optimizationStats.listenersRemoved += totalRemoved;
        return {
          success: true,
          rule: 'listener_optimization',
          message: `${totalRemoved} 個のリスナーを削除`,
          removed: totalRemoved,
        };
      }

      return {
        success: false,
        rule: 'listener_optimization',
        reason: '削除対象のリスナーなし',
      };
    } catch (error) {
      return {
        success: false,
        rule: 'listener_optimization',
        reason: `エラー: ${error.message}`,
      };
    }
  }

  /**
   * イベント履歴を最適化する
   *
   * @private
   * @param {Object} eventEmitter - イベントエミッター
   * @returns {Object} 最適化結果
   */
  _optimizeEventHistory(eventEmitter) {
    try {
      if (
        eventEmitter.eventHistory &&
        eventEmitter.eventHistory.length > this.config.maxEventHistory
      ) {
        const beforeCount = eventEmitter.eventHistory.length;
        const toRemove = beforeCount - this.config.maxEventHistory;

        // 古いイベントを削除
        eventEmitter.eventHistory.splice(0, toRemove);

        return {
          success: true,
          rule: 'history_optimization',
          message: `${toRemove} 個の古いイベント履歴を削除`,
          removed: toRemove,
        };
      }

      return {
        success: false,
        rule: 'history_optimization',
        reason: '履歴サイズが制限内',
      };
    } catch (error) {
      return {
        success: false,
        rule: 'history_optimization',
        reason: `エラー: ${error.message}`,
      };
    }
  }

  /**
   * メモリを最適化する
   *
   * @private
   * @param {Object} eventEmitter - イベントエミッター
   * @returns {Object} 最適化結果
   */
  _optimizeMemory(eventEmitter) {
    try {
      let memoryFreed = 0;

      // 未使用のイベントタイプを削除
      if (eventEmitter.listeners && eventEmitter.listeners instanceof Map) {
        for (const [eventName, listeners] of eventEmitter.listeners) {
          if (listeners.length === 0) {
            eventEmitter.listeners.delete(eventName);
            memoryFreed++;
          }
        }
      }

      // 統計情報の最適化
      if (eventEmitter.stats && eventEmitter.stats.eventsByType instanceof Map) {
        const emptyEventTypes = [];
        for (const [eventType, count] of eventEmitter.stats.eventsByType) {
          if (count === 0) {
            emptyEventTypes.push(eventType);
          }
        }

        for (const eventType of emptyEventTypes) {
          eventEmitter.stats.eventsByType.delete(eventType);
          memoryFreed++;
        }
      }

      if (memoryFreed > 0) {
        return {
          success: true,
          rule: 'memory_optimization',
          message: `${memoryFreed} 個の未使用オブジェクトを削除`,
          freed: memoryFreed,
        };
      }

      return {
        success: false,
        rule: 'memory_optimization',
        reason: '最適化対象なし',
      };
    } catch (error) {
      return {
        success: false,
        rule: 'memory_optimization',
        reason: `エラー: ${error.message}`,
      };
    }
  }

  /**
   * バッチを処理する
   *
   * @private
   */
  _processBatch() {
    if (this.eventBatch.length === 0) {
      return;
    }

    // バッチ内のイベントを発行
    for (const event of this.eventBatch) {
      try {
        event.emitter.emit(event.name, event.data);
      } catch (error) {
        // 個別のイベントエラーは無視
      }
    }

    this.optimizationStats.eventsBatched += this.eventBatch.length;
    this.eventBatch = [];

    // タイマーをクリア
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
  }

  /**
   * 未使用のリスナーを削除する
   *
   * @private
   * @param {Object} eventEmitter - イベントエミッター
   */
  _removeUnusedListeners(eventEmitter) {
    if (!eventEmitter.listeners || !(eventEmitter.listeners instanceof Map)) {
      return;
    }

    for (const [eventName, listeners] of eventEmitter.listeners) {
      // 無効なリスナーをフィルタリング
      const validListeners = listeners.filter(
        listener => listener && typeof listener.callback === 'function'
      );

      if (validListeners.length !== listeners.length) {
        eventEmitter.listeners.set(eventName, validListeners);
      }
    }
  }

  /**
   * イベント履歴をクリーンアップする
   *
   * @private
   * @param {Object} eventEmitter - イベントエミッター
   */
  _cleanupEventHistory(eventEmitter) {
    if (!eventEmitter.eventHistory || !Array.isArray(eventEmitter.eventHistory)) {
      return;
    }

    const now = Date.now();
    const maxAge = 300000; // 5分

    // 古いイベントを削除
    eventEmitter.eventHistory = eventEmitter.eventHistory.filter(
      event => now - event.timestamp < maxAge
    );
  }

  /**
   * メモリ統計を更新する
   *
   * @private
   * @param {Object} eventEmitter - イベントエミッター
   */
  _updateMemoryStats(eventEmitter) {
    this.memoryStats.totalListeners = eventEmitter.totalListenerCount
      ? eventEmitter.totalListenerCount()
      : 0;

    this.memoryStats.totalEvents = eventEmitter.eventHistory ? eventEmitter.eventHistory.length : 0;

    this.memoryStats.lastCleanup = Date.now();
  }
}
