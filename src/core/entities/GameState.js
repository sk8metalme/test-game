/**
 * @file GameState.js
 * @description ゲーム状態管理エンティティ
 * 
 * 責任:
 * - ゲーム状態の管理（MENU/PLAYING/PAUSED/GAME_OVER）
 * - スコア計算とレベル進行
 * - 統計情報の追跡
 * - 時間管理
 * - イベント通知
 * 
 * アーキテクチャ: エンティティ層（オニオンアーキテクチャ）
 * テスト: tests/unit/entities/GameState.test.js
 */

/**
 * ゲーム状態管理クラス
 * 
 * @class GameState
 * @description テトリスゲームの状態管理を担当するエンティティ
 */
export class GameState {
  /**
   * 有効なゲーム状態の定義
   * @static
   * @readonly
   */
  static VALID_STATUSES = ['MENU', 'PLAYING', 'PAUSED', 'GAME_OVER'];

  /**
   * 有効な状態遷移の定義
   * @static
   * @readonly
   */
  static VALID_TRANSITIONS = {
    'MENU': ['PLAYING'],
    'PLAYING': ['PAUSED', 'GAME_OVER'],
    'PAUSED': ['PLAYING'],
    'GAME_OVER': ['MENU']
  };

  /**
   * スコア計算定数
   * @static
   * @readonly
   */
  static SCORE_VALUES = {
    SINGLE: 40,
    DOUBLE: 100,
    TRIPLE: 300,
    TETRIS: 1200,
    SOFT_DROP: 1,
    HARD_DROP: 2,
    T_SPIN_SINGLE: 800,
    T_SPIN_DOUBLE: 1200,
    T_SPIN_TRIPLE: 1600,
    COMBO_BASE: 50,
    PERFECT_CLEAR: 1000
  };

  /**
   * レベル進行定数
   * @static
   * @readonly
   */
  static LEVEL_CONFIG = {
    LINES_PER_LEVEL: 10,
    MAX_LEVEL: 99,
    MIN_LEVEL: 1
  };

  /**
   * GameState インスタンスを作成
   * 
   * @param {Object} [initialSettings={}] - 初期設定
   * @param {number} [initialSettings.level=1] - 初期レベル
   * @param {number} [initialSettings.score=0] - 初期スコア
   * @param {number} [initialSettings.lines=0] - 初期ライン数
   */
  constructor(initialSettings = {}) {
    // 基本ゲーム状態
    this.status = 'MENU';
    this.score = this._validateNumber(initialSettings.score, 0);
    this.level = this._validateNumber(initialSettings.level, 1, 1, 99);
    this.lines = this._validateNumber(initialSettings.lines, 0);
    this.gameTime = 0;

    // ゲーム進行状態
    this.combo = 0;
    this.isBackToBack = false;

    // タイマー管理
    this._timer = null;
    this._timerStartTime = null;
    this._pausedTime = 0;

    // 統計情報
    this.statistics = {
      totalGames: 0,
      totalScore: 0,
      totalLines: 0,
      totalTime: 0,
      highScore: 0,
      bestLevel: 1,
      pieceUsage: {
        I: 0, O: 0, T: 0, S: 0, Z: 0, J: 0, L: 0
      },
      actionCounts: {
        tSpin: 0,
        perfectClear: 0,
        tetris: 0,
        combo: 0
      },
      averages: {
        score: 0,
        lines: 0,
        time: 0
      }
    };

    // イベントシステム
    this.eventListeners = {};

    // 初期化完了フラグ
    this._initialized = true;
  }

  // =============================================================================
  // 状態管理メソッド
  // =============================================================================

  /**
   * ゲーム状態を設定
   * 
   * @param {string} newStatus - 新しい状態
   * @returns {boolean} 成功した場合true
   */
  setStatus(newStatus) {
    if (!this._initialized) return false;

    // 有効性チェック
    if (!GameState.VALID_STATUSES.includes(newStatus)) {
      return false;
    }

    // 遷移チェック
    const validTransitions = GameState.VALID_TRANSITIONS[this.status];
    if (!validTransitions.includes(newStatus)) {
      return false;
    }

    const oldStatus = this.status;
    this.status = newStatus;

    // 状態変更時の処理
    this._handleStatusChange(oldStatus, newStatus);

    // イベント発行
    this.emit('statusChange', {
      type: 'statusChange',
      oldStatus,
      newStatus
    });

    return true;
  }

