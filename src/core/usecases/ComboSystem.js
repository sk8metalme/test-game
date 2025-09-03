/**
 * ComboSystem.js - コンボシステムユースケース
 *
 * TDD Green Phase: テストを通すための最小実装
 *
 * 責任:
 * - コンボロジックの管理
 * - エフェクトとUIの統合
 * - スコア計算との連携
 * - イベント発火と統計収集
 *
 * オニオンアーキテクチャ: Use Case Layer
 */

import { ComboState } from '../entities/ComboState.js';

export class ComboSystem {
  /**
   * ComboSystem インスタンスを作成
   *
   * @param {Object} gameLogic - GameLogic インスタンス
   * @param {Object} effectManager - EffectManager インスタンス
   * @param {Object} uiManager - UIManager インスタンス
   * @param {Object} config - 設定オプション
   */
  constructor(gameLogic, effectManager, uiManager, config = {}) {
    // 依存関係の検証
    if (!gameLogic) {
      throw new Error('GameLogic is required');
    }
    if (!effectManager) {
      throw new Error('EffectManager is required');
    }
    if (!uiManager) {
      throw new Error('UIManager is required');
    }

    this.gameLogic = gameLogic;
    this.effectManager = effectManager;
    this.uiManager = uiManager;

    // 設定の初期化
    this.config = {
      maxComboHistory: 100,
      enableEffects: true,
      effectIntensityMultiplier: 1.0,
      uiUpdateThrottle: 50,
      ...config,
    };

    // コンボ状態の初期化
    this.comboState = new ComboState({
      maxHistorySize: this.config.maxComboHistory,
      enableStatistics: true,
    });

    // 内部状態
    this._isDestroyed = false;
    this._isPaused = false;
    this._lastUIUpdate = 0;
    this._totalBonus = 0;

    // イベントリスナーの設定
    this._setupEventListeners();
  }

