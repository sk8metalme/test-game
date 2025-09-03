/**
 * GameLogic.js - コアゲームロジック実装
 *
 * オニオンアーキテクチャ: Application Layer (Use Cases)
 *
 * 責任:
 * - ゲームの主要な業務ロジック管理
 * - ピース移動・回転・固定の統制
 * - ライン削除ロジックの実行
 * - ゲーム状態遷移の管理
 * - スコア計算の連携
 *
 * @tdd-development-expert との協力実装
 */

import Tetromino from '../entities/Tetromino.js';
import GameEventEmitter from './GameEventEmitter.js';

export default class GameLogic {
  /**
   * @param {Board} board - ゲームボードエンティティ
   * @param {GameState} gameState - ゲーム状態エンティティ
   * @param {GameEventEmitter} [eventEmitter] - イベントエミッター
   */
  constructor(board, gameState, eventEmitter = null) {
    this.board = board;
    this.gameState = gameState;
    this.eventEmitter = eventEmitter || new GameEventEmitter();

    // GameStateのレベルアップイベントをGameLogicのEventEmitterで中継
    this.gameState.addEventListener('level.up', eventData => {
      this.eventEmitter.emit('level.up', eventData);
    });

    // 現在のピース
    this.currentPiece = null;

    // ネクストピースキュー（3つ先まで表示）
    this.nextPieces = [];

    // ホールドピース
    this.heldPiece = null;
    this.canHold = true;

    // 7-bagシステム
    this.pieceBag = [];
    this.bagIndex = 0;

    // ゲームタイマー
    this.dropTimer = 0;
    this.lockTimer = 0;
    this.lockDelay = 500; // 500ms

    // 初期化
    this._initializePieceBag();
    this._initializeNextPieces();
  }

  /**
   * ゲームを開始する
   * @returns {Object} 操作結果
   */
  startGame() {
    try {
      this.gameState.setStatus('PLAYING');
      this.currentPiece = this._spawnPiece();
      this.canHold = true;

      // ゲーム開始イベントを発行
      this.eventEmitter.emit('game.started', {
        level: this.gameState.level,
        piece: this.currentPiece,
      });

      return {
        success: true,
        piece: this.currentPiece,
      };
    } catch (error) {
      return {
        success: false,
        reason: 'spawn_failed',
        error: error.message,
      };
    }
  }

  /**
   * ゲームを一時停止する
   * @returns {Object} 操作結果
   */
  pauseGame() {
    if (this.gameState.status !== 'PLAYING') {
      return {
        success: false,
        reason: 'not_playing',
      };
    }

    this.gameState.setStatus('PAUSED');

    // ゲーム一時停止イベントを発行
    this.eventEmitter.emit('game.paused', {
      level: this.gameState.level,
      score: this.gameState.score,
    });

    return {
      success: true,
    };
  }

  /**
   * ゲームを再開する
   * @returns {Object} 操作結果
   */
  resumeGame() {
    if (this.gameState.status !== 'PAUSED') {
      return {
        success: false,
        reason: 'not_paused',
      };
    }

    this.gameState.setStatus('PLAYING');

    // ゲーム再開イベントを発行
    this.eventEmitter.emit('game.resumed', {
      level: this.gameState.level,
      score: this.gameState.score,
    });

    return {
      success: true,
    };
  }

  /**
   * ゲームをリセットする
   * @returns {Object} 操作結果
   */
  resetGame() {
    this.board.clear();
    this.gameState.resetGame();
    this.currentPiece = null;
    this.heldPiece = null;
    this.canHold = true;

    this._initializePieceBag();
    this._initializeNextPieces();

    return {
      success: true,
    };
  }

  /**
   * 現在のピースを取得
   * @returns {Tetromino|null}
   */
  getCurrentPiece() {
    return this.currentPiece;
  }

  /**
   * 次のピース配列を取得
   * @returns {Array<Tetromino>} 次のピース配列
   */
  getNextPieces() {
    return this.nextPieces ? this.nextPieces.slice(0, 3) : [];
  }

  /**
   * ホールドピースを取得
   * @returns {Tetromino|null}
   */
  getHoldPiece() {
    return this.heldPiece;
  }

