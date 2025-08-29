import Board from '../../../src/core/entities/Board.js';

describe('Board', () => {
  describe('初期化', () => {
    test('空の20x10グリッドで初期化される', () => {
      const board = new Board();
      
      expect(board.grid).toHaveLength(20);
      expect(board.grid[0]).toHaveLength(10);
      expect(board.isEmpty(0, 0)).toBe(true);
      expect(board.isEmpty(19, 9)).toBe(true);
    });

    test('全てのセルが空で初期化される', () => {
      const board = new Board();
      
      for (let row = 0; row < 20; row++) {
        for (let col = 0; col < 10; col++) {
          expect(board.isEmpty(row, col)).toBe(true);
        }
      }
    });
  });

  describe('セル操作', () => {
    let board;

    beforeEach(() => {
      board = new Board();
    });

    test('セルに値を設定できる', () => {
      board.setCell(0, 0, 1);
      expect(board.getCell(0, 0)).toBe(1);
      expect(board.isEmpty(0, 0)).toBe(false);
    });

    test('セルをクリアできる', () => {
      board.setCell(0, 0, 1);
      board.clearCell(0, 0);
      expect(board.isEmpty(0, 0)).toBe(true);
    });

    test('範囲外のアクセスは例外をスローする', () => {
      expect(() => board.getCell(-1, 0)).toThrow();
      expect(() => board.getCell(20, 0)).toThrow();
      expect(() => board.getCell(0, -1)).toThrow();
      expect(() => board.getCell(0, 10)).toThrow();
    });
  });

  describe('ライン操作', () => {
    let board;

    beforeEach(() => {
      board = new Board();
    });

    test('完全なラインを検出できる', () => {
      // 最下行を埋める
      for (let col = 0; col < 10; col++) {
        board.setCell(19, col, 1);
      }

      const fullLines = board.getFullLines();
      expect(fullLines).toEqual([19]);
    });

    test('複数の完全なラインを検出できる', () => {
      // 18行目と19行目を埋める
      for (let row = 18; row < 20; row++) {
        for (let col = 0; col < 10; col++) {
          board.setCell(row, col, 1);
        }
      }

      const fullLines = board.getFullLines();
      expect(fullLines).toEqual([18, 19]);
    });

    test('部分的に埋まったラインは検出されない', () => {
      // 最下行を部分的に埋める
      for (let col = 0; col < 9; col++) {
        board.setCell(19, col, 1);
      }

      const fullLines = board.getFullLines();
      expect(fullLines).toEqual([]);
    });
  });
});
