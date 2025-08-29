/**
 * テトロミノピースを管理するクラス
 * 7種類のテトロミノピース（I, O, T, S, Z, J, L）の状態管理、回転、移動を行う
 */
export default class Tetromino {
  /**
   * テトロミノの形状定義
   * 各ピースは4x4または2x2のマトリックスで定義
   */
  static SHAPES = {
    I: {
      shape: [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
      ],
      color: '#00FFFF' // シアン
    },
    O: {
      shape: [
        [1, 1],
        [1, 1]
      ],
      color: '#FFFF00' // 黄色
    },
    T: {
      shape: [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0]
      ],
      color: '#800080' // 紫
    },
    S: {
      shape: [
        [0, 1, 1],
        [1, 1, 0],
        [0, 0, 0]
      ],
      color: '#00FF00' // 緑
    },
    Z: {
      shape: [
        [1, 1, 0],
        [0, 1, 1],
        [0, 0, 0]
      ],
      color: '#FF0000' // 赤
    },
    J: {
      shape: [
        [1, 0, 0],
        [1, 1, 1],
        [0, 0, 0]
      ],
      color: '#0000FF' // 青
    },
    L: {
      shape: [
        [0, 0, 1],
        [1, 1, 1],
        [0, 0, 0]
      ],
      color: '#FFA500' // オレンジ
    }
  };

  /**
   * Tetrominoコンストラクタ
   * @param {string} type テトロミノタイプ（I, O, T, S, Z, J, L）
   * @param {Object} position 初期位置 {x, y}
   */
  constructor(type, position = { x: 4, y: 0 }) {
    if (!Tetromino.SHAPES[type]) {
      throw new Error(`Invalid tetromino type: ${type}`);
    }

    this.type = type;
    this.position = { ...position };
    this.defaultPosition = { ...position };
    this.shape = this.cloneShape(Tetromino.SHAPES[type].shape);
    this.color = Tetromino.SHAPES[type].color;
    this.rotationState = 0;
    this.isGhost = false;
  }

  /**
   * 形状の深いコピーを作成
   * @param {Array<Array<number>>} shape 元の形状
   * @returns {Array<Array<number>>} コピーされた形状
   */
  cloneShape(shape) {
    return shape.map(row => [...row]);
  }

  /**
   * 現在の形状を取得
   * @returns {Array<Array<number>>} 現在の形状
   */
  getShape() {
    return this.cloneShape(this.shape);
  }

  /**
   * 時計回りに回転
   */
  rotateClockwise() {
    // O字ピースは回転しても変わらない
    if (this.type === 'O') {
      return;
    }

    this.shape = this.rotateMatrixClockwise(this.shape);
    this.rotationState = (this.rotationState + 1) % 4;
  }

  /**
   * 反時計回りに回転
   */
  rotateCounterClockwise() {
    // O字ピースは回転しても変わらない
    if (this.type === 'O') {
      return;
    }

    this.shape = this.rotateMatrixCounterClockwise(this.shape);
    this.rotationState = (this.rotationState + 3) % 4; // -1と同等
  }

  /**
   * マトリックスを時計回りに回転
   * @param {Array<Array<number>>} matrix 元のマトリックス
   * @returns {Array<Array<number>>} 回転後のマトリックス
   */
  rotateMatrixClockwise(matrix) {
    const size = matrix.length;
    const rotated = Array(size).fill(null).map(() => Array(size).fill(0));

    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        rotated[j][size - 1 - i] = matrix[i][j];
      }
    }

    return rotated;
  }

  /**
   * マトリックスを反時計回りに回転
   * @param {Array<Array<number>>} matrix 元のマトリックス
   * @returns {Array<Array<number>>} 回転後のマトリックス
   */
  rotateMatrixCounterClockwise(matrix) {
    const size = matrix.length;
    const rotated = Array(size).fill(null).map(() => Array(size).fill(0));

    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        rotated[size - 1 - j][i] = matrix[i][j];
      }
    }

    return rotated;
  }

  /**
   * 左に移動
   */
  moveLeft() {
    this.position.x -= 1;
  }

  /**
   * 右に移動
   */
  moveRight() {
    this.position.x += 1;
  }

  /**
   * 下に移動
   */
  moveDown() {
    this.position.y += 1;
  }

  /**
   * 上に移動
   */
  moveUp() {
    this.position.y -= 1;
  }

  /**
   * 指定位置に設定
   * @param {number} x X座標
   * @param {number} y Y座標
   */
  setPosition(x, y) {
    this.position.x = x;
    this.position.y = y;
  }

  /**
   * 位置をデフォルト位置にリセット
   */
  resetPosition() {
    this.position = { ...this.defaultPosition };
  }

  /**
   * テトロミノの幅を取得
   * @returns {number} 幅
   */
  getWidth() {
    return this.shape[0].length;
  }

  /**
   * テトロミノの高さを取得
   * @returns {number} 高さ
   */
  getHeight() {
    return this.shape.length;
  }

  /**
   * 実際に占有しているセルの相対座標を取得
   * @returns {Array<Object>} 占有セルの配列 [{row, col}, ...]
   */
  getOccupiedCells() {
    const cells = [];
    
    for (let row = 0; row < this.shape.length; row++) {
      for (let col = 0; col < this.shape[row].length; col++) {
        if (this.shape[row][col] !== 0) {
          cells.push({ row, col });
        }
      }
    }
    
    return cells;
  }

  /**
   * 実際に占有しているセルの絶対座標を取得
   * @returns {Array<Object>} 占有セルの配列 [{row, col}, ...]
   */
  getAbsoluteCells() {
    const cells = [];
    
    for (let row = 0; row < this.shape.length; row++) {
      for (let col = 0; col < this.shape[row].length; col++) {
        if (this.shape[row][col] !== 0) {
          cells.push({
            row: this.position.y + row,
            col: this.position.x + col
          });
        }
      }
    }
    
    return cells;
  }

  /**
   * テトロミノを複製
   * @returns {Tetromino} 複製されたテトロミノ
   */
  clone() {
    const cloned = new Tetromino(this.type, this.position);
    cloned.shape = this.cloneShape(this.shape);
    cloned.rotationState = this.rotationState;
    cloned.isGhost = this.isGhost;
    return cloned;
  }

  /**
   * 他のテトロミノと等価かチェック
   * @param {Tetromino} other 比較対象のテトロミノ
   * @returns {boolean} 等価な場合true
   */
  equals(other) {
    if (!(other instanceof Tetromino)) {
      return false;
    }

    return (
      this.type === other.type &&
      this.position.x === other.position.x &&
      this.position.y === other.position.y &&
      this.rotationState === other.rotationState
    );
  }

  /**
   * ゴーストピースを作成
   * @returns {Tetromino} ゴーストピース
   */
  createGhost() {
    const ghost = this.clone();
    ghost.isGhost = true;
    return ghost;
  }

  /**
   * テトロミノの状態を文字列として取得（デバッグ用）
   * @returns {string} テトロミノの状態
   */
  toString() {
    const info = `Type: ${this.type}, Position: (${this.position.x}, ${this.position.y}), Rotation: ${this.rotationState}`;
    const shapeStr = this.shape.map(row => 
      row.map(cell => cell === 0 ? '.' : '█').join('')
    ).join('\n');
    
    return `${info}\n${shapeStr}`;
  }

  /**
   * テトロミノの状態をシリアライズ
   * @returns {Object} シリアライズされた状態
   */
  serialize() {
    return {
      type: this.type,
      position: { ...this.position },
      rotationState: this.rotationState,
      isGhost: this.isGhost
    };
  }

  /**
   * シリアライズされた状態からテトロミノを復元
   * @param {Object} data シリアライズされたデータ
   * @returns {Tetromino} 復元されたテトロミノ
   */
  static deserialize(data) {
    const tetromino = new Tetromino(data.type, data.position);
    
    // 回転状態を復元
    for (let i = 0; i < data.rotationState; i++) {
      tetromino.rotateClockwise();
    }
    
    tetromino.isGhost = data.isGhost || false;
    return tetromino;
  }

  /**
   * ランダムなテトロミノタイプを取得
   * @returns {string} ランダムなテトロミノタイプ
   */
  static getRandomType() {
    const types = Object.keys(Tetromino.SHAPES);
    return types[Math.floor(Math.random() * types.length)];
  }

  /**
   * 7-bag randomizer用のシャッフル済みピースセットを取得
   * @returns {Array<string>} シャッフルされたテトロミノタイプの配列
   */
  static getShuffledBag() {
    const types = Object.keys(Tetromino.SHAPES);
    
    // Fisher-Yates シャッフル
    for (let i = types.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [types[i], types[j]] = [types[j], types[i]];
    }
    
    return types;
  }
}
