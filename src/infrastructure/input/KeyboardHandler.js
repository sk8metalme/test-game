/**
 * KeyboardHandler.js - キーボード入力処理システム
 *
 * オニオンアーキテクチャ: Infrastructure Layer
 *
 * 責任:
 * - キーボード入力の捕捉と処理
 * - DAS（Delayed Auto Shift）システム
 * - 入力バッファリングとデバウンス
 * - キーマッピング管理
 * - 入力統計の収集
 *
 * @tdd-development-expert との協力実装
 */

export default class KeyboardHandler {
  /**
   * @param {Object} callbacks - ゲームアクションコールバック
   */
  constructor(callbacks = {}) {
    this.callbacks = this._validateCallbacks(callbacks);
    this.isEnabled = true;

    // キーマッピング（カスタマイズ可能）
    this.keyMapping = {
      // 移動キー
      ArrowLeft: 'moveLeft',
      ArrowRight: 'moveRight',
      ArrowDown: 'moveDown',

      // 回転キー
      ArrowUp: 'rotateClockwise',
      KeyZ: 'rotateCounterClockwise',
      KeyX: 'rotateClockwise',

      // アクションキー
      Space: 'hardDrop',
      KeyC: 'hold',

      // ゲーム制御
      Escape: 'pause',
      KeyR: 'reset',
    };

    // DAS（Delayed Auto Shift）設定
    this.dasConfig = {
      delay: 167, // 10フレーム at 60fps (ms)
      repeat: 33, // 2フレーム at 60fps (ms)
    };

    // DAS状態管理
    this.dasStates = new Map();

    // 入力バッファ（重複防止・デバウンス用）
    this.inputBuffer = new Map();
    this.maxBufferSize = 10;

    // 統計情報
    this.statistics = {
      totalInputs: 0,
      actionCounts: {},
      firstInputTime: null,
      lastInputTime: null,
    };

    // イベントリスナーのバインド
    this.boundKeyDown = this.handleKeyDown.bind(this);
    this.boundKeyUp = this.handleKeyUp.bind(this);

    // イベントリスナー登録
    this._attachEventListeners();
  }

  /**
   * キーダウンイベント処理
   * @param {KeyboardEvent} event - キーボードイベント
   */
  handleKeyDown(event) {
    if (!this._isValidEvent(event) || !this.isEnabled) {
      return;
    }

    const key = this._normalizeKey(event.key, event.code);
    const action = this.keyMapping[key];

    if (!action) {
      return; // マッピングされていないキー
    }

    // デフォルト動作の防止
    event.preventDefault();
    event.stopPropagation();

    // 入力バッファチェック（重複防止）
    if (this._isBufferedInput(key, event.timeStamp)) {
      return;
    }

    // アクション実行
    this._executeAction(action);

    // DAS開始（移動系アクションのみ）
    if (this._isDASEnabledAction(action)) {
      this._startDAS(key, action);
    }

    // 統計更新
    this._updateStatistics(action, event.timeStamp);

    // 入力バッファ更新
    this._updateInputBuffer(key, event.timeStamp);
  }

  /**
   * キーアップイベント処理
   * @param {KeyboardEvent} event - キーボードイベント
   */
  handleKeyUp(event) {
    if (!this._isValidEvent(event) || !this.isEnabled) {
      return;
    }

    const key = this._normalizeKey(event.key, event.code);

    // DAS停止
    this._stopDAS(key);

    // 入力バッファからクリア
    this.inputBuffer.delete(key);
  }

  /**
   * フレーム更新処理（DAS処理）
   */
  update() {
    if (!this.isEnabled) {
      return;
    }

    const currentTime = this._getCurrentTime();

    for (const [, dasState] of this.dasStates) {
      if (this._shouldTriggerDAS(dasState, currentTime)) {
        this._executeAction(dasState.action);
        dasState.lastTrigger = currentTime;
      }
    }
  }

  /**
   * キーマッピング設定
   * @param {Object} mapping - 新しいキーマッピング
   */
  setKeyMapping(mapping) {
    if (typeof mapping === 'object' && mapping !== null) {
      this.keyMapping = { ...mapping };
    }
  }

  /**
   * キーマッピング取得
   * @returns {Object} 現在のキーマッピング
   */
  getKeyMapping() {
    return { ...this.keyMapping };
  }

