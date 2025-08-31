/**
 * BasicAI ユニットテスト
 *
 * 基本的なAIアルゴリズムの動作を検証します。
 *
 * @fileoverview BasicAI テストスイート
 * @author Test Development Team
 * @version 1.0.0
 */

import BasicAI from '../../../src/core/usecases/BasicAI.js';
import Board from '../../../src/core/entities/Board.js';
import Tetromino from '../../../src/core/entities/Tetromino.js';

// Mock CollisionDetector
jest.mock('../../../src/core/usecases/CollisionDetector.js', () => {
  return jest.fn().mockImplementation(() => ({
    checkCollision: jest.fn().mockReturnValue(false),
  }));
});

describe('BasicAI', () => {
  let basicAI;
  let board;
  let piece;

  beforeEach(() => {
    basicAI = new BasicAI();
    board = new Board();
    piece = new Tetromino('I', { x: 0, y: 0 });
  });

  describe('初期化と設定', () => {
    test('デフォルト設定で初期化される', () => {
      const config = basicAI.getConfig();
      expect(config.searchDepth).toBe(2);
      expect(config.maxMoves).toBe(100);
      expect(config.enableRotation).toBe(true);
      expect(config.enableHold).toBe(true);
    });

    test('カスタム設定で初期化される', () => {
      const customConfig = {
        searchDepth: 3,
        enableRotation: false,
      };
      const customAI = new BasicAI(customConfig);
      const config = customAI.getConfig();

      expect(config.searchDepth).toBe(3);
      expect(config.enableRotation).toBe(false);
      expect(config.maxMoves).toBe(100); // デフォルト値
    });

    test('設定を更新できる', () => {
      const newConfig = { searchDepth: 5 };
      basicAI.updateConfig(newConfig);

      const config = basicAI.getConfig();
      expect(config.searchDepth).toBe(5);
    });
  });

  describe('最適な配置の検索', () => {
    test('空のボードで最適な配置を見つける', () => {
      // テスト内で新しいTetrominoインスタンスを作成
      const testPiece = new Tetromino('I', { x: 0, y: 0 });

      // pieceが正しく初期化されているか確認
      expect(testPiece).toBeDefined();
      expect(typeof testPiece.getOccupiedCells).toBe('function');
      expect(typeof testPiece.getWidth).toBe('function');
      expect(testPiece.getOccupiedCells().length).toBeGreaterThan(0);
      expect(testPiece.getWidth()).toBeGreaterThan(0);

      const result = basicAI.findBestMove(board, testPiece);

      expect(result).toHaveProperty('move');
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('shouldHold');
      expect(result.move).toBeDefined();
    });

    test('無効な入力でエラーが発生する', () => {
      expect(() => basicAI.findBestMove(null, piece)).toThrow(
        'BasicAI: 有効なBoardとTetrominoが必要です'
      );
      expect(() => basicAI.findBestMove(board, null)).toThrow(
        'BasicAI: 有効なBoardとTetrominoが必要です'
      );
    });
  });

  describe('可能な配置の生成', () => {
    test('空のボードで可能な配置を生成', () => {
      // テスト内で新しいTetrominoインスタンスを作成
      const testPiece = new Tetromino('I', { x: 0, y: 0 });

      // pieceが正しく初期化されているか確認
      expect(testPiece).toBeDefined();
      expect(typeof testPiece.getOccupiedCells).toBe('function');
      expect(typeof testPiece.getWidth).toBe('function');
      expect(testPiece.getOccupiedCells().length).toBeGreaterThan(0);
      expect(testPiece.getWidth()).toBeGreaterThan(0);

      const moves = basicAI.generatePossibleMoves(board, testPiece);

      expect(Array.isArray(moves)).toBe(true);
      expect(moves.length).toBeGreaterThan(0);

      // 各移動が正しい形式を持つことを確認
      for (const move of moves) {
        expect(move).toHaveProperty('x');
        expect(move).toHaveProperty('y');
        expect(move).toHaveProperty('rotation');
        expect(move).toHaveProperty('piece');
      }
    });

    test('回転が無効な場合の配置生成', () => {
      // テスト内で新しいTetrominoインスタンスを作成
      const testPiece = new Tetromino('I', { x: 0, y: 0 });

      // pieceが正しく初期化されているか確認
      expect(testPiece).toBeDefined();
      expect(typeof testPiece.getOccupiedCells).toBe('function');
      expect(typeof testPiece.getWidth).toBe('function');
      expect(testPiece.getOccupiedCells().length).toBeGreaterThan(0);
      expect(testPiece.getWidth()).toBeGreaterThan(0);

      const noRotationAI = new BasicAI({ enableRotation: false });
      const moves = noRotationAI.generatePossibleMoves(board, testPiece);

      // 回転が無効な場合、rotation=0のみ
      for (const move of moves) {
        expect(move.rotation).toBe(0);
      }
    });
  });

  describe('回転したテトロミノの作成', () => {
    test('回転したテトロミノを作成', () => {
      // テスト内で新しいTetrominoインスタンスを作成
      const testPiece = new Tetromino('I', { x: 0, y: 0 });
      const rotatedPiece = basicAI.createRotatedPiece(testPiece, 2);

      expect(rotatedPiece).toBeDefined();
      expect(rotatedPiece.rotationState).toBe(2);
    });

    test('4回転で元の状態に戻る', () => {
      // テスト内で新しいTetrominoインスタンスを作成
      const testPiece = new Tetromino('I', { x: 0, y: 0 });
      const rotatedPiece = basicAI.createRotatedPiece(testPiece, 4);

      expect(rotatedPiece.rotationState).toBe(0);
    });
  });

  describe('ドロップ位置の検索', () => {
    test('空のボードでドロップ位置を見つける', () => {
      // テスト内で新しいTetrominoインスタンスを作成
      const testPiece = new Tetromino('I', { x: 0, y: 0 });

      // pieceが正しく初期化されているか確認
      expect(testPiece).toBeDefined();
      expect(typeof testPiece.getOccupiedCells).toBe('function');
      expect(typeof testPiece.getWidth).toBe('function');
      expect(testPiece.getOccupiedCells().length).toBeGreaterThan(0);
      expect(testPiece.getWidth()).toBeGreaterThan(0);

      const y = basicAI.findDropPosition(board, testPiece, 0);

      expect(y).toBeDefined();
      expect(y).toBeGreaterThanOrEqual(0);
    });

    test('配置不可能な位置でnullを返す', () => {
      // テスト内で新しいTetrominoインスタンスを作成
      const testPiece = new Tetromino('I', { x: 0, y: 0 });
      // ボードの右端を超える位置
      const y = basicAI.findDropPosition(board, testPiece, 20);

      expect(y).toBeNull();
    });
  });

  describe('テトロミノの配置可能性チェック', () => {
    test('空のセルに配置可能', () => {
      // テスト内で新しいTetrominoインスタンスを作成
      const testPiece = new Tetromino('I', { x: 0, y: 0 });
      const canPlace = basicAI.canPlacePiece(board, testPiece, 0, 0);
      expect(canPlace).toBe(true);
    });

    test('境界外の配置は不可能', () => {
      // テスト内で新しいTetrominoインスタンスを作成
      const testPiece = new Tetromino('I', { x: 0, y: 0 });

      // まず、pieceが正しく初期化されているか確認
      expect(testPiece.getOccupiedCells().length).toBeGreaterThan(0);
      expect(testPiece.getWidth()).toBeGreaterThan(0);

      // 左端を超える配置
      const canPlace = basicAI.canPlacePiece(board, testPiece, -1, 0);
      expect(canPlace).toBe(false);

      // 上端を超える配置
      const canPlace2 = basicAI.canPlacePiece(board, testPiece, 0, -1);
      expect(canPlace2).toBe(false);

      // 右端を超える配置
      const canPlace3 = basicAI.canPlacePiece(board, testPiece, 20, 0);
      expect(canPlace3).toBe(false);

      // 下端を超える配置
      const canPlace4 = basicAI.canPlacePiece(board, testPiece, 0, 20);
      expect(canPlace4).toBe(false);
    });
  });

  describe('配置の評価', () => {
    test('配置を評価できる', () => {
      // テスト内で新しいTetrominoインスタンスを作成
      const testPiece = new Tetromino('I', { x: 0, y: 0 });
      const move = { x: 0, y: 0, rotation: 0, piece: testPiece };
      const score = basicAI.evaluateMove(board, testPiece, move, []);

      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThan(-Infinity);
    });

    test('次のピースを考慮した評価', () => {
      // テスト内で新しいTetrominoインスタンスを作成
      const testPiece = new Tetromino('I', { x: 0, y: 0 });
      const move = { x: 0, y: 0, rotation: 0, piece: testPiece };
      const nextPiece = new Tetromino('O', { x: 0, y: 0 });
      const score = basicAI.evaluateMove(board, testPiece, move, [nextPiece]);

      expect(typeof score).toBe('number');
    });
  });

  describe('仮想的なボードの作成', () => {
    test('仮想的なボードを作成', () => {
      const virtualBoard = basicAI.createVirtualBoard(board);

      expect(virtualBoard).toBeDefined();
      expect(virtualBoard).not.toBe(board);
      expect(virtualBoard.grid).toEqual(board.grid);
    });
  });

  describe('テトロミノの配置', () => {
    test('テトロミノをボードに配置', () => {
      // テスト内で新しいTetrominoインスタンスを作成
      const testPiece = new Tetromino('I', { x: 0, y: 0 });
      const testBoard = new Board();
      basicAI.placePieceOnBoard(testBoard, testPiece, 0, 0);

      // 配置されたセルが1になっているかチェック
      let hasPlacedPiece = false;
      for (let row = 0; row < testBoard.ROWS; row++) {
        for (let col = 0; col < testBoard.COLS; col++) {
          if (testBoard.getCell(row, col) === 1) {
            hasPlacedPiece = true;
            break;
          }
        }
        if (hasPlacedPiece) break;
      }

      expect(hasPlacedPiece).toBe(true);
    });
  });

  describe('ライン削除のシミュレート', () => {
    test('完全な行を削除', () => {
      const testBoard = new Board();

      // 最下段を完全に埋める
      for (let col = 0; col < testBoard.COLS; col++) {
        testBoard.setCell(19, col, 1);
      }

      const originalRow19 = testBoard.grid[19].slice();
      basicAI.simulateLineClear(testBoard);

      // 最下段が削除されているかチェック
      expect(testBoard.grid[19]).not.toEqual(originalRow19);
    });
  });

  describe('追加スコアの計算', () => {
    test('追加スコアを計算', () => {
      const move = { x: 5, y: 15, rotation: 0 };
      const score = basicAI.calculateAdditionalScore(move, []);

      expect(typeof score).toBe('number');
    });

    test('高さペナルティの適用', () => {
      const lowMove = { x: 5, y: 15, rotation: 0 };
      const highMove = { x: 5, y: 5, rotation: 0 };

      const lowScore = basicAI.calculateAdditionalScore(lowMove, []);
      const highScore = basicAI.calculateAdditionalScore(highMove, []);

      // 低い位置の方が高いスコア（y=15は低い位置、y=5は高い位置）
      // 高さペナルティ: (20 - y) * 10
      // y=15: (20-15) * 10 = 50, y=5: (20-5) * 10 = 150
      // 低い位置の方が高いスコアになるはず
      expect(lowScore).toBeGreaterThan(highScore);
    });
  });

  describe('次のピースとの相性評価', () => {
    test('Iピースとの相性を評価', () => {
      const move = { x: 4, y: 15, rotation: 0 };
      const nextPiece = new Tetromino('I', { x: 0, y: 0 });

      const score = basicAI.evaluateNextPieceCompatibility(move, nextPiece);
      expect(typeof score).toBe('number');
    });
  });

  describe('ホールドの評価', () => {
    test('ホールドを評価', () => {
      // テスト内で新しいTetrominoインスタンスを作成
      const testPiece = new Tetromino('I', { x: 0, y: 0 });
      const nextPiece = new Tetromino('O', { x: 0, y: 0 });
      const score = basicAI.evaluateHold(board, testPiece, [nextPiece]);

      expect(typeof score).toBe('number');
    });

    test('次のピースがない場合のホールド評価', () => {
      const score = basicAI.evaluateHold(board, piece, []);
      expect(score).toBe(-Infinity);
    });
  });

  describe('統合テスト', () => {
    test('基本的なAI動作の統合テスト', () => {
      // テスト内で新しいTetrominoインスタンスを作成
      const testPiece = new Tetromino('I', { x: 0, y: 0 });

      // pieceが正しく初期化されているか確認
      expect(testPiece).toBeDefined();
      expect(typeof testPiece.getOccupiedCells).toBe('function');
      expect(typeof testPiece.getWidth).toBe('function');
      expect(testPiece.getOccupiedCells().length).toBeGreaterThan(0);
      expect(testPiece.getWidth()).toBeGreaterThan(0);

      // 空のボードでIピースの最適配置を検索
      const result = basicAI.findBestMove(board, testPiece, []);

      expect(result.move).toBeDefined();
      expect(result.score).toBeGreaterThan(-Infinity);
      expect(result.shouldHold).toBe(false);

      // 移動情報の検証
      if (result.move) {
        expect(result.move.x).toBeGreaterThanOrEqual(0);
        expect(result.move.y).toBeGreaterThanOrEqual(0);
        expect(result.move.rotation).toBeGreaterThanOrEqual(0);
        expect(result.move.rotation).toBeLessThan(4);
      }
    });

    test('複数のピースを考慮したAI動作', () => {
      // テスト内で新しいTetrominoインスタンスを作成
      const testPiece = new Tetromino('I', { x: 0, y: 0 });

      // pieceが正しく初期化されているか確認
      expect(testPiece).toBeDefined();
      expect(typeof testPiece.getOccupiedCells).toBe('function');
      expect(typeof testPiece.getWidth).toBe('function');
      expect(testPiece.getOccupiedCells().length).toBeGreaterThan(0);
      expect(testPiece.getWidth()).toBeGreaterThan(0);

      const nextPiece = new Tetromino('O', { x: 0, y: 0 });
      const result = basicAI.findBestMove(board, testPiece, [nextPiece]);

      expect(result.move).toBeDefined();
      expect(result.score).toBeGreaterThan(-Infinity);
    });
  });
});
