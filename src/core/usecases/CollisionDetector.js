/**
 * CollisionDetector.js - 衝突検知システム
 * 
 * オニオンアーキテクチャ: Application Layer (Use Cases)
 * 
 * 責任:
 * - ピースとボード間の衝突検知
 * - ピースと壁・床・天井の境界検知
 * - Wall Kickシステムの支援
 * - ゴーストピース位置の計算
 * - 移動・回転可能性の事前チェック
 * 
 * @tdd-development-expert との協力実装
 */

export default class CollisionDetector {
  /**
   * @param {Board} board - ゲームボードエンティティ
   */
  constructor(board) {
    this.board = board;
    
    // Wall Kickオフセットテーブル（SRSガイドライン準拠）
    this.wallKickTables = this._initializeWallKickTables();
  }

  /**
   * ピースの衝突をチェック
   * @param {Tetromino} piece - チェック対象のピース
   * @returns {Object} 衝突結果
   */
  checkCollision(piece) {
    // 入力検証
    if (!this._isValidPiece(piece)) {
      return this._createCollisionResult(true, 'invalid_piece', 'invalid_piece');
    }

    if (!this._isValidCoordinates(piece.x, piece.y)) {
      return this._createCollisionResult(true, 'invalid_coordinates', 'invalid_coordinates');
    }

    // 境界チェック
    const boundaryResult = this._checkBoundaries(piece);
    if (boundaryResult.hasCollision) {
      return boundaryResult;
    }

    // ピース衝突チェック
    const pieceResult = this._checkPieceCollision(piece);
    if (pieceResult.hasCollision) {
      return pieceResult;
    }

    // 衝突なし
    return this._createCollisionResult(false, 'none');
  }

  /**
   * 移動可能性をチェック
   * @param {Tetromino} piece - チェック対象のピース
   * @param {string} direction - 移動方向 ('left', 'right', 'down')
   * @returns {Object} 移動チェック結果
   */
  checkMovement(piece, direction) {
    if (!this._isValidPiece(piece)) {
      return this._createMovementResult(false, null, 'invalid_piece');
    }

    if (!this._isValidDirection(direction)) {
      return this._createMovementResult(false, null, 'invalid_direction');
    }

    // 新しい位置を計算
    const newPosition = this._calculateNewPosition(piece, direction);
    
    // 新しい位置でのピースを作成（一時的）
    const testPiece = this._createTestPiece(piece, newPosition.x, newPosition.y);
    
    // 衝突チェック
    const collisionResult = this.checkCollision(testPiece);
    
    if (collisionResult.hasCollision) {
      return {
        canMove: false,
        collisionType: collisionResult.collisionType,
        wall: collisionResult.wall,
        reason: collisionResult.collisionType
      };
    }

    return {
      canMove: true,
      newPosition: newPosition,
      collisionType: 'none'
    };
  }

  /**
   * 回転可能性をチェック
   * @param {Tetromino} piece - チェック対象のピース
   * @param {string} direction - 回転方向 ('clockwise', 'counterclockwise')
   * @returns {Object} 回転チェック結果
   */
  checkRotation(piece, direction) {
    if (!this._isValidPiece(piece)) {
      return this._createRotationResult(false, piece.rotation, 'invalid_piece');
    }

    if (!this._isValidRotationDirection(direction)) {
      return this._createRotationResult(false, piece.rotation, 'invalid_direction');
    }

    // 新しい回転状態を計算
    const newRotation = this._calculateNewRotation(piece.rotation, direction);
    
    // 新しい回転状態でのピースを作成（一時的）
    const testPiece = this._createTestPiece(piece, piece.x, piece.y, newRotation);
    
    // 衝突チェック
    const collisionResult = this.checkCollision(testPiece);
    
    if (collisionResult.hasCollision) {
      return {
        canRotate: false,
        collisionType: collisionResult.collisionType,
        wall: collisionResult.wall,
        currentRotation: piece.rotation,
        newRotation: newRotation
      };
    }

    return {
      canRotate: true,
      currentRotation: piece.rotation,
      newRotation: newRotation,
      collisionType: 'none'
    };
  }