  /**
   * ピースを左に移動
   * @returns {Object} 操作結果
   */
  movePieceLeft() {
    if (!this._canOperate()) {
      return this._getOperationError();
    }

    const originalX = this.currentPiece.position.x;
    this.currentPiece.moveLeft();

    if (this._isColliding()) {
      this.currentPiece.position.x = originalX; // 元に戻す
      return {
        success: false,
        reason: 'collision',
      };
    }

    this._resetLockTimer();
    return {
      success: true,
      newPosition: { x: this.currentPiece.position.x, y: this.currentPiece.position.y },
    };
  }

  /**
   * ピースを右に移動
   * @returns {Object} 操作結果
   */
  movePieceRight() {
    if (!this._canOperate()) {
      return this._getOperationError();
    }

    const originalX = this.currentPiece.position.x;
    this.currentPiece.moveRight();

    if (this._isColliding()) {
      this.currentPiece.position.x = originalX; // 元に戻す
      return {
        success: false,
        reason: 'collision',
      };
    }

    this._resetLockTimer();
    return {
      success: true,
      newPosition: { x: this.currentPiece.position.x, y: this.currentPiece.position.y },
    };
  }

  /**
   * ピースを下に移動
   * @returns {Object} 操作結果
   */
  movePieceDown() {
    if (!this._canOperate()) {
      return this._getOperationError();
    }

    const originalY = this.currentPiece.position.y;
    this.currentPiece.moveDown();

    if (this._isColliding()) {
      this.currentPiece.position.y = originalY; // 元に戻す

      // 底に着いた場合はロックタイマー開始
      this._startLockTimer();
      return {
        success: false,
        reason: 'collision',
        landed: true,
      };
    }

    // ソフトドロップスコア
    this.gameState.addSoftDropScore(1);

    return {
      success: true,
      newPosition: { x: this.currentPiece.position.x, y: this.currentPiece.position.y },
    };
  }

  /**
   * ピースを時計回りに回転
   * @returns {Object} 操作結果
   */
  rotatePieceClockwise() {
    if (!this._canOperate()) {
      return this._getOperationError();
    }

    const originalRotation = this.currentPiece.rotationState;
    const originalX = this.currentPiece.position.x;
    const originalY = this.currentPiece.position.y;

    this.currentPiece.rotateClockwise();

    // 衝突チェック（Wall Kick含む）
    const kickResult = this._tryWallKick(originalRotation, this.currentPiece.rotationState);

    if (!kickResult.success) {
      // 回転失敗：元に戻す
      this.currentPiece.rotationState = originalRotation;
      this.currentPiece.position.x = originalX;
      this.currentPiece.position.y = originalY;

      return {
        success: false,
        reason: 'collision',
      };
    }

    this._resetLockTimer();
    return {
      success: true,
      wallKick: kickResult.wallKick,
      newPosition: { x: this.currentPiece.position.x, y: this.currentPiece.position.y },
      newRotation: this.currentPiece.rotationState,
    };
  }

  /**
   * ピースを反時計回りに回転
   * @returns {Object} 操作結果
   */
  rotatePieceCounterClockwise() {
    if (!this._canOperate()) {
      return this._getOperationError();
    }

    const originalRotation = this.currentPiece.rotationState;
    const originalX = this.currentPiece.position.x;
    const originalY = this.currentPiece.position.y;

    this.currentPiece.rotateCounterClockwise();

    // 衝突チェック（Wall Kick含む）
    const kickResult = this._tryWallKick(originalRotation, this.currentPiece.rotationState);

    if (!kickResult.success) {
      // 回転失敗：元に戻す
      this.currentPiece.rotationState = originalRotation;
      this.currentPiece.position.x = originalX;
      this.currentPiece.position.y = originalY;

      return {
        success: false,
        reason: 'collision',
      };
    }

    this._resetLockTimer();
    return {
      success: true,
      wallKick: kickResult.wallKick,
      newPosition: { x: this.currentPiece.position.x, y: this.currentPiece.position.y },
      newRotation: this.currentPiece.rotationState,
    };
  }

