/**
 * GameEventIntegrator.js - ゲームイベントとエフェクトの統合システム
 *
 * オニオンアーキテクチャ: Application Layer (Use Cases)
 *
 * 責任:
 * - GameLogicとEffectManagerの連携
 * - ゲームイベントの監視とエフェクト実行
 * - イベントデータの変換
 * - エフェクト設定の管理
 *
 * @developer との協力実装
 */

/**
 * ゲームイベント統合クラス
 *
 * @class GameEventIntegrator
 * @description ゲームイベントとパーティクルエフェクトを統合するユースケース
 */
export default class GameEventIntegrator {
  /**
   * GameEventIntegrator インスタンスを作成
   *
   * @param {Object} gameLogic - GameLogicインスタンス
   * @param {Object} effectManager - EffectManagerインスタンス
   * @param {Object} [config={}] - 設定
   * @param {boolean} [config.enableEffects=true] - エフェクトの有効/無効
   * @param {Object} [config.effectSettings={}] - エフェクト固有の設定
   * @param {Object} [config.eventMapping={}] - イベントとエフェクトのマッピング
   */
  constructor(gameLogic, effectManager, config = {}) {
    if (!gameLogic) {
      throw new Error('GameEventIntegrator: GameLogicインスタンスが必要です');
    }

    if (!effectManager) {
      throw new Error('GameEventIntegrator: EffectManagerインスタンスが必要です');
    }

    this.gameLogic = gameLogic;
    this.effectManager = effectManager;

    this.config = {
      enableEffects: config.enableEffects !== false,
      effectSettings: config.effectSettings || {},
      eventMapping: config.eventMapping || {},
      ...config,
    };

    // GameLogicのイベントエミッターを使用
    this.eventEmitter = this.gameLogic.getEventEmitter();

    // イベントハンドラーの登録
    this.eventHandlers = new Map();

    // 統計情報
    this.stats = {
      totalEventsProcessed: 0,
      totalEffectsTriggered: 0,
      eventsByType: new Map(),
      effectsByType: new Map(),
    };

    // 初期化完了フラグ
    this._initialized = true;
  }

  /**
   * イベント統合を開始する
   *
   * @returns {boolean} 統合成功かどうか
   */
  integrate() {
    try {
      // イベントハンドラーを登録
      this._registerEventHandlers();

      // イベントエミッターを設定
      this._setupEventEmitter();

      // 統合完了
      return true;
    } catch (error) {
      // console.error('GameEventIntegrator: 統合に失敗しました:', error);
      return false;
    }
  }

  /**
   * イベント統合を停止する
   */
  disconnect() {
    try {
      // GameLogicのイベントエミッターからハンドラーを削除
      if (this.gameLogic.getEventEmitter) {
        const gameEventEmitter = this.gameLogic.getEventEmitter();

        for (const [eventName, handler] of this.eventHandlers) {
          gameEventEmitter.off(eventName, handler);
        }
      }

      // GameStateのイベントリスナーを削除
      if (this.gameLogic.gameState && this.gameLogic.gameState.removeEventListener) {
        // リスナーを削除するには、同じ関数参照が必要なので、
        // レベルアップハンドラーを保存しておく必要がある
        if (this._levelUpHandler) {
          this.gameLogic.gameState.removeEventListener('levelUp', this._levelUpHandler);
        }
      }

      // イベントハンドラーを削除
      this._unregisterEventHandlers();

      // イベントエミッターをクリア
      this.eventEmitter.removeAllListenersAll();

      return true;
    } catch (error) {
      // console.error('GameEventIntegrator: 切断に失敗しました:', error);
      return false;
    }
  }

  /**
   * ライン削除イベントを処理する
   *
   * @param {Object} eventData - イベントデータ
   */
  handleLineClear(eventData) {
    if (!this.config.enableEffects) {
      return;
    }

    const { data } = eventData;
    const { count, type, score } = data;

    if (count === 0) {
      return;
    }

    // ライン削除エフェクトを実行
    const effectData = {
      position: this._calculateLineClearPosition(data),
      intensity: this._calculateLineClearIntensity(count),
      customConfig: {
        lineCount: count,
        lineTypes: [type],
        score: score,
        ...this.config.effectSettings.lineClear,
      },
    };

    this.effectManager.playEffect('line-clear', effectData);
    this._updateStats('lines.cleared', 'line-clear');
  }