  /**
   * Wall Kickをチェック
   * @param {Tetromino} piece - チェック対象のピース
   * @param {number} fromRotation - 回転前の状態
   * @param {number} toRotation - 回転後の状態
   * @returns {Object} Wall Kickチェック結果
   */
  checkWallKick(piece, fromRotation, toRotation) {
    if (!this._isValidPiece(piece)) {
      return { needsKick: false, validKick: null, error: 'invalid_piece' };
    }

    // Wall Kickテーブルを取得
    const kickTable = this._getWallKickTable(piece.type);
    const kickOffsets = kickTable[fromRotation]?.[toRotation] || [];

    if (kickOffsets.length === 0) {
      return { needsKick: false, validKick: null };
    }

    // 回転後のピースを作成
    const rotatedPiece = this._createTestPiece(piece, piece.x, piece.y, toRotation);

    // 基本位置で衝突しない場合はキック不要
    if (!this.checkCollision(rotatedPiece).hasCollision) {
      return { needsKick: false, validKick: null };
    }

    // 各キックオフセットを試行
    for (let i = 0; i < kickOffsets.length; i++) {
      const [dx, dy] = kickOffsets[i];
      const testPiece = this._createTestPiece(
        piece, 
        piece.x + dx, 
        piece.y + dy, 
        toRotation
      );

      if (!this.checkCollision(testPiece).hasCollision) {
        return {
          needsKick: true,
          validKick: {
            offset: [dx, dy],
            offsetIndex: i,
            newPosition: { x: piece.x + dx, y: piece.y + dy }
          },
          kickOffsets: kickOffsets
        };
      }
    }

    // 全てのキックが失敗
    return {
      needsKick: true,
      validKick: null,
      kickOffsets: kickOffsets
    };
  }

  /**
   * ピース配置可能性をチェック
   * @param {Tetromino} piece - チェック対象のピース
   * @returns {Object} 配置チェック結果
   */
  canPlacePiece(piece) {
    if (!this._isValidPiece(piece)) {
      return {
        canPlace: false,
        reason: 'invalid_piece'
      };
    }

    const collisionResult = this.checkCollision(piece);
    
    if (collisionResult.hasCollision) {
      let reason = 'collision';
      
      if (collisionResult.collisionType === 'wall' || 
          collisionResult.collisionType === 'floor' || 
          collisionResult.collisionType === 'ceiling') {
        reason = 'out_of_bounds';
      }
      
      return {
        canPlace: false,
        reason: reason,
        collisionType: collisionResult.collisionType
      };
    }

    // 配置するセル座標を計算
    const placementCells = this._getAbsoluteCells(piece);

    return {
      canPlace: true,
      placementCells: placementCells,
      affectedRows: this._getAffectedRows(placementCells)
    };
  }

  /**
   * ゴーストピースの位置を計算
   * @param {Tetromino} piece - 基準となるピース
   * @returns {Object} ゴーストピース位置
   */
  calculateGhostPosition(piece) {
    if (!this._isValidPiece(piece)) {
      return {
        ghostY: piece?.y || 0,
        distance: 0,
        error: 'invalid_piece'
      };
    }

    let ghostY = piece.y;
    let distance = 0;

    // 1セルずつ下に移動して衝突まで探索
    while (distance < this.board.height) {
      const testPiece = this._createTestPiece(piece, piece.x, ghostY + 1);
      
      if (this.checkCollision(testPiece).hasCollision) {
        break;
      }
      
      ghostY++;
      distance++;
      
      // 安全装置：無限ループ防止
      if (distance > this.board.height) {
        break;
      }
    }

    return {
      ghostY: ghostY,
      distance: distance,
      originalY: piece.y
    };
  }

  /**
   * 特定位置での衝突をチェック
   * @param {Tetromino} piece - チェック対象のピース
   * @param {number} x - X座標
   * @param {number} y - Y座標
   * @param {number} rotation - 回転状態（省略可）
   * @returns {Object} 衝突結果
   */
  checkCollisionAt(piece, x, y, rotation = null) {
    if (!this._isValidPiece(piece)) {
      return this._createCollisionResult(true, 'invalid_piece', 'invalid_piece');
    }

    const testRotation = rotation !== null ? rotation : piece.rotation;
    const testPiece = this._createTestPiece(piece, x, y, testRotation);
    
    return this.checkCollision(testPiece);
  }

  // === プライベートメソッド ===

  /**
   * 有効なピースかチェック
   * @private
   * @param {*} piece - チェック対象
   * @returns {boolean}
   */
  _isValidPiece(piece) {
    return piece && 
           typeof piece === 'object' && 
           typeof piece.x === 'number' && 
           typeof piece.y === 'number' && 
           (piece.rotation === undefined || typeof piece.rotation === 'number') &&
           typeof piece.getOccupiedCells === 'function';
  }

  /**
   * 有効な座標かチェック
   * @private
   * @param {number} x - X座標
   * @param {number} y - Y座標
   * @returns {boolean}
   */
  _isValidCoordinates(x, y) {
    return typeof x === 'number' && typeof y === 'number' && 
           !isNaN(x) && !isNaN(y) && 
           isFinite(x) && isFinite(y);
  }