  /**
   * ゲーム状態をリセット
   */
  reset() {
    this.status = 'MENU';
    this.score = 0;
    this.level = 1;
    this.lines = 0;
    this.gameTime = 0;
    this.combo = 0;
    this.isBackToBack = false;
    this._pausedTime = 0;
    
    this.stopTimer();
  }

  /**
   * 状態変更時の内部処理
   * 
   * @private
   * @param {string} oldStatus - 前の状態
   * @param {string} newStatus - 新しい状態
   */
  _handleStatusChange(oldStatus, newStatus) {
    switch (newStatus) {
      case 'PLAYING':
        if (oldStatus === 'MENU') {
          this.startTimer();
        } else if (oldStatus === 'PAUSED') {
          this._resumeTimer();
        }
        break;
      case 'PAUSED':
        this._pauseTimer();
        break;
      case 'GAME_OVER':
        this.stopTimer();
        this._recordGameEnd();
        break;
    }
  }

  // =============================================================================
  // スコア管理メソッド
  // =============================================================================

  /**
   * スコアを更新（加算）
   * 
   * @param {number} points - 追加するポイント
   * @returns {boolean} 成功した場合true
   */
  updateScore(points) {
    if (!this._validateNumber(points) || points < 0) {
      return false;
    }

    this.score += points;
    return true;
  }

  /**
   * ライン削除スコアを追加
   * 
   * @param {number} lineCount - 削除したライン数（1-4）
   * @returns {number} 追加されたスコア
   */
  addLineScore(lineCount) {
    if (lineCount < 1 || lineCount > 4) return 0;

    let baseScore = 0;
    let actionType = '';

    switch (lineCount) {
      case 1:
        baseScore = GameState.SCORE_VALUES.SINGLE;
        actionType = 'single';
        break;
      case 2:
        baseScore = GameState.SCORE_VALUES.DOUBLE;
        actionType = 'double';
        break;
      case 3:
        baseScore = GameState.SCORE_VALUES.TRIPLE;
        actionType = 'triple';
        break;
      case 4:
        baseScore = GameState.SCORE_VALUES.TETRIS;
        actionType = 'tetris';
        this.incrementActionCount('tetris');
        break;
    }

    const levelMultiplier = this.level;
    const totalScore = baseScore * levelMultiplier;

    this.updateScore(totalScore);
    this._updateCombo(lineCount);

    this.emit('lineScore', {
      type: 'lineScore',
      lineCount,
      actionType,
      baseScore,
      levelMultiplier,
      totalScore
    });

    return totalScore;
  }

  /**
   * ソフトドロップスコアを追加
   * 
   * @param {number} dropDistance - ドロップした距離
   * @returns {number} 追加されたスコア
   */
  addSoftDropScore(dropDistance) {
    if (!this._validateNumber(dropDistance) || dropDistance <= 0) return 0;

    const score = dropDistance * GameState.SCORE_VALUES.SOFT_DROP;
    this.updateScore(score);
    return score;
  }

  /**
   * ハードドロップスコアを追加
   * 
   * @param {number} dropDistance - ドロップした距離
   * @returns {number} 追加されたスコア
   */
  addHardDropScore(dropDistance) {
    if (!this._validateNumber(dropDistance) || dropDistance <= 0) return 0;

    const score = dropDistance * GameState.SCORE_VALUES.HARD_DROP;
    this.updateScore(score);
    return score;
  }

  /**
   * コンボスコアを追加
   * 
   * @param {number} comboCount - コンボ数
   * @returns {number} 追加されたスコア
   */
  addComboScore(comboCount) {
    if (!this._validateNumber(comboCount) || comboCount <= 0) return 0;

    const score = GameState.SCORE_VALUES.COMBO_BASE * this.level * comboCount;
    this.updateScore(score);
    this.incrementActionCount('combo');
    return score;
  }

  /**
   * Tスピンスコアを追加
   * 
   * @param {number} lineCount - 削除したライン数
   * @param {boolean} isTSpin - Tスピンかどうか
   * @returns {number} 追加されたスコア
   */
  addTSpinScore(lineCount, isTSpin) {
    if (!isTSpin || lineCount < 0 || lineCount > 3) return 0;

    let baseScore = 0;
    switch (lineCount) {
      case 1:
        baseScore = GameState.SCORE_VALUES.T_SPIN_SINGLE;
        break;
      case 2:
        baseScore = GameState.SCORE_VALUES.T_SPIN_DOUBLE;
        break;
      case 3:
        baseScore = GameState.SCORE_VALUES.T_SPIN_TRIPLE;
        break;
      default:
        return 0;
    }

    const totalScore = baseScore * this.level;
    this.updateScore(totalScore);
    this.incrementActionCount('tSpin');

    this.emit('tSpinScore', {
      type: 'tSpinScore',
      lineCount,
      baseScore,
      levelMultiplier: this.level,
      totalScore
    });

    return totalScore;
  }

