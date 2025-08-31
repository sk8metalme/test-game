/**
 * 基本的なAIアルゴリズム
 *
 * テトロミノの最適な配置を決定する基本的なAIシステムを提供します。
 * 評価関数を使用して、可能な配置の中から最適なものを選択します。
 *
 * @fileoverview 基本的なAI配置システム
 * @author AI Development Team
 * @version 1.0.0
 */

import BoardEvaluator from './BoardEvaluator.js';
import CollisionDetector from './CollisionDetector.js';
import Tetromino from '../entities/Tetromino.js';

/**
 * 基本的なAIクラス
 *
 * テトロミノの配置を最適化するための基本的なAIアルゴリズムを実装します。
 * 評価関数と衝突検出を使用して、最適な配置を決定します。
 */
export default class BasicAI {
  /**
   * BasicAI インスタンスを作成
   *
   * @param {Object} config - AI設定
   * @param {number} config.searchDepth - 探索深度（デフォルト: 2）
   * @param {number} config.maxMoves - 最大移動回数（デフォルト: 100）
   * @param {boolean} config.enableRotation - 回転を有効にするか（デフォルト: true）
   * @param {boolean} config.enableHold - ホールドを有効にするか（デフォルト: true）
   */
  constructor(config = {}) {
    this.config = {
      searchDepth: config.searchDepth || 2,
      maxMoves: config.maxMoves || 100,
      enableRotation: config.enableRotation !== false,
      enableHold: config.enableHold !== false,
      ...config,
    };

    this.boardEvaluator = new BoardEvaluator();
    this.collisionDetector = new CollisionDetector();

    // 移動方向の定義
    this.moveDirections = [
      { x: -1, y: 0 }, // 左
      { x: 1, y: 0 }, // 右
      { x: 0, y: 1 }, // 下
    ];
  }

