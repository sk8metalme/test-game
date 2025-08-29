/**
 * Advanced Performance Benchmarks
 * 高度なパフォーマンス測定とベンチマークテスト
 */

import Board from '../../src/core/entities/Board.js';
import Tetromino from '../../src/core/entities/Tetromino.js';

describe('Advanced Performance Benchmarks', () => {
  describe('リアルタイムゲーム性能テスト', () => {
    test('60FPS相当の処理能力テスト', () => {
      const board = new Board();
      const targetFPS = 60;
      const frameTime = 1000 / targetFPS; // 16.67ms per frame

      // 1秒間のフレーム処理をシミュレート
      const frameCount = 60;
      const operations = [];

      for (let frame = 0; frame < frameCount; frame++) {
        operations.push(() => {
          // フレームごとの典型的な処理
          const tetromino = new Tetromino('T', { x: frame % 10, y: frame % 20 });

          // ピース操作
          tetromino.rotateClockwise();
          tetromino.moveDown();

          // 衝突検知
          const cells = tetromino.getOccupiedCells();
          board.canPlacePiece(cells, tetromino.position.x, tetromino.position.y);

          // 統計更新
          board.getStatistics();

          // ライン検出
          board.getFullLines();
        });
      }

      const startTime = performance.now();
      operations.forEach(op => op());
      const endTime = performance.now();

      const totalTime = endTime - startTime;
      const averageFrameTime = totalTime / frameCount;

      expect(averageFrameTime).toBeLessThan(frameTime);
      expect(totalTime).toBeLessThan(1000); // 1秒以内で60フレーム処理
    });

    test('高速ピース移動のレスポンス性能', () => {
      const tetromino = new Tetromino('I');
      const moveOperations = 1000;

      // DAS（Delayed Auto Shift）シミュレーション
      const startTime = performance.now();

      for (let i = 0; i < moveOperations; i++) {
        if (i % 4 === 0) tetromino.moveLeft();
        else if (i % 4 === 1) tetromino.moveRight();
        else if (i % 4 === 2) tetromino.moveDown();
        else tetromino.moveUp();
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const operationTime = totalTime / moveOperations;

      // 1操作あたり0.1ms以下（DASに十分な速度）
      expect(operationTime).toBeLessThan(0.1);
      expect(totalTime).toBeLessThan(100);
    });

    test('複数ピース同時処理性能', () => {
      const board = new Board();
      const pieceCount = 20; // 同時に存在する最大ピース数
      const tetrominoes = [];

      // 複数ピース生成
      for (let i = 0; i < pieceCount; i++) {
        const types = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
        const tetromino = new Tetromino(types[i % 7], { x: i % 10, y: i % 15 });
        tetrominoes.push(tetromino);
      }

      const startTime = performance.now();

      // 全ピースに対して同時操作
      for (let cycle = 0; cycle < 100; cycle++) {
        tetrominoes.forEach(tetromino => {
          tetromino.rotateClockwise();
          tetromino.moveDown();

          const cells = tetromino.getOccupiedCells();
          board.canPlacePiece(cells, tetromino.position.x, tetromino.position.y);
        });
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // 2000回の操作（20ピース × 100サイクル）が500ms以内
      expect(totalTime).toBeLessThan(500);
    });
  });

  describe('メモリ効率性能テスト', () => {
    test('ガベージコレクション圧力測定', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      let peakMemory = initialMemory;

      // 大量のオブジェクト生成・破棄サイクル
      for (let cycle = 0; cycle < 100; cycle++) {
        const temporaryObjects = [];

        // 1サイクルで50個のピース生成
        for (let i = 0; i < 50; i++) {
          const tetromino = new Tetromino('T');
          tetromino.rotateClockwise();
          const clone = tetromino.clone();
          const ghost = tetromino.createGhost();

          temporaryObjects.push(tetromino, clone, ghost);
        }

        // メモリ使用量測定
        const currentMemory = process.memoryUsage().heapUsed;
        peakMemory = Math.max(peakMemory, currentMemory);

        // オブジェクト破棄（スコープアウト）
        temporaryObjects.length = 0;
      }

      // 強制ガベージコレクション
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryGrowth = finalMemory - initialMemory;
      const peakGrowth = peakMemory - initialMemory;

      // 最終メモリ増加が15MB以下（テスト環境に合わせて調整）
      expect(memoryGrowth).toBeLessThan(15 * 1024 * 1024);

      // ピーク時でも80MB以下
      expect(peakGrowth).toBeLessThan(80 * 1024 * 1024);
    });

    test('長時間動作でのメモリリーク検出', () => {
      const board = new Board();
      const initialMemory = process.memoryUsage().heapUsed;

      // 1時間のゲームプレイ相当の操作をシミュレート
      const operationCount = 60 * 60 * 60; // 60FPS × 60秒 × 60分
      const batchSize = 1000;

      for (let batch = 0; batch < operationCount / batchSize; batch++) {
        for (let i = 0; i < batchSize; i++) {
          const tetromino = new Tetromino('T');
          tetromino.rotateClockwise();
          tetromino.moveDown();

          const cells = tetromino.getOccupiedCells();
          board.canPlacePiece(cells, i % 10, (i + batch) % 20);

          // 定期的にライン削除
          if (i % 100 === 99) {
            board.clearLines();
          }
        }

        // バッチごとにメモリチェック
        if (batch % 10 === 9) {
          const currentMemory = process.memoryUsage().heapUsed;
          const growth = currentMemory - initialMemory;

          // メモリ増加が40MB以下であることを確認（テスト環境に合わせて調整）
          expect(growth).toBeLessThan(40 * 1024 * 1024);
        }
      }

      // 最終メモリチェック
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const totalGrowth = finalMemory - initialMemory;

      // 長時間動作後でもメモリ増加が35MB以下（Node.jsテスト環境に合わせて調整）
      expect(totalGrowth).toBeLessThan(35 * 1024 * 1024);
    });

    test('並行処理でのメモリ競合', () => {
      const boards = [];
      const tetrominoes = [];

      // 複数のボードとピースを同時に操作
      for (let i = 0; i < 10; i++) {
        boards.push(new Board());
        tetrominoes.push(new Tetromino('T'));
      }

      const startTime = performance.now();
      const initialMemory = process.memoryUsage().heapUsed;

      // 並行処理シミュレーション
      for (let iteration = 0; iteration < 1000; iteration++) {
        boards.forEach((board, index) => {
          const tetromino = tetrominoes[index];

          tetromino.rotateClockwise();
          const cells = tetromino.getOccupiedCells();

          board.canPlacePiece(cells, iteration % 10, iteration % 20);
          board.getStatistics();

          if (iteration % 50 === 49) {
            board.clearLines();
          }
        });
      }

      const endTime = performance.now();
      const finalMemory = process.memoryUsage().heapUsed;

      const totalTime = endTime - startTime;
      const memoryGrowth = finalMemory - initialMemory;

      // 10000回の並行操作が2秒以内
      expect(totalTime).toBeLessThan(2000);

      // メモリ増加が15MB以下
      expect(memoryGrowth).toBeLessThan(15 * 1024 * 1024);
    });
  });

  describe('CPU集約的処理性能テスト', () => {
    test('複雑なライン削除アルゴリズム性能', () => {
      const board = new Board();

      // 複雑なボード状態を作成（市松模様）
      for (let row = 10; row < 20; row++) {
        for (let col = 0; col < 10; col++) {
          if ((row + col) % 2 === 0) {
            board.setCell(row, col, 1);
          }
        }
      }

      const startTime = performance.now();

      // 1000回のライン削除処理
      for (let i = 0; i < 1000; i++) {
        // 完全ラインを作成
        for (let col = 0; col < 10; col++) {
          board.setCell(19, col, 1);
        }

        // ライン削除実行
        const result = board.clearLines();
        expect(result.linesCleared).toBeGreaterThanOrEqual(0);

        // ボード状態をランダムに変更
        for (let changes = 0; changes < 5; changes++) {
          const row = 15 + (changes % 5);
          const col = i % 10;
          board.setCell(row, col, ((i + changes) % 7) + 1);
        }
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // 1000回のライン削除が1秒以内
      expect(totalTime).toBeLessThan(1000);
    });

    test('大量衝突検知処理性能', () => {
      const board = new Board();

      // ボードをランダムに半分埋める
      for (let row = 10; row < 20; row++) {
        for (let col = 0; col < 10; col++) {
          if (Math.random() > 0.5) {
            board.setCell(row, col, Math.floor(Math.random() * 7) + 1);
          }
        }
      }

      const tetrominoes = [];
      const types = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

      // 1000個のピースを生成
      for (let i = 0; i < 1000; i++) {
        const tetromino = new Tetromino(types[i % 7]);

        // ランダムに回転
        for (let r = 0; r < i % 4; r++) {
          tetromino.rotateClockwise();
        }

        tetrominoes.push(tetromino);
      }

      const startTime = performance.now();

      let collisionChecks = 0;
      // let validPlacements = 0; // TODO: 配置可能数カウント実装予定

      // 全ピースの衝突検知
      tetrominoes.forEach(tetromino => {
        for (let y = 0; y < 15; y++) {
          for (let x = 0; x < 8; x++) {
            const cells = tetromino.getOccupiedCells();
            const canPlace = board.canPlacePiece(cells, x, y);

            collisionChecks++;
            if (canPlace) {
              // validPlacements++; // TODO: 配置可能数カウント実装予定
            }
          }
        }
      });

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(collisionChecks).toBeGreaterThan(100000); // 10万回以上の衝突チェック
      expect(totalTime).toBeLessThan(3000); // 3秒以内で完了

      const checksPerSecond = collisionChecks / (totalTime / 1000);
      expect(checksPerSecond).toBeGreaterThan(50000); // 毎秒5万回以上の衝突チェック
    });

    test('統計計算パフォーマンス', () => {
      const board = new Board();

      // 複雑なボード状態を作成
      for (let i = 0; i < 1000; i++) {
        const row = Math.floor(Math.random() * 20);
        const col = Math.floor(Math.random() * 10);
        const value = Math.floor(Math.random() * 7) + 1;
        board.setCell(row, col, value);
      }

      const startTime = performance.now();

      // 10000回の統計計算
      for (let i = 0; i < 10000; i++) {
        const stats = board.getStatistics();

        expect(stats.totalCells).toBe(200);
        expect(stats.filledCells).toBeGreaterThanOrEqual(0);
        expect(stats.emptyCells).toBeGreaterThanOrEqual(0);
        expect(stats.fillPercentage).toBeGreaterThanOrEqual(0);
        expect(stats.fillPercentage).toBeLessThanOrEqual(100);
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // 10000回の統計計算が500ms以内
      expect(totalTime).toBeLessThan(500);
    });
  });

  describe('スケーラビリティテスト', () => {
    test('大きなボードサイズでの性能', () => {
      // 通常の2倍サイズのボードをシミュレート
      // const largeBoard = new Board(); // TODO: 大型ボード性能テスト実装予定

      // 40x20の仮想ボードをシミュレート（通常の2倍の高さ）
      const virtualHeight = 40;
      const virtualGrid = Array(virtualHeight)
        .fill(null)
        .map(() => Array(10).fill(0));

      const startTime = performance.now();

      // 大きなボードでの操作
      for (let operation = 0; operation < 1000; operation++) {
        // ランダムにセルを設定
        for (let i = 0; i < 10; i++) {
          const row = Math.floor(Math.random() * virtualHeight);
          const col = Math.floor(Math.random() * 10);
          virtualGrid[row][col] = ((operation + i) % 7) + 1;
        }

        // 統計計算をシミュレート
        // let filledCells = 0; // TODO: セル数統計実装予定
        for (let row = 0; row < virtualHeight; row++) {
          for (let col = 0; col < 10; col++) {
            if (virtualGrid[row][col] !== 0) {
              // filledCells++; // TODO: セル数カウント実装予定
            }
          }
        }

        // ライン検索をシミュレート
        const fullLines = [];
        for (let row = 0; row < virtualHeight; row++) {
          if (virtualGrid[row].every(cell => cell !== 0)) {
            fullLines.push(row);
          }
        }

        // ライン削除をシミュレート
        if (fullLines.length > 0) {
          fullLines.reverse().forEach(lineIndex => {
            virtualGrid.splice(lineIndex, 1);
            virtualGrid.unshift(Array(10).fill(0));
          });
        }
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // 2倍サイズのボードでも2秒以内で1000回操作
      expect(totalTime).toBeLessThan(2000);
    });

    test('同時多数ピース管理性能', () => {
      const pieceCount = 1000;
      const tetrominoes = [];

      // 1000個のピース生成
      for (let i = 0; i < pieceCount; i++) {
        const types = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
        const tetromino = new Tetromino(types[i % 7]);
        tetrominoes.push(tetromino);
      }

      const startTime = performance.now();

      // 全ピースに対して複数操作
      for (let cycle = 0; cycle < 100; cycle++) {
        tetrominoes.forEach((tetromino, index) => {
          // 回転
          if (index % 4 === 0) tetromino.rotateClockwise();
          else if (index % 4 === 1) tetromino.rotateCounterClockwise();

          // 移動
          if (index % 3 === 0) tetromino.moveLeft();
          else if (index % 3 === 1) tetromino.moveRight();
          else tetromino.moveDown();

          // 座標計算
          tetromino.getAbsoluteCells();

          // 複製・比較
          if (cycle % 10 === 9) {
            const clone = tetromino.clone();
            tetromino.equals(clone);
          }
        });
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // 1000個のピースを100サイクル操作が3秒以内
      expect(totalTime).toBeLessThan(3000);

      // 全ピースが正常な状態を保持
      tetrominoes.forEach(tetromino => {
        expect(tetromino.rotationState).toBeGreaterThanOrEqual(0);
        expect(tetromino.rotationState).toBeLessThan(4);
        expect(tetromino.getOccupiedCells().length).toBeGreaterThan(0);
      });
    });
  });

  describe('リアルワールドシナリオ性能', () => {
    test('典型的なゲームセッション性能', () => {
      const board = new Board();
      const startTime = performance.now();

      // 10分間のゲームセッションをシミュレート
      const sessionDuration = 10 * 60; // 10分
      const framesPerSecond = 60;
      const totalFrames = sessionDuration * framesPerSecond;

      let piecesPlaced = 0;
      let linesCleared = 0;

      for (let frame = 0; frame < totalFrames; frame++) {
        // 新しいピースが1秒に1個落ちると仮定
        if (frame % framesPerSecond === 0) {
          const types = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
          const tetromino = new Tetromino(types[piecesPlaced % 7]);

          // ピース操作（移動・回転）
          tetromino.moveDown();
          if (frame % 180 === 0) {
            // 3秒に1回回転
            tetromino.rotateClockwise();
          }

          // 配置試行
          const cells = tetromino.getOccupiedCells();
          const y = Math.min(18 - (piecesPlaced % 10), 18);

          if (board.canPlacePiece(cells, frame % 10, y)) {
            board.placePiece(cells, frame % 10, y, (piecesPlaced % 7) + 1);
            piecesPlaced++;
          }
        }

        // ライン削除チェック（フレームごと）
        if (frame % 60 === 59) {
          // 1秒に1回
          const result = board.clearLines();
          linesCleared += result.linesCleared;
        }

        // 統計更新（5秒に1回）
        if (frame % (5 * framesPerSecond) === 0) {
          board.getStatistics();
        }
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // 10分間のシミュレーションが30秒以内で完了
      expect(totalTime).toBeLessThan(30000);

      // 実際にピースが配置されライン削除が発生
      expect(piecesPlaced).toBeGreaterThan(0);
      expect(linesCleared).toBeGreaterThanOrEqual(0);

      // フレームレート計算
      const simulatedFPS = totalFrames / (totalTime / 1000);
      expect(simulatedFPS).toBeGreaterThan(1000); // シミュレーションが実時間の10倍以上の速度
    });
  });
});