  /**
   * T-Spinイベントを処理する
   *
   * @param {Object} eventData - イベントデータ
   */
  handleTSpin(eventData) {
    if (!this.config.enableEffects) {
      return;
    }

    const { data } = eventData;
    const { type, score, position } = data;

    // T-Spinエフェクトを実行
    const effectData = {
      position: position || this._getDefaultPosition(),
      intensity: this._calculateTSpinIntensity(type),
      customConfig: {
        tSpinType: type,
        score: score,
        ...this.config.effectSettings.tSpin,
      },
    };

    this.effectManager.playEffect('t-spin', effectData);
    this._updateStats('t-spin.achieved', 't-spin');
  }

  /**
   * Perfect Clearイベントを処理する
   *
   * @param {Object} eventData - イベントデータ
   */
  handlePerfectClear(eventData) {
    if (!this.config.enableEffects) {
      return;
    }

    const { data } = eventData;
    const { type, score, linesCleared } = data;

    // Perfect Clearエフェクトを実行
    const effectData = {
      position: this._getDefaultPosition(),
      intensity: 1.0, // Perfect Clearは常に最大強度
      customConfig: {
        perfectClearType: type,
        score: score,
        linesCleared: linesCleared,
        ...this.config.effectSettings.perfectClear,
      },
    };

    this.effectManager.playEffect('perfect-clear', effectData);
    this._updateStats('perfect-clear.achieved', 'perfect-clear');
  }

  /**
   * レベルアップイベントを処理する
   *
   * @param {Object} eventData - イベントデータ
   */
  handleLevelUp(eventData) {
    if (!this.config.enableEffects) {
      return;
    }

    const { data } = eventData;
    const { newLevel, oldLevel, reason = 'lines' } = data;

    // レベルアップエフェクトを実行
    const effectData = {
      position: this._getDefaultPosition(),
      intensity: this._calculateLevelUpIntensity(newLevel, oldLevel),
      customConfig: {
        newLevel: newLevel,
        oldLevel: oldLevel,
        reason: reason,
        ...this.config.effectSettings.levelUp,
      },
    };

    this.effectManager.playEffect('level-up', effectData);
    this._updateStats('levelUp', 'level-up');
  }

  /**
   * ゲームオーバーイベントを処理する
   *
   * @param {Object} eventData - イベントデータ
   */
  handleGameOver(eventData) {
    if (!this.config.enableEffects) {
      return;
    }

    const { data } = eventData;
    const { score, level, lines, time, statistics } = data;

    // ゲームオーバーエフェクトを実行
    const effectData = {
      position: this._getDefaultPosition(),
      intensity: this._calculateGameOverIntensity(score, level),
      customConfig: {
        finalScore: score,
        finalLevel: level,
        finalLines: lines,
        gameTime: time,
        statistics: statistics,
        ...this.config.effectSettings.gameOver,
      },
    };

    this.effectManager.playEffect('game-over', effectData);
    this._updateStats('game.ended', 'game-over');
  }

  /**
   * 統計情報を取得する
   *
   * @returns {Object} 統計情報
   */
  getStats() {
    // GameLogicのEventEmitterの統計を取得
    const eventEmitterStats = this.eventEmitter.getStats();

    return {
      totalEventsProcessed: this.stats.totalEventsProcessed,
      totalEffectsTriggered: this.stats.totalEffectsTriggered,
      eventsByType: {
        ...Object.fromEntries(this.stats.eventsByType),
        ...eventEmitterStats.eventsByType, // EventEmitterの統計をマージ
      },
      effectsByType: Object.fromEntries(this.stats.effectsByType),
      eventEmitterStats: eventEmitterStats,
    };
  }

  /**
   * 統計情報をリセットする
   */
  resetStats() {
    this.stats = {
      totalEventsProcessed: 0,
      totalEffectsTriggered: 0,
      eventsByType: new Map(),
      effectsByType: new Map(),
    };
    this.eventEmitter.resetStats();
  }

  /**
   * エフェクトの有効/無効を切り替える
   *
   * @param {boolean} enabled - 有効にするかどうか
   */
  setEffectsEnabled(enabled) {
    this.config.enableEffects = enabled;
  }

  /**
   * エフェクト設定を更新する
   *
   * @param {Object} settings - 新しい設定
   */
  updateEffectSettings(settings) {
    this.config.effectSettings = {
      ...this.config.effectSettings,
      ...settings,
    };
  }

  // =============================================================================
  // プライベートメソッド
  // =============================================================================

