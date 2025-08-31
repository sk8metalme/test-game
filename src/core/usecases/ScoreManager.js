/**
 * ScoreManager.js - スコア計算とレベル管理システム
 *
 * オニオンアーキテクチャ: Application Layer (Use Cases)
 *
 * 責任:
 * - 各種スコア計算（ライン削除、ドロップ、コンボ、T-Spin等）
 * - レベル進行システムの管理
 * - 落下速度の計算
 * - スコア履歴と統計の管理
 *
 * @tdd-development-expert との協力実装
 */

export default class ScoreManager {
  /**
   * @param {GameState} gameState - ゲーム状態エンティティ
   */
  constructor(gameState) {
    this.gameState = gameState;

    // スコア倍率テーブル
    this.scoreMultipliers = {
      single: 100,
      double: 300,
      triple: 500,
      tetris: 800,
      // T-Spin スコア
      tSpinMini: 100,
      tSpinSingle: 800,
      tSpinDouble: 1200,
      tSpinTriple: 1600,
      // ドロップスコア
      softDrop: 1, // 1セル = 1ポイント
      hardDrop: 2, // 1セル = 2ポイント
    };

    // コンボテーブル
    this.comboMultipliers = [
      0, // コンボ0
      50, // コンボ1
      50, // コンボ2
      100, // コンボ3
      100, // コンボ4
      100, // コンボ5
      150, // コンボ6
      150, // コンボ7
      150, // コンボ8
      200, // コンボ9
      200, // コンボ10
      200, // コンボ11以上
    ];

    // レベル進行設定
    this.levelSettings = {
      linesPerLevel: 10, // レベルアップに必要なライン数
      maxLevel: 99, // 最大レベル
      baseDropSpeed: 1000, // ベース落下速度（ms）
    };

    // スコア履歴
    this.scoreHistory = [];
    this.levelHistory = [];
  }

  /**
   * スコア倍率テーブルを取得
   * @returns {Object} スコア倍率テーブル
   */
  getScoreMultipliers() {
    return { ...this.scoreMultipliers };
  }

  /**
   * ライン削除スコアを計算
   * @param {number} linesCleared - 削除されたライン数
   * @returns {Object} スコア計算結果
   */
  calculateLineScore(linesCleared) {
    // 入力値検証
    if (!this._isValidNumber(linesCleared) || linesCleared < 0 || linesCleared > 4) {
      return this._createScoreResult(0, 'none');
    }

    let baseScore = 0;
    let lineType = 'none';

    switch (linesCleared) {
      case 1:
        baseScore = this.scoreMultipliers.single;
        lineType = 'single';
        break;
      case 2:
        baseScore = this.scoreMultipliers.double;
        lineType = 'double';
        break;
      case 3:
        baseScore = this.scoreMultipliers.triple;
        lineType = 'triple';
        break;
      case 4:
        baseScore = this.scoreMultipliers.tetris;
        lineType = 'tetris';
        break;
      default:
        baseScore = 0;
        lineType = 'none';
    }

    const levelMultiplier = this.gameState.level;
    const totalScore = baseScore * levelMultiplier;

    return {
      baseScore,
      levelMultiplier,
      totalScore,
      lineType,
      linesCleared,
    };
  }

  /**
   * ソフトドロップスコアを計算
   * @param {number} distance - 落下距離（セル数）
   * @returns {Object} スコア計算結果
   */
  calculateSoftDropScore(distance) {
    if (!this._isValidNumber(distance) || distance < 0) {
      return this._createDropScoreResult(0, 'soft');
    }

    const baseScore = distance * this.scoreMultipliers.softDrop;

    return {
      baseScore,
      totalScore: baseScore,
      dropType: 'soft',
      distance,
    };
  }

  /**
   * ハードドロップスコアを計算
   * @param {number} distance - 落下距離（セル数）
   * @returns {Object} スコア計算結果
   */
  calculateHardDropScore(distance) {
    if (!this._isValidNumber(distance) || distance < 0) {
      return this._createDropScoreResult(0, 'hard');
    }

    const baseScore = Math.min(
      distance * this.scoreMultipliers.hardDrop,
      Number.MAX_SAFE_INTEGER / 2
    );

    return {
      baseScore,
      totalScore: baseScore,
      dropType: 'hard',
      distance,
    };
  }