  /**
   * ハードドロップ
   * @returns {Object} 操作結果
   */
  hardDrop() {
    if (!this._canOperate()) {
      return this._getOperationError();
    }

    // const startY = this.currentPiece.y; // 未使用のため一時的にコメントアウト
    let distance = 0;

    // 底まで移動
    while (!this._isColliding()) {
      this.currentPiece.moveDown();
      distance++;
    }

    // 最後の移動は衝突したので1つ戻す
    this.currentPiece.moveUp();
    distance--;

    // ハードドロップスコア
    this.gameState.addHardDropScore(distance);

    // ピースを即座に固定
    const lockResult = this._lockPiece();

    return {
      success: true,
      distance: distance,
      pieceLocked: lockResult.success,
      linesCleared: lockResult.linesCleared || 0,
    };
  }

  /**
   * ピースをホールドする
   * @returns {Object} 操作結果
   */
  holdPiece() {
    if (!this._canOperate()) {
      return this._getOperationError();
    }

    if (!this.canHold) {
      return {
        success: false,
        reason: 'already_held_this_turn',
      };
    }

    const currentType = this.currentPiece.type;

    if (this.heldPiece === null) {
      // 初回ホールド
      this.heldPiece = new Tetromino(currentType);
      this.currentPiece = this._spawnPiece();
    } else {
      // ホールドピースと交換
      const holdType = this.heldPiece.type;
      this.heldPiece = new Tetromino(currentType);
      this.currentPiece = new Tetromino(holdType);
      this.currentPiece.position.x = Math.floor(
        (this.board.COLS - this.currentPiece.getWidth()) / 2
      );
      this.currentPiece.position.y = 0;
    }

    this.canHold = false;

    return {
      success: true,
      holdPiece: this.heldPiece,
      currentPiece: this.currentPiece,
    };
  }

  /**
   * ライン削除チェックと実行
   * @returns {Object} 操作結果
   */
  checkAndClearLines() {
    const clearResult = this.board.clearLines();

    if (clearResult.linesCleared === 0) {
      return {
        linesCleared: 0,
        lineTypes: [],
      };
    }

    // スコア計算
    const lineScore = this.gameState.addLineScore(clearResult.linesCleared);

    // ライン数更新
    this.gameState.updateLines(clearResult.linesCleared);

    // ライン種別判定
    const lineTypes = this._getLineTypes(clearResult.linesCleared);

    // ライン削除イベントを発行
    this.eventEmitter.emit('lines.cleared', {
      lines: clearResult.clearedLines || [],
      count: clearResult.linesCleared,
      type: lineTypes[0] || 'single',
      score: lineScore,
      tspin: false, // T-Spin判定は別途実装
    });

    return {
      linesCleared: clearResult.linesCleared,
      lineTypes: lineTypes,
      score: lineScore,
      totalLines: this.gameState.lines,
    };
  }

  /**
   * 次のピースをスポーンする
   * @returns {Tetromino} 新しいピース
   */
  spawnNextPiece() {
    try {
      this.currentPiece = this._spawnPiece();
      this.canHold = true;

      return {
        success: true,
        piece: this.currentPiece,
      };
    } catch (error) {
      // ゲームオーバー
      this.gameState.setStatus('GAME_OVER');
      this.gameState.incrementTotalGames();

      // ゲームオーバーイベントを発行
      this.eventEmitter.emit('game.ended', {
        score: this.gameState.score,
        level: this.gameState.level,
        lines: this.gameState.lines,
        time: this.gameState.gameTime,
        statistics: this.gameState.statistics,
      });

      return {
        success: false,
        gameOver: true,
        reason: 'spawn_collision',
      };
    }
  }

  /**
   * ゲーム更新（フレーム毎の処理）
   * @param {number} deltaTime - 前フレームからの経過時間（ms）
   * @returns {Object} 更新結果
   */
  update(deltaTime) {
    if (this.gameState.status !== 'PLAYING') {
      return { updated: false };
    }

    this.dropTimer += deltaTime;
    const dropInterval = this.gameState.getDropInterval();

    // 自動落下
    if (this.dropTimer >= dropInterval) {
      this.dropTimer = 0;
      const moveResult = this.movePieceDown();

      if (!moveResult.success && moveResult.landed) {
        // ロックタイマー進行
        this.lockTimer += deltaTime;

        if (this.lockTimer >= this.lockDelay) {
          const lockResult = this._lockPiece();
          return {
            updated: true,
            pieceLocked: true,
            linesCleared: lockResult.linesCleared,
          };
        }
      }
    }

    return { updated: true };
  }

