/**
 * GameEventEmitter.js - ゲームイベント配信システム
 *
 * オニオンアーキテクチャ: Application Layer (Use Cases)
 *
 * 責任:
 * - ゲームイベントの配信と管理
 * - イベントリスナーの登録・削除
 * - イベントデータの検証
 * - イベント履歴の管理
 *
 * @developer との協力実装
 */

/**
 * ゲームイベント配信クラス
 *
 * @class GameEventEmitter
 * @description テトリスゲームのイベント配信を担当するユースケース
 */
export default class GameEventEmitter {
  /**
   * GameEventEmitter インスタンスを作成
   *
   * @param {Object} [config={}] - 設定
   * @param {boolean} [config.enableHistory=true] - イベント履歴の有効化
   * @param {number} [config.maxHistorySize=100] - 最大履歴サイズ
   * @param {boolean} [config.enableValidation=true] - イベント検証の有効化
   */
  constructor(config = {}) {
    this.config = {
      enableHistory: config.enableHistory !== false,
      maxHistorySize: config.maxHistorySize || 100,
      enableValidation: config.enableValidation !== false,
      ...config,
    };

    // イベントリスナー管理
    this.listeners = new Map();

    // イベント履歴
    this.eventHistory = [];

    // 統計情報
    this.stats = {
      totalEventsEmitted: 0,
      totalListeners: 0,
      eventsByType: new Map(),
    };

    // 有効なイベントタイプ
    this.validEventTypes = [
      // ゲーム状態イベント
      'game.started',
      'game.paused',
      'game.resumed',
      'game.ended',

      // ピースイベント
      'piece.spawned',
      'piece.moved',
      'piece.rotated',
      'piece.dropped',
      'piece.locked',
      'piece.held',

      // ボードイベント
      'lines.cleared',
      'level.up',

      // 特殊ルールイベント
      't-spin.achieved',
      'perfect-clear.achieved',
      'combo.achieved',
      'back-to-back.achieved',

      // UIイベント
      'ui.menu.opened',
      'ui.menu.closed',
      'ui.settings.changed',
    ];

    // 初期化完了フラグ
    this._initialized = true;
  }

  /**
   * イベントリスナーを登録する
   *
   * @param {string} eventName - イベント名
   * @param {Function} callback - コールバック関数
   * @param {Object} [options={}] - オプション
   * @param {boolean} [options.once=false] - 一度だけ実行するかどうか
   * @param {number} [options.priority=0] - 優先度（数値が大きいほど優先）
   * @returns {Function} 登録解除関数
   */
  on(eventName, callback, options = {}) {
    if (typeof callback !== 'function') {
      throw new Error('GameEventEmitter: コールバックは関数である必要があります');
    }

    if (this.config.enableValidation && !this.validEventTypes.includes(eventName)) {
      // console.warn(`GameEventEmitter: 無効なイベントタイプ '${eventName}'`);
    }

    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }

    const listener = {
      callback,
      once: options.once || false,
      priority: options.priority || 0,
      id: Date.now() + Math.random(),
    };

    this.listeners.get(eventName).push(listener);

    // 優先度でソート
    this.listeners.get(eventName).sort((a, b) => b.priority - a.priority);

    this.stats.totalListeners++;