  /**
   * コンボスコアを計算
   * @param {number} comboLevel - コンボレベル
   * @returns {Object} コンボスコア計算結果
   */
  calculateComboScore(comboLevel) {
    if (!this._isValidNumber(comboLevel) || comboLevel < 0) {
      return this._createComboResult(0, 0);
    }

    if (comboLevel === 0) {
      return this._createComboResult(0, 0);
    }

    // コンボテーブルから基本スコアを取得
    const tableIndex = Math.min(comboLevel, this.comboMultipliers.length - 1);
    const bonusScore = this.comboMultipliers[tableIndex];

    // レベル倍率適用
    const levelMultiplier = this.gameState.level;
    const totalScore = bonusScore * levelMultiplier;

    return {
      comboLevel,
      bonusScore,
      levelMultiplier,
      totalScore,
    };
  }

  /**
   * T-Spinスコアを計算
   * @param {number} linesCleared - 削除されたライン数
   * @param {boolean} isMini - T-Spin Miniかどうか
   * @returns {Object} T-Spinスコア計算結果
   */
  calculateTSpinScore(linesCleared, isMini = false) {
    if (!this._isValidNumber(linesCleared) || linesCleared < 0) {
      return this._createTSpinResult(0, 'none', 0);
    }

    if (linesCleared === 0) {
      return this._createTSpinResult(0, 'none', 0);
    }

    let baseScore = 0;
    let tSpinType = 'none';

    if (isMini && linesCleared === 1) {
      baseScore = this.scoreMultipliers.tSpinMini;
      tSpinType = 'mini';
    } else {
      switch (linesCleared) {
        case 1:
          baseScore = this.scoreMultipliers.tSpinSingle;
          tSpinType = 'single';
          break;
        case 2:
          baseScore = this.scoreMultipliers.tSpinDouble;
          tSpinType = 'double';
          break;
        case 3:
          baseScore = this.scoreMultipliers.tSpinTriple;
          tSpinType = 'triple';
          break;
        default:
          baseScore = 0;
          tSpinType = 'none';
      }
    }

    const levelMultiplier = this.gameState.level;
    const totalScore = baseScore * levelMultiplier;

    return {
      baseScore,
      levelMultiplier,
      totalScore,
      tSpinType,
      linesCleared,
      isMini,
    };
  }

  /**
   * パーフェクトクリアボーナスを計算
   * @param {number} linesCleared - 削除されたライン数
   * @returns {Object} パーフェクトクリアボーナス計算結果
   */
  calculatePerfectClearBonus(linesCleared) {
    if (!this._isValidNumber(linesCleared) || linesCleared < 1) {
      return this._createPerfectClearResult(0, 0);
    }

    // パーフェクトクリア倍率（ライン数に応じて）
    const multipliers = {
      1: 800, // シングルPC
      2: 1200, // ダブルPC
      3: 1800, // トリプルPC
      4: 2000, // テトリスPC
    };

    const multiplier = multipliers[linesCleared] || 1000; // デフォルト値
    const bonusScore = multiplier * this.gameState.level;

    return {
      bonusType: 'perfect_clear',
      bonusScore,
      multiplier,
      linesCleared,
      levelMultiplier: this.gameState.level,
    };
  }

  /**
   * 総合スコアを計算
   * @param {Object} scoreData - 各種スコアデータ
   * @returns {Object} 総合スコア計算結果
   */
  calculateTotalScore(scoreData) {
    const breakdown = {
      lines: this._getScoreValue(scoreData.lineScore),
      softDrop: this._getScoreValue(scoreData.softDropScore),
      hardDrop: this._getScoreValue(scoreData.hardDropScore),
      combo: this._getScoreValue(scoreData.comboScore),
      tSpin: this._getScoreValue(scoreData.tSpinScore),
      perfectClear: this._getBonusValue(scoreData.perfectClearBonus),
    };

    const totalScore = Object.values(breakdown).reduce((sum, score) => sum + score, 0);

    return {
      totalScore,
      breakdown,
    };
  }

