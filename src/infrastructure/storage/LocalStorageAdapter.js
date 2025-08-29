/**
 * LocalStorageAdapter.js - ローカルストレージ管理システム
 *
 * オニオンアーキテクチャ: Infrastructure Layer
 *
 * 責任:
 * - 高スコアの永続化と管理
 * - ゲーム設定の保存と復元
 * - データ検証とエラーハンドリング
 * - データエクスポート・インポート機能
 *
 * @tdd-development-expert との協力実装
 */

export default class LocalStorageAdapter {
  /**
   * コンストラクタ
   * @param {Object} options - 初期化オプション
   */
  constructor(options = {}) {
    this._validateOptions(options);
    this._initializeState(options);
    this._setupStorageKeys();
    this._loadInitialData();
  }

  // === パブリックメソッド ===

  /**
   * 高スコアを保存
   * @param {Object} scoreData - スコアデータ
   * @returns {boolean} 保存成功フラグ
   */
  saveHighScore(scoreData) {
    if (!this._isValidScoreData(scoreData)) {
      throw new Error('Invalid score data');
    }

    try {
      const scores = this._getHighScores();
      scores.push(scoreData);

      // スコア順でソート（降順）
      scores.sort((a, b) => b.score - a.score);

      // 最大保存数を制限（上位10件）
      const maxScores = 10;
      if (scores.length > maxScores) {
        scores.splice(maxScores);
      }

      this._saveHighScores(scores);
      return true;
    } catch (error) {
      this._handleError('saveHighScore', error);
      return false;
    }
  }

  /**
   * 最高スコアを取得
   * @returns {Object|null} 最高スコアデータ
   */
  getHighScore() {
    const scores = this._getHighScores();
    return scores.length > 0 ? scores[0] : null;
  }

  /**
   * 上位スコアを取得
   * @param {number} limit - 取得件数
   * @returns {Array} 上位スコア配列
   */
  getTopScores(limit = 5) {
    const scores = this._getHighScores();
    return scores.slice(0, Math.min(limit, scores.length));
  }

  /**
   * ゲーム設定を保存
   * @param {Object} config - ゲーム設定
   * @returns {boolean} 保存成功フラグ
   */
  saveGameConfig(config) {
    if (!this._isValidGameConfig(config)) {
      throw new Error('Invalid config data');
    }

    try {
      const currentConfig = this._getGameConfig();
      const mergedConfig = { ...currentConfig, ...config };

      this._saveGameConfig(mergedConfig);
      return true;
    } catch (error) {
      this._handleError('saveGameConfig', error);
      return false;
    }
  }

  /**
   * ゲーム設定を部分更新
   * @param {Object} updates - 更新設定
   * @returns {boolean} 更新成功フラグ
   */
  updateGameConfig(updates) {
    return this.saveGameConfig(updates);
  }

  /**
   * ゲーム設定を取得
   * @returns {Object} ゲーム設定
   */
  getGameConfig() {
    return this._getGameConfig();
  }

  /**
   * 特定の高スコアを削除
   * @param {number} score - 削除対象スコア
   * @returns {boolean} 削除成功フラグ
   */
  removeHighScore(score) {
    try {
      const scores = this._getHighScores();
      const filteredScores = scores.filter(s => s.score !== score);

      if (filteredScores.length !== scores.length) {
        this._saveHighScores(filteredScores);
        return true;
      }
      return false;
    } catch (error) {
      this._handleError('removeHighScore', error);
      return false;
    }
  }

  /**
   * 全データをクリア
   * @returns {boolean} クリア成功フラグ
   */
  clearAllData() {
    try {
      this._clearStorage();
      this._loadInitialData(); // デフォルト値を再読み込み
      return true;
    } catch (error) {
      this._handleError('clearAllData', error);
      return false;
    }
  }

  /**
   * データをエクスポート
   * @returns {Object} エクスポートデータ
   */
  exportData() {
    try {
      return {
        highScores: this._getHighScores(),
        gameConfig: this._getGameConfig(),
        exportDate: new Date().toISOString(),
        version: this._getConfig().version,
      };
    } catch (error) {
      this._handleError('exportData', error);
      return null;
    }
  }