  /**
   * 最適な配置を見つける
   *
   * @param {Board} board - 現在のボード状態
   * @param {Tetromino} piece - 配置するテトロミノ
   * @param {Array} nextPieces - 次のテトロミノ配列
   * @returns {Object} 最適な配置情報
   * @returns {Object} returns.move - 移動情報
   * @returns {number} returns.rotation - 回転状態
   * @returns {boolean} returns.shouldHold - ホールドすべきか
   * @returns {number} returns.score - 評価スコア
   */
  findBestMove(board, piece, nextPieces = []) {
    if (!board || !piece) {
      throw new Error('BasicAI: 有効なBoardとTetrominoが必要です');
    }

    const possibleMoves = this.generatePossibleMoves(board, piece);
    let bestMove = null;
    let bestScore = -Infinity;

    // 各可能な配置を評価
    for (const move of possibleMoves) {
      const score = this.evaluateMove(board, piece, move, nextPieces);

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    // ホールドの評価
    if (this.config.enableHold && nextPieces.length > 0) {
      const holdScore = this.evaluateHold(board, piece, nextPieces);

      if (holdScore > bestScore) {
        bestScore = holdScore;
        bestMove = { ...bestMove, shouldHold: true };
      }
    }

    return {
      move: bestMove,
      score: bestScore,
      shouldHold: bestMove?.shouldHold || false,
    };
  }

  /**
   * 可能な配置を生成
   *
   * @param {Board} board - 現在のボード状態
   * @param {Tetromino} piece - 配置するテトロミノ
   * @returns {Array} 可能な配置の配列
   */
  generatePossibleMoves(board, piece) {
    const moves = [];
    const maxX = board.COLS - piece.getWidth();

    // 各回転状態で配置を試行
    for (let rotation = 0; rotation < 4; rotation++) {
      if (!this.config.enableRotation && rotation > 0) {
        break;
      }

      const rotatedPiece = this.createRotatedPiece(piece, rotation);

      // 各X位置で配置を試行
      for (let x = 0; x <= maxX; x++) {
        const y = this.findDropPosition(board, rotatedPiece, x);

        if (y !== null) {
          moves.push({
            x,
            y,
            rotation,
            piece: rotatedPiece,
          });
        }
      }
    }

    return moves;
  }

  /**
   * 回転したテトロミノを作成
   *
   * @param {Tetromino} piece - 元のテトロミノ
   * @param {number} rotation - 回転回数
   * @returns {Tetromino} 回転したテトロミノ
   */
  createRotatedPiece(piece, rotation) {
    // Tetrominoインスタンスの正しい複製を作成
    const rotatedPiece = new Tetromino(piece.type, piece.position);
    rotatedPiece.rotationState = piece.rotationState;

    // 回転を適用
    for (let i = 0; i < rotation; i++) {
      rotatedPiece.rotationState = (rotatedPiece.rotationState + 1) % 4;
    }

    return rotatedPiece;
  }

  /**
   * ドロップ位置を見つける
   *
   * @param {Board} board - ボード状態
   * @param {Tetromino} piece - テトロミノ
   * @param {number} x - X座標
   * @returns {number|null} Y座標（配置不可能な場合はnull）
   */
  findDropPosition(board, piece, x) {
    let y = 0;

    // 上から下に向かって配置可能な位置を探索
    while (y < board.ROWS) {
      if (this.canPlacePiece(board, piece, x, y)) {
        return y;
      }
      y++;
    }

    return null;
  }

  /**
   * テトロミノが配置可能かチェック
   *
   * @param {Board} board - ボード状態
   * @param {Tetromino} piece - テトロミノ
   * @param {number} x - X座標
   * @param {number} y - Y座標
   * @returns {boolean} 配置可能かどうか
   */
  canPlacePiece(board, piece, x, y) {
    const occupiedCells = piece.getOccupiedCells();

    // 占有セルがない場合は配置不可能
    if (occupiedCells.length === 0) {
      return false;
    }

    // 基本的な境界チェック（占有セルの有無に関係なく）
    // 負の座標やボードサイズを超える座標は明らかに配置不可能
    if (x < 0 || y < 0 || x >= board.COLS || y >= board.ROWS) {
      return false;
    }

    for (const cell of occupiedCells) {
      const boardX = cell.col + x;
      const boardY = cell.row + y;

      // 境界チェック
      if (boardX < 0 || boardX >= board.COLS || boardY < 0 || boardY >= board.ROWS) {
        return false;
      }

      // 既存ブロックとの衝突チェック
      if (board.getCell(boardY, boardX) !== 0) {
        return false;
      }
    }

    return true;
  }

  /**
   * 配置を評価
   *
   * @param {Board} board - 現在のボード状態
   * @param {Tetromino} piece - 配置するテトロミノ
   * @param {Object} move - 移動情報
   * @param {Array} nextPieces - 次のテトロミノ配列
   * @returns {number} 評価スコア
   */
  evaluateMove(board, piece, move, nextPieces) {
    // 仮想的なボードを作成
    const virtualBoard = this.createVirtualBoard(board);

    // テトロミノを仮想的に配置
    this.placePieceOnBoard(virtualBoard, piece, move.x, move.y);

    // ライン削除をシミュレート
    this.simulateLineClear(virtualBoard);

    // ボード状態を評価
    const boardScore = this.boardEvaluator.evaluateBoard(virtualBoard);

    // 追加の評価要素
    const additionalScore = this.calculateAdditionalScore(move, nextPieces);

    return boardScore.score + additionalScore;
  }

  /**
   * 仮想的なボードを作成
   *
   * @param {Board} board - 元のボード
   * @returns {Board} 仮想的なボード
   */
  createVirtualBoard(board) {
    const virtualBoard = new board.constructor();
    virtualBoard.grid = board.grid.map(row => [...row]);
    return virtualBoard;
  }

  /**
   * テトロミノをボードに配置
   *
   * @param {Board} board - ボード
   * @param {Tetromino} piece - テトロミノ
   * @param {number} x - X座標
   * @param {number} y - Y座標
   */
  placePieceOnBoard(board, piece, x, y) {
    const occupiedCells = piece.getOccupiedCells();

    for (const cell of occupiedCells) {
      const boardX = cell.col + x;
      const boardY = cell.row + y;

      if (boardX >= 0 && boardX < board.COLS && boardY >= 0 && boardY < board.ROWS) {
        board.grid[boardY][boardX] = 1;
      }
    }
  }

  /**
   * ライン削除をシミュレート
   *
   * @param {Board} board - ボード
   */
  simulateLineClear(board) {
    // 完全に埋まった行を削除
    for (let row = board.ROWS - 1; row >= 0; row--) {
      let isFull = true;

      for (let col = 0; col < board.COLS; col++) {
        if (board.getCell(row, col) === 0) {
          isFull = false;
          break;
        }
      }

      if (isFull) {
        // 行を削除して上から下に移動
        for (let r = row; r > 0; r--) {
          for (let col = 0; col < board.COLS; col++) {
            board.grid[r][col] = board.grid[r - 1][col];
          }
        }

        // 最上行をクリア
        for (let col = 0; col < board.COLS; col++) {
          board.grid[0][col] = 0;
        }

        row++; // 同じ行を再チェック
      }
    }
  }

  /**
   * 追加の評価スコアを計算
   *
   * @param {Object} move - 移動情報
   * @param {Array} nextPieces - 次のテトロミノ配列
   * @returns {number} 追加スコア
   */
  calculateAdditionalScore(move, nextPieces) {
    let score = 0;

    // 高さペナルティ（低い位置ほど良い）
    // 低い位置（y=15）の方が高いスコアになるように修正
    score += move.y * 10;

    // 中央寄り配置のボーナス
    const centerX = 5;
    const distanceFromCenter = Math.abs(move.x - centerX);
    score += (5 - distanceFromCenter) * 5;

    // 次のピースとの相性
    if (nextPieces.length > 0) {
      score += this.evaluateNextPieceCompatibility(move, nextPieces[0]);
    }

    return score;
  }

  /**
   * 次のピースとの相性を評価
   *
   * @param {Object} move - 現在の移動
   * @param {Tetromino} nextPiece - 次のピース
   * @returns {number} 相性スコア
   */
  evaluateNextPieceCompatibility(move, nextPiece) {
    let score = 0;

    // Iピースの場合は中央配置を優先
    if (nextPiece.type === 'I') {
      const centerX = 4; // Iピースは4列分
      const distanceFromCenter = Math.abs(move.x - centerX);
      score += (5 - distanceFromCenter) * 3;
    }

    return score;
  }

  /**
   * ホールドの評価
   *
   * @param {Board} board - ボード状態
   * @param {Tetromino} piece - 現在のピース
   * @param {Array} nextPieces - 次のピース配列
   * @returns {number} ホールド評価スコア
   */
  evaluateHold(board, piece, nextPieces) {
    if (nextPieces.length === 0) {
      return -Infinity;
    }

    const nextPiece = nextPieces[0];
    const nextPieceMoves = this.generatePossibleMoves(board, nextPiece);

    if (nextPieceMoves.length === 0) {
      return -Infinity;
    }

    // 次のピースの最適配置を評価
    let bestScore = -Infinity;

    for (const move of nextPieceMoves) {
      const score = this.evaluateMove(board, nextPiece, move, nextPieces.slice(1));
      if (score > bestScore) {
        bestScore = score;
      }
    }

    return bestScore;
  }

  /**
   * AI設定を更新
   *
   * @param {Object} newConfig - 新しい設定
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * 現在の設定を取得
   *
   * @returns {Object} 現在の設定
   */
  getConfig() {
    return { ...this.config };
  }
}