  /**
   * 現在のレベルを取得
   * @returns {number} 現在のレベル
   */
  getCurrentLevel() {
    return this.gameState.level;
  }

  /**
   * レベルアップをチェック
   * @param {number} totalLines - 総削除ライン数
   * @returns {Object} レベルアップ結果
   */
  checkLevelUp(totalLines) {
    if (!this._isValidNumber(totalLines) || totalLines < 0) {
      return this._createLevelUpResult(false, this.gameState.level, 0);
    }

    const currentLevel = this.gameState.level;
    const newLevel = Math.min(
      Math.floor(totalLines / this.levelSettings.linesPerLevel) + 1,
      this.levelSettings.maxLevel
    );

    const levelUp = newLevel > currentLevel;
    const linesForNext =
      this.levelSettings.linesPerLevel - (totalLines % this.levelSettings.linesPerLevel);

    if (levelUp) {
      this.recordLevelUp(currentLevel, newLevel, totalLines);
    }

    return {
      levelUp,
      currentLevel,
      newLevel,
      linesForNext: linesForNext,
      totalLines,
    };
  }

  /**
   * レベル倍率を取得
   * @param {number} level - レベル
   * @returns {number} レベル倍率
   */
  getLevelMultiplier(level) {
    if (!this._isValidNumber(level) || level < 1) {
      return 1;
    }
    return Math.min(level, this.levelSettings.maxLevel);
  }

  /**
   * 最大レベルを取得
   * @returns {number} 最大レベル
   */
  getMaxLevel() {
    return this.levelSettings.maxLevel;
  }

  /**
   * 落下速度を計算
   * @param {number} level - レベル
   * @returns {number} 落下間隔（ms）
   */
  calculateDropSpeed(level) {
    if (!this._isValidNumber(level) || level < 1) {
      return this.levelSettings.baseDropSpeed;
    }

    // レベルに応じて指数的に速くなる
    const adjustedLevel = Math.min(level, this.levelSettings.maxLevel);
    const speed = this.levelSettings.baseDropSpeed * Math.pow(0.8, adjustedLevel - 1);

    // 最小速度は50ms
    return Math.max(speed, 50);
  }

  /**
   * スコアを記録
   * @param {string} type - スコアタイプ
   * @param {number} score - スコア値
   * @param {Object} metadata - メタデータ
   */
  recordScore(type, score, metadata = {}) {
    this.scoreHistory.push({
      type,
      score,
      metadata,
      timestamp: Date.now(),
      level: this.gameState.level,
    });

    // 履歴サイズ制限（最新1000件）
    if (this.scoreHistory.length > 1000) {
      this.scoreHistory = this.scoreHistory.slice(-1000);
    }
  }

  /**
   * レベルアップを記録
   * @param {number} fromLevel - 変更前レベル
   * @param {number} toLevel - 変更後レベル
   * @param {number} totalLines - 総ライン数
   */
  recordLevelUp(fromLevel, toLevel, totalLines) {
    this.levelHistory.push({
      fromLevel,
      toLevel,
      totalLines,
      timestamp: Date.now(),
    });

    // 履歴サイズ制限（最新100件）
    if (this.levelHistory.length > 100) {
      this.levelHistory = this.levelHistory.slice(-100);
    }
  }

  /**
   * スコア履歴を取得
   * @returns {Array} スコア履歴
   */
  getScoreHistory() {
    return [...this.scoreHistory];
  }

  /**
   * レベル履歴を取得
   * @returns {Array} レベル履歴
   */
  getLevelHistory() {
    return [...this.levelHistory];
  }