  /**
   * DAS設定変更
   * @param {Object} config - DAS設定
   */
  setDASConfig(config) {
    if (typeof config === 'object' && config !== null) {
      if (typeof config.delay === 'number' && config.delay >= 0) {
        this.dasConfig.delay = config.delay;
      }
      if (typeof config.repeat === 'number' && config.repeat >= 0) {
        this.dasConfig.repeat = config.repeat;
      }
    }
  }

  /**
   * DAS設定取得
   * @returns {Object} 現在のDAS設定
   */
  getDASConfig() {
    return { ...this.dasConfig };
  }

  /**
   * DAS状態取得（テスト用）
   * @param {string} key - キー
   * @returns {Object|null} DAS状態
   */
  getDASState(key) {
    return this.dasStates.get(key) || null;
  }

  /**
   * 入力ハンドラー有効化
   */
  enable() {
    this.isEnabled = true;
  }

  /**
   * 入力ハンドラー無効化
   */
  disable() {
    this.isEnabled = false;
    this._clearAllDAS();
    this._clearInputBuffer();
  }

  /**
   * 入力バッファクリア
   */
  clearInputBuffer() {
    this.inputBuffer.clear();
  }

  /**
   * 入力バッファサイズ取得
   * @returns {number} バッファサイズ
   */
  getInputBufferSize() {
    return this.inputBuffer.size;
  }

  /**
   * 入力統計取得
   * @returns {Object} 統計情報
   */
  getInputStatistics() {
    const stats = { ...this.statistics };

    // 平均入力レート計算
    if (stats.firstInputTime && stats.lastInputTime && stats.totalInputs > 1) {
      const duration = stats.lastInputTime - stats.firstInputTime;
      stats.averageInputRate = (stats.totalInputs - 1) / (duration / 1000); // inputs per second
    } else {
      stats.averageInputRate = 0;
    }

    return stats;
  }

  /**
   * 統計リセット
   */
  resetStatistics() {
    this.statistics = {
      totalInputs: 0,
      actionCounts: {},
      firstInputTime: null,
      lastInputTime: null,
    };
  }

  /**
   * リソース解放
   */
  destroy() {
    this._detachEventListeners();
    this._clearAllDAS();
    this._clearInputBuffer();
    this.callbacks = {};
  }

  // === プライベートメソッド ===

  /**
   * コールバック検証
   * @private
   * @param {Object} callbacks - コールバック関数群
   * @returns {Object} 検証済みコールバック
   */
  _validateCallbacks(callbacks) {
    const validCallbacks = {};

    // 必要なコールバックの一覧とアクション名のマッピング
    const callbackMapping = {
      onMoveLeft: 'moveLeft',
      onMoveRight: 'moveRight',
      onMoveDown: 'moveDown',
      onRotateClockwise: 'rotateClockwise',
      onRotateCounterClockwise: 'rotateCounterClockwise',
      onHardDrop: 'hardDrop',
      onHold: 'hold',
      onPause: 'pause',
      onReset: 'reset',
    };

    Object.entries(callbackMapping).forEach(([callbackName, actionName]) => {
      const callback = callbacks[callbackName];

      if (typeof callback === 'function') {
        validCallbacks[actionName] = callback;
      } else {
        validCallbacks[actionName] = () => {}; // no-op
      }
    });

    return validCallbacks;
  }

  /**
   * 有効なイベントかチェック
   * @private
   * @param {Event} event - イベント
   * @returns {boolean}
   */
  _isValidEvent(event) {
    return event && typeof event === 'object' && (event.key || event.code);
  }

  /**
   * キー正規化
   * @private
   * @param {string} key - イベントキー
   * @param {string} code - イベントコード
   * @returns {string} 正規化されたキー
   */
  _normalizeKey(key, code) {
    // スペースキーの特殊処理
    if (key === ' ') {
      return 'Space';
    }

    // コードが利用可能ならコードを優先
    if ((code && code.startsWith('Key')) || code.startsWith('Arrow')) {
      return code;
    }

    return key;
  }

  /**
   * バッファ済み入力かチェック
   * @private
   * @param {string} key - キー
   * @param {number} timeStamp - タイムスタンプ
   * @returns {boolean}
   */
  _isBufferedInput(key, timeStamp) {
    const buffered = this.inputBuffer.get(key);

    if (!buffered) {
      return false;
    }

    // 同一フレーム内（16ms以内）の重複入力をバッファ
    return timeStamp - buffered.timeStamp < 16;
  }

