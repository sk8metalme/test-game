/**
 * SpecialRulesEngine - 特殊ルールエンジン
 *
 * フェーズ3: ゲームプレイ拡張とユーザビリティ向上
 *
 * 責任:
 * - T-Spin、Perfect Clear等の特殊ルールの判定
 * - Combo System、Back-to-Back等の連続ボーナス管理
 * - 特殊ルールのスコア計算
 * - ルール発動のイベント通知
 *
 * @author AI Assistant
 * @version 1.0.0
 */

export default class SpecialRulesEngine {
  /**
   * SpecialRulesEngineのコンストラクタ
   *
   * @param {Object} config - 初期設定
   */
  constructor(config = {}) {
    this.config = {
      enableTSpin: config.enableTSpin !== false,
      enablePerfectClear: config.enablePerfectClear !== false,
      enableCombo: config.enableCombo !== false,
      enableBackToBack: config.enableBackToBack !== false,
      enableSoftDropBonus: config.enableSoftDropBonus !== false,
      maxComboCount: config.maxComboCount || 10,
      maxHistorySize: config.maxHistorySize || 100,
      ...config,
    };

    // ルール管理
    this.rules = new Map();

    // アクティブなルール
    this.activeRules = new Set();

    // ルール履歴
    this.ruleHistory = [];

    // コンボ管理
    this.comboCount = 0;
    this.lastClearType = null;
    this.backToBackCount = 0;

    // イベントリスナー
    this.listeners = new Map();

    // 初期化
    this.initialize();
  }

  /**
   * 初期化処理
   */
  initialize() {
    this.registerDefaultRules();
    this.emit('initialized');
  }

  /**
   * デフォルトルールの登録
   */
  registerDefaultRules() {
    // T-Spinルール
    if (this.config.enableTSpin) {
      this.registerRule('tspin', this.checkTSpin.bind(this));
    }

    // Perfect Clearルール
    if (this.config.enablePerfectClear) {
      this.registerRule('perfectclear', this.checkPerfectClear.bind(this));
    }

    // Combo System
    if (this.config.enableCombo) {
      this.registerRule('combo', this.calculateCombo.bind(this));
    }

    // Back-to-Back
    if (this.config.enableBackToBack) {
      this.registerRule('backtoback', this.checkBackToBack.bind(this));
    }

    // Soft Drop Bonus
    if (this.config.enableSoftDropBonus) {
      this.registerRule('softdrop', this.calculateSoftDropBonus.bind(this));
    }
  }

  /**
   * ルールの登録
   *
   * @param {string} name - ルール名
   * @param {Function} ruleFunction - ルール関数
   */
  registerRule(name, ruleFunction) {
    if (this.rules.has(name)) {
      throw new Error(`SpecialRulesEngine: ルール '${name}' は既に登録されています`);
    }

    // ルール関数の検証
    if (typeof ruleFunction !== 'function') {
      throw new Error('SpecialRulesEngine: ルール関数が必要です');
    }

    this.rules.set(name, {
      function: ruleFunction,
      enabled: true,
      priority: this.rules.size,
      lastUsed: null,
      usageCount: 0,
    });

    this.emit('ruleRegistered', { name, ruleFunction });
  }

  /**
   * ルールの有効化
   *
   * @param {string} name - ルール名
   */
  activateRule(name) {
    if (!this.rules.has(name)) {
      throw new Error(`SpecialRulesEngine: ルール '${name}' は登録されていません`);
    }

    const rule = this.rules.get(name);
    rule.enabled = true;
    this.activeRules.add(name);

    this.emit('ruleActivated', { name });
  }

  /**
   * ルールの無効化
   *
   * @param {string} name - ルール名
   */
  deactivateRule(name) {
    if (!this.rules.has(name)) {
      return;
    }

    const rule = this.rules.get(name);
    rule.enabled = false;
    this.activeRules.delete(name);

    this.emit('ruleDeactivated', { name });
  }

  /**
   * T-Spin判定
   *
   * @param {Object} piece - テトロミノピース
   * @param {Object} board - ゲームボード
   * @param {Object} rotationResult - 回転結果
   * @returns {Object} T-Spin判定結果
   */
  checkTSpin(piece, board, rotationResult) {
    if (!this.config.enableTSpin || piece.type !== 'T') {
      return { isTSpin: false, type: null, bonus: 0 };
    }

    // 壁キックの確認
    if (!rotationResult.wallKick || !rotationResult.wallKick.validKick) {
      return { isTSpin: false, type: null, bonus: 0 };
    }

    // 角の位置を取得
    const corners = this.getCornerPositions(piece, board);
    const filledCorners = corners.filter(pos => board.getCell(pos.y, pos.x) !== 0);

    if (filledCorners.length < 2) {
      return { isTSpin: false, type: null, bonus: 0 };
    }

    // T-Spinタイプの判定
    const type = this.determineTSpinType(piece, board);
    const bonus = this.calculateTSpinBonus(type);

    // 履歴に追加
    this.addToHistory('tspin', { type, bonus, position: piece.position });

    // イベント発火
    this.emit('tspinAchieved', { type, bonus, position: piece.position });

    return { isTSpin: true, type, bonus };
  }

