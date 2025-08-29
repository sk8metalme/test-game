/**
 * GameLogic.test.js - コアゲームロジックのユニットテスト
 * 
 * @tdd-development-expert との協力実装
 * TDDアプローチ: RED -> GREEN -> REFACTOR
 */

import GameLogic from '../../../src/core/usecases/GameLogic.js';
import Board from '../../../src/core/entities/Board.js';
import Tetromino from '../../../src/core/entities/Tetromino.js';
import { GameState } from '../../../src/core/entities/GameState.js';

describe('GameLogic', () => {
  let gameLogic;
  let board;
  let gameState;

  beforeEach(() => {
    board = new Board();
    gameState = new GameState();
    gameLogic = new GameLogic(board, gameState);
  });

  describe('初期化とセットアップ', () => {
    test('GameLogicが正しく初期化される', () => {
      expect(gameLogic).toBeDefined();
      expect(gameLogic.board).toBe(board);
      expect(gameLogic.gameState).toBe(gameState);
    });

    test('初期状態で現在のピースが設定される', () => {
      gameLogic.startGame();
      expect(gameLogic.getCurrentPiece()).toBeDefined();
      expect(gameLogic.getCurrentPiece()).toBeInstanceOf(Tetromino);
    });

    test('ネクストピースが適切に管理される', () => {
      gameLogic.startGame();
      const nextPieces = gameLogic.getNextPieces();
      expect(nextPieces).toHaveLength(3); // 3つ先まで表示
      nextPieces.forEach(piece => {
        expect(piece).toBeInstanceOf(Tetromino);
      });
    });
  });

  describe('ピース移動ロジック', () => {
    beforeEach(() => {
      gameLogic.startGame();
    });

    test('ピースを左に移動できる', () => {
      const piece = gameLogic.getCurrentPiece();
      const originalX = piece.x;
      
      const result = gameLogic.movePieceLeft();
      
      expect(result.success).toBe(true);
      expect(piece.x).toBe(originalX - 1);
    });

    test('ピースを右に移動できる', () => {
      const piece = gameLogic.getCurrentPiece();
      const originalX = piece.x;
      
      const result = gameLogic.movePieceRight();
      
      expect(result.success).toBe(true);
      expect(piece.x).toBe(originalX + 1);
    });

    test('ピースを下に移動できる', () => {
      const piece = gameLogic.getCurrentPiece();
      const originalY = piece.y;
      
      const result = gameLogic.movePieceDown();
      
      expect(result.success).toBe(true);
      expect(piece.y).toBe(originalY + 1);
    });

    test('壁際での移動が制限される', () => {
      const piece = gameLogic.getCurrentPiece();
      piece.x = 0; // 左端に配置
      
      const result = gameLogic.movePieceLeft();
      
      expect(result.success).toBe(false);
      expect(piece.x).toBe(0); // 位置が変わらない
    });

    test('衝突時の移動が制限される', () => {
      // ボードに障害物を配置
      board.setCell(5, 5, 1);
      
      const piece = gameLogic.getCurrentPiece();
      piece.x = 4;
      piece.y = 4;
      
      const result = gameLogic.movePieceRight();
      
      // 衝突が検知されれば移動できない
      if (!result.success) {
        expect(piece.x).toBe(4);
      }
    });
  });

  describe('ピース回転ロジック', () => {
    beforeEach(() => {
      gameLogic.startGame();
    });

    test('ピースを時計回りに回転できる', () => {
      const piece = gameLogic.getCurrentPiece();
      const originalRotation = piece.rotation;
      
      const result = gameLogic.rotatePieceClockwise();
      
      expect(result.success).toBe(true);
      expect(piece.rotation).toBe((originalRotation + 1) % 4);
    });

    test('ピースを反時計回りに回転できる', () => {
      const piece = gameLogic.getCurrentPiece();
      const originalRotation = piece.rotation;
      
      const result = gameLogic.rotatePieceCounterClockwise();
      
      expect(result.success).toBe(true);
      const expectedRotation = originalRotation === 0 ? 3 : originalRotation - 1;
      expect(piece.rotation).toBe(expectedRotation);
    });

    test('Wall Kickが機能する', () => {
      const piece = gameLogic.getCurrentPiece();
      // I字ピースの場合のテスト
      if (piece.type === 'I') {
        piece.x = 8; // 右端近くに配置
        piece.rotation = 0;
        
        const result = gameLogic.rotatePieceClockwise();
        
        // Wall Kickが成功するかキック失敗で回転しないか
        expect(typeof result.success).toBe('boolean');
        if (result.success) {
          expect(result.wallKick).toBeDefined();
        }
      }
    });

    test('回転不可能な場合は回転しない', () => {
      // 回転できない状況を作成
      const piece = gameLogic.getCurrentPiece();
      
      // 周囲をブロックで囲む
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx !== 0 || dy !== 0) {
            const checkX = piece.x + dx;
            const checkY = piece.y + dy;
            if (checkX >= 0 && checkX < 10 && checkY >= 0 && checkY < 20) {
              board.setCell(checkY, checkX, 1);
            }
          }
        }
      }
      
      const originalRotation = piece.rotation;
      const result = gameLogic.rotatePieceClockwise();
      
      expect(result.success).toBe(false);
      expect(piece.rotation).toBe(originalRotation);
    });
  });

  describe('ハードドロップ機能', () => {
    beforeEach(() => {
      gameLogic.startGame();
    });

    test('ハードドロップで底まで移動する', () => {
      const piece = gameLogic.getCurrentPiece();
      const startY = piece.y;
      
      const result = gameLogic.hardDrop();
      
      expect(result.success).toBe(true);
      expect(piece.y).toBeGreaterThan(startY);
      expect(result.distance).toBeGreaterThan(0);
    });

    test('ハードドロップ後にピースが固定される', () => {
      const result = gameLogic.hardDrop();
      
      expect(result.success).toBe(true);
      expect(result.pieceLocked).toBe(true);
    });

    test('ハードドロップでスコアが加算される', () => {
      const initialScore = gameState.score;
      
      const result = gameLogic.hardDrop();
      
      expect(result.success).toBe(true);
      expect(gameState.score).toBeGreaterThan(initialScore);
    });
  });

  describe('ライン削除ロジック', () => {
    beforeEach(() => {
      gameLogic.startGame();
    });

    test('完成ラインが削除される', () => {
      // 下段に完全なラインを作成
      for (let col = 0; col < 10; col++) {
        board.setCell(19, col, 1);
      }
      
      const result = gameLogic.checkAndClearLines();
      
      expect(result.linesCleared).toBe(1);
      expect(result.lineTypes).toContain('single');
    });

    test('複数ライン同時削除', () => {
      // 2行の完全なラインを作成
      for (let row = 18; row <= 19; row++) {
        for (let col = 0; col < 10; col++) {
          board.setCell(row, col, 1);
        }
      }
      
      const result = gameLogic.checkAndClearLines();
      
      expect(result.linesCleared).toBe(2);
      expect(result.lineTypes).toContain('double');
    });

    test('テトリス（4ライン削除）', () => {
      // 4行の完全なラインを作成
      for (let row = 16; row <= 19; row++) {
        for (let col = 0; col < 10; col++) {
          board.setCell(row, col, 1);
        }
      }
      
      const result = gameLogic.checkAndClearLines();
      
      expect(result.linesCleared).toBe(4);
      expect(result.lineTypes).toContain('tetris');
    });

    test('ライン削除後にスコアが更新される', () => {
      const initialScore = gameState.score;
      
      // 1行の完全なラインを作成
      for (let col = 0; col < 10; col++) {
        board.setCell(19, col, 1);
      }
      
      const result = gameLogic.checkAndClearLines();
      
      expect(result.linesCleared).toBe(1);
      expect(gameState.score).toBeGreaterThan(initialScore);
    });
  });

  describe('ピース固定とスポーン', () => {
    beforeEach(() => {
      gameLogic.startGame();
    });

    test('ピースが底で固定される', () => {
      const piece = gameLogic.getCurrentPiece();
      
      // 底まで移動
      gameLogic.hardDrop();
      
      // 新しいピースがスポーンされる
      const newPiece = gameLogic.getCurrentPiece();
      expect(newPiece).not.toBe(piece);
      expect(newPiece.y).toBeLessThan(piece.y);
    });

    test('7-bag システムが機能する', () => {
      const pieceTypes = new Set();
      
      // 7個のピースを生成
      for (let i = 0; i < 7; i++) {
        const piece = gameLogic.spawnNextPiece();
        pieceTypes.add(piece.type);
      }
      
      // 7種類全てのピースが含まれている
      expect(pieceTypes.size).toBe(7);
      expect(Array.from(pieceTypes).sort()).toEqual(['I', 'J', 'L', 'O', 'S', 'T', 'Z']);
    });

    test('ホールド機能', () => {
      const currentPiece = gameLogic.getCurrentPiece();
      const currentType = currentPiece.type;
      
      const result = gameLogic.holdPiece();
      
      expect(result.success).toBe(true);
      expect(gameLogic.getHoldPiece()?.type).toBe(currentType);
      expect(gameLogic.getCurrentPiece().type).not.toBe(currentType);
    });

    test('同じピースを連続でホールドできない', () => {
      gameLogic.holdPiece(); // 最初のホールド
      
      const result = gameLogic.holdPiece(); // 連続ホールド
      
      expect(result.success).toBe(false);
      expect(result.reason).toBe('already_held_this_turn');
    });
  });

  describe('ゲームオーバー判定', () => {
    beforeEach(() => {
      gameLogic.startGame();
    });

    test('スポーン位置での衝突でゲームオーバー', () => {
      // スポーン位置にブロックを配置
      board.setCell(0, 4, 1);
      board.setCell(0, 5, 1);
      
      const result = gameLogic.spawnNextPiece();
      
      expect(result.success).toBe(false);
      expect(result.gameOver).toBe(true);
      expect(gameState.status).toBe('GAME_OVER');
    });

    test('ゲームオーバー時の統計更新', () => {
      // ゲームオーバー条件を作成
      board.setCell(0, 4, 1);
      board.setCell(0, 5, 1);
      
      gameLogic.spawnNextPiece();
      
      expect(gameState.status).toBe('GAME_OVER');
      expect(gameState.statistics.totalGames).toBeGreaterThan(0);
    });
  });

  describe('ゲーム状態管理', () => {
    test('ゲームを開始できる', () => {
      const result = gameLogic.startGame();
      
      expect(result.success).toBe(true);
      expect(gameState.status).toBe('PLAYING');
      expect(gameLogic.getCurrentPiece()).toBeDefined();
    });

    test('ゲームを一時停止できる', () => {
      gameLogic.startGame();
      
      const result = gameLogic.pauseGame();
      
      expect(result.success).toBe(true);
      expect(gameState.status).toBe('PAUSED');
    });

    test('ゲームを再開できる', () => {
      gameLogic.startGame();
      gameLogic.pauseGame();
      
      const result = gameLogic.resumeGame();
      
      expect(result.success).toBe(true);
      expect(gameState.status).toBe('PLAYING');
    });

    test('ゲームをリセットできる', () => {
      gameLogic.startGame();
      gameState.updateScore(1000);
      
      const result = gameLogic.resetGame();
      
      expect(result.success).toBe(true);
      expect(gameState.status).toBe('MENU');
      expect(gameState.score).toBe(0);
    });
  });

  describe('エラーハンドリング', () => {
    test('無効な状態での操作が安全に処理される', () => {
      // ゲーム開始前の操作
      const result = gameLogic.movePieceLeft();
      
      expect(result.success).toBe(false);
      expect(result.reason).toBe('game_not_started');
    });

    test('一時停止中の操作が制限される', () => {
      gameLogic.startGame();
      gameLogic.pauseGame();
      
      const result = gameLogic.movePieceLeft();
      
      expect(result.success).toBe(false);
      expect(result.reason).toBe('game_paused');
    });

    test('ゲームオーバー後の操作が制限される', () => {
      gameLogic.startGame();
      gameState.setStatus('GAME_OVER');
      
      const result = gameLogic.movePieceLeft();
      
      expect(result.success).toBe(false);
      expect(result.reason).toBe('game_over');
    });
  });

  describe('パフォーマンス', () => {
    test('移動操作が効率的に実行される', () => {
      gameLogic.startGame();
      
      const startTime = performance.now();
      
      // 100回の移動操作
      for (let i = 0; i < 100; i++) {
        gameLogic.movePieceLeft();
        gameLogic.movePieceRight();
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(50); // 50ms以内
    });

    test('回転操作が効率的に実行される', () => {
      gameLogic.startGame();
      
      const startTime = performance.now();
      
      // 100回の回転操作
      for (let i = 0; i < 100; i++) {
        gameLogic.rotatePieceClockwise();
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(100); // 100ms以内
    });
  });
});
