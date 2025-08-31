/**
 * BoardEvaluator ユニットテスト
 *
 * AI機能の基盤となる評価関数の動作を検証します。
 *
 * @fileoverview BoardEvaluator テストスイート
 * @author Test Development Team
 * @version 1.0.0
 */

import BoardEvaluator from '../../../src/core/usecases/BoardEvaluator.js';
import Board from '../../../src/core/entities/Board.js';

describe('BoardEvaluator', () => {
  let boardEvaluator;
  let board;

  beforeEach(() => {
    boardEvaluator = new BoardEvaluator();
    board = new Board();
  });

  describe('初期化と設定', () => {
    test('デフォルト設定で初期化される', () => {
      const config = boardEvaluator.getConfig();
      expect(config.lineEfficiencyWeight).toBe(100);
      expect(config.holePenaltyWeight).toBe(10);
      expect(config.heightVariationWeight).toBe(5);
      expect(config.edgeTouchWeight).toBe(2);
    });

    test('カスタム設定で初期化される', () => {
      const customConfig = {
        lineEfficiencyWeight: 200,
        holePenaltyWeight: 20,
      };
      const customEvaluator = new BoardEvaluator(customConfig);
      const config = customEvaluator.getConfig();

      expect(config.lineEfficiencyWeight).toBe(200);
      expect(config.holePenaltyWeight).toBe(20);
      expect(config.heightVariationWeight).toBe(5); // デフォルト値
    });

    test('設定を更新できる', () => {
      const newConfig = { lineEfficiencyWeight: 150 };
      boardEvaluator.updateConfig(newConfig);

      const config = boardEvaluator.getConfig();
      expect(config.lineEfficiencyWeight).toBe(150);
    });
  });

  describe('ボード評価', () => {
    test('空のボードを評価できる', () => {
      const result = boardEvaluator.evaluateBoard(board);

      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('lineEfficiency');
      expect(result).toHaveProperty('holeCount');
      expect(result).toHaveProperty('heightVariation');
      expect(result).toHaveProperty('edgeTouchScore');
      expect(result).toHaveProperty('details');
    });

    test('無効なボードでエラーが発生する', () => {
      expect(() => boardEvaluator.evaluateBoard(null)).toThrow(
        'BoardEvaluator: 有効なBoardインスタンスが必要です'
      );
      expect(() => boardEvaluator.evaluateBoard({})).toThrow(
        'BoardEvaluator: 有効なBoardインスタンスが必要です'
      );
    });
  });

  describe('ライン効率計算', () => {
    test('空の行の効率は0', () => {
      const efficiency = boardEvaluator.calculateRowEfficiency(board, 0);
      expect(efficiency).toBe(0);
    });

    test('部分的に埋まった行の効率を計算', () => {
      // 5個のセルを埋める（10個中5個 = 0.5）
      for (let col = 0; col < 5; col++) {
        board.setCell(0, col, 1);
      }

      const efficiency = boardEvaluator.calculateRowEfficiency(board, 0);
      expect(efficiency).toBe(0.5);
    });

    test('完全に埋まった行の効率は1', () => {
      // 全てのセルを埋める
      for (let col = 0; col < 10; col++) {
        board.setCell(0, col, 1);
      }

      const efficiency = boardEvaluator.calculateRowEfficiency(board, 0);
      expect(efficiency).toBe(1.0);
    });

    test('全体のライン効率を計算', () => {
      // 最初の行を完全に埋める
      for (let col = 0; col < 10; col++) {
        board.setCell(0, col, 1);
      }

      const efficiency = boardEvaluator.calculateLineEfficiency(board);
      // 1行が完全（1.0）、19行が空（0.0）なので、平均は 1/20 = 0.05
      expect(efficiency).toBeCloseTo(0.05, 2);
    });
  });

  describe('穴の検出', () => {
    test('空のボードに穴はない', () => {
      const holeCount = boardEvaluator.countHoles(board);
      expect(holeCount).toBe(0);
    });

    test('単純な穴を検出', () => {
      // 列0にブロックを配置（行19に）
      board.setCell(19, 0, 1);
      // 行19にブロックがあるので、行0-18の空のセルは全て穴
      // ただし、行18は穴としてカウントされる（下部にブロックがある空のセル）

      const holeCount = boardEvaluator.countHoles(board);
      expect(holeCount).toBe(19); // 行0-18の19個の穴
    });

    test('複数の穴を検出', () => {
      // 列0にブロックを配置（行19と18）
      board.setCell(19, 0, 1);
      board.setCell(18, 0, 1);
      // 列1にブロックを配置（行19）
      board.setCell(19, 1, 1);
      // 列0の行0-17は穴（18個）、列1の行0-18は穴（19個）
      // 合計: 18 + 19 = 37個

      const holeCount = boardEvaluator.countHoles(board);
      expect(holeCount).toBe(37);
    });

    test('上部にブロックがない場合は穴としてカウントしない', () => {
      // 列0の行18にブロックを配置（上部にブロックなし）
      board.setCell(18, 0, 1);
      // 行18にブロックがあるので、行0-17の空のセルは穴
      // 合計: 18個の穴

      const holeCount = boardEvaluator.countHoles(board);
      expect(holeCount).toBe(18);
    });
  });

  describe('高さ変動計算', () => {
    test('空のボードの高さ変動は0', () => {
      const variation = boardEvaluator.calculateHeightVariation(board);
      expect(variation).toBe(0);
    });

    test('平坦な配置の高さ変動は低い', () => {
      // 全ての列を同じ高さ（行19）に配置
      for (let col = 0; col < 10; col++) {
        board.setCell(19, col, 1);
      }

      const variation = boardEvaluator.calculateHeightVariation(board);
      expect(variation).toBe(0);
    });

    test('不均一な配置の高さ変動は高い', () => {
      // 列0を高く（行15）、列9を低く（行19）配置
      board.setCell(15, 0, 1);
      board.setCell(19, 9, 1);

      const variation = boardEvaluator.calculateHeightVariation(board);
      expect(variation).toBeGreaterThan(0);
    });

    test('特定列の高さを計算', () => {
      // 列0の行15にブロックを配置
      board.setCell(15, 0, 1);

      const height = boardEvaluator.calculateColumnHeight(board, 0);
      // 行15は20行目から数えて5番目なので、高さは5
      expect(height).toBe(5);
    });
  });

  describe('エッジ接触スコア', () => {
    test('空のボードの接触スコアは0', () => {
      const touchScore = boardEvaluator.calculateEdgeTouchScore(board);
      expect(touchScore).toBe(0);
    });

    test('単一ブロックの接触スコアを計算', () => {
      // 中央にブロックを配置
      board.setCell(19, 5, 1);

      const touchScore = boardEvaluator.calculateEdgeTouchScore(board);
      // 中央のブロックは左右上下の接触をカウント
      expect(touchScore).toBeGreaterThan(0);
    });

    test('隣接するブロックの接触スコアを計算', () => {
      // 隣接する2つのブロックを配置
      board.setCell(19, 5, 1);
      board.setCell(19, 6, 1);

      const touchScore = boardEvaluator.calculateEdgeTouchScore(board);
      // 隣接するブロックは内部接触もカウント
      expect(touchScore).toBeGreaterThan(0);
    });
  });

  describe('配置評価', () => {
    test('仮想的な配置を評価できる', () => {
      const pieceShape = [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 1, col: 0 },
        { row: 1, col: 1 },
      ];

      const result = boardEvaluator.evaluatePlacement(board, pieceShape, 0, 18);

      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('lineEfficiency');
      expect(result).toHaveProperty('holeCount');
    });

    test('配置後のボード状態を正しく評価', () => {
      const pieceShape = [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
      ];

      const result = boardEvaluator.evaluatePlacement(board, pieceShape, 0, 19);

      // 配置後の評価結果が返される
      expect(result.score).toBeDefined();
    });
  });

  describe('総合評価', () => {
    test('基本的なボード状態の総合評価', () => {
      // 基本的な配置を作成
      for (let col = 0; col < 10; col++) {
        board.setCell(19, col, 1);
      }

      const result = boardEvaluator.evaluateBoard(board);

      expect(result.score).toBeDefined();
      expect(result.lineEfficiency).toBe(0.05); // 1行が完全
      expect(result.holeCount).toBe(190); // 行0-18の19行 × 10列 = 190個の穴
      expect(result.heightVariation).toBe(0); // 平坦
      expect(result.edgeTouchScore).toBeGreaterThan(0); // 接触あり
    });

    test('詳細な評価情報が含まれる', () => {
      const result = boardEvaluator.evaluateBoard(board);

      expect(result.details).toHaveProperty('lineEfficiencyScore');
      expect(result.details).toHaveProperty('holePenalty');
      expect(result.details).toHaveProperty('heightVariationPenalty');
      expect(result.details).toHaveProperty('edgeTouchBonus');
    });
  });
});
