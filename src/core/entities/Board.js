/**
 * ゲームボードを管理するクラス
 * 20行x10列のグリッドでテトリスゲームのボードを表現
 */
export default class Board {
  constructor() {
    this.ROWS = 20;
    this.COLS = 10;
    this.grid = this.initializeGrid();
  }

  /**
   * 空のグリッドを初期化
   * @returns {Array<Array<number>>} 20x10の2次元配列（0で初期化）
   */
  initializeGrid() {
    return Array(this.ROWS).fill(null).map(() => Array(this.COLS).fill(0));
  }

  /**
   * 指定した位置のセルが空かどうかを確認
   * @param {number} row 行番号（0-19）
   * @param {number} col 列番号（0-9）
   * @returns {boolean} 空の場合true
   */
  isEmpty(row, col) {
    this.validatePosition(row, col);
    return this.grid[row][col] === 0;
  }

  /**
   * 指定した位置のセルの値を取得
   * @param {number} row 行番号（0-19）
   * @param {number} col 列番号（0-9）
   * @returns {number} セルの値
   */
  getCell(row, col) {
    this.validatePosition(row, col);
    return this.grid[row][col];
  }

  /**
   * 指定した位置のセルに値を設定
   * @param {number} row 行番号（0-19）
   * @param {number} col 列番号（0-9）
   * @param {number} value 設定する値
   */
  setCell(row, col, value) {
    this.validatePosition(row, col);
    this.grid[row][col] = value;
  }

  /**
   * 指定した位置のセルをクリア（0に設定）
   * @param {number} row 行番号（0-19）
   * @param {number} col 列番号（0-9）
   */
  clearCell(row, col) {
    this.validatePosition(row, col);
    this.grid[row][col] = 0;
  }

  /**
   * 完全に埋まったラインを検出
   * @returns {Array<number>} 完全に埋まったラインのインデックス配列
   */
  getFullLines() {
    const fullLines = [];
    
    for (let row = 0; row < this.ROWS; row++) {
      if (this.isLineFull(row)) {
        fullLines.push(row);
      }
    }
    
    return fullLines;
  }

  /**
   * 指定したラインが完全に埋まっているかを確認
   * @param {number} row 行番号
   * @returns {boolean} 完全に埋まっている場合true
   */
  isLineFull(row) {
    this.validateRow(row);
    return this.grid[row].every(cell => cell !== 0);
  }

  /**
   * 位置の妥当性を検証
   * @param {number} row 行番号
   * @param {number} col 列番号
   * @throws {Error} 範囲外の場合
   */
  validatePosition(row, col) {
    if (row < 0 || row >= this.ROWS || col < 0 || col >= this.COLS) {
      throw new Error(`Position out of bounds: (${row}, ${col})`);
    }
  }

  /**
   * 行番号の妥当性を検証
   * @param {number} row 行番号
   * @throws {Error} 範囲外の場合
   */
  validateRow(row) {
    if (row < 0 || row >= this.ROWS) {
      throw new Error(`Row out of bounds: ${row}`);
    }
  }
}