  /**
   * 有効な移動方向かチェック
   * @private
   * @param {string} direction - 方向
   * @returns {boolean}
   */
  _isValidDirection(direction) {
    return ['left', 'right', 'down'].includes(direction);
  }

  /**
   * 有効な回転方向かチェック
   * @private
   * @param {string} direction - 回転方向
   * @returns {boolean}
   */
  _isValidRotationDirection(direction) {
    return ['clockwise', 'counterclockwise'].includes(direction);
  }

  /**
   * 境界衝突をチェック
   * @private
   * @param {Tetromino} piece - チェック対象のピース
   * @returns {Object} 境界衝突結果
   */
  _checkBoundaries(piece) {
    const cells = piece.getOccupiedCells();
    
    for (const cell of cells) {
      // セルの形式を判定
      let dx, dy;
      if (Array.isArray(cell)) {
        [dx, dy] = cell;
      } else if (cell && typeof cell === 'object') {
        dx = cell.col;
        dy = cell.row;
      } else {
        continue;
      }
      
      const x = piece.x + dx;
      const y = piece.y + dy;
      
      // 左壁
      if (x < 0) {
        return this._createCollisionResult(true, 'wall', null, 'left');
      }
      
      // 右壁
      if (x >= this.board.width) {
        return this._createCollisionResult(true, 'wall', null, 'right');
      }
      
      // 天井
      if (y < 0) {
        return this._createCollisionResult(true, 'ceiling');
      }
      
      // 床
      if (y >= this.board.height) {
        return this._createCollisionResult(true, 'floor');
      }
    }
    
    return this._createCollisionResult(false, 'none');
  }

  /**
   * ピース間衝突をチェック
   * @private
   * @param {Tetromino} piece - チェック対象のピース
   * @returns {Object} ピース衝突結果
   */
  _checkPieceCollision(piece) {
    const cells = piece.getOccupiedCells();
    
    for (const cell of cells) {
      // セルの形式を判定
      let dx, dy;
      if (Array.isArray(cell)) {
        [dx, dy] = cell;
      } else if (cell && typeof cell === 'object') {
        dx = cell.col;
        dy = cell.row;
      } else {
        continue;
      }
      
      const x = piece.x + dx;
      const y = piece.y + dy;
      
      // ボード内の占有セルチェック
      if (this.board.getCell(y, x) !== 0) {
        return this._createCollisionResult(true, 'piece', null, null, { x, y });
      }
    }
    
    return this._createCollisionResult(false, 'none');
  }

  /**
   * 新しい位置を計算
   * @private
   * @param {Tetromino} piece - 基準ピース
   * @param {string} direction - 移動方向
   * @returns {Object} 新しい位置
   */
  _calculateNewPosition(piece, direction) {
    const position = { x: piece.x, y: piece.y };
    
    switch (direction) {
      case 'left':
        position.x--;
        break;
      case 'right':
        position.x++;
        break;
      case 'down':
        position.y++;
        break;
    }
    
    return position;
  }

  /**
   * 新しい回転状態を計算
   * @private
   * @param {number} currentRotation - 現在の回転状態
   * @param {string} direction - 回転方向
   * @returns {number} 新しい回転状態
   */
  _calculateNewRotation(currentRotation, direction) {
    if (direction === 'clockwise') {
      return (currentRotation + 1) % 4;
    } else if (direction === 'counterclockwise') {
      return currentRotation === 0 ? 3 : currentRotation - 1;
    }
    return currentRotation;
  }

  /**
   * テスト用ピースを作成
   * @private
   * @param {Tetromino} basePiece - 基準ピース
   * @param {number} x - X座標
   * @param {number} y - Y座標
   * @param {number} rotation - 回転状態（省略可）
   * @returns {Object} テスト用ピース
   */
  _createTestPiece(basePiece, x, y, rotation = null) {
    // Tetrominoクラスのインスタンスを作成
    const testPiece = {
      x: x,
      y: y,
      rotation: rotation !== null ? rotation : (basePiece.rotation || 0),
      type: basePiece.type,
      getOccupiedCells: basePiece.getOccupiedCells.bind(basePiece)
    };
    
    // 一時的に座標と回転を設定
    const originalX = basePiece.x;
    const originalY = basePiece.y;
    const originalRotation = basePiece.rotation;
    
    basePiece.x = x;
    basePiece.y = y;
    if (rotation !== null) {
      basePiece.rotation = rotation;
    }
    
    // セルを取得
    const cells = basePiece.getOccupiedCells();
    
    // 元に戻す
    basePiece.x = originalX;
    basePiece.y = originalY;
    basePiece.rotation = originalRotation;
    
    // テストピースにセルを設定
    testPiece.getOccupiedCells = () => cells;
    
    return testPiece;
  }