  /**
   * アクション実行
   * @private
   * @param {string} action - アクション名
   */
  _executeAction(action) {
    const callback = this.callbacks[action];

    if (typeof callback === 'function') {
      try {
        callback();
      } catch (error) {
        // エラーログは本番環境では無効化
        if (process.env.NODE_ENV === 'development') {
          // console.warn(`KeyboardHandler: Action ${action} failed:`, error);
        }
      }
    }
  }

  /**
   * DAS対象アクションかチェック
   * @private
   * @param {string} action - アクション名
   * @returns {boolean}
   */
  _isDASEnabledAction(action) {
    return ['moveLeft', 'moveRight', 'moveDown'].includes(action);
  }

  /**
   * DAS開始
   * @private
   * @param {string} key - キー
   * @param {string} action - アクション
   */
  _startDAS(key, action) {
    const currentTime = this._getCurrentTime();

    this.dasStates.set(key, {
      action: action,
      startTime: currentTime,
      lastTrigger: currentTime,
      phase: 'delay', // 'delay' -> 'repeat'
    });
  }

  /**
   * DAS停止
   * @private
   * @param {string} key - キー
   */
  _stopDAS(key) {
    this.dasStates.delete(key);
  }

  /**
   * 全DASクリア
   * @private
   */
  _clearAllDAS() {
    this.dasStates.clear();
  }

  /**
   * DAS発動判定
   * @private
   * @param {Object} dasState - DAS状態
   * @param {number} currentTime - 現在時刻
   * @returns {boolean}
   */
  _shouldTriggerDAS(dasState, currentTime) {
    if (dasState.phase === 'delay') {
      // 遅延フェーズ
      if (currentTime - dasState.startTime >= this.dasConfig.delay) {
        dasState.phase = 'repeat';
        return true;
      }
    } else if (dasState.phase === 'repeat') {
      // リピートフェーズ
      if (currentTime - dasState.lastTrigger >= this.dasConfig.repeat) {
        return true;
      }
    }

    return false;
  }

  /**
   * 統計更新
   * @private
   * @param {string} action - アクション
   * @param {number} timeStamp - タイムスタンプ
   */
  _updateStatistics(action, timeStamp) {
    this.statistics.totalInputs++;

    // アクション別カウント
    if (!this.statistics.actionCounts[action]) {
      this.statistics.actionCounts[action] = 0;
    }
    this.statistics.actionCounts[action]++;

    // 時間記録
    if (!this.statistics.firstInputTime) {
      this.statistics.firstInputTime = timeStamp;
    }
    this.statistics.lastInputTime = timeStamp;
  }

  /**
   * 入力バッファ更新
   * @private
   * @param {string} key - キー
   * @param {number} timeStamp - タイムスタンプ
   */
  _updateInputBuffer(key, timeStamp) {
    // バッファサイズ制限
    if (this.inputBuffer.size >= this.maxBufferSize) {
      // 最も古いエントリを削除
      const oldestKey = this.inputBuffer.keys().next().value;
      this.inputBuffer.delete(oldestKey);
    }

    this.inputBuffer.set(key, {
      timeStamp: timeStamp,
      processed: true,
    });
  }

  /**
   * 入力バッファクリア
   * @private
   */
  _clearInputBuffer() {
    this.inputBuffer.clear();
  }

  /**
   * イベントリスナー登録
   * @private
   */
  _attachEventListeners() {
    if (typeof document !== 'undefined') {
      document.addEventListener('keydown', this.boundKeyDown, { passive: false });
      document.addEventListener('keyup', this.boundKeyUp, { passive: false });
    }
  }

  /**
   * 現在時刻取得（テスト環境対応）
   * @private
   * @returns {number} 現在時刻（ミリ秒）
   */
  _getCurrentTime() {
    // テスト環境ではjest.now()を使用、本番環境ではDate.now()を使用
    if (typeof jest !== 'undefined' && jest.now) {
      return jest.now();
    }
    return Date.now();
  }

  /**
   * イベントリスナー削除
   * @private
   */
  _detachEventListeners() {
    if (typeof document !== 'undefined') {
      document.removeEventListener('keydown', this.boundKeyDown);
      document.removeEventListener('keyup', this.boundKeyUp);
    }
  }
}
