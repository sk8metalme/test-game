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
    // NaNや浮動小数点のチェック
    if (!Number.isInteger(row) || !Number.isInteger(col)) {
      throw new Error(`Position must be integers: (${row}, ${col})`);
    }
    
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

  /**
   * 完全なラインを削除し、上のラインを下に移動
   * @returns {Object} 削除結果 {linesCleared, clearedRows, isTetris}
   */
  clearLines() {
    const fullLines = this.getFullLines();
    const linesCleared = fullLines.length;
    
    if (linesCleared === 0) {
      return { linesCleared: 0, clearedRows: [], isTetris: false };
    }

    // 新しいグリッドを作成（削除されないラインのみ）
    const newGrid = [];
    
    // 空のラインを上部に追加（削除された分だけ）
    for (let i = 0; i < linesCleared; i++) {
      newGrid.push(Array(this.COLS).fill(0));
    }
    
    // 削除されないラインを下部に追加
    for (let row = 0; row < this.ROWS; row++) {
      if (!fullLines.includes(row)) {
        newGrid.push([...this.grid[row]]);
      }
    }
    
    this.grid = newGrid;

    return {
      linesCleared,
      clearedRows: fullLines,
      isTetris: linesCleared === 4
    };
  }

  /**
   * ピース形状がボードに配置可能かチェック
   * @param {Array} pieceShape ピースの形状 [{row, col}, ...]
   * @param {number} offsetX X座標オフセット
   * @param {number} offsetY Y座標オフセット
   * @returns {boolean} 配置可能な場合true
   */
  canPlacePiece(pieceShape, offsetX, offsetY) {
    return pieceShape.every(cell => {
      const newRow = cell.row + offsetY;
      const newCol = cell.col + offsetX;
      
      // 境界チェック
      if (newRow < 0 || newRow >= this.ROWS || 
          newCol < 0 || newCol >= this.COLS) {
        return false;
      }
      
      // 衝突チェック
      return this.isEmpty(newRow, newCol);
    });
  }

  /**
   * ピースをボードに配置
   * @param {Array} pieceShape ピースの形状 [{row, col}, ...]
   * @param {number} offsetX X座標オフセット
   * @param {number} offsetY Y座標オフセット
   * @param {number} pieceType ピースタイプ（1-7）
   * @returns {Object} 配置結果 {success, pieceId}
   */
  placePiece(pieceShape, offsetX, offsetY, pieceType) {
    if (!this.canPlacePiece(pieceShape, offsetX, offsetY)) {
      return { success: false, pieceId: null };
    }

    const pieceId = this.generatePieceId();
    
    pieceShape.forEach(cell => {
      const newRow = cell.row + offsetY;
      const newCol = cell.col + offsetX;
      this.setCell(newRow, newCol, pieceType);
    });

    return { success: true, pieceId };
  }

  /**
   * ユニークなピースIDを生成
   * @returns {string} ピースID
   */
  generatePieceId() {
    return `piece_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * ボードをクリア（全セルを0に）
   */
  clear() {
    this.grid = this.initializeGrid();
  }

  /**
   * ボードの現在状態を取得
   * @returns {Array<Array<number>>} グリッドのディープコピー
   */
  getState() {
    return this.grid.map(row => [...row]);
  }

  /**
   * ボードの状態を設定
   * @param {Array<Array<number>>} state 設定するグリッド状態
   */
  setState(state) {
    if (state === null || state === undefined) {
      throw new Error('Invalid state: cannot be null or undefined');
    }
    
    if (!Array.isArray(state) || state.length !== this.ROWS) {
      throw new Error('Invalid state: must be 20x10 grid');
    }
    
    for (let row = 0; row < this.ROWS; row++) {
      if (!Array.isArray(state[row]) || state[row].length !== this.COLS) {
        throw new Error(`Invalid state: row ${row} must have ${this.COLS} columns`);
      }
      
      for (let col = 0; col < this.COLS; col++) {
        this.grid[row][col] = state[row][col];
      }
    }
  }

  /**
   * ボードの統計情報を取得
   * @returns {Object} 統計情報
   */
  getStatistics() {
    let filledCells = 0;
    let highestOccupiedRow = -1;
    
    for (let row = 0; row < this.ROWS; row++) {
      for (let col = 0; col < this.COLS; col++) {
        if (!this.isEmpty(row, col)) {
          filledCells++;
          if (highestOccupiedRow === -1) {
            highestOccupiedRow = row;
          }
        }
      }
    }

    const totalCells = this.ROWS * this.COLS;
    const emptyCells = totalCells - filledCells;
    const fillPercentage = (filledCells / totalCells) * 100;

    return {
      totalCells,
      filledCells,
      emptyCells,
      fillPercentage: Math.round(fillPercentage * 100) / 100,
      highestOccupiedRow
    };
  }

  /**
   * ボードが空かどうかをチェック
   * @returns {boolean} 空の場合true
   */
  isBoardEmpty() {
    return this.getStatistics().filledCells === 0;
  }

  /**
   * 指定した行より上にブロックがあるかチェック
   * @param {number} row 基準行
   * @returns {boolean} 上にブロックがある場合true
   */
  hasBlocksAbove(row) {
    for (let r = 0; r < row; r++) {
      for (let col = 0; col < this.COLS; col++) {
        if (!this.isEmpty(r, col)) {
          return true;
        }
      }
    }
    return false;
  }
}