    // 登録解除関数を返す
    return () => this.off(eventName, callback);
  }

  /**
   * 一度だけ実行されるイベントリスナーを登録する
   *
   * @param {string} eventName - イベント名
   * @param {Function} callback - コールバック関数
   * @param {Object} [options={}] - オプション
   * @returns {Function} 登録解除関数
   */
  once(eventName, callback, options = {}) {
    return this.on(eventName, callback, { ...options, once: true });
  }

  /**
   * イベントリスナーを削除する
   *
   * @param {string} eventName - イベント名
   * @param {Function} callback - コールバック関数
   * @returns {boolean} 削除成功かどうか
   */
  off(eventName, callback) {
    if (!this.listeners.has(eventName)) {
      return false;
    }

    const eventListeners = this.listeners.get(eventName);
    const initialLength = eventListeners.length;

    // コールバックが一致するリスナーを削除
    const filteredListeners = eventListeners.filter(listener => listener.callback !== callback);

    this.listeners.set(eventName, filteredListeners);

    const removed = initialLength - filteredListeners.length;
    this.stats.totalListeners -= removed;

    return removed > 0;
  }

  /**
   * 特定のイベントの全てのリスナーを削除する
   *
   * @param {string} eventName - イベント名
   * @returns {number} 削除されたリスナー数
   */
  removeAllListeners(eventName) {
    if (!this.listeners.has(eventName)) {
      return 0;
    }

    const eventListeners = this.listeners.get(eventName);
    const count = eventListeners.length;

    this.listeners.delete(eventName);
    this.stats.totalListeners -= count;

    return count;
  }

  /**
   * 全てのイベントリスナーを削除する
   */
  removeAllListenersAll() {
    const totalCount = this.stats.totalListeners;
    this.listeners.clear();
    this.stats.totalListeners = 0;
    return totalCount;
  }

  /**
   * イベントを配信する
   *
   * @param {string} eventName - イベント名
   * @param {Object} [data={}] - イベントデータ
   * @returns {boolean} 配信成功かどうか
   */
  emit(eventName, data = {}) {
    if (this.config.enableValidation && !this.validEventTypes.includes(eventName)) {
      // console.warn(`GameEventEmitter: 無効なイベントタイプ '${eventName}'`);
      return false;
    }

    const eventData = {
      name: eventName,
      data,
      timestamp: Date.now(),
    };

    // イベント履歴に追加（リスナーの有無に関係なく記録）
    if (this.config.enableHistory) {
      this._addToHistory(eventData);
    }

    // 統計情報を更新（リスナーの有無に関係なく記録）
    this.stats.totalEventsEmitted++;
    const eventCount = this.stats.eventsByType.get(eventName) || 0;
    this.stats.eventsByType.set(eventName, eventCount + 1);

    // リスナーがない場合は履歴のみ記録して終了
    if (!this.listeners.has(eventName)) {
      return false;
    }

    const eventListeners = this.listeners.get(eventName);

    // リスナーを実行
    const listenersToRemove = [];

    for (const listener of eventListeners) {
      try {
        listener.callback(eventData);
        if (listener.once) {
          listenersToRemove.push(listener);
        }
      } catch (error) {
        // console.error(`GameEventEmitter: イベントリスナーでエラーが発生しました: ${error.message}`);
      }
    }

    // 一度だけのリスナーを削除
    if (listenersToRemove.length > 0) {
      const remainingListeners = eventListeners.filter(
        listener => !listenersToRemove.includes(listener)
      );
      this.listeners.set(eventName, remainingListeners);
      this.stats.totalListeners -= listenersToRemove.length;
    }

    return true;
  }

  /**
   * 特定のイベントのリスナー数を取得する
   *
   * @param {string} eventName - イベント名
   * @returns {number} リスナー数
   */
  listenerCount(eventName) {
    return this.listeners.has(eventName) ? this.listeners.get(eventName).length : 0;
  }

  /**
   * 全てのイベントリスナー数を取得する
   *
   * @returns {number} 総リスナー数
   */
  totalListenerCount() {
    return this.stats.totalListeners;
  }

  /**
   * イベント履歴を取得する
   *
   * @param {Object} [options={}] - オプション
   * @param {string} [options.eventName] - 特定のイベント名でフィルタ
   * @param {number} [options.limit] - 取得件数制限
   * @param {number} [options.since] - この時刻以降のイベント
   * @returns {Array} イベント履歴
   */
  getEventHistory(options = {}) {
    let history = [...this.eventHistory];

    // イベント名でフィルタ
    if (options.eventName) {
      history = history.filter(event => event.name === options.eventName);
    }

    // 時刻でフィルタ
    if (options.since) {
      history = history.filter(event => event.timestamp >= options.since);
    }

    // 件数制限
    if (options.limit) {
      history = history.slice(-options.limit);
    }

    return history;
  }

  /**
   * 統計情報を取得する
   *
   * @returns {Object} 統計情報
   */
  getStats() {
    return {
      totalEventsEmitted: this.stats.totalEventsEmitted,
      totalListeners: this.stats.totalListeners,
      eventsByType: Object.fromEntries(this.stats.eventsByType),
      eventHistorySize: this.eventHistory.length,
      validEventTypes: this.validEventTypes,
    };
  }

  /**
   * イベント履歴をクリアする
   */
  clearEventHistory() {
    this.eventHistory = [];
  }

  /**
   * 統計情報をリセットする
   */
  resetStats() {
    this.stats = {
      totalEventsEmitted: 0,
      totalListeners: 0,
      eventsByType: new Map(),
    };
  }

  // =============================================================================
  // プライベートメソッド
  // =============================================================================

  /**
   * イベント履歴に追加する
   *
   * @private
   * @param {Object} eventData - イベントデータ
   */
  _addToHistory(eventData) {
    this.eventHistory.push(eventData);

    // 最大サイズを超えた場合、古いイベントを削除
    if (this.eventHistory.length > this.config.maxHistorySize) {
      this.eventHistory.shift();
    }
  }

  /**
   * 数値の検証
   *
   * @private
   * @param {number} value - 検証する値
   * @param {number} defaultValue - デフォルト値
   * @param {number} min - 最小値
   * @param {number} max - 最大値
   * @returns {number} 検証済みの値
   */
  _validateNumber(value, defaultValue, min = -Infinity, max = Infinity) {
    const num = Number(value);
    if (isNaN(num) || num < min || num > max) {
      return defaultValue;
    }
    return num;
  }
}
