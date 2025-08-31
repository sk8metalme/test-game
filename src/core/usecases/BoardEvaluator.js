/**
 * ボード状態の評価関数
 *
 * テトロミノ配置の最適化に使用される評価関数を提供します。
 * ボードの状態を数値化し、AIが最適な配置を決定するための基盤となります。
 *
 * @fileoverview ボード評価システム
 * @author AI Development Team
 * @version 1.0.0
 */

import Board from '../entities/Board.js';

/**
 * ボード状態の評価関数クラス
 *
 * テトロミノ配置の品質を評価するための包括的な評価システムを提供します。
 * 評価基準には以下の要素が含まれます：
 * - ライン効率（完成ラインの数と分布）
 * - 穴の数と位置
 * - 高さの変動
 * - テトロミノの配置可能性
 */
export default class BoardEvaluator {
  /**
   * BoardEvaluator インスタンスを作成
   *
   * @param {Object} config - 評価設定
   * @param {number} config.lineEfficiencyWeight - ライン効率の重み（デフォルト: 100）
   * @param {number} config.holePenaltyWeight - 穴のペナルティ重み（デフォルト: 10）
   * @param {number} config.heightVariationWeight - 高さ変動の重み（デフォルト: 5）
   * @param {number} config.edgeTouchWeight - エッジ接触の重み（デフォルト: 2）
   */
  constructor(config = {}) {
    this.config = {
      lineEfficiencyWeight: config.lineEfficiencyWeight || 100,
      holePenaltyWeight: config.holePenaltyWeight || 10,
      heightVariationWeight: config.heightVariationWeight || 5,
      edgeTouchWeight: config.edgeTouchWeight || 2,
      ...config,
    };
  }

  /**
   * ボード状態を総合的に評価
   *
   * @param {Board} board - 評価対象のボード
   * @returns {Object} 評価結果
   * @returns {number} returns.score - 総合評価スコア（高いほど良い）
   * @returns {number} returns.lineEfficiency - ライン効率スコア
   * @returns {number} returns.holeCount - 穴の数
   * @returns {number} returns.heightVariation - 高さの変動
   * @returns {number} returns.edgeTouchScore - エッジ接触スコア
   * @returns {Object} returns.details - 詳細な評価情報
   */
  evaluateBoard(board) {
    if (!board || !(board instanceof Board)) {
      throw new Error('BoardEvaluator: 有効なBoardインスタンスが必要です');
    }

    const lineEfficiency = this.calculateLineEfficiency(board);
    const holeCount = this.countHoles(board);
    const heightVariation = this.calculateHeightVariation(board);
    const edgeTouchScore = this.calculateEdgeTouchScore(board);

    // 総合スコアの計算
    const totalScore =
      lineEfficiency * this.config.lineEfficiencyWeight -
      holeCount * this.config.holePenaltyWeight -
      heightVariation * this.config.heightVariationWeight +
      edgeTouchScore * this.config.edgeTouchWeight;

    return {
      score: totalScore,
      lineEfficiency,
      holeCount,
      heightVariation,
      edgeTouchScore,
      details: {
        lineEfficiencyScore: lineEfficiency * this.config.lineEfficiencyWeight,
        holePenalty: holeCount * this.config.holePenaltyWeight,
        heightVariationPenalty: heightVariation * this.config.heightVariationWeight,
        edgeTouchBonus: edgeTouchScore * this.config.edgeTouchWeight,
      },
    };
  }

  /**
   * ライン効率を計算
   *
   * 完成に近いラインの数を評価し、効率的な配置を促進します。
   *
   * @param {Board} board - 評価対象のボード
   * @returns {number} ライン効率スコア（0-1の範囲、高いほど良い）
   */
  calculateLineEfficiency(board) {
    let totalEfficiency = 0;
    const rows = board.ROWS;

    for (let row = 0; row < rows; row++) {
      const rowEfficiency = this.calculateRowEfficiency(board, row);
      totalEfficiency += rowEfficiency;
    }

    return totalEfficiency / rows;
  }

  /**
   * 特定行の効率を計算
   *
   * @param {Board} board - 評価対象のボード
   * @param {number} row - 行番号
   * @returns {number} 行効率スコア（0-1の範囲）
   */
  calculateRowEfficiency(board, row) {
    let filledCells = 0;
    const totalCells = board.COLS;

    for (let col = 0; col < board.COLS; col++) {
      if (board.getCell(row, col) !== 0) {
        filledCells++;
      }
    }

    // 完全に埋まっている行は最高効率
    if (filledCells === totalCells) {
      return 1.0;
    }

    // 部分的に埋まっている行は埋まり具合に比例
    return filledCells / totalCells;
  }