  /**
   * T字ピースの角位置を取得
   *
   * @param {Object} piece - T字ピース
   * @param {Object} board - ゲームボード
   * @returns {Array} 角の位置配列
   */
  getCornerPositions(piece, board) {
    const piecePos = piece.position;
    const rotation = piece.rotationState || 0;

    // T字ピースの角の位置を計算
    const corners = [];

    // 回転状態に応じた角の位置を計算
    switch (rotation) {
      case 0: // 上向き
        corners.push(
          { x: piecePos.x - 1, y: piecePos.y - 1 }, // 左上
          { x: piecePos.x + 1, y: piecePos.y - 1 }, // 右上
          { x: piecePos.x - 1, y: piecePos.y + 1 }, // 左下
          { x: piecePos.x + 1, y: piecePos.y + 1 } // 右下
        );
        break;
      case 1: // 右向き
        corners.push(
          { x: piecePos.x - 1, y: piecePos.y - 1 }, // 左上
          { x: piecePos.x + 1, y: piecePos.y - 1 }, // 右上
          { x: piecePos.x - 1, y: piecePos.y + 1 }, // 左下
          { x: piecePos.x + 1, y: piecePos.y + 1 } // 右下
        );
        break;
      case 2: // 下向き
        corners.push(
          { x: piecePos.x - 1, y: piecePos.y - 1 }, // 左上
          { x: piecePos.x + 1, y: piecePos.y - 1 }, // 右上
          { x: piecePos.x - 1, y: piecePos.y + 1 }, // 左下
          { x: piecePos.x + 1, y: piecePos.y + 1 } // 右下
        );
        break;
      case 3: // 左向き
        corners.push(
          { x: piecePos.x - 1, y: piecePos.y - 1 }, // 左上
          { x: piecePos.x + 1, y: piecePos.y - 1 }, // 右上
          { x: piecePos.x - 1, y: piecePos.y + 1 }, // 左下
          { x: piecePos.x + 1, y: piecePos.y + 1 } // 右下
        );
        break;
    }

    // ボード範囲内の角のみを返す
    return corners.filter(
      pos => pos.x >= 0 && pos.x < board.COLS && pos.y >= 0 && pos.y < board.ROWS
    );
  }

  /**
   * T-Spinタイプを判定
   *
   * @param {Object} piece - T字ピース
   * @param {Object} board - ゲームボード
   * @returns {string} T-Spinタイプ
   */
  determineTSpinType() {
    // 実装: T-Spinタイプの判定ロジック
    // 現在は基本的なT-Spinとして扱う
    return 'single';
  }

  /**
   * T-Spinボーナスを計算
   *
   * @param {string} type - T-Spinタイプ
   * @returns {number} ボーナス点数
   */
  calculateTSpinBonus(type) {
    const bonuses = {
      single: 800,
      double: 1200,
      triple: 1600,
    };

    return bonuses[type] || 800;
  }

  /**
   * Perfect Clear判定
   *
   * @param {Object} board - ゲームボード
   * @returns {Object} Perfect Clear判定結果
   */
  checkPerfectClear(board) {
    if (!this.config.enablePerfectClear) {
      return { isPerfectClear: false, bonus: 0 };
    }

    // ボードの全セルをチェック
    for (let row = 0; row < board.ROWS; row++) {
      for (let col = 0; col < board.COLS; col++) {
        if (board.getCell(row, col) !== 0) {
          return { isPerfectClear: false, bonus: 0 };
        }
      }
    }

    const bonus = this.calculatePerfectClearBonus();

    // 履歴に追加
    this.addToHistory('perfectclear', { bonus });

    // イベント発火
    this.emit('perfectClearAchieved', { bonus });

    return { isPerfectClear: true, bonus };
  }

  /**
   * Perfect Clearボーナスを計算
   *
   * @returns {number} ボーナス点数
   */
  calculatePerfectClearBonus() {
    // Perfect Clearのボーナス計算
    // 現在は固定値として実装
    return 2000;
  }

  /**
   * コンボ計算
   *
   * @param {number} linesCleared - 削除されたライン数
   * @returns {Object} コンボ結果
   */
  calculateCombo(linesCleared) {
    if (!this.config.enableCombo) {
      return { combo: 0, bonus: 0, broken: false };
    }

    if (linesCleared === 0) {
      // コンボが途切れた
      const lastCombo = this.comboCount;
      this.comboCount = 0;

      if (lastCombo > 0) {
        this.emit('comboBroken', { lastCount: lastCombo });
      }

      return { combo: 0, bonus: 0, broken: true };
    }

    // コンボ継続
    this.comboCount++;
    const bonus = this.calculateComboBonus(this.comboCount);

    // 履歴に追加
    this.addToHistory('combo', { count: this.comboCount, bonus });

    // イベント発火
    this.emit('comboContinued', { count: this.comboCount, bonus });

    return { combo: this.comboCount, bonus, broken: false };
  }

