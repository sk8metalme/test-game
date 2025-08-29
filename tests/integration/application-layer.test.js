/**
 * application-layer.test.js - アプリケーション層統合テスト
 * 
 * @test-verification-expert との協力実装
 * ユースケース間の連携と統合テスト
 */

import GameLogic from '../../src/core/usecases/GameLogic.js';
import ScoreManager from '../../src/core/usecases/ScoreManager.js';
import CollisionDetector from '../../src/core/usecases/CollisionDetector.js';
import Board from '../../src/core/entities/Board.js';
import Tetromino from '../../src/core/entities/Tetromino.js';
import { GameState } from '../../src/core/entities/GameState.js';

describe('Application Layer Integration Tests', () => {
  let gameLogic;
  let scoreManager;
  let collisionDetector;
  let board;
  let gameState;

  beforeEach(() => {
    board = new Board();
    gameState = new GameState();
    gameLogic = new GameLogic(board, gameState);
    scoreManager = new ScoreManager(gameState);
    collisionDetector = new CollisionDetector(board);
  });

  describe('ゲーム開始からピース固定までの統合フロー', () => {
    test('完全なゲームセッションの統合', () => {
      // ゲーム開始
      const startResult = gameLogic.startGame();
      expect(startResult.success).toBe(true);
      expect(gameState.status).toBe('PLAYING');

      // 現在のピースを取得
      const currentPiece = gameLogic.getCurrentPiece();
      expect(currentPiece).toBeDefined();

      // 衝突検知テスト
      const collisionResult = collisionDetector.checkCollision(currentPiece);
      expect(collisionResult.hasCollision).toBe(false);

      // ピース移動テスト
      const moveResult = gameLogic.movePieceLeft();
      if (moveResult.success) {
        expect(currentPiece.x).toBeLessThan(5); // 初期位置より左
      }

      // スコア計算テスト
      const lineScore = scoreManager.calculateLineScore(1);
      expect(lineScore.totalScore).toBeGreaterThan(0);
    });

    test('ピース移動と衝突検知の統合', () => {
      gameLogic.startGame();
      const piece = gameLogic.getCurrentPiece();

      // 左端まで移動
      let moveCount = 0;
      while (gameLogic.movePieceLeft().success && moveCount < 10) {
        moveCount++;
      }

      // 衝突検知との整合性確認
      const leftCollision = collisionDetector.checkMovement(piece, 'left');
      expect(leftCollision.canMove).toBe(false);
      expect(leftCollision.collisionType).toBe('wall');
    });

    test('ハードドロップとスコア計算の統合', () => {
      gameLogic.startGame();
      const initialScore = gameState.score;

      // ハードドロップ実行
      const dropResult = gameLogic.hardDrop();
      expect(dropResult.success).toBe(true);
      expect(dropResult.distance).toBeGreaterThan(0);

      // スコアが加算されているか確認
      expect(gameState.score).toBeGreaterThan(initialScore);

      // スコア計算の検証
      const expectedScore = scoreManager.calculateHardDropScore(dropResult.distance);
      expect(gameState.score - initialScore).toBe(expectedScore.totalScore);
    });
  });

  describe('ライン削除とスコア計算の統合', () => {
    test('シングルライン削除の統合フロー', () => {
      gameLogic.startGame();

      // 下段を埋める（1セル残し）
      for (let col = 0; col < 9; col++) {
        board.setCell(19, col, 1);
      }

      // I字ピースで最後の1セルを埋める
      const piece = new Tetromino('I');
      piece.x = 9;
      piece.y = 16;
      piece.rotation = 1; // 縦向き
      
      // ピース配置
      board.placePiece(piece);

      // ライン削除チェック
      const clearResult = gameLogic.checkAndClearLines();
      expect(clearResult.linesCleared).toBe(1);

      // スコア検証
      const expectedLineScore = scoreManager.calculateLineScore(1);
      expect(clearResult.score).toBe(expectedLineScore.totalScore);
    });

    test('テトリス削除の統合フロー', () => {
      gameLogic.startGame();

      // 4行を埋める（I字ピース用の隙間を残して）
      for (let row = 16; row <= 19; row++) {
        for (let col = 1; col < 10; col++) {
          board.setCell(row, col, 1);
        }
      }

      // I字ピースでテトリス完成
      const piece = new Tetromino('I');
      piece.x = 0;
      piece.y = 16;
      piece.rotation = 1; // 縦向き

      // 配置可能性チェック
      const canPlace = collisionDetector.canPlacePiece(piece);
      expect(canPlace.canPlace).toBe(true);

      // ピース配置
      board.placePiece(piece);

      // テトリス削除
      const clearResult = gameLogic.checkAndClearLines();
      expect(clearResult.linesCleared).toBe(4);
      expect(clearResult.lineTypes).toContain('tetris');

      // テトリススコア検証
      const expectedScore = scoreManager.calculateLineScore(4);
      expect(clearResult.score).toBe(expectedScore.totalScore);
    });
  });

  describe('回転とWall Kickの統合', () => {
    test('Wall Kickシステムの統合', () => {
      gameLogic.startGame();

      // I字ピースを右端に配置
      const piece = new Tetromino('I');
      piece.x = 7;
      piece.y = 10;
      piece.rotation = 0; // 水平

      // 衝突検知で回転チェック
      const rotationCheck = collisionDetector.checkRotation(piece, 'clockwise');

      // Wall Kickが必要かチェック
      const wallKickCheck = collisionDetector.checkWallKick(piece, 0, 1);

      if (wallKickCheck.needsKick && wallKickCheck.validKick) {
        // Wall Kickが成功する場合
        expect(wallKickCheck.validKick.newPosition).toBeDefined();
        expect(wallKickCheck.validKick.offset).toBeDefined();
      }
    });

    test('回転不可能な状況の統合チェック', () => {
      gameLogic.startGame();

      // T字ピースを隙間の少ない場所に配置
      const piece = new Tetromino('T');
      piece.x = 4;
      piece.y = 18;

      // 周囲にブロックを配置
      board.setCell(18, 3, 1);
      board.setCell(18, 5, 1);
      board.setCell(17, 4, 1);

      // 回転チェック
      const rotationResult = collisionDetector.checkRotation(piece, 'clockwise');
      expect(rotationResult.canRotate).toBe(false);

      // GameLogicでの回転試行
      gameLogic.currentPiece = piece;
      const gameLogicRotation = gameLogic.rotatePieceClockwise();
      expect(gameLogicRotation.success).toBe(false);
    });
  });

  describe('ゲーム状態とレベル進行の統合', () => {
    test('レベルアップとドロップスピードの統合', () => {
      gameLogic.startGame();

      // 初期レベルの落下速度
      const level1Speed = scoreManager.calculateDropSpeed(1);
      expect(level1Speed).toBeGreaterThan(0);

      // レベルアップ
      gameState.updateLines(10);
      const levelUpResult = scoreManager.checkLevelUp(10);
      expect(levelUpResult.levelUp).toBe(true);
      expect(levelUpResult.newLevel).toBe(2);

      // ゲーム状態のレベル更新
      gameState.setLevel(levelUpResult.newLevel);

      // 新しいレベルの落下速度
      const level2Speed = scoreManager.calculateDropSpeed(2);
      expect(level2Speed).toBeLessThan(level1Speed);

      // GameStateの落下間隔確認
      const gameStateSpeed = gameState.getDropInterval();
      expect(gameStateSpeed).toBe(level2Speed);
    });

    test('コンボシステムの統合', () => {
      gameLogic.startGame();

      // 複数回のライン削除でコンボ
      for (let combo = 1; combo <= 3; combo++) {
        // 1行埋める
        for (let col = 0; col < 10; col++) {
          board.setCell(19, col, 1);
        }

        // ライン削除
        const clearResult = gameLogic.checkAndClearLines();
        expect(clearResult.linesCleared).toBe(1);

        // コンボスコア計算
        const comboScore = scoreManager.calculateComboScore(combo);
        expect(comboScore.comboLevel).toBe(combo);
        expect(comboScore.totalScore).toBeGreaterThan(0);
      }
    });
  });

  describe('ゴーストピースシステムの統合', () => {
    test('ゴーストピース位置計算の統合', () => {
      gameLogic.startGame();
      const piece = gameLogic.getCurrentPiece();

      // ゴーストピース位置計算
      const ghostResult = collisionDetector.calculateGhostPosition(piece);
      expect(ghostResult.ghostY).toBeGreaterThanOrEqual(piece.y);
      expect(ghostResult.distance).toBeGreaterThanOrEqual(0);

      // ハードドロップとの整合性確認
      const dropResult = gameLogic.hardDrop();
      expect(dropResult.distance).toBe(ghostResult.distance);
    });

    test('障害物がある場合のゴーストピース', () => {
      gameLogic.startGame();
      const piece = gameLogic.getCurrentPiece();

      // 障害物を配置
      board.setCell(15, piece.x, 1);

      // ゴーストピース計算
      const ghostResult = collisionDetector.calculateGhostPosition(piece);
      expect(ghostResult.ghostY).toBeLessThan(15);

      // 実際のハードドロップでの検証
      const originalY = piece.y;
      const dropResult = gameLogic.hardDrop();
      expect(dropResult.distance).toBe(ghostResult.distance);
    });
  });

  describe('エラーハンドリングの統合', () => {
    test('ゲームオーバー状態の統合処理', () => {
      gameLogic.startGame();

      // スポーン位置にブロックを配置
      board.setCell(0, 4, 1);
      board.setCell(0, 5, 1);

      // 新しいピースのスポーン試行
      const spawnResult = gameLogic.spawnNextPiece();
      expect(spawnResult.success).toBe(false);
      expect(spawnResult.gameOver).toBe(true);

      // ゲーム状態の確認
      expect(gameState.status).toBe('GAME_OVER');

      // ゲームオーバー後の操作制限
      const moveResult = gameLogic.movePieceLeft();
      expect(moveResult.success).toBe(false);
      expect(moveResult.reason).toBe('game_over');
    });

    test('無効な操作の統合的な処理', () => {
      // ゲーム開始前の操作
      const moveResult = gameLogic.movePieceLeft();
      expect(moveResult.success).toBe(false);
      expect(moveResult.reason).toBe('game_not_started');

      // 一時停止中の操作
      gameLogic.startGame();
      gameLogic.pauseGame();

      const pausedMoveResult = gameLogic.movePieceRight();
      expect(pausedMoveResult.success).toBe(false);
      expect(pausedMoveResult.reason).toBe('game_paused');
    });
  });

  describe('パフォーマンス統合テスト', () => {
    test('統合システムのパフォーマンス', () => {
      gameLogic.startGame();

      const startTime = performance.now();

      // 複合操作の実行
      for (let i = 0; i < 100; i++) {
        const piece = gameLogic.getCurrentPiece();
        
        // 衝突チェック
        collisionDetector.checkCollision(piece);
        
        // 移動チェック
        collisionDetector.checkMovement(piece, 'left');
        collisionDetector.checkMovement(piece, 'right');
        collisionDetector.checkMovement(piece, 'down');
        
        // 回転チェック
        collisionDetector.checkRotation(piece, 'clockwise');
        
        // スコア計算
        scoreManager.calculateLineScore(Math.floor(Math.random() * 4) + 1);
        scoreManager.calculateSoftDropScore(5);
        
        // ゴーストピース計算
        collisionDetector.calculateGhostPosition(piece);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(500); // 500ms以内
    });

    test('大量データでの統合パフォーマンス', () => {
      gameLogic.startGame();

      // ボードを複雑な状態にする
      for (let row = 10; row < 20; row++) {
        for (let col = 0; col < 10; col++) {
          if (Math.random() > 0.5) {
            board.setCell(row, col, 1);
          }
        }
      }

      const startTime = performance.now();

      // 統合処理の実行
      for (let i = 0; i < 50; i++) {
        const piece = gameLogic.getCurrentPiece();
        
        // ランダムな操作
        switch (Math.floor(Math.random() * 4)) {
          case 0:
            gameLogic.movePieceLeft();
            break;
          case 1:
            gameLogic.movePieceRight();
            break;
          case 2:
            gameLogic.movePieceDown();
            break;
          case 3:
            gameLogic.rotatePieceClockwise();
            break;
        }

        // ライン削除チェック
        gameLogic.checkAndClearLines();
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(1000); // 1秒以内
    });
  });

  describe('実際のゲームプレイシナリオ統合', () => {
    test('典型的なゲームプレイの統合テスト', () => {
      // ゲーム開始
      const startResult = gameLogic.startGame();
      expect(startResult.success).toBe(true);

      let totalScore = 0;
      let linesCleared = 0;

      // 10個のピースを処理
      for (let pieceCount = 0; pieceCount < 10; pieceCount++) {
        const piece = gameLogic.getCurrentPiece();
        
        // ランダムな操作を数回実行
        for (let moveCount = 0; moveCount < Math.floor(Math.random() * 10) + 1; moveCount++) {
          const operations = ['left', 'right', 'down', 'rotate'];
          const operation = operations[Math.floor(Math.random() * operations.length)];
          
          switch (operation) {
            case 'left':
              gameLogic.movePieceLeft();
              break;
            case 'right':
              gameLogic.movePieceRight();
              break;
            case 'down':
              gameLogic.movePieceDown();
              break;
            case 'rotate':
              gameLogic.rotatePieceClockwise();
              break;
          }
        }

        // ハードドロップで固定
        const dropResult = gameLogic.hardDrop();
        if (dropResult.success) {
          totalScore += scoreManager.calculateHardDropScore(dropResult.distance).totalScore;
          
          // ライン削除チェック
          const clearResult = gameLogic.checkAndClearLines();
          if (clearResult.linesCleared > 0) {
            linesCleared += clearResult.linesCleared;
            totalScore += clearResult.score;
          }
        }
      }

      // 統計確認
      expect(totalScore).toBeGreaterThanOrEqual(0);
      expect(linesCleared).toBeGreaterThanOrEqual(0);
      expect(gameState.status).toBe('PLAYING'); // ゲームは継続中
    });
  });
});