  /**
   * パーフェクトクリアボーナスを追加
   * 
   * @param {number} lineCount - 削除したライン数
   * @returns {number} 追加されたスコア
   */
  addPerfectClearBonus(lineCount) {
    if (!this._validateNumber(lineCount) || lineCount <= 0) return 0;

    const bonus = GameState.SCORE_VALUES.PERFECT_CLEAR * this.level;
    this.updateScore(bonus);
    this.incrementActionCount('perfectClear');

    this.emit('perfectClear', {
      type: 'perfectClear',
      lineCount,
      bonus
    });

    return bonus;
  }

  /**
   * コンボを更新
   * 
   * @private
   * @param {number} lineCount - 削除したライン数
   */
  _updateCombo(lineCount) {
    if (lineCount > 0) {
      this.combo += 1;
      if (this.combo > 1) {
        this.addComboScore(this.combo - 1);
      }
    } else {
      this.combo = 0;
    }
  }

  // =============================================================================
  // レベル管理メソッド
  // =============================================================================

  /**
   * レベルを設定
   * 
   * @param {number} newLevel - 新しいレベル
   * @returns {boolean} 成功した場合true
   */
  setLevel(newLevel) {
    if (!this._validateNumber(newLevel)) return false;

    if (newLevel < GameState.LEVEL_CONFIG.MIN_LEVEL || 
        newLevel > GameState.LEVEL_CONFIG.MAX_LEVEL) {
      return false;
    }

    this.level = newLevel;
    return true;
  }

  /**
   * ライン数を更新してレベルを自動調整
   * 
   * @param {number} lineCount - 追加するライン数
   */
  updateLines(lineCount) {
    if (!this._validateNumber(lineCount) || lineCount < 0) return;

    const oldLevel = this.level;
    this.lines += lineCount;

    // レベル計算（1 + 削除ライン数 / 10）
    const newLevel = Math.min(
      Math.floor(this.lines / GameState.LEVEL_CONFIG.LINES_PER_LEVEL) + 1,
      GameState.LEVEL_CONFIG.MAX_LEVEL
    );

    if (newLevel > oldLevel) {
      this.level = newLevel;
      this.emit('levelUp', {
        type: 'levelUp',
        oldLevel,
        newLevel,
        totalLines: this.lines
      });
    }
  }

  /**
   * 現在のレベルに基づく落下間隔を取得
   * 
   * @returns {number} 落下間隔（ミリ秒）
   */
  getDropInterval() {
    // レベルに基づく落下速度の計算
    // フレームレート: 60FPS (16.67ms/frame)
    const baseFrames = Math.max(
      1, // 最低1フレーム
      Math.floor(48 - (this.level - 1) * 3)
    );
    
    return Math.max(16.67, baseFrames * 16.67); // 最低1フレーム間隔
  }

  // =============================================================================
  // 時間管理メソッド
  // =============================================================================

  /**
   * ゲーム時間を更新（手動）
   * 
   * @param {number} deltaTime - 追加する時間（ミリ秒）
   */
  updateGameTime(deltaTime) {
    if (!this._validateNumber(deltaTime) || deltaTime < 0) return;

    this.gameTime += deltaTime;
  }

  /**
   * タイマーを開始
   */
  startTimer() {
    if (this._timer) {
      this.stopTimer();
    }

    this._timerStartTime = Date.now();
    this._timer = setInterval(() => {
      if (this.status === 'PLAYING') {
        this.gameTime = Date.now() - this._timerStartTime - this._pausedTime;
      }
    }, 100); // 100ms間隔で更新
  }

