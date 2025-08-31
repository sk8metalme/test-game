/**
 * Advanced Boundary Conditions and Edge Cases Tests
 * 高度な境界条件とエッジケースの堅牢性をテストします
 */

import Board from '../../src/core/entities/Board.js';
import Tetromino from '../../src/core/entities/Tetromino.js';

describe('Advanced Boundary Conditions and Edge Cases', () => {
  let board;

  beforeEach(() => {
    board = new Board();
  });

  describe('極端な境界条件', () => {
    test('ピースが左端境界を完全に超える状況', () => {
      const tetromino = new Tetromino('T', { x: -2, y: 0 });
      const cells = tetromino.getOccupiedCells();

      expect(board.canPlacePiece(cells, tetromino.position.x, tetromino.position.y)).toBe(false);
    });

    test('ピースが右端境界を完全に超える状況', () => {
      const tetromino = new Tetromino('T', { x: 10, y: 0 });
      const cells = tetromino.getOccupiedCells();

      expect(board.canPlacePiece(cells, tetromino.position.x, tetromino.position.y)).toBe(false);
    });

    test('ピースが上端境界を超える状況', () => {
      const tetromino = new Tetromino('T', { x: 4, y: -2 });
      const cells = tetromino.getOccupiedCells();

      expect(board.canPlacePiece(cells, tetromino.position.x, tetromino.position.y)).toBe(false);
    });

    test('ピースが下端境界を超える状況', () => {
      // I字ピースを縦向きにして下端境界を超える位置に配置
      const tetromino = new Tetromino('I', { x: 4, y: 18 });
      tetromino.rotateClockwise(); // 縦向きにする（高さ4）
      const cells = tetromino.getOccupiedCells();

      expect(board.canPlacePiece(cells, tetromino.position.x, tetromino.position.y)).toBe(false);
    });

    test('回転時の境界超過処理', () => {
      // 右端でのI字ピース回転試行
      const tetromino = new Tetromino('I', { x: 8, y: 0 });
      // 横向きのI字ピースは幅4なので x=8では x+4=12で境界超過

      const cells = tetromino.getOccupiedCells();
      expect(board.canPlacePiece(cells, tetromino.position.x, tetromino.position.y)).toBe(false);

      // 適切な位置に移動して配置可能にする
      tetromino.setPosition(6, 0); // x=6なら x+4=10で境界内
      const cellsAfterMove = tetromino.getOccupiedCells();
      expect(board.canPlacePiece(cellsAfterMove, tetromino.position.x, tetromino.position.y)).toBe(
        true
      );
    });
  });

  describe('メモリとリソースの限界テスト', () => {
    test('大量のピース操作でのメモリリーク検証', () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // 1000個のピース生成・操作・破棄
      for (let i = 0; i < 1000; i++) {
        const types = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
        const tetromino = new Tetromino(types[i % 7]);

        // 複数回転
        for (let r = 0; r < 4; r++) {
          tetromino.rotateClockwise();
        }

        // 複数移動
        tetromino.moveLeft();
        tetromino.moveRight();
        tetromino.moveDown();

        // 複製・比較
        const clone = tetromino.clone();
        tetromino.equals(clone);

        // ガベージコレクション対象にする
        // ピースは自動的にスコープから外れる
      }

      // ガベージコレクション実行（テスト環境）
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // メモリ増加が3MB以下であることを確認
      expect(memoryIncrease).toBeLessThan(3 * 1024 * 1024);
    });

    test('極端に深い再帰処理の制限テスト', () => {
      // 大量の回転操作
      const tetromino = new Tetromino('T');

      const startTime = performance.now();

      // 10000回回転（実用的でない極端なケース）
      for (let i = 0; i < 10000; i++) {
        tetromino.rotateClockwise();
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // 10000回転でも1秒以内で完了することを確認
      expect(duration).toBeLessThan(1000);

      // 最終的に正しい状態であることを確認（10000回転は4で割り切れるので元の状態）
      expect(tetromino.rotationState).toBe(0);
    });

    test('同時大量ピース処理のストレステスト', () => {
      const tetrominoes = [];
      const startTime = performance.now();

      // 同時に500個のピース生成
      for (let i = 0; i < 500; i++) {
        const types = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
        const tetromino = new Tetromino(types[i % 7], { x: i % 10, y: i % 20 });
        tetrominoes.push(tetromino);
      }

      // 全ピースに対して同時操作
      tetrominoes.forEach(tetromino => {
        tetromino.rotateClockwise();
        tetromino.moveDown();
        const cells = tetromino.getOccupiedCells();
        board.canPlacePiece(cells, tetromino.position.x, tetromino.position.y);
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // 500個のピース処理が500ms以内で完了
      expect(duration).toBeLessThan(500);
      expect(tetrominoes.length).toBe(500);
    });
  });

  describe('データ整合性とエラー復旧', () => {
    test('破損したピース形状からの復旧', () => {
      const tetromino = new Tetromino('T');

      // 形状を意図的に破損
      const originalShape = tetromino.getShape();

      expect(() => {
        tetromino.shape = null;
        tetromino.getOccupiedCells();
      }).toThrow();

      // 形状を復元
      tetromino.shape = originalShape;
      expect(() => {
        tetromino.getOccupiedCells();
      }).not.toThrow();
    });

    test('無効な位置データの処理', () => {
      const tetromino = new Tetromino('T');

      // 無効な位置設定
      tetromino.setPosition(NaN, NaN);

      // NaN位置では例外が発生することを確認（適切なエラーハンドリング）
      expect(() => {
        board.canPlacePiece(
          tetromino.getOccupiedCells(),
          tetromino.position.x,
          tetromino.position.y
        );
      }).toThrow();
    });

    test('ボード状態の不整合検出と復旧', () => {
      // 正常な操作を確認
      expect(() => {
        board.getStatistics();
      }).not.toThrow();

      // 不正な状態設定をテスト
      expect(() => {
        board.setState(null);
      }).toThrow();

      // 状態が変更されていないことを確認
      expect(() => {
        board.getStatistics();
      }).not.toThrow();
    });

    test('競合状態での操作安全性', () => {
      const tetromino1 = new Tetromino('T', { x: 4, y: 0 });
      const tetromino2 = new Tetromino('O', { x: 5, y: 0 });

      // 同時配置試行
      const cells1 = tetromino1.getOccupiedCells();
      const cells2 = tetromino2.getOccupiedCells();

      const result1 = board.placePiece(cells1, tetromino1.position.x, tetromino1.position.y, 1);
      const result2 = board.placePiece(cells2, tetromino2.position.x, tetromino2.position.y, 2);

      // 一方は成功、一方は失敗（衝突）するはず
      expect(result1.success || result2.success).toBe(true);
      expect(result1.success && result2.success).toBe(false);
    });
  });

  describe('極端な入力値の処理', () => {
    test('極大・極小値での位置設定', () => {
      const tetromino = new Tetromino('T');

      // JavaScript Number の最大・最小値
      tetromino.setPosition(Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER);

      expect(() => {
        board.canPlacePiece(
          tetromino.getOccupiedCells(),
          tetromino.position.x,
          tetromino.position.y
        );
      }).not.toThrow();

      expect(
        board.canPlacePiece(
          tetromino.getOccupiedCells(),
          tetromino.position.x,
          tetromino.position.y
        )
      ).toBe(false);
    });

    test('無効なテトロミノタイプでの処理', () => {
      expect(() => {
        new Tetromino('INVALID');
      }).toThrow('Invalid tetromino type: INVALID');

      expect(() => {
        new Tetromino(null);
      }).toThrow();

      expect(() => {
        new Tetromino(undefined);
      }).toThrow();
    });

    test('浮動小数点位置での処理', () => {
      const tetromino = new Tetromino('T');

      // 浮動小数点位置
      tetromino.setPosition(4.5, 0.7);

      // 浮動小数点位置では例外が発生することを確認（適切なエラーハンドリング）
      expect(() => {
        board.canPlacePiece(
          tetromino.getOccupiedCells(),
          tetromino.position.x,
          tetromino.position.y
        );
      }).toThrow();
    });
  });

  describe('長時間動作の安定性', () => {
    test('長時間連続操作での状態整合性', () => {
      const operationCount = 5000;
      let successfulOperations = 0;

      for (let i = 0; i < operationCount; i++) {
        try {
          const types = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
          const tetromino = new Tetromino(types[i % 7]);

          // ランダムな操作
          const operations = [
            () => tetromino.rotateClockwise(),
            () => tetromino.rotateCounterClockwise(),
            () => tetromino.moveLeft(),
            () => tetromino.moveRight(),
            () => tetromino.moveDown(),
            () => tetromino.moveUp(),
          ];

          const randomOp = operations[i % operations.length];
          randomOp();

          // 位置の妥当性チェック
          const cells = tetromino.getOccupiedCells();
          const isValid = cells.length > 0;

          if (isValid) {
            successfulOperations++;
          }

          // 定期的にボードリセット
          if (i % 1000 === 999) {
            board.clear();
          }
        } catch (error) {
          // エラーが発生しても継続
          // console.warn(`Operation ${i} failed:`, error.message);
        }
      }

      // 少なくとも95%の操作が成功することを期待
      const successRate = successfulOperations / operationCount;
      expect(successRate).toBeGreaterThan(0.95);
    });

    test('メモリプレッシャー下での動作', () => {
      const largeArrays = [];

      try {
        // メモリプレッシャーを作成
        for (let i = 0; i < 100; i++) {
          largeArrays.push(new Array(10000).fill(i));
        }

        // プレッシャー下でのピース操作
        const tetromino = new Tetromino('T');

        for (let i = 0; i < 100; i++) {
          tetromino.rotateClockwise();
          const cells = tetromino.getOccupiedCells();
          board.canPlacePiece(cells, i % 10, i % 20);
        }

        expect(tetromino.rotationState).toBe(0); // 100回転後は元の状態
      } finally {
        // メモリ解放
        largeArrays.length = 0;
      }
    });
  });

  describe('並行処理とタイミング問題', () => {
    test('高頻度操作での状態整合性', () => {
      const tetromino = new Tetromino('T');
      const initialPosition = { ...tetromino.position };

      // 高頻度での移動操作
      const operations = [];

      for (let i = 0; i < 1000; i++) {
        operations.push(() => {
          tetromino.moveRight();
          tetromino.moveLeft(); // 往復移動
        });
      }

      // 全操作を高速実行
      const startTime = performance.now();
      operations.forEach(op => op());
      const endTime = performance.now();

      // 最終位置が初期位置と同じであることを確認
      expect(tetromino.position).toEqual(initialPosition);

      // 1000回の往復操作が100ms以内で完了
      expect(endTime - startTime).toBeLessThan(100);
    });

    test('状態変更の原子性確認', () => {
      const tetromino = new Tetromino('T');
      const originalState = tetromino.serialize();

      // 複合操作（移動+回転）
      tetromino.moveRight();
      tetromino.rotateClockwise();
      tetromino.moveDown();

      const newState = tetromino.serialize();

      // 状態が確実に変更されていることを確認
      expect(newState).not.toEqual(originalState);

      // 状態復元
      const restored = Tetromino.deserialize(originalState);
      expect(restored.serialize()).toEqual(originalState);
    });
  });
});