  /**
   * 絶対座標でのセル位置を取得
   * @private
   * @param {Tetromino} piece - 対象ピース
   * @returns {Array} 絶対座標のセル配列
   */
  _getAbsoluteCells(piece) {
    const cells = piece.getOccupiedCells();
    return cells.map(([dx, dy]) => ({
      x: piece.x + dx,
      y: piece.y + dy
    }));
  }

  /**
   * 影響する行を取得
   * @private
   * @param {Array} cells - セル配列
   * @returns {Array} 影響する行番号
   */
  _getAffectedRows(cells) {
    const rows = new Set();
    cells.forEach(cell => rows.add(cell.y));
    return Array.from(rows).sort((a, b) => a - b);
  }

  /**
   * Wall Kickテーブルを取得
   * @private
   * @param {string} pieceType - ピースタイプ
   * @returns {Object} Wall Kickテーブル
   */
  _getWallKickTable(pieceType) {
    return this.wallKickTables[pieceType] || this.wallKickTables.default;
  }

  /**
   * Wall Kickテーブルを初期化
   * @private
   * @returns {Object} Wall Kickテーブル
   */
  _initializeWallKickTables() {
    // SRSガイドライン準拠のWall Kickテーブル
    const defaultTable = {
      0: {
        1: [[-1, 0], [-1, 1], [0, -2], [-1, -2]],
        3: [[1, 0], [1, 1], [0, -2], [1, -2]]
      },
      1: {
        0: [[1, 0], [1, -1], [0, 2], [1, 2]],
        2: [[1, 0], [1, -1], [0, 2], [1, 2]]
      },
      2: {
        1: [[-1, 0], [-1, 1], [0, -2], [-1, -2]],
        3: [[1, 0], [1, 1], [0, -2], [1, -2]]
      },
      3: {
        0: [[-1, 0], [-1, -1], [0, 2], [-1, 2]],
        2: [[-1, 0], [-1, -1], [0, 2], [-1, 2]]
      }
    };

    const iTable = {
      0: {
        1: [[-2, 0], [1, 0], [-2, -1], [1, 2]],
        3: [[-1, 0], [2, 0], [-1, 2], [2, -1]]
      },
      1: {
        0: [[2, 0], [-1, 0], [2, 1], [-1, -2]],
        2: [[-1, 0], [2, 0], [-1, 2], [2, -1]]
      },
      2: {
        1: [[1, 0], [-2, 0], [1, -2], [-2, 1]],
        3: [[2, 0], [-1, 0], [2, 1], [-1, -2]]
      },
      3: {
        0: [[1, 0], [-2, 0], [1, -2], [-2, 1]],
        2: [[-2, 0], [1, 0], [-2, -1], [1, 2]]
      }
    };

    return {
      default: defaultTable,
      I: iTable,
      O: {}, // O字ピースは回転しても形状が変わらないためキック不要
      T: defaultTable,
      S: defaultTable,
      Z: defaultTable,
      J: defaultTable,
      L: defaultTable
    };
  }

  /**
   * 衝突結果オブジェクトを作成
   * @private
   * @param {boolean} hasCollision - 衝突があるか
   * @param {string} collisionType - 衝突タイプ
   * @param {string} error - エラーメッセージ
   * @param {string} wall - 壁の種類
   * @param {Object} collisionPoint - 衝突点
   * @returns {Object}
   */
  _createCollisionResult(hasCollision, collisionType, error = null, wall = null, collisionPoint = null) {
    const result = {
      hasCollision,
      collisionType
    };

    if (error) result.error = error;
    if (wall) result.wall = wall;
    if (collisionPoint) result.collisionPoint = collisionPoint;

    return result;
  }

  /**
   * 移動結果オブジェクトを作成
   * @private
   * @param {boolean} canMove - 移動可能か
   * @param {Object} newPosition - 新しい位置
   * @param {string} error - エラーメッセージ
   * @returns {Object}
   */
  _createMovementResult(canMove, newPosition, error = null) {
    const result = { canMove };
    
    if (newPosition) result.newPosition = newPosition;
    if (error) result.error = error;
    
    return result;
  }

  /**
   * 回転結果オブジェクトを作成
   * @private
   * @param {boolean} canRotate - 回転可能か
   * @param {number} rotation - 回転状態
   * @param {string} error - エラーメッセージ
   * @returns {Object}
   */
  _createRotationResult(canRotate, rotation, error = null) {
    const result = {
      canRotate,
      newRotation: rotation
    };
    
    if (error) result.error = error;
    
    return result;
  }
}