  /**
   * タイマーを停止
   */
  stopTimer() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
    this._timerStartTime = null;
    this._pausedTime = 0;
  }

  /**
   * タイマーを一時停止
   * 
   * @private
   */
  _pauseTimer() {
    if (this._timer && this._timerStartTime) {
      this.gameTime = Date.now() - this._timerStartTime - this._pausedTime;
    }
  }

  /**
   * タイマーを再開
   * 
   * @private
   */
  _resumeTimer() {
    if (this._timer && this._timerStartTime) {
      const pauseDuration = Date.now() - this._timerStartTime - this.gameTime;
      this._pausedTime += pauseDuration;
    }
  }

  /**
   * タイマーが動作中かどうかを確認
   * 
   * @returns {boolean} 動作中の場合true
   */
  isTimerRunning() {
    return this._timer !== null;
  }

  /**
   * フォーマットされた時間文字列を取得
   * 
   * @returns {string} MM:SS または H:MM:SS 形式の時間文字列
   */
  getFormattedTime() {
    const totalSeconds = Math.floor(this.gameTime / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    } else {
      return `${minutes}:${String(seconds).padStart(2, '0')}`;
    }
  }

  // =============================================================================
  // 統計管理メソッド
  // =============================================================================

  /**
   * 統計情報を更新
   * 
   * @param {Object} stats - 統計データ
   * @param {number} [stats.gamesPlayed] - プレイ回数
   * @param {number} [stats.score] - スコア
   * @param {number} [stats.lines] - ライン数
   * @param {number} [stats.gameTime] - プレイ時間
   */
  updateStatistics(stats) {
    if (typeof stats !== 'object' || stats === null) return;

    if (this._validateNumber(stats.gamesPlayed)) {
      this.statistics.totalGames += stats.gamesPlayed;
    }

    if (this._validateNumber(stats.score)) {
      this.statistics.totalScore += stats.score;
      if (stats.score > this.statistics.highScore) {
        this.statistics.highScore = stats.score;
      }
    }

    if (this._validateNumber(stats.lines)) {
      this.statistics.totalLines += stats.lines;
    }

    if (this._validateNumber(stats.gameTime)) {
      this.statistics.totalTime += stats.gameTime;
    }

    // レベル記録
    if (this.level > this.statistics.bestLevel) {
      this.statistics.bestLevel = this.level;
    }

    // 平均値更新
    this._updateAverages();
  }

  /**
   * ピース使用回数をインクリメント
   * 
   * @param {string} pieceType - ピースタイプ（I, O, T, S, Z, J, L）
   */
  incrementPieceUsage(pieceType) {
    if (this.statistics.pieceUsage.hasOwnProperty(pieceType)) {
      this.statistics.pieceUsage[pieceType]++;
    }
  }

  /**
   * アクション回数をインクリメント
   * 
   * @param {string} actionType - アクションタイプ
   */
  incrementActionCount(actionType) {
    if (this.statistics.actionCounts.hasOwnProperty(actionType)) {
      this.statistics.actionCounts[actionType]++;
    }
  }

  /**
   * 平均スコアを取得
   * 
   * @returns {number} 平均スコア
   */
  getAverageScore() {
    return this.statistics.totalGames > 0 ? 
      Math.round(this.statistics.totalScore / this.statistics.totalGames) : 0;
  }

  /**
   * 平均ライン数を取得
   * 
   * @returns {number} 平均ライン数
   */
  getAverageLines() {
    return this.statistics.totalGames > 0 ? 
      Math.round(this.statistics.totalLines / this.statistics.totalGames) : 0;
  }

  /**
   * 平均プレイ時間を取得
   * 
   * @returns {number} 平均プレイ時間（ミリ秒）
   */
  getAverageTime() {
    return this.statistics.totalGames > 0 ? 
      Math.round(this.statistics.totalTime / this.statistics.totalGames) : 0;
  }

  /**
   * 平均値を更新
   * 
   * @private
   */
  _updateAverages() {
    this.statistics.averages.score = this.getAverageScore();
    this.statistics.averages.lines = this.getAverageLines();
    this.statistics.averages.time = this.getAverageTime();
  }

  /**
   * ゲーム終了時の統計記録
   * 
   * @private
   */
  _recordGameEnd() {
    this.updateStatistics({
      gamesPlayed: 1,
      score: this.score,
      lines: this.lines,
      gameTime: this.gameTime
    });

    this.emit('gameEnd', {
      type: 'gameEnd',
      finalScore: this.score,
      finalLevel: this.level,
      finalLines: this.lines,
      finalTime: this.gameTime
    });
  }

  // =============================================================================
  // イベントシステム
  // =============================================================================

  /**
   * イベントリスナーを追加
   * 
   * @param {string} eventType - イベントタイプ
   * @param {Function} listener - リスナー関数
   */
  addEventListener(eventType, listener) {
    if (typeof listener !== 'function') return;

    if (!this.eventListeners[eventType]) {
      this.eventListeners[eventType] = [];
    }

    this.eventListeners[eventType].push(listener);
  }

  /**
   * イベントリスナーを削除
   * 
   * @param {string} eventType - イベントタイプ
   * @param {Function} listener - リスナー関数
   */
  removeEventListener(eventType, listener) {
    if (!this.eventListeners[eventType]) return;

    const index = this.eventListeners[eventType].indexOf(listener);
    if (index > -1) {
      this.eventListeners[eventType].splice(index, 1);
    }
  }

  /**
   * イベントを発行
   * 
   * @param {string} eventType - イベントタイプ
   * @param {Object} eventData - イベントデータ
   */
  emit(eventType, eventData) {
    if (!this.eventListeners[eventType]) return;

    this.eventListeners[eventType].forEach(listener => {
      try {
        listener(eventData);
      } catch (error) {
        console.warn(`Event listener error for ${eventType}:`, error);
      }
    });
  }

  // =============================================================================
  // 永続化メソッド
  // =============================================================================

  /**
   * ゲーム状態をシリアライズ
   * 
   * @returns {Object} シリアライズされた状態
   */
  serialize() {
    return {
      status: this.status,
      score: this.score,
      level: this.level,
      lines: this.lines,
      gameTime: this.gameTime,
      statistics: JSON.parse(JSON.stringify(this.statistics))
    };
  }

  /**
   * シリアライズされた状態から復元
   * 
   * @param {Object} data - 復元するデータ
   * @returns {boolean} 成功した場合true
   */
  deserialize(data) {
    if (typeof data !== 'object' || data === null) return false;

    // バリデーション付きで復元
    const validStatus = GameState.VALID_STATUSES.includes(data.status) ? 
      data.status : 'MENU';
    const validScore = this._validateNumber(data.score, 0, 0);
    const validLevel = this._validateNumber(data.level, 1, 1, 99);
    const validLines = this._validateNumber(data.lines, 0, 0);
    const validTime = this._validateNumber(data.gameTime, 0, 0);

    this.status = validStatus;
    this.score = validScore;
    this.level = validLevel;
    this.lines = validLines;
    this.gameTime = validTime;

    // 統計情報の復元
    if (data.statistics && typeof data.statistics === 'object') {
      Object.assign(this.statistics, data.statistics);
    }

    return true;
  }

  // =============================================================================
  // エラーハンドリング・メンテナンス
  // =============================================================================

  /**
   * 状態を検証して修復
   * 
   * @returns {boolean} 修復が必要だった場合true
   */
  validateAndRecover() {
    let recovered = false;

    // 基本プロパティの検証・修復
    if (!this._validateNumber(this.score)) {
      this.score = 0;
      recovered = true;
    }

    if (!this._validateNumber(this.level) || 
        this.level < 1 || this.level > 99) {
      this.level = 1;
      recovered = true;
    }

    if (!this._validateNumber(this.lines)) {
      this.lines = 0;
      recovered = true;
    }

    if (!this._validateNumber(this.gameTime)) {
      this.gameTime = 0;
      recovered = true;
    }

    if (!GameState.VALID_STATUSES.includes(this.status)) {
      this.status = 'MENU';
      recovered = true;
    }

    return recovered;
  }

  /**
   * リソースのクリーンアップ
   */
  cleanup() {
    this.stopTimer();
    this.eventListeners = {};
  }

  // =============================================================================
  // ユーティリティメソッド
  // =============================================================================

  /**
   * 数値の妥当性を検証
   * 
   * @private
   * @param {any} value - 検証する値
   * @param {number} [defaultValue=0] - デフォルト値
   * @param {number} [min] - 最小値
   * @param {number} [max] - 最大値
   * @returns {number|boolean} 有効な数値または妥当性（boolean）
   */
  _validateNumber(value, defaultValue = null, min = null, max = null) {
    const isValid = typeof value === 'number' && 
                   !isNaN(value) && 
                   isFinite(value);

    if (defaultValue !== null) {
      if (!isValid) return defaultValue;
      if (min !== null && value < min) return defaultValue;
      if (max !== null && value > max) return defaultValue;
      return value;
    }

    return isValid;
  }
}