  /**
   * 効率性指標を計算
   * @returns {Object} 効率性指標
   */
  calculateEfficiency() {
    if (this.scoreHistory.length === 0) {
      return {
        averageScorePerLine: 0,
        tetrisRatio: 0,
        scorePerMinute: 0,
      };
    }

    const lineScores = this.scoreHistory.filter(entry => entry.type === 'line');
    const totalLineScore = lineScores.reduce((sum, entry) => sum + entry.score, 0);
    const totalLines = lineScores.reduce(
      (sum, entry) => sum + (entry.metadata.linesCleared || 0),
      0
    );

    const tetrisCount = lineScores.filter(entry => entry.metadata.type === 'tetris').length;
    const tetrisRatio = lineScores.length > 0 ? tetrisCount / lineScores.length : 0;

    const timespan =
      this.scoreHistory.length > 1
        ? this.scoreHistory[this.scoreHistory.length - 1].timestamp - this.scoreHistory[0].timestamp
        : 1;
    const totalScore = this.scoreHistory.reduce((sum, entry) => sum + entry.score, 0);
    const scorePerMinute = (totalScore / timespan) * 60000; // ms to minutes

    return {
      averageScorePerLine: totalLines > 0 ? totalLineScore / totalLines : 0,
      tetrisRatio,
      scorePerMinute: Math.max(scorePerMinute, 0),
    };
  }

  // === プライベートメソッド ===

  /**
   * 有効な数値かチェック
   * @private
   * @param {*} value - チェックする値
   * @returns {boolean}
   */
  _isValidNumber(value) {
    return typeof value === 'number' && !isNaN(value) && isFinite(value);
  }

  /**
   * スコア結果オブジェクトを作成
   * @private
   * @param {number} score - スコア
   * @param {string} type - タイプ
   * @returns {Object}
   */
  _createScoreResult(score, type) {
    return {
      baseScore: score,
      levelMultiplier: this.gameState.level,
      totalScore: score * this.gameState.level,
      lineType: type,
      linesCleared: 0,
    };
  }

  /**
   * ドロップスコア結果オブジェクトを作成
   * @private
   * @param {number} score - スコア
   * @param {string} type - タイプ
   * @returns {Object}
   */
  _createDropScoreResult(score, type) {
    return {
      baseScore: score,
      totalScore: score,
      dropType: type,
      distance: 0,
    };
  }

  /**
   * コンボ結果オブジェクトを作成
   * @private
   * @param {number} bonus - ボーナススコア
   * @param {number} combo - コンボレベル
   * @returns {Object}
   */
  _createComboResult(bonus, combo) {
    return {
      comboLevel: combo,
      bonusScore: bonus,
      levelMultiplier: this.gameState.level,
      totalScore: bonus * this.gameState.level,
    };
  }

  /**
   * T-Spin結果オブジェクトを作成
   * @private
   * @param {number} score - スコア
   * @param {string} type - T-Spinタイプ
   * @param {number} lines - ライン数
   * @returns {Object}
   */
  _createTSpinResult(score, type, lines) {
    return {
      baseScore: score,
      levelMultiplier: this.gameState.level,
      totalScore: score * this.gameState.level,
      tSpinType: type,
      linesCleared: lines,
      isMini: false,
    };
  }

  /**
   * パーフェクトクリア結果オブジェクトを作成
   * @private
   * @param {number} bonus - ボーナススコア
   * @param {number} lines - ライン数
   * @returns {Object}
   */
  _createPerfectClearResult(bonus, lines) {
    return {
      bonusType: 'perfect_clear',
      bonusScore: bonus,
      multiplier: 0,
      linesCleared: lines,
      levelMultiplier: this.gameState.level,
    };
  }

  /**
   * レベルアップ結果オブジェクトを作成
   * @private
   * @param {boolean} levelUp - レベルアップしたか
   * @param {number} level - レベル
   * @param {number} lines - 次まで必要なライン数
   * @returns {Object}
   */
  _createLevelUpResult(levelUp, level, lines) {
    return {
      levelUp,
      currentLevel: level,
      newLevel: level,
      linesForNext: lines,
      totalLines: 0,
    };
  }

  /**
   * スコア値を取得（安全）
   * @private
   * @param {Object} scoreObj - スコアオブジェクト
   * @returns {number}
   */
  _getScoreValue(scoreObj) {
    return scoreObj?.totalScore || 0;
  }

  /**
   * ボーナス値を取得（安全）
   * @private
   * @param {Object} bonusObj - ボーナスオブジェクト
   * @returns {number}
   */
  _getBonusValue(bonusObj) {
    return bonusObj?.bonusScore || 0;
  }
}