  // === プライベートメソッド ===

  /**
   * 7-bagシステムの初期化
   * @private
   */
  _initializePieceBag() {
    this.pieceBag = this._shuffleArray(['I', 'O', 'T', 'S', 'Z', 'J', 'L']);
    this.bagIndex = 0;
  }

  /**
   * ネクストピースの初期化
   * @private
   */
  _initializeNextPieces() {
    this.nextPieces = [];
    for (let i = 0; i < 5; i++) {
      // 5個先まで準備
      this.nextPieces.push(new Tetromino(this._getNextPieceType()));
    }
  }

  /**
   * 次のピースタイプを取得（7-bagシステム）
   * @private
   * @returns {string} ピースタイプ
   */
  _getNextPieceType() {
    if (this.bagIndex >= this.pieceBag.length) {
      this._initializePieceBag();
    }

    return this.pieceBag[this.bagIndex++];
  }

  /**
   * 新しいピースをスポーンする
   * @private
   * @returns {Tetromino} 新しいピース
   */
  _spawnPiece() {
    const piece = this.nextPieces.shift();
    this.nextPieces.push(new Tetromino(this._getNextPieceType()));

    // スポーン位置設定
    piece.position.x = Math.floor((this.board.COLS - piece.getWidth()) / 2);
    piece.position.y = 0;

    // スポーン時の衝突チェック
    this.currentPiece = piece;
    if (this._isColliding()) {
      throw new Error('Spawn collision - Game Over');
    }

    return piece;
  }

  /**
   * 衝突判定
   * @private
   * @returns {boolean} 衝突している場合true
   */
  _isColliding() {
    if (!this.currentPiece) return false;

    return this.board.isColliding(this.currentPiece);
  }

  /**
   * Wall Kickを試行する
   * @private
   * @param {number} fromRotation - 回転前の状態
   * @param {number} toRotation - 回転後の状態
   * @returns {Object} キック結果
   */
  _tryWallKick(fromRotation, toRotation) {
    // 現在の位置で衝突しない場合はキック不要
    if (!this._isColliding()) {
      return { success: true, wallKick: null };
    }

    // Wall Kickオフセットテーブル（SRSガイドライン）
    const kickTable = this._getWallKickTable(this.currentPiece.type);
    const kicks = kickTable[fromRotation][toRotation] || [];

    const originalX = this.currentPiece.position.x;
    const originalY = this.currentPiece.position.y;

    // 各キックオフセットを試行
    for (let i = 0; i < kicks.length; i++) {
      const [dx, dy] = kicks[i];
      this.currentPiece.position.x = originalX + dx;
      this.currentPiece.position.y = originalY + dy;

      if (!this._isColliding()) {
        return {
          success: true,
          wallKick: { offsetIndex: i, dx, dy },
        };
      }
    }

    // 全てのキックが失敗
    this.currentPiece.position.x = originalX;
    this.currentPiece.position.y = originalY;

    return { success: false };
  }

