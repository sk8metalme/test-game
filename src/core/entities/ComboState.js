/**
 * ComboState.js - コンボ状態管理エンティティ
 *
 * TDD Green Phase: テストを通すための最小実装
 *
 * 責任:
 * - コンボ状態の管理
 * - コンボ履歴の記録
 * - 統計情報の計算
 *
 * オニオンアーキテクチャ: Entity Layer
 */

export class ComboState {
  /**
   * ComboState インスタンスを作成
   *
   * @param {Object} config - 設定オプション
   * @param {number} [config.maxHistorySize=100] - 履歴最大サイズ
   * @param {boolean} [config.enableStatistics=true] - 統計機能有効化
   */
  constructor(config = {}) {
    // 設定値の検証とデフォルト値設定
    this.maxHistorySize = this._validatePositiveNumber(config.maxHistorySize)
      ? config.maxHistorySize
      : 100;
    this.enableStatistics =
      typeof config.enableStatistics === 'boolean' ? config.enableStatistics : true;

    // コンボ状態の初期化
    this.currentCombo = 0;
    this.maxCombo = 0;
    this.totalCombos = 0;
    this.comboHistory = [];
    this.comboStartTime = null;
    this.lastComboTime = null;
  }

  /**
   * コンボを増加させる
   */
  incrementCombo() {
    const now = Date.now();

    if (this.currentCombo === 0) {
      this.comboStartTime = now;
    }

    this.currentCombo++;
    this.totalCombos++;
    this.lastComboTime = now;

    // 最大コンボ更新
    if (this.currentCombo > this.maxCombo) {
      this.maxCombo = this.currentCombo;
    }
  }

  /**
   * コンボをリセットする
   *
   * @returns {Object} リセット結果
   */
  resetCombo() {
    const wasActive = this.currentCombo > 0;
    const finalCombo = this.currentCombo;

    if (wasActive) {
      // 履歴に記録
      const duration = this.lastComboTime - this.comboStartTime;
      this.addToHistory({
        maxCombo: finalCombo,
        duration: duration,
        timestamp: Date.now(),
        averageInterval: finalCombo > 1 ? duration / (finalCombo - 1) : 0,
      });
    }

    // 状態リセット
    this.currentCombo = 0;
    this.comboStartTime = null;
    this.lastComboTime = null;

    return {
      wasActive,
      finalCombo,
    };
  }

  /**
   * 履歴エントリを追加
   *
   * @param {Object} entry - 履歴エントリ
   */
  addToHistory(entry) {
    // 履歴エントリの検証
    if (!this._isValidHistoryEntry(entry)) {
      return;
    }

    this.comboHistory.push(entry);

    // 履歴サイズ制限
    if (this.comboHistory.length > this.maxHistorySize) {
      this.comboHistory.shift();
    }
  }

  /**
   * 履歴をクリア
   */
  clearHistory() {
    this.comboHistory = [];
  }

  /**
   * コンボ統計を取得
   *
   * @returns {Object} 統計情報
   */
  getComboStats() {
    if (!this.enableStatistics) {
      return {};
    }

    if (this.comboHistory.length === 0) {
      return {
        averageCombo: 0,
        maxCombo: 0,
        averageDuration: 0,
        comboPerSecond: 0,
      };
    }

    const totalCombo = this.comboHistory.reduce((sum, entry) => sum + entry.maxCombo, 0);
    const totalDuration = this.comboHistory.reduce((sum, entry) => sum + entry.duration, 0);
    const averageCombo = totalCombo / this.comboHistory.length;
    const averageDuration = totalDuration / this.comboHistory.length;
    const maxCombo = Math.max(...this.comboHistory.map(entry => entry.maxCombo));
    const comboPerSecond = averageDuration > 0 ? averageCombo / (averageDuration / 1000) : 0;

    return {
      averageCombo: parseFloat(averageCombo.toFixed(2)),
      maxCombo,
      averageDuration: parseFloat(averageDuration.toFixed(0)),
      comboPerSecond: parseFloat(comboPerSecond.toFixed(2)),
    };
  }

  /**
   * アクティブ状態を確認
   *
   * @returns {boolean} アクティブかどうか
   */
  isActive() {
    return this.currentCombo > 0;
  }

  /**
   * 現在のコンボレベルを取得
   *
   * @returns {number} コンボレベル
   */
  getComboLevel() {
    return this.currentCombo;
  }

  /**
   * 現在の継続時間を取得
   *
   * @returns {number} 継続時間（ミリ秒）
   */
  getCurrentDuration() {
    if (!this.isActive() || !this.comboStartTime) {
      return 0;
    }

    return Date.now() - this.comboStartTime;
  }

  /**
   * JSONにシリアライズ
   *
   * @returns {Object} シリアライズされたデータ
   */
  toJSON() {
    return {
      currentCombo: this.currentCombo,
      maxCombo: this.maxCombo,
      totalCombos: this.totalCombos,
      comboHistory: [...this.comboHistory],
      comboStartTime: this.comboStartTime,
      lastComboTime: this.lastComboTime,
      maxHistorySize: this.maxHistorySize,
      enableStatistics: this.enableStatistics,
    };
  }

  /**
   * JSONから復元
   *
   * @param {Object} data - シリアライズされたデータ
   * @returns {ComboState} 復元されたインスタンス
   */
  static fromJSON(data) {
    if (!data || typeof data !== 'object') {
      return new ComboState();
    }

    const instance = new ComboState({
      maxHistorySize: data.maxHistorySize,
      enableStatistics: data.enableStatistics,
    });

    // 数値プロパティの復元（検証付き）
    instance.currentCombo = this._validateNumber(data.currentCombo) ? data.currentCombo : 0;
    instance.maxCombo = this._validateNumber(data.maxCombo) ? data.maxCombo : 0;
    instance.totalCombos = this._validateNumber(data.totalCombos) ? data.totalCombos : 0;
    instance.comboStartTime = this._validateNumber(data.comboStartTime)
      ? data.comboStartTime
      : null;
    instance.lastComboTime = this._validateNumber(data.lastComboTime) ? data.lastComboTime : null;

    // 履歴の復元
    if (Array.isArray(data.comboHistory)) {
      instance.comboHistory = data.comboHistory.filter(entry =>
        instance._isValidHistoryEntry(entry)
      );
    }

    return instance;
  }

  /**
   * 正の数値を検証
   *
   * @private
   * @param {*} value - 検証する値
   * @returns {boolean} 正の数値かどうか
   */
  _validatePositiveNumber(value) {
    return typeof value === 'number' && value > 0 && !isNaN(value);
  }

  /**
   * 数値を検証
   *
   * @private
   * @param {*} value - 検証する値
   * @returns {boolean} 数値かどうか
   */
  static _validateNumber(value) {
    return typeof value === 'number' && !isNaN(value);
  }

  /**
   * 履歴エントリの妥当性を検証
   *
   * @private
   * @param {*} entry - 検証するエントリ
   * @returns {boolean} 妥当かどうか
   */
  _isValidHistoryEntry(entry) {
    return (
      entry &&
      typeof entry === 'object' &&
      typeof entry.maxCombo === 'number' &&
      entry.maxCombo >= 0 &&
      typeof entry.duration === 'number' &&
      entry.duration >= 0 &&
      typeof entry.timestamp === 'number'
    );
  }
}