  /**
   * イベントハンドラーを登録する
   *
   * @private
   */
  _registerEventHandlers() {
    // ライン削除イベント
    this.eventHandlers.set('lines.cleared', eventData => {
      this.handleLineClear(eventData);
    });

    // T-Spinイベント
    this.eventHandlers.set('t-spin.achieved', eventData => {
      this.handleTSpin(eventData);
    });

    // Perfect Clearイベント
    this.eventHandlers.set('perfect-clear.achieved', eventData => {
      this.handlePerfectClear(eventData);
    });

    // レベルアップイベント
    this.eventHandlers.set('level.up', eventData => {
      this.handleLevelUp(eventData);
    });

    // ゲームオーバーイベント
    this.eventHandlers.set('game.ended', eventData => {
      this.handleGameOver(eventData);
    });

    // イベントエミッターにハンドラーを登録
    for (const [eventName, handler] of this.eventHandlers) {
      this.eventEmitter.on(eventName, handler);
    }
  }

  /**
   * イベントハンドラーを削除する
   *
   * @private
   */
  _unregisterEventHandlers() {
    for (const [eventName, handler] of this.eventHandlers) {
      this.eventEmitter.off(eventName, handler);
    }
    this.eventHandlers.clear();
  }

  /**
   * イベントエミッターを設定する
   *
   * @private
   */
  _setupEventEmitter() {
    // GameLogicのイベントエミッターにイベントハンドラーを登録
    for (const [eventName, handler] of this.eventHandlers) {
      this.eventEmitter.on(eventName, handler);
    }
  }

  /**
   * ライン削除位置を計算する
   *
   * @private
   * @param {Object} _data - イベントデータ
   * @returns {Object} 位置 {x, y}
   */
  _calculateLineClearPosition(_data) {
    // ボードの中心位置を返す
    return {
      x: 400, // ボードの中心X座標
      y: 300, // ボードの中心Y座標
    };
  }

  /**
   * ライン削除強度を計算する
   *
   * @private
   * @param {number} linesCleared - 削除されたライン数
   * @returns {number} 強度（0.0-1.0）
   */
  _calculateLineClearIntensity(linesCleared) {
    // ライン数に応じて強度を調整
    const baseIntensity = 0.5;
    const lineMultiplier = 0.2;
    return Math.min(1.0, baseIntensity + (linesCleared - 1) * lineMultiplier);
  }

  /**
   * T-Spin強度を計算する
   *
   * @private
   * @param {string} type - T-Spinタイプ
   * @returns {number} 強度（0.0-1.0）
   */
  _calculateTSpinIntensity(type) {
    const intensityMap = {
      't-spin-mini': 0.6,
      't-spin-single': 0.7,
      't-spin-double': 0.8,
      't-spin-triple': 1.0,
    };
    return intensityMap[type] || 0.7;
  }

  /**
   * レベルアップ強度を計算する
   *
   * @private
   * @param {number} newLevel - 新しいレベル
   * @param {number} oldLevel - 古いレベル
   * @returns {number} 強度（0.0-1.0）
   */
  _calculateLevelUpIntensity(newLevel, oldLevel) {
    const levelDiff = newLevel - oldLevel;
    return Math.min(1.0, 0.5 + levelDiff * 0.1);
  }

  /**
   * ゲームオーバー強度を計算する
   *
   * @private
   * @param {number} score - 最終スコア
   * @param {number} level - 最終レベル
   * @returns {number} 強度（0.0-1.0）
   */
  _calculateGameOverIntensity(score, level) {
    // スコアとレベルに応じて強度を調整
    const scoreIntensity = Math.min(1.0, score / 10000);
    const levelIntensity = Math.min(1.0, level / 20);
    return (scoreIntensity + levelIntensity) / 2;
  }

  /**
   * デフォルト位置を取得する
   *
   * @private
   * @returns {Object} 位置 {x, y}
   */
  _getDefaultPosition() {
    return {
      x: 400, // 画面の中心X座標
      y: 300, // 画面の中心Y座標
    };
  }

  /**
   * 統計情報を更新する
   *
   * @private
   * @param {string} eventType - イベントタイプ
   * @param {string} effectType - エフェクトタイプ
   */
  _updateStats(eventType, effectType) {
    this.stats.totalEventsProcessed++;
    this.stats.totalEffectsTriggered++;

    // イベントタイプ別統計
    const eventCount = this.stats.eventsByType.get(eventType) || 0;
    this.stats.eventsByType.set(eventType, eventCount + 1);

    // エフェクトタイプ別統計
    const effectCount = this.stats.effectsByType.get(effectType) || 0;
    this.stats.effectsByType.set(effectType, effectCount + 1);
  }
}