  /**
   * コンボを更新する
   *
   * @param {number} linesCleared - 削除されたライン数
   * @param {Object} gameState - ゲーム状態
   * @returns {Object} 更新結果
   */
  updateCombo(linesCleared, gameState) {
    // システム状態チェック
    if (this._isDestroyed) {
      return { success: false, error: 'ComboSystem is destroyed' };
    }
    if (this._isPaused) {
      return { success: false, error: 'ComboSystem is paused' };
    }

    // 入力値検証
    if (!this._validateInput(linesCleared, gameState)) {
      return { success: false, error: 'Invalid input parameters' };
    }

    try {
      // 状態の復旧（不正な状態の場合）
      this._sanitizeState();

      const previousCombo = this.comboState.getComboLevel();
      const wasActive = this.comboState.isActive();

      let result;

      if (linesCleared === 0) {
        // コンボ中断
        result = this._handleComboBreak(previousCombo);
      } else {
        // コンボ継続/開始
        result = this._handleComboUpdate(linesCleared, gameState, previousCombo, wasActive);
      }

      // エフェクトとUI更新（エラーが発生してもコンボ処理は継続）
      this._updateEffects(result);
      this._updateUI(result);

      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * コンボ統計を取得
   *
   * @returns {Object} 統計情報
   */
  getComboStats() {
    const baseStats = this.comboState.getComboStats();
    return {
      ...baseStats,
      totalBonus: this._totalBonus,
      totalCombos: this.comboState.totalCombos,
    };
  }

  /**
   * 設定を更新
   *
   * @param {Object} newConfig - 新しい設定
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * システムを一時停止
   */
  pause() {
    this._isPaused = true;
  }

  /**
   * システムを再開
   */
  resume() {
    this._isPaused = false;
  }

  /**
   * システムをリセット
   */
  reset() {
    this.comboState = new ComboState({
      maxHistorySize: this.config.maxComboHistory,
      enableStatistics: true,
    });
    this._totalBonus = 0;
  }

  /**
   * システムを破棄
   */
  destroy() {
    this._isDestroyed = true;

    // イベントリスナーの削除
    if (this.gameLogic && this.gameLogic.eventEmitter) {
      this.gameLogic.eventEmitter.off('combo.updated', this._onComboEvent);
    }
  }

  /**
   * コンボ中断を処理
   *
   * @private
   * @param {number} previousCombo - 前のコンボレベル
   * @returns {Object} 処理結果
   */
  _handleComboBreak(previousCombo) {
    const resetResult = this.comboState.resetCombo();

    const result = {
      success: true,
      comboLevel: 0,
      bonus: 0,
      multiplier: 1.0,
      comboBroken: true,
      previousCombo: previousCombo,
      wasActive: resetResult.wasActive,
    };

    if (resetResult.wasActive) {
      // イベント発火
      this._emitComboEvent('combo.broken', result);
    }

    return result;
  }

  /**
   * コンボ更新を処理
   *
   * @private
   * @param {number} linesCleared - 削除されたライン数
   * @param {Object} gameState - ゲーム状態
   * @param {number} previousCombo - 前のコンボレベル
   * @param {boolean} wasActive - 前回アクティブだったか
   * @returns {Object} 処理結果
   */
  _handleComboUpdate(linesCleared, gameState, previousCombo, _wasActive) {
    // コンボ増加
    this.comboState.incrementCombo();
    const currentCombo = this.comboState.getComboLevel();

    // ボーナス計算
    const bonus = this._calculateBonus(linesCleared, currentCombo, gameState);
    const multiplier = this._calculateMultiplier(currentCombo);

    // Perfect Clear判定
    const perfectClear = this._checkPerfectClear();
    const specialBonus = perfectClear ? bonus * 2 : 0;

    const totalBonus = bonus + specialBonus;
    this._totalBonus += totalBonus;

    // スコア更新
    try {
      gameState.addComboScore(totalBonus);
    } catch (error) {
      throw new Error(`Score update failed: ${error.message}`);
    }

    const result = {
      success: true,
      comboLevel: currentCombo,
      bonus: totalBonus,
      multiplier: multiplier,
      comboContinued: currentCombo > 1,
      wasFirstCombo: currentCombo === 1,
      perfectClear: perfectClear,
      specialBonus: specialBonus,
      linesCleared: linesCleared,
    };

    // イベント発火
    const eventType = currentCombo === 1 ? 'combo.started' : 'combo.continued';
    this._emitComboEvent(eventType, result);

    // 最大コンボ記録更新チェック
    if (currentCombo > previousCombo && currentCombo === this.comboState.maxCombo) {
      this._emitComboEvent('combo.record', {
        newRecord: currentCombo,
        previousRecord: Math.max(0, currentCombo - 1),
      });
    }

    return result;
  }

  /**
   * ボーナスを計算
   *
   * @private
   * @param {number} linesCleared - 削除されたライン数
   * @param {number} comboLevel - コンボレベル
   * @param {Object} gameState - ゲーム状態
   * @returns {number} ボーナス値
   */
  _calculateBonus(linesCleared, comboLevel, gameState) {
    // 基本ボーナス（ライン数ベース）
    const lineBonus = linesCleared * 50;

    // コンボボーナス（高コンボ時に指数的に増加）
    let comboBonus;
    if (comboLevel <= 5) {
      comboBonus = comboLevel * 25;
    } else if (comboLevel <= 10) {
      comboBonus = 125 + (comboLevel - 5) * 50;
    } else {
      comboBonus = 375 + (comboLevel - 10) * 100; // 高コンボ時さらに大幅増加
    }

    // レベル倍率
    const levelMultiplier = gameState.level || 1;

    // ライン種別ボーナス
    let lineTypeBonus = 0;
    if (linesCleared === 4) {
      lineTypeBonus = 200; // テトリス
    } else if (linesCleared === 3) {
      lineTypeBonus = 100; // トリプル
    } else if (linesCleared === 2) {
      lineTypeBonus = 50; // ダブル
    }

    return Math.floor((lineBonus + comboBonus + lineTypeBonus) * levelMultiplier);
  }

  /**
   * 倍率を計算
   *
   * @private
   * @param {number} comboLevel - コンボレベル
   * @returns {number} 倍率
   */
  _calculateMultiplier(comboLevel) {
    if (comboLevel <= 1) return 1.0;
    if (comboLevel <= 5) return 1.5;
    if (comboLevel <= 10) return 2.0;
    if (comboLevel <= 15) return 2.5;
    return 3.0; // 超高コンボ
  }

  /**
   * Perfect Clear判定
   *
   * @private
   * @returns {boolean} Perfect Clearかどうか
   */
  _checkPerfectClear() {
    if (!this.gameLogic.board || typeof this.gameLogic.board.getHeight !== 'function') {
      return false;
    }

    return this.gameLogic.board.getHeight() === 0;
  }

  /**
   * エフェクトを更新
   *
   * @private
   * @param {Object} result - 更新結果
   */
  _updateEffects(result) {
    if (!this.config.enableEffects) {
      return;
    }

    try {
      if (result.comboBroken) {
        // コンボ中断エフェクト
        this.effectManager.playEffect('combo-break', {
          finalCombo: result.previousCombo,
          intensity:
            Math.min(result.previousCombo * 0.1, 1.0) * this.config.effectIntensityMultiplier,
        });
      } else if (result.success) {
        // 通常コンボエフェクト
        const intensity =
          Math.min(result.comboLevel * 0.1, 1.0) * this.config.effectIntensityMultiplier;

        this.effectManager.playEffect('combo-chain', {
          intensity: intensity,
          comboLevel: result.comboLevel,
          position: this._getEffectPosition(),
        });

        // 高コンボ時の特別エフェクト
        if (result.comboLevel >= 10) {
          this.effectManager.playEffect('combo-mega', {
            intensity: intensity,
            comboLevel: result.comboLevel,
          });
        }
      }
    } catch (error) {
      result.effectError = true;
    }
  }

  /**
   * UIを更新
   *
   * @private
   * @param {Object} result - 更新結果
   */
  _updateUI(result) {
    const now = Date.now();

    // スロットル制御
    if (now - this._lastUIUpdate < this.config.uiUpdateThrottle) {
      return;
    }
    this._lastUIUpdate = now;

    try {
      if (result.comboBroken && result.wasActive) {
        // コンボ中断UI
        this.uiManager.hideComboDisplay({
          finalCombo: result.previousCombo,
          fadeOutDuration: 1000,
        });
      } else if (result.success) {
        // コンボ表示更新
        this.uiManager.updateComboDisplay({
          comboLevel: result.comboLevel,
          bonus: result.bonus,
          multiplier: result.multiplier,
          isActive: true,
          progress: Math.min(result.comboLevel / 10, 1.0),
        });

        // コンボアニメーション
        const animationType = result.wasFirstCombo ? 'combo-start' : 'combo-continue';
        this.uiManager.showComboAnimation({
          comboLevel: result.comboLevel,
          animationType: animationType,
          intensity: Math.min(result.comboLevel * 0.2, 1.0),
        });
      }
    } catch (error) {
      result.uiError = true;
    }
  }

  /**
   * エフェクト位置を取得
   *
   * @private
   * @returns {Object} 位置情報
   */
  _getEffectPosition() {
    return {
      x: 400, // ゲーム画面中央付近
      y: 300,
    };
  }

  /**
   * 入力値を検証
   *
   * @private
   * @param {*} linesCleared - 削除されたライン数
   * @param {*} gameState - ゲーム状態
   * @returns {boolean} 妥当かどうか
   */
  _validateInput(linesCleared, gameState) {
    return (
      typeof linesCleared === 'number' &&
      linesCleared >= 0 &&
      linesCleared <= 4 &&
      !isNaN(linesCleared) &&
      gameState &&
      typeof gameState === 'object'
    );
  }

  /**
   * 状態を修正
   *
   * @private
   */
  _sanitizeState() {
    if (this.comboState.currentCombo < 0) {
      this.comboState.currentCombo = 0;
    }
  }

  /**
   * イベントを発火
   *
   * @private
   * @param {string} eventName - イベント名
   * @param {Object} data - イベントデータ
   */
  _emitComboEvent(eventName, data) {
    if (this.gameLogic.eventEmitter && typeof this.gameLogic.eventEmitter.emit === 'function') {
      this.gameLogic.eventEmitter.emit(eventName, data);
    }
  }

  /**
   * イベントリスナーを設定
   *
   * @private
   */
  _setupEventListeners() {
    if (this.gameLogic.eventEmitter && typeof this.gameLogic.eventEmitter.on === 'function') {
      this._onComboEvent = this._onComboEvent.bind(this);
      this.gameLogic.eventEmitter.on('combo.updated', this._onComboEvent);
    }
  }

  /**
   * コンボイベントハンドラー
   *
   * @private
   * @param {Object} data - イベントデータ
   */
  _onComboEvent(_data) {
    // 外部からのコンボイベントを処理
    // 現在の実装では特別な処理は不要
  }
}
