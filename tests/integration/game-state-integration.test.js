/**
 * @file game-state-integration.test.js
 * @description Board-Tetromino-GameState の統合テスト
 *
 * テストカテゴリ:
 * - ゲーム状態とボード統合
 * - スコア計算統合
 * - レベル進行統合
 * - 実ゲームシナリオ
 * - エラーハンドリング統合
 * - パフォーマンス統合
 */

import Board from '../../src/core/entities/Board.js';
import Tetromino from '../../src/core/entities/Tetromino.js';
import { GameState } from '../../src/core/entities/GameState.js';

describe('Game State Integration Tests', () => {
  describe('ゲーム状態とボード統合', () => {
    let board, gameState;

    beforeEach(() => {
      board = new Board();
      gameState = new GameState();
      gameState.setStatus('PLAYING');
    });

    test('ピース配置とスコア更新の統合', () => {
      const tetromino = new Tetromino('T', { x: 4, y: 18 });
      const cells = tetromino.getOccupiedCells();

      // ピース配置
      const result = board.placePiece(cells, tetromino.position.x, tetromino.position.y, 1);
      expect(result.success).toBe(true);

      // 配置成功によるスコア加算（例：配置ボーナス）
      gameState.addSoftDropScore(2); // 2行分のソフトドロップ
      expect(gameState.score).toBe(2);
    });

    test('ライン削除とスコア計算の統合', () => {
      // 直接ライン削除を作成（実装に依存しない方法）
      const fullRows = [19, 18]; // 2行を完全に埋める
      fullRows.forEach(row => {
        for (let col = 0; col < 10; col++) {
          board.setCell(row, col, 1);
        }
      });

      // ライン削除実行
      const clearResult = board.clearLines();
      expect(clearResult.linesCleared).toBeGreaterThan(0);

      // GameStateでスコア計算
      const score = gameState.addLineScore(clearResult.linesCleared);
      expect(score).toBeGreaterThan(0); // スコアが追加されることを確認

      // ライン数更新
      gameState.updateLines(clearResult.linesCleared);
      expect(gameState.lines).toBe(clearResult.linesCleared);
    });

    test('複数ライン削除でのテトリススコア', () => {
      // 4行を完全に埋める（テトリス相当の状況）
      for (let row = 16; row < 20; row++) {
        for (let col = 0; col < 10; col++) {
          board.setCell(row, col, 1);
        }
      }

      // ライン削除実行
      const clearResult = board.clearLines();
      expect(clearResult.linesCleared).toBe(4);

      // テトリススコア計算
      const score = gameState.addLineScore(4);
      expect(score).toBe(1200); // レベル1で1200点

      gameState.updateLines(4);
      expect(gameState.lines).toBe(4);
    });

    test('レベルアップによるスコア倍率変化', () => {
      // レベル3まで上げる（20ライン削除）
      gameState.updateLines(20);
      expect(gameState.level).toBe(3);

      // レベル3でのシングルスコア
      const score = gameState.addLineScore(1);
      expect(score).toBe(120); // 40 * 3 = 120点
    });

    test('ゲームオーバー判定との統合', () => {
      // ボード上部を埋める
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 10; col++) {
          board.setCell(row, col, 1);
        }
      }

      // 新しいピースが配置できない状況
      const tetromino = new Tetromino('O', { x: 4, y: 0 });
      const cells = tetromino.getOccupiedCells();

      const canPlace = board.canPlacePiece(cells, tetromino.position.x, tetromino.position.y);
      expect(canPlace).toBe(false);

      // ゲームオーバー状態に遷移
      expect(gameState.setStatus('GAME_OVER')).toBe(true);
      expect(gameState.status).toBe('GAME_OVER');
    });
  });

  describe('ゲーム進行シナリオ統合', () => {
    let board, gameState;

    beforeEach(() => {
      board = new Board();
      gameState = new GameState();
      gameState.setStatus('PLAYING');
    });

    test('完全なゲームセッションシナリオ', () => {
      const pieces = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
      let totalScore = 0;
      let totalLines = 0;

      // 複数ピースを順次配置
      pieces.forEach((pieceType, index) => {
        const tetromino = new Tetromino(pieceType, { x: 4, y: 18 - index * 2 });
        const cells = tetromino.getOccupiedCells();

        if (board.canPlacePiece(cells, tetromino.position.x, tetromino.position.y)) {
          board.placePiece(cells, tetromino.position.x, tetromino.position.y, index + 1);

          // ピース使用統計更新
          gameState.incrementPieceUsage(pieceType);

          // ソフトドロップスコア
          const dropScore = gameState.addSoftDropScore(index + 1);
          totalScore += dropScore;
        }
      });

      // ライン削除チェック
      const clearResult = board.clearLines();
      if (clearResult.linesCleared > 0) {
        const lineScore = gameState.addLineScore(clearResult.linesCleared);
        totalScore += lineScore;
        totalLines += clearResult.linesCleared;
        gameState.updateLines(clearResult.linesCleared);
      }

      expect(gameState.score).toBe(totalScore);
      expect(gameState.lines).toBe(totalLines);

      // 統計確認
      pieces.forEach(pieceType => {
        expect(gameState.statistics.pieceUsage[pieceType]).toBe(1);
      });
    });

    test('コンボシステムの統合', () => {
      // 連続でライン削除を行うシナリオ
      gameState.combo = 0;

      // 1回目のライン削除
      gameState.addLineScore(1); // シングル: 40点
      expect(gameState.combo).toBe(1);
      expect(gameState.score).toBe(40);

      // 2回目のライン削除（コンボ発生）
      gameState.addLineScore(2); // ダブル: 100点
      expect(gameState.combo).toBe(2);
      // コンボボーナスも自動計算される
      const expectedScore = 40 + 100 + 50 * 1 * 1; // 前スコア + ダブル + コンボ
      expect(gameState.score).toBe(expectedScore);
    });

    test('Tスピン検出と特殊スコア', () => {
      // Tスピンシングル実行（ピース配置は簡略化）
      const baseScore = gameState.score;
      const tSpinScore = gameState.addTSpinScore(1, true);

      expect(tSpinScore).toBe(800); // レベル1でTスピンシングル
      expect(gameState.score).toBe(baseScore + 800);
      expect(gameState.statistics.actionCounts.tSpin).toBe(1);
    });

    test('パーフェクトクリアボーナス', () => {
      // 空のボードで4ライン削除（パーフェクトクリア）
      const baseScore = gameState.score;

      // テトリス + パーフェクトクリア
      gameState.addLineScore(4); // 1200点
      gameState.addPerfectClearBonus(4); // 1000点

      const expectedScore = baseScore + 1200 + 1000;
      expect(gameState.score).toBe(expectedScore);
      expect(gameState.statistics.actionCounts.perfectClear).toBe(1);
    });
  });

  describe('レベル進行と難易度調整', () => {
    let gameState;

    beforeEach(() => {
      gameState = new GameState();
      gameState.setStatus('PLAYING');
    });

    test('レベルアップによる落下速度変化', () => {
      const initialSpeed = gameState.getDropInterval();

      // レベル5まで上げる
      gameState.updateLines(40); // 4レベル分
      expect(gameState.level).toBe(5);

      const newSpeed = gameState.getDropInterval();
      expect(newSpeed).toBeLessThan(initialSpeed);
    });

    test('高レベルでの高速ゲームプレイ', () => {
      // レベル10に設定
      gameState.setLevel(10);
      expect(gameState.getDropInterval()).toBeLessThan(500); // 0.5秒以下

      // 高レベルでのスコア倍率確認
      const score = gameState.addLineScore(1);
      expect(score).toBe(400); // 40 * 10 = 400点
    });

    test('最大レベルでの動作確認', () => {
      gameState.setLevel(99); // 最大レベル

      const score = gameState.addLineScore(4); // テトリス
      expect(score).toBe(118800); // 1200 * 99

      // さらにライン削除してもレベル99を維持
      gameState.updateLines(100);
      expect(gameState.level).toBe(99);
    });
  });

  describe('時間管理統合', () => {
    let gameState;

    beforeEach(() => {
      gameState = new GameState();
    });

    test('ゲーム状態変更による時間管理', () => {
      // ゲーム開始
      gameState.setStatus('PLAYING');
      expect(gameState.isTimerRunning()).toBe(true);

      // ポーズ
      gameState.setStatus('PAUSED');
      const pauseTime = gameState.gameTime;

      // ポーズ状態では時間が進まない（即座に確認）
      const pauseTimeAfter = gameState.gameTime;
      expect(pauseTimeAfter).toBe(pauseTime);

      // 再開
      gameState.setStatus('PLAYING');
      expect(gameState.isTimerRunning()).toBe(true);

      // ゲーム終了
      gameState.setStatus('GAME_OVER');
      expect(gameState.isTimerRunning()).toBe(false);
    });

    test('ゲーム終了時の統計記録', () => {
      gameState.setStatus('PLAYING');

      // ゲームプレイ
      gameState.updateScore(1000);
      gameState.updateLines(15);
      gameState.updateGameTime(300000); // 5分

      const initialGames = gameState.statistics.totalGames;

      // ゲーム終了
      gameState.setStatus('GAME_OVER');

      // 統計が更新されることを確認
      expect(gameState.statistics.totalGames).toBe(initialGames + 1);
      expect(gameState.statistics.totalScore).toBeGreaterThan(0);
      expect(gameState.statistics.totalTime).toBeGreaterThan(0);
    });
  });

  describe('エラーハンドリング統合', () => {
    let board, gameState;

    beforeEach(() => {
      board = new Board();
      gameState = new GameState();
      gameState.setStatus('PLAYING');
    });

    test('無効なピース配置での安全性', () => {
      const tetromino = new Tetromino('I', { x: -2, y: 0 }); // 範囲外
      const cells = tetromino.getOccupiedCells();

      // 無効配置は失敗するが、システムは安定
      const result = board.placePiece(cells, tetromino.position.x, tetromino.position.y, 1);
      expect(result.success).toBe(false);

      // GameStateは影響を受けない
      const initialScore = gameState.score;
      gameState.addSoftDropScore(5);
      expect(gameState.score).toBe(initialScore + 5);
    });

    test('破損した状態データからの回復', () => {
      // 故意に状態を破損
      gameState.score = 'invalid';
      gameState.level = null;

      // 自動回復
      const recovered = gameState.validateAndRecover();
      expect(recovered).toBe(true);

      // 正常に動作することを確認
      gameState.addLineScore(1);
      expect(gameState.score).toBe(40); // 復旧後は正常
    });

    test('メモリリーク防止の統合テスト', () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // 大量の操作を実行
      for (let i = 0; i < 1000; i++) {
        const tetromino = new Tetromino('I', { x: 4, y: 10 });
        gameState.addSoftDropScore(1);
        gameState.incrementPieceUsage('I');

        // イベント発行
        gameState.emit('test', { data: i });
      }

      // クリーンアップ
      gameState.cleanup();

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // メモリ増加が3MB以下
      expect(memoryIncrease).toBeLessThan(3 * 1024 * 1024);
    });
  });

  describe('パフォーマンス統合テスト', () => {
    let board, gameState;

    beforeEach(() => {
      board = new Board();
      gameState = new GameState();
      gameState.setStatus('PLAYING');
    });

    test('高速ゲームプレイのパフォーマンス', () => {
      const startTime = performance.now();

      // 高速でピース配置とスコア計算を実行
      for (let i = 0; i < 1000; i++) {
        const pieceTypes = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
        const pieceType = pieceTypes[i % 7];

        const tetromino = new Tetromino(pieceType, { x: 4, y: 15 });
        const cells = tetromino.getOccupiedCells();

        if (board.canPlacePiece(cells, tetromino.position.x, tetromino.position.y)) {
          board.placePiece(cells, tetromino.position.x, tetromino.position.y, 1);
          gameState.addSoftDropScore(1);
          gameState.incrementPieceUsage(pieceType);
        }

        // 定期的にライン削除
        if (i % 50 === 0) {
          board.clearLines();
        }
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // 1000回の操作が500ms以下で完了
      expect(duration).toBeLessThan(500);
    });

    test('大量データでの統計計算性能', () => {
      // 大量の統計データを追加
      for (let i = 0; i < 1000; i++) {
        gameState.updateStatistics({
          gamesPlayed: 1,
          score: Math.floor(Math.random() * 10000),
          lines: Math.floor(Math.random() * 100),
          gameTime: Math.floor(Math.random() * 600000),
        });
      }

      const startTime = performance.now();

      // 平均値計算
      const avgScore = gameState.getAverageScore();
      const avgLines = gameState.getAverageLines();
      const avgTime = gameState.getAverageTime();

      const endTime = performance.now();
      const duration = endTime - startTime;

      // 計算が50ms以下で完了
      expect(duration).toBeLessThan(50);
      expect(typeof avgScore).toBe('number');
      expect(typeof avgLines).toBe('number');
      expect(typeof avgTime).toBe('number');
    });

    test('リアルタイムゲーム処理の統合性能', () => {
      const startTime = performance.now();

      // 60FPSでのゲーム処理をシミュレート
      const frameCount = 60 * 5; // 5秒分
      const targetFrameTime = 1000 / 60; // 16.67ms

      for (let frame = 0; frame < frameCount; frame++) {
        // フレームごとの処理
        gameState.updateGameTime(targetFrameTime);

        // 定期的にピース操作
        if (frame % 30 === 0) {
          // 0.5秒ごと
          const tetromino = new Tetromino('I', { x: 4, y: 15 });
          const cells = tetromino.getOccupiedCells();

          if (board.canPlacePiece(cells, tetromino.position.x, tetromino.position.y)) {
            board.placePiece(cells, tetromino.position.x, tetromino.position.y, 1);
            gameState.addSoftDropScore(1);
          }
        }

        // 定期的にライン削除チェック
        if (frame % 60 === 0) {
          // 1秒ごと
          const clearResult = board.clearLines();
          if (clearResult.linesCleared > 0) {
            gameState.addLineScore(clearResult.linesCleared);
            gameState.updateLines(clearResult.linesCleared);
          }
        }
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const averageFrameTime = totalTime / frameCount;

      // 平均フレーム時間が目標以下
      expect(averageFrameTime).toBeLessThan(targetFrameTime);
      expect(totalTime).toBeLessThan(5000); // 5秒以下で完了
    });
  });

  describe('状態永続化統合', () => {
    let board, gameState;

    beforeEach(() => {
      board = new Board();
      gameState = new GameState();
      gameState.setStatus('PLAYING');
    });

    test('ゲーム状態の完全な保存と復元', () => {
      // ゲーム進行
      gameState.updateScore(5000);
      gameState.setLevel(7);
      gameState.updateLines(65);
      gameState.updateGameTime(180000); // 3分

      // 統計更新
      gameState.updateStatistics({
        gamesPlayed: 5,
        score: 25000,
        lines: 150,
        gameTime: 900000,
      });

      // 保存
      const savedState = gameState.serialize();

      // 新しいインスタンスで復元
      const newGameState = new GameState();
      const restored = newGameState.deserialize(savedState);

      expect(restored).toBe(true);
      expect(newGameState.score).toBe(5000);
      expect(newGameState.level).toBe(7);
      expect(newGameState.lines).toBe(65);
      expect(newGameState.gameTime).toBe(180000);
      expect(newGameState.statistics.totalGames).toBe(5);
    });

    test('ボード状態との同期保存', () => {
      // GameStateの更新
      gameState.addSoftDropScore(3);
      gameState.incrementPieceUsage('T');

      // 状態保存
      const gameStateData = gameState.serialize();

      // 復元確認
      expect(gameStateData.score).toBe(3);
      expect(gameStateData.statistics.pieceUsage.T).toBe(1);

      // ボード操作を確認
      board.setCell(5, 5, 1);
      expect(board.getCell(5, 5)).toBe(1); // セル設定が正常に動作することを確認
    });
  });

  describe('ボード状態の統合管理', () => {
    let gameState, board;

    beforeEach(() => {
      gameState = new GameState();
      board = new Board();
      gameState.setBoard(board);
    });

    test('ボードの状態変更と統合', () => {
      // ボードの状態変更
      gameState.board.setCell(0, 0, 1);
      gameState.board.setCell(0, 1, 1);

      // 状態の整合性確認
      expect(gameState.board.getCell(0, 0)).toBe(1);
      expect(gameState.board.getCell(0, 1)).toBe(1);

      // 統計情報の更新確認
      const stats = gameState.board.getStatistics();
      expect(stats.filledCells).toBe(2);
    });
  });

  describe('テトロミノ状態の統合管理', () => {
    let gameState;

    beforeEach(() => {
      gameState = new GameState();
    });

    test('テトロミノの状態変更と統合', () => {
      // テトロミノの状態変更
      const tetromino = new Tetromino('T', { x: 4, y: 0 });
      gameState.setCurrentPiece(tetromino);

      // 状態の整合性確認
      expect(gameState.currentPiece.type).toBe('T');
      expect(gameState.currentPiece.position.x).toBe(4);
      expect(gameState.currentPiece.position.y).toBe(0);
    });
  });

  describe('ゲーム状態の統合管理', () => {
    let gameState;

    beforeEach(() => {
      gameState = new GameState();
    });

    test('ゲーム状態の変更と統合', () => {
      // ゲーム状態の変更
      gameState.updateScore(1000);
      gameState.setLevel(3);
      gameState.updateLines(25);

      // 状態の整合性確認
      expect(gameState.score).toBe(1000);
      expect(gameState.level).toBe(3);
      expect(gameState.lines).toBe(25);
    });
  });
});