  /**
   * データをインポート
   * @param {Object} data - インポートデータ
   * @returns {boolean} インポート成功フラグ
   */
  importData(data) {
    try {
      if (!this._isValidImportData(data)) {
        throw new Error('Invalid import data');
      }

      if (data.highScores) {
        this._saveHighScores(data.highScores);
      }

      if (data.gameConfig) {
        this._saveGameConfig(data.gameConfig);
      }

      return true;
    } catch (error) {
      this._handleError('importData', error);
      return false;
    }
  }

  /**
   * 設定情報を取得
   * @returns {Object} 設定情報
   */
  getConfig() {
    return this._getConfig();
  }

  /**
   * リソース解放
   */
  destroy() {
    this._cleanup();
    this._resetState();
  }

  // === プライベートメソッド ===

  /**
   * オプション検証
   * @private
   * @param {Object} options - 検証対象オプション
   */
  _validateOptions(options) {
    if (typeof options !== 'object' || options === null) {
      throw new Error('Options must be an object');
    }
  }

  /**
   * 状態初期化
   * @private
   * @param {Object} options - 初期化オプション
   */
  _initializeState(options) {
    this.state = {
      isDestroyed: false,
      ...options,
    };
  }

  /**
   * ストレージキー設定
   * @private
   */
  _setupStorageKeys() {
    this.storageKeys = {
      highScores: 'tetris-high-scores',
      gameConfig: 'tetris-game-config',
      config: 'tetris-config',
    };
  }

  /**
   * 初期データ読み込み
   * @private
   */
  _loadInitialData() {
    // デフォルト設定を保存
    if (!this._hasData(this.storageKeys.config)) {
      this._saveConfig(this._getDefaultConfig());
    }

    // デフォルトゲーム設定を保存
    if (!this._hasData(this.storageKeys.gameConfig)) {
      this._saveGameConfig(this._getDefaultGameConfig());
    }

    // 高スコアは空配列で初期化
    if (!this._hasData(this.storageKeys.highScores)) {
      this._saveHighScores([]);
    }
  }

  /**
   * 高スコアデータ検証
   * @private
   * @param {Object} scoreData - 検証対象スコアデータ
   * @returns {boolean} 有効性
   */
  _isValidScoreData(scoreData) {
    if (!scoreData || typeof scoreData !== 'object') {
      return false;
    }

    const { score, level, lines, timestamp, player } = scoreData;

    return (
      typeof score === 'number' &&
      score > 0 &&
      typeof level === 'number' &&
      level > 0 &&
      typeof lines === 'number' &&
      lines >= 0 &&
      typeof timestamp === 'number' &&
      timestamp > 0 &&
      typeof player === 'string' &&
      player.length > 0
    );
  }

  /**
   * ゲーム設定データ検証
   * @private
   * @param {Object} config - 検証対象設定
   * @returns {boolean} 有効性
   */
  _isValidGameConfig(config) {
    if (!config || typeof config !== 'object') {
      return false;
    }

    const { difficulty, soundEnabled, musicVolume, sfxVolume, keyBindings } = config;

    // 必須項目チェック
    if (difficulty && !['easy', 'normal', 'hard'].includes(difficulty)) {
      return false;
    }

    if (soundEnabled !== undefined && typeof soundEnabled !== 'boolean') {
      return false;
    }

    if (
      musicVolume !== undefined &&
      (typeof musicVolume !== 'number' || musicVolume < 0 || musicVolume > 1)
    ) {
      return false;
    }

    if (
      sfxVolume !== undefined &&
      (typeof sfxVolume !== 'number' || sfxVolume < 0 || sfxVolume > 1)
    ) {
      return false;
    }

    if (keyBindings && typeof keyBindings !== 'object') {
      return false;
    }

    return true;
  }

  /**
   * インポートデータ検証
   * @private
   * @param {Object} data - 検証対象データ
   * @returns {boolean} 有効性
   */
  _isValidImportData(data) {
    if (!data || typeof data !== 'object') {
      return false;
    }

    if (data.highScores && !Array.isArray(data.highScores)) {
      return false;
    }

    if (data.gameConfig && !this._isValidGameConfig(data.gameConfig)) {
      return false;
    }

    return true;
  }

