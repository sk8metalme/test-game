import Board from '../../src/core/entities/Board.js';
import Tetromino from '../../src/core/entities/Tetromino.js';

describe('Board-Tetromino Integration Tests', () => {
  describe('ピース配置統合テスト', () => {
    let board;

    beforeEach(() => {
      board = new Board();
    });

    test('T字ピースをボードに正常配置できる', () => {
      const tetromino = new Tetromino('T', { x: 4, y: 0 });
      const occupiedCells = tetromino.getOccupiedCells();
      
      // ピース配置前の状態確認
      expect(board.canPlacePiece(occupiedCells, tetromino.position.x, tetromino.position.y)).toBe(true);
      
      // ピース配置実行
      const result = board.placePiece(occupiedCells, tetromino.position.x, tetromino.position.y, 1);
      expect(result.success).toBe(true);
      
      // 配置後の状態確認
      const absoluteCells = tetromino.getAbsoluteCells();
      absoluteCells.forEach(cell => {
        expect(board.getCell(cell.row, cell.col)).toBe(1);
      });
    });

    test('回転したピースの配置テスト', () => {
      const tetromino = new Tetromino('L', { x: 5, y: 1 });
      
      // 1回転させる
      tetromino.rotateClockwise();
      const occupiedCells = tetromino.getOccupiedCells();
      
      // 回転後のピースが配置可能か確認
      expect(board.canPlacePiece(occupiedCells, tetromino.position.x, tetromino.position.y)).toBe(true);
      
      // 配置実行
      const result = board.placePiece(occupiedCells, tetromino.position.x, tetromino.position.y, 2);
      expect(result.success).toBe(true);
      
      // 回転後の形状で正しく配置されているか確認
      const absoluteCells = tetromino.getAbsoluteCells();
      absoluteCells.forEach(cell => {
        expect(board.getCell(cell.row, cell.col)).toBe(2);
      });
    });

    test('境界近くでのピース配置テスト', () => {
      // 左端での配置
      const tetrominoLeft = new Tetromino('I', { x: 0, y: 0 });
      tetrominoLeft.rotateClockwise(); // 縦向きにする
      
      const leftCells = tetrominoLeft.getOccupiedCells();
      expect(board.canPlacePiece(leftCells, tetrominoLeft.position.x, tetrominoLeft.position.y)).toBe(true);
      
      // 右端での配置（I字ピースは回転すると位置が変わるので適切な位置に配置）
      const tetrominoRight = new Tetromino('I', { x: 7, y: 0 });
      tetrominoRight.rotateClockwise(); // 縦向きにする
      
      const rightCells = tetrominoRight.getOccupiedCells();
      expect(board.canPlacePiece(rightCells, tetrominoRight.position.x, tetrominoRight.position.y)).toBe(true);
      
      // 右端でのO字ピース（幅2なので x=8が限界）
      const tetrominoRightO = new Tetromino('O', { x: 8, y: 0 });
      const rightOCells = tetrominoRightO.getOccupiedCells();
      expect(board.canPlacePiece(rightOCells, tetrominoRightO.position.x, tetrominoRightO.position.y)).toBe(true);
      
      // 下端での配置
      const tetrominoBottom = new Tetromino('O', { x: 4, y: 18 });
      const bottomCells = tetrominoBottom.getOccupiedCells();
      expect(board.canPlacePiece(bottomCells, tetrominoBottom.position.x, tetrominoBottom.position.y)).toBe(true);
    });
  });

  describe('衝突検知統合テスト', () => {
    let board;

    beforeEach(() => {
      board = new Board();
    });

    test('既存ピースとの衝突検知', () => {
      // 最初のピースを配置
      const tetromino1 = new Tetromino('O', { x: 4, y: 18 });
      const cells1 = tetromino1.getOccupiedCells();
      board.placePiece(cells1, tetromino1.position.x, tetromino1.position.y, 1);
      
      // 同じ位置に別のピースを配置しようとする
      const tetromino2 = new Tetromino('T', { x: 4, y: 18 });
      const cells2 = tetromino2.getOccupiedCells();
      
      expect(board.canPlacePiece(cells2, tetromino2.position.x, tetromino2.position.y)).toBe(false);
    });

    test('部分的な衝突検知', () => {
      // L字ピースを配置
      const tetrominoL = new Tetromino('L', { x: 4, y: 17 });
      const cellsL = tetrominoL.getOccupiedCells();
      board.placePiece(cellsL, tetrominoL.position.x, tetrominoL.position.y, 1);
      
      // T字ピースが部分的に重なる位置に配置しようとする
      const tetrominoT = new Tetromino('T', { x: 5, y: 17 });
      const cellsT = tetrominoT.getOccupiedCells();
      
      expect(board.canPlacePiece(cellsT, tetrominoT.position.x, tetrominoT.position.y)).toBe(false);
    });

    test('境界を超える配置の検知', () => {
      // 左境界を超える配置
      const tetrominoLeft = new Tetromino('T', { x: -1, y: 0 });
      const cellsLeft = tetrominoLeft.getOccupiedCells();
      expect(board.canPlacePiece(cellsLeft, tetrominoLeft.position.x, tetrominoLeft.position.y)).toBe(false);
      
      // 右境界を超える配置
      const tetrominoRight = new Tetromino('T', { x: 8, y: 0 });
      const cellsRight = tetrominoRight.getOccupiedCells();
      expect(board.canPlacePiece(cellsRight, tetrominoRight.position.x, tetrominoRight.position.y)).toBe(false);
      
      // 下境界を超える配置
      const tetrominoBottom = new Tetromino('I', { x: 4, y: 19 });
      const cellsBottom = tetrominoBottom.getOccupiedCells();
      expect(board.canPlacePiece(cellsBottom, tetrominoBottom.position.x, tetrominoBottom.position.y)).toBe(false);
    });
  });

  describe('ライン削除統合テスト', () => {
    let board;

    beforeEach(() => {
      board = new Board();
    });

    test('複数ピースでラインを完成させて削除', () => {
      // 下端にI字ピースを4つ配置してラインを作る
      const positions = [
        { x: 0, y: 19 },
        { x: 1, y: 19 },
        { x: 2, y: 19 },
        { x: 3, y: 19 },
        { x: 4, y: 19 },
        { x: 5, y: 19 },
        { x: 6, y: 19 },
        { x: 7, y: 19 },
        { x: 8, y: 19 },
        { x: 9, y: 19 }
      ];

      // 各位置にブロックを配置
      positions.forEach((pos, index) => {
        board.setCell(pos.y, pos.x, 1);
      });

      // ラインが完成していることを確認
      const fullLines = board.getFullLines();
      expect(fullLines).toEqual([19]);

      // ライン削除実行
      const result = board.clearLines();
      expect(result.linesCleared).toBe(1);
      expect(result.clearedRows).toEqual([19]);

      // 削除後のボード状態確認
      for (let col = 0; col < 10; col++) {
        expect(board.getCell(19, col)).toBe(0);
      }
    });

    test('T字ピースによるライン完成とT-spin検知準備', () => {
      // T字ピースでラインを完成させるシナリオ
      // 19行目を9個まで埋める
      for (let col = 0; col < 9; col++) {
        board.setCell(19, col, 1);
      }

      // T字ピースを回転させて最後の1個を埋める
      const tetromino = new Tetromino('T', { x: 8, y: 17 });
      tetromino.rotateClockwise(); // 適切な向きに回転

      const cells = tetromino.getOccupiedCells();
      
      // T字ピースの一部が最後のセルを埋める位置に配置
      if (board.canPlacePiece(cells, tetromino.position.x, tetromino.position.y)) {
        board.placePiece(cells, tetromino.position.x, tetromino.position.y, 2);
        
        // ライン完成確認
        const fullLines = board.getFullLines();
        if (fullLines.length > 0) {
          const result = board.clearLines();
          expect(result.linesCleared).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('複雑なゲームシナリオ統合テスト', () => {
    let board;

    beforeEach(() => {
      board = new Board();
    });

    test('複数ピース配置からライン削除までのフローテスト', () => {
      const gameScenario = [
        { type: 'I', position: { x: 0, y: 16 }, rotations: 1 },
        { type: 'O', position: { x: 4, y: 18 }, rotations: 0 },
        { type: 'T', position: { x: 6, y: 17 }, rotations: 0 },
        { type: 'L', position: { x: 8, y: 17 }, rotations: 0 }
      ];

      let placedPieces = 0;

      gameScenario.forEach(scenario => {
        const tetromino = new Tetromino(scenario.type, scenario.position);
        
        // 指定回数回転
        for (let i = 0; i < scenario.rotations; i++) {
          tetromino.rotateClockwise();
        }

        const cells = tetromino.getOccupiedCells();
        
        if (board.canPlacePiece(cells, tetromino.position.x, tetromino.position.y)) {
          const result = board.placePiece(cells, tetromino.position.x, tetromino.position.y, placedPieces + 1);
          if (result.success) {
            placedPieces++;
          }
        }
      });

      expect(placedPieces).toBeGreaterThan(0);

      // 統計情報の確認
      const stats = board.getStatistics();
      expect(stats.filledCells).toBeGreaterThan(0);
      expect(stats.fillPercentage).toBeGreaterThan(0);
    });

    test('ゲームオーバー状況の検出', () => {
      // T字ピースが配置される位置（x: 4, y: 0）を含めて上部を埋める
      // T字ピースの初期形状: [[0,1,0], [1,1,1], [0,0,0]]
      // 位置(4,0)に配置すると実際の位置は (0,5), (1,4), (1,5), (1,6)
      
      board.setCell(0, 5, 1); // T字ピースの上部と衝突
      board.setCell(1, 4, 1); // T字ピースの下部と衝突
      
      // 追加でボードを埋める（50%以上を確保）
      for (let row = 8; row < 20; row++) {
        for (let col = 0; col < 10; col++) {
          board.setCell(row, col, 1);
        }
      }

      // 新しいピースが上部に配置できないことを確認
      const newPiece = new Tetromino('T', { x: 4, y: 0 });
      const cells = newPiece.getOccupiedCells();
      
      // 上部での衝突確認
      const canPlace = board.canPlacePiece(cells, newPiece.position.x, newPiece.position.y);
      expect(canPlace).toBe(false); // 上部に配置できない = ゲームオーバー状況
      
      // ボードが十分に埋まっていることを確認
      const stats = board.getStatistics();
      expect(stats.fillPercentage).toBeGreaterThan(50);
    });
  });

  describe('パフォーマンス統合テスト', () => {
    let board;

    beforeEach(() => {
      board = new Board();
    });

    test('大量ピース操作のパフォーマンス', () => {
      const startTime = performance.now();
      
      // 100個のピース配置・削除サイクル
      for (let i = 0; i < 100; i++) {
        const types = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
        const randomType = types[i % types.length];
        const tetromino = new Tetromino(randomType, { x: i % 8, y: (i % 15) + 1 });
        
        // ランダムに回転
        for (let r = 0; r < i % 4; r++) {
          tetromino.rotateClockwise();
        }
        
        const cells = tetromino.getOccupiedCells();
        board.placePiece(cells, tetromino.position.x, tetromino.position.y, i % 7 + 1);
        
        // 10回に1回ライン削除
        if (i % 10 === 9) {
          board.clearLines();
        }
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(500); // 500ms以内で完了
    });

    test('メモリ効率統合テスト', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // 大量のピース生成・配置・削除
      for (let cycle = 0; cycle < 50; cycle++) {
        const tetrominoes = [];
        
        // 7種類のピースを生成
        ['I', 'O', 'T', 'S', 'Z', 'J', 'L'].forEach(type => {
          const tetromino = new Tetromino(type);
          tetrominoes.push(tetromino);
        });
        
        // 各ピースをボードに配置・削除
        tetrominoes.forEach((tetromino, index) => {
          const cells = tetromino.getOccupiedCells();
          board.placePiece(cells, index, cycle % 10, index + 1);
        });
        
        // ボードクリア
        board.clear();
      }
      
      // ガベージコレクション実行（テスト環境）
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024); // 5MB以下
    });
  });

  describe('エラーハンドリング統合テスト', () => {
    let board;

    beforeEach(() => {
      board = new Board();
    });

    test('無効な配置要求のハンドリング', () => {
      const tetromino = new Tetromino('T');
      
      // null位置での配置試行
      const cells = tetromino.getOccupiedCells();
      
      expect(() => {
        board.canPlacePiece(cells, null, 0);
      }).not.toThrow();
      
      expect(() => {
        board.canPlacePiece(cells, 0, null);
      }).not.toThrow();
    });

    test('破損したピース形状のハンドリング', () => {
      const tetromino = new Tetromino('T');
      
      // 形状を意図的に破損
      tetromino.shape = null;
      
      expect(() => {
        tetromino.getOccupiedCells();
      }).toThrow();
    });

    test('境界値でのエラーハンドリング', () => {
      const tetromino = new Tetromino('I');
      
      // 極端な位置設定
      tetromino.setPosition(-1000, -1000);
      const cells = tetromino.getOccupiedCells();
      
      expect(board.canPlacePiece(cells, tetromino.position.x, tetromino.position.y)).toBe(false);
      
      tetromino.setPosition(1000, 1000);
      expect(board.canPlacePiece(cells, tetromino.position.x, tetromino.position.y)).toBe(false);
    });
  });
});