  /**
   * Wall Kickテーブルを取得
   * @private
   * @param {string} pieceType - ピースタイプ
   * @returns {Object} キックテーブル
   */
  _getWallKickTable(pieceType) {
    if (pieceType === 'I') {
      // I字ピース専用テーブル
      return {
        0: {
          1: [
            [-2, 0],
            [1, 0],
            [-2, -1],
            [1, 2],
          ],
          3: [
            [-1, 0],
            [2, 0],
            [-1, 2],
            [2, -1],
          ],
        },
        1: {
          0: [
            [2, 0],
            [-1, 0],
            [2, 1],
            [-1, -2],
          ],
          2: [
            [-1, 0],
            [2, 0],
            [-1, 2],
            [2, -1],
          ],
        },
        2: {
          1: [
            [1, 0],
            [-2, 0],
            [1, -2],
            [-2, 1],
          ],
          3: [
            [2, 0],
            [-1, 0],
            [2, 1],
            [-1, -2],
          ],
        },
        3: {
          0: [
            [1, 0],
            [-2, 0],
            [1, -2],
            [-2, 1],
          ],
          2: [
            [-2, 0],
            [1, 0],
            [-2, -1],
            [1, 2],
          ],
        },
      };
    } else {
      // その他のピース（共通テーブル）
      return {
        0: {
          1: [
            [-1, 0],
            [-1, 1],
            [0, -2],
            [-1, -2],
          ],
          3: [
            [1, 0],
            [1, 1],
            [0, -2],
            [1, -2],
          ],
        },
        1: {
          0: [
            [1, 0],
            [1, -1],
            [0, 2],
            [1, 2],
          ],
          2: [
            [1, 0],
            [1, -1],
            [0, 2],
            [1, 2],
          ],
        },
        2: {
          1: [
            [-1, 0],
            [-1, 1],
            [0, -2],
            [-1, -2],
          ],
          3: [
            [1, 0],
            [1, 1],
            [0, -2],
            [1, -2],
          ],
        },
        3: {
          0: [
            [-1, 0],
            [-1, -1],
            [0, 2],
            [-1, 2],
          ],
          2: [
            [-1, 0],
            [-1, -1],
            [0, 2],
            [-1, 2],
          ],
        },
      };
    }
  }

  /**
   * ピースを固定する
   * @private
   * @returns {Object} 固定結果
   */
  _lockPiece() {
    // ボードにピースを配置
    const pieceShape = this.currentPiece.getOccupiedCells();
    const offsetX = this.currentPiece.position.x;
    const offsetY = this.currentPiece.position.y;
    const pieceType =
      this.currentPiece.type === 'I'
        ? 1
        : this.currentPiece.type === 'O'
          ? 2
          : this.currentPiece.type === 'T'
            ? 3
            : this.currentPiece.type === 'S'
              ? 4
              : this.currentPiece.type === 'Z'
                ? 5
                : this.currentPiece.type === 'J'
                  ? 6
                  : 7;

    this.board.placePiece(pieceShape, offsetX, offsetY, pieceType);

    // ライン削除チェック
    const clearResult = this.checkAndClearLines();

    // 新しいピースをスポーン
    const spawnResult = this.spawnNextPiece();

    // ロックタイマーリセット
    this.lockTimer = 0;

    return {
      success: true,
      linesCleared: clearResult.linesCleared,
      gameOver: !spawnResult.success,
    };
  }

  /**
   * ライン種別を判定
   * @private
   * @param {number} lines - 削除ライン数
   * @returns {Array<string>} ライン種別
   */
  _getLineTypes(lines) {
    const types = [];

    switch (lines) {
      case 1:
        types.push('single');
        break;
      case 2:
        types.push('double');
        break;
      case 3:
        types.push('triple');
        break;
      case 4:
        types.push('tetris');
        break;
    }

    return types;
  }

  /**
   * 操作可能かチェック
   * @private
   * @returns {boolean}
   */
  _canOperate() {
    return this.gameState.status === 'PLAYING' && this.currentPiece !== null;
  }

  /**
   * 操作エラーを取得
   * @private
   * @returns {Object}
   */
  _getOperationError() {
    if (this.gameState.status === 'MENU') {
      return { success: false, reason: 'game_not_started' };
    } else if (this.gameState.status === 'PAUSED') {
      return { success: false, reason: 'game_paused' };
    } else if (this.gameState.status === 'GAME_OVER') {
      return { success: false, reason: 'game_over' };
    } else {
      return { success: false, reason: 'no_current_piece' };
    }
  }

  /**
   * ロックタイマー開始
   * @private
   */
  _startLockTimer() {
    if (this.lockTimer === 0) {
      this.lockTimer = 1; // タイマー開始
    }
  }

  /**
   * ロックタイマーリセット
   * @private
   */
  _resetLockTimer() {
    this.lockTimer = 0;
  }

  /**
   * イベントエミッターを取得する
   *
   * @returns {GameEventEmitter} イベントエミッター
   */
  getEventEmitter() {
    return this.eventEmitter;
  }

  /**
   * 配列をシャッフル
   * @private
   * @param {Array} array - シャッフルする配列
   * @returns {Array} シャッフル済み配列
   */
  _shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}