  /**
   * 高スコア取得
   * @private
   * @returns {Array} 高スコア配列
   */
  _getHighScores() {
    try {
      const data = this._getData(this.storageKeys.highScores);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      this._handleError('_getHighScores', error);
      return [];
    }
  }

  /**
   * 高スコア保存
   * @private
   * @param {Array} scores - 保存対象スコア配列
   */
  _saveHighScores(scores) {
    this._setData(this.storageKeys.highScores, scores);
  }

  /**
   * ゲーム設定取得
   * @private
   * @returns {Object} ゲーム設定
   */
  _getGameConfig() {
    try {
      const data = this._getData(this.storageKeys.gameConfig);
      return data || this._getDefaultGameConfig();
    } catch (error) {
      this._handleError('_getGameConfig', error);
      return this._getDefaultGameConfig();
    }
  }

  /**
   * ゲーム設定保存
   * @private
   * @param {Object} config - 保存対象設定
   */
  _saveGameConfig(config) {
    this._setData(this.storageKeys.gameConfig, config);
  }

  /**
   * 設定情報取得
   * @private
   * @returns {Object} 設定情報
   */
  _getConfig() {
    try {
      const data = this._getData(this.storageKeys.config);
      return data || this._getDefaultConfig();
    } catch (error) {
      this._handleError('_getConfig', error);
      return this._getDefaultConfig();
    }
  }

  /**
   * 設定情報保存
   * @private
   * @param {Object} config - 保存対象設定
   */
  _saveConfig(config) {
    this._setData(this.storageKeys.config, config);
  }

  /**
   * デフォルト設定取得
   * @private
   * @returns {Object} デフォルト設定
   */
  _getDefaultConfig() {
    return {
      version: '1.0.0',
      maxHighScores: 10,
      dataRetentionDays: 365,
    };
  }

  /**
   * デフォルトゲーム設定取得
   * @private
   * @returns {Object} デフォルトゲーム設定
   */
  _getDefaultGameConfig() {
    return {
      difficulty: 'normal',
      soundEnabled: true,
      musicVolume: 0.7,
      sfxVolume: 0.8,
      keyBindings: {
        moveLeft: 'ArrowLeft',
        moveRight: 'ArrowRight',
        moveDown: 'ArrowDown',
        rotate: 'ArrowUp',
        hardDrop: 'Space',
      },
    };
  }

  /**
   * データ存在確認
   * @private
   * @param {string} key - ストレージキー
   * @returns {boolean} 存在フラグ
   */
  _hasData(key) {
    try {
      return this._getData(key) !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * データ取得
   * @private
   * @param {string} key - ストレージキー
   * @returns {*} 取得データ
   */
  _getData(key) {
    if (!this._isStorageAvailable()) {
      return null;
    }

    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      this._handleError('_getData', error);
      return null;
    }
  }

  /**
   * データ保存
   * @private
   * @param {string} key - ストレージキー
   * @param {*} value - 保存データ
   */
  _setData(key, value) {
    if (!this._isStorageAvailable()) {
      return;
    }

    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      this._handleError('_setData', error);
    }
  }

  /**
   * ストレージ利用可能性確認
   * @private
   * @returns {boolean} 利用可能フラグ
   */
  _isStorageAvailable() {
    try {
      return typeof localStorage !== 'undefined' && localStorage !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * ストレージクリア
   * @private
   */
  _clearStorage() {
    if (!this._isStorageAvailable()) {
      return;
    }

    try {
      Object.values(this.storageKeys).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      this._handleError('_clearStorage', error);
    }
  }

  /**
   * エラーハンドリング
   * @private
   * @param {string} method - メソッド名
   * @param {Error} error - エラーオブジェクト
   */
  _handleError(method, error) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error(`LocalStorageAdapter.${method} error:`, error);
    }
  }

  /**
   * クリーンアップ処理
   * @private
   */
  _cleanup() {
    // 現在は特別なクリーンアップ処理なし
  }

  /**
   * 状態リセット
   * @private
   */
  _resetState() {
    this.state.isDestroyed = true;
  }
}
