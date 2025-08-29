import Board from '../../../src/core/entities/Board.js';

describe('Board - Advanced Features', () => {
  describe('ライン削除ロジック', () => {
    let board;

    beforeEach(() => {
      board = new Board();
    });

    test('単一ライン削除とボード更新', () => {
      // 19行目と18行目にピースを配置
      for (let col = 0; col < 10; col++) {
        board.setCell(19, col, 1); // 最下行を完全に埋める
        if (col < 5) {
          board.setCell(18, col, 2); // 18行目を部分的に埋める
        }
      }

      const result = board.clearLines();
      
      expect(result.linesCleared).toBe(1);
      expect(result.clearedRows).toEqual([19]);
      
      // 18行目が19行目に移動していることを確認
      for (let col = 0; col < 5; col++) {
        expect(board.getCell(19, col)).toBe(2);
      }
      for (let col = 5; col < 10; col++) {
        expect(board.getCell(19, col)).toBe(0);
      }
    });

    test('複数ライン同時削除', () => {
      // 18,19行目を完全に埋める
      for (let row = 18; row < 20; row++) {
        for (let col = 0; col < 10; col++) {
          board.setCell(row, col, 1);
        }
      }
      
      // 17行目を部分的に埋める
      for (let col = 0; col < 7; col++) {
        board.setCell(17, col, 2);
      }

      const result = board.clearLines();
      
      expect(result.linesCleared).toBe(2);
      expect(result.clearedRows).toEqual([18, 19]);
      
      // 17行目が19行目に移動していることを確認
      for (let col = 0; col < 7; col++) {
        expect(board.getCell(19, col)).toBe(2);
      }
    });

    test('テトリス（4ライン同時削除）', () => {
      // 16-19行目を完全に埋める
      for (let row = 16; row < 20; row++) {
        for (let col = 0; col < 10; col++) {
          board.setCell(row, col, 1);
        }
      }

      const result = board.clearLines();
      
      expect(result.linesCleared).toBe(4);
      expect(result.clearedRows).toEqual([16, 17, 18, 19]);
      expect(result.isTetris).toBe(true);
      
      // すべてのラインがクリアされていることを確認
      for (let row = 16; row < 20; row++) {
        for (let col = 0; col < 10; col++) {
          expect(board.getCell(row, col)).toBe(0);
        }
      }
    });

    test('非連続ラインの削除', () => {
      // 19行目と17行目を完全に埋める（18行目は空ける）
      for (let col = 0; col < 10; col++) {
        board.setCell(19, col, 1);
        board.setCell(17, col, 2);
      }
      
      // 18行目と16行目を部分的に埋める
      for (let col = 0; col < 8; col++) {
        board.setCell(18, col, 3);
        board.setCell(16, col, 4);
      }

      const result = board.clearLines();
      
      expect(result.linesCleared).toBe(2);
      expect(result.clearedRows).toEqual([17, 19]);
      
      // 18行目と16行目のピースが下に移動していることを確認
      for (let col = 0; col < 8; col++) {
        expect(board.getCell(19, col)).toBe(3); // 18行目→19行目
        expect(board.getCell(18, col)).toBe(4); // 16行目→18行目
      }
    });
  });

  describe('ピース配置と衝突検知', () => {
    let board;

    beforeEach(() => {
      board = new Board();
    });

    test('ピース形状による衝突検知', () => {
      // T字ピースの形状をシミュレート
      const tPieceShape = [
        { row: 0, col: 1 },
        { row: 1, col: 0 },
        { row: 1, col: 1 },
        { row: 1, col: 2 }
      ];

      // ボードに障害物を配置
      board.setCell(2, 1, 1);

      // T字ピースが位置(1,1)に配置可能かチェック
      const canPlace = board.canPlacePiece(tPieceShape, 1, 1);
      expect(canPlace).toBe(false); // 衝突するはず

      // 障害物を取り除いてテスト
      board.clearCell(2, 1);
      expect(board.canPlacePiece(tPieceShape, 1, 1)).toBe(true);
    });

    test('境界での衝突検知', () => {
      const iPieceShape = [
        { row: 0, col: 0 },
        { row: 1, col: 0 },
        { row: 2, col: 0 },
        { row: 3, col: 0 }
      ];

      // 左端での配置
      expect(board.canPlacePiece(iPieceShape, 0, 0)).toBe(true);
      
      // 左端を超える配置
      expect(board.canPlacePiece(iPieceShape, -1, 0)).toBe(false);
      
      // 右端での配置
      expect(board.canPlacePiece(iPieceShape, 9, 0)).toBe(true);
      
      // 右端を超える配置
      expect(board.canPlacePiece(iPieceShape, 10, 0)).toBe(false);
      
      // 下端を超える配置
      expect(board.canPlacePiece(iPieceShape, 0, 17)).toBe(false);
    });

    test('ピース配置実行', () => {
      const lPieceShape = [
        { row: 0, col: 0 },
        { row: 1, col: 0 },
        { row: 2, col: 0 },
        { row: 2, col: 1 }
      ];

      const result = board.placePiece(lPieceShape, 0, 0, 3); // type 3でL字ピースを配置
      
      expect(result.success).toBe(true);
      expect(result.pieceId).toBeDefined();
      
      // 配置されたセルをチェック
      expect(board.getCell(0, 0)).toBe(3);
      expect(board.getCell(1, 0)).toBe(3);
      expect(board.getCell(2, 0)).toBe(3);
      expect(board.getCell(2, 1)).toBe(3);
    });
  });

  describe('パフォーマンス最適化', () => {
    let board;

    beforeEach(() => {
      board = new Board();
    });

    test('大量セル操作のパフォーマンス', () => {
      const startTime = performance.now();
      
      // 1000回のセル操作
      for (let i = 0; i < 1000; i++) {
        const row = i % 20;
        const col = (i * 3) % 10;
        board.setCell(row, col, (i % 7) + 1);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(50); // 50ms以内で完了
    });

    test('大量ライン検出のパフォーマンス', () => {
      // ボードを複雑な状態にセットアップ
      for (let row = 0; row < 20; row++) {
        for (let col = 0; col < 10; col++) {
          if (Math.random() > 0.3) {
            board.setCell(row, col, (row + col) % 7 + 1);
          }
        }
      }

      const startTime = performance.now();
      
      // 100回のライン検出処理
      for (let i = 0; i < 100; i++) {
        board.getFullLines();
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(20); // 20ms以内で完了
    });

    test('メモリ効率的なボード状態管理', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // 大量のボード操作
      for (let iteration = 0; iteration < 100; iteration++) {
        // ボードをランダムに埋める
        for (let row = 0; row < 20; row++) {
          for (let col = 0; col < 10; col++) {
            board.setCell(row, col, Math.floor(Math.random() * 8));
          }
        }
        
        // ライン削除
        board.clearLines();
        
        // ボードリセット
        board.clear();
      }
      
      // ガベージコレクションを強制実行（テスト環境）
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // メモリ増加が2MB以下であることを確認（テスト環境で余裕を持たせる）
      expect(memoryIncrease).toBeLessThan(2 * 1024 * 1024);
    });
  });

  describe('高度なボード操作', () => {
    let board;

    beforeEach(() => {
      board = new Board();
    });

    test('ボード状態のコピーと復元', () => {
      // 複雑なボード状態を作成
      board.setCell(5, 3, 2);
      board.setCell(10, 7, 5);
      board.setCell(15, 1, 3);

      const boardState = board.getState();
      
      // ボードを変更
      board.setCell(5, 3, 0);
      board.setCell(2, 2, 7);

      // 状態を復元
      board.setState(boardState);

      // 元の状態に戻っていることを確認
      expect(board.getCell(5, 3)).toBe(2);
      expect(board.getCell(10, 7)).toBe(5);
      expect(board.getCell(15, 1)).toBe(3);
      expect(board.getCell(2, 2)).toBe(0);
    });

    test('ボード統計情報の取得', () => {
      // いくつかのセルを埋める
      for (let i = 0; i < 50; i++) {
        const row = Math.floor(Math.random() * 20);
        const col = Math.floor(Math.random() * 10);
        board.setCell(row, col, Math.floor(Math.random() * 7) + 1);
      }

      const stats = board.getStatistics();
      
      expect(stats.totalCells).toBe(200);
      expect(stats.filledCells).toBeGreaterThan(0);
      expect(stats.emptyCells).toBe(200 - stats.filledCells);
      expect(stats.fillPercentage).toBe(stats.filledCells / 200 * 100);
      expect(stats.highestOccupiedRow).toBeGreaterThanOrEqual(0);
    });
  });
});