  /**
   * 穴の数をカウント
   *
   * テトロミノが配置できない穴の数を数えます。
   * 穴は下部にブロックがある空のセルとして定義されます。
   *
   * @param {Board} board - 評価対象のボード
   * @returns {number} 穴の数
   */
  countHoles(board) {
    let holeCount = 0;

    for (let col = 0; col < board.COLS; col++) {
      let foundBlock = false;

      // 下から上に向かって走査（テトロミノの配置順序に合わせる）
      for (let row = board.ROWS - 1; row >= 0; row--) {
        const cell = board.getCell(row, col);

        if (cell !== 0) {
          foundBlock = true;
        } else if (foundBlock) {
          // 下部にブロックがある空のセルは穴
          holeCount++;
        }
      }
    }

    return holeCount;
  }

  /**
   * 高さの変動を計算
   *
   * 各列の高さの標準偏差を計算し、平坦な配置を促進します。
   *
   * @param {Board} board - 評価対象のボード
   * @returns {number} 高さ変動スコア（低いほど良い）
   */
  calculateHeightVariation(board) {
    const heights = [];

    for (let col = 0; col < board.COLS; col++) {
      const height = this.calculateColumnHeight(board, col);
      heights.push(height);
    }

    // 標準偏差の計算
    const mean = heights.reduce((sum, height) => sum + height, 0) / heights.length;
    const variance =
      heights.reduce((sum, height) => sum + Math.pow(height - mean, 2), 0) / heights.length;

    return Math.sqrt(variance);
  }

  /**
   * 特定列の高さを計算
   *
   * @param {Board} board - 評価対象のボード
   * @param {number} col - 列番号
   * @returns {number} 列の高さ
   */
  calculateColumnHeight(board, col) {
    for (let row = 0; row < board.ROWS; row++) {
      if (board.getCell(row, col) !== 0) {
        return board.ROWS - row;
      }
    }
    return 0; // 空の列
  }

  /**
   * エッジ接触スコアを計算
   *
   * テトロミノが他のブロックや壁に適切に接触しているかを評価します。
   * 適切な接触は安定性を向上させます。
   *
   * @param {Board} board - 評価対象のボード
   * @returns {number} エッジ接触スコア（高いほど良い）
   */
  calculateEdgeTouchScore(board) {
    let touchScore = 0;

    for (let row = 0; row < board.ROWS; row++) {
      for (let col = 0; col < board.COLS; col++) {
        if (board.getCell(row, col) !== 0) {
          touchScore += this.calculateCellTouchScore(board, row, col);
        }
      }
    }

    return touchScore;
  }

  /**
   * 特定セルの接触スコアを計算
   *
   * @param {Board} board - 評価対象のボード
   * @param {number} row - 行番号
   * @param {number} col - 列番号
   * @returns {number} 接触スコア
   */
  calculateCellTouchScore(board, row, col) {
    let touchCount = 0;
    const directions = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1], // 上下左右
    ];

    for (const [dRow, dCol] of directions) {
      const newRow = row + dRow;
      const newCol = col + dCol;

      // 境界チェック
      if (newRow < 0 || newRow >= board.ROWS || newCol < 0 || newCol >= board.COLS) {
        touchCount++; // 壁との接触
      } else if (board.getCell(newRow, newCol) !== 0) {
        touchCount++; // 他のブロックとの接触
      }
    }

    return touchCount;
  }

  /**
   * 特定のテトロミノ配置の評価
   *
   * 仮想的にテトロミノを配置した後のボード状態を評価します。
   *
   * @param {Board} board - 現在のボード
   * @param {Array} pieceShape - ピースの形状
   * @param {number} offsetX - X座標オフセット
   * @param {number} offsetY - Y座標オフセット
   * @returns {Object} 配置後の評価結果
   */
  evaluatePlacement(board, pieceShape, offsetX, offsetY) {
    // 仮想的なボードを作成
    const virtualBoard = new Board();
    virtualBoard.grid = board.grid.map(row => [...row]);

    // ピースを仮想的に配置
    for (const cell of pieceShape) {
      const newRow = cell.row + offsetY;
      const newCol = cell.col + offsetX;

      if (newRow >= 0 && newRow < virtualBoard.ROWS && newCol >= 0 && newCol < virtualBoard.COLS) {
        virtualBoard.grid[newRow][newCol] = 1;
      }
    }

    // 配置後の評価
    return this.evaluateBoard(virtualBoard);
  }

  /**
   * 評価設定を更新
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