  /**
   * コンボボーナスを計算
   *
   * @param {number} comboCount - コンボ数
   * @returns {number} ボーナス点数
   */
  calculateComboBonus(comboCount) {
    if (comboCount <= 1) return 0;

    // 指数関数的なボーナス計算
    return Math.pow(2, comboCount - 1) * 50;
  }

  /**
   * Back-to-Back判定
   *
   * @param {string} clearType - クリアタイプ
   * @returns {Object} Back-to-Back結果
   */
  checkBackToBack(clearType) {
    if (!this.config.enableBackToBack) {
      this.lastClearType = clearType;
      return { isBackToBack: false, multiplier: 1.0 };
    }

    const specialTypes = ['tspin', 'perfectclear'];

    if (!specialTypes.includes(clearType)) {
      this.lastClearType = clearType;
      return { isBackToBack: false, multiplier: 1.0 };
    }

    if (this.lastClearType && specialTypes.includes(this.lastClearType)) {
      // Back-to-Back成立
      this.backToBackCount++;
      this.lastClearType = clearType;

      // 履歴に追加
      this.addToHistory('backtoback', { count: this.backToBackCount });

      // イベント発火
      this.emit('backToBackAchieved', { count: this.backToBackCount, multiplier: 1.5 });

      return {
        isBackToBack: true,
        multiplier: 1.5,
        count: this.backToBackCount,
      };
    }

    this.lastClearType = clearType;
    return { isBackToBack: false, multiplier: 1.0 };
  }

  /**
   * ソフトドロップボーナス計算
   *
   * @param {number} dropDistance - ドロップ距離
   * @returns {number} ボーナス点数
   */
  calculateSoftDropBonus(dropDistance) {
    if (!this.config.enableSoftDropBonus || dropDistance <= 0) {
      return 0;
    }

    return dropDistance * 2; // 1マスにつき2点
  }

  /**
   * 特殊スコア計算
   *
   * @param {string} ruleType - ルールタイプ
   * @param {number} baseScore - 基本スコア
   * @param {Object} modifiers - 修飾子
   * @returns {number} 特殊スコア
   */
  calculateSpecialScore(ruleType, baseScore, modifiers = {}) {
    let finalScore = baseScore;

    // Back-to-Back倍率の適用
    if (modifiers.backToBack) {
      finalScore *= modifiers.backToBack;
    }

    // レベル倍率の適用
    if (modifiers.level) {
      finalScore *= modifiers.level + 1;
    }

    return Math.floor(finalScore);
  }

  /**
   * 履歴に追加
   *
   * @param {string} type - 履歴タイプ
   * @param {Object} data - 履歴データ
   */
  addToHistory(type, data) {
    const historyEntry = {
      type,
      data,
      timestamp: Date.now(),
    };

    this.ruleHistory.push(historyEntry);

    // 履歴サイズの制限
    if (this.ruleHistory.length > this.config.maxHistorySize) {
      this.ruleHistory.shift();
    }
  }

  /**
   * ルール統計を取得
   *
   * @returns {Object} ルール統計
   */
  getRuleStats() {
    const stats = {};

    for (const [name, rule] of this.rules) {
      stats[name] = {
        enabled: rule.enabled,
        priority: rule.priority,
        lastUsed: rule.lastUsed,
        usageCount: rule.usageCount,
      };
    }

    return stats;
  }

  /**
   * コンボ履歴を取得
   *
   * @returns {Array} コンボ履歴
   */
  getComboHistory() {
    return this.ruleHistory.filter(entry => entry.type === 'combo');
  }

  /**
   * 全履歴を取得
   *
   * @returns {Array} 全履歴
   */
  getFullHistory() {
    return [...this.ruleHistory];
  }

  /**
   * ルール履歴をクリア
   */
  clearHistory() {
    this.ruleHistory = [];
    this.comboCount = 0;
    this.backToBackCount = 0;
    this.lastClearType = null;

    this.emit('historyCleared');
  }

  /**
   * イベントリスナーの追加
   *
   * @param {string} event - イベント名
   * @param {Function} listener - リスナー関数
   */
  on(event, listener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(listener);
  }

  /**
   * イベントの発生
   *
   * @param {string} event - イベント名
   * @param {*} data - イベントデータ
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          // イベントエラーを無視（開発時のみ）
        }
      });
    }
  }

  /**
   * 特殊ルールエンジンの破棄
   */
  destroy() {
    // 破棄イベントを先に発火
    this.emit('destroyed');

    // イベントリスナーの削除
    this.listeners.clear();

    // ルールの削除
    this.rules.clear();
    this.activeRules.clear();

    // 履歴のクリア
    this.ruleHistory = [];

    // 状態のリセット
    this.comboCount = 0;
    this.backToBackCount = 0;
    this.lastClearType = null;
  }
}
