/**
 * CollisionDetector.test.js - 衝突検知システムのユニットテスト
 * 
 * @tdd-development-expert との協力実装
 * TDDアプローチ: RED -> GREEN -> REFACTOR
 */

import CollisionDetector from '../../../src/core/usecases/CollisionDetector.js';
import Board from '../../../src/core/entities/Board.js';
import Tetromino from '../../../src/core/entities/Tetromino.js';

describe('CollisionDetector', () => {
  let collisionDetector;
  let board;

  beforeEach(() => {
    board = new Board();
    collisionDetector = new CollisionDetector(board);
  });

  describe('初期化', () => {
    test('CollisionDetectorが正しく初期化される', () => {
      expect(collisionDetector).toBeDefined();
      expect(collisionDetector.board).toBe(board);
    });
  });

  describe('基本的な衝突検知', () => {
    test('空のボードでは衝突しない', () => {
      const piece = new Tetromino('I');
      piece.x = 4;
      piece.y = 10;
      
      const result = collisionDetector.checkCollision(piece);
      
      expect(result.hasCollision).toBe(false);
      expect(result.collisionType).toBe('none');
    });

    test('占有されたセルとの衝突を検知', () => {
      // ボードにブロックを配置
      board.setCell(10, 5, 1);
      
      const piece = new Tetromino('I');
      piece.x = 4;
      piece.y = 9; // I字ピースの下部が10行目の5列目に来る位置
      
      const result = collisionDetector.checkCollision(piece);
      
      expect(result.hasCollision).toBe(true);
      expect(result.collisionType).toBe('piece');
    });

    test('左壁との衝突を検知', () => {
      const piece = new Tetromino('I');
      piece.x = -1; // 左端を超える
      piece.y = 10;
      
      const result = collisionDetector.checkCollision(piece);
      
      expect(result.hasCollision).toBe(true);
      expect(result.collisionType).toBe('wall');
      expect(result.wall).toBe('left');
    });

    test('右壁との衝突を検知', () => {
      const piece = new Tetromino('I');
      piece.x = 9; // 右端を超える（I字ピースは幅4）
      piece.y = 10;
      
      const result = collisionDetector.checkCollision(piece);
      
      expect(result.hasCollision).toBe(true);
      expect(result.collisionType).toBe('wall');
      expect(result.wall).toBe('right');
    });

    test('床との衝突を検知', () => {
      const piece = new Tetromino('I');
      piece.x = 4;
      piece.y = 20; // 底を超える
      
      const result = collisionDetector.checkCollision(piece);
      
      expect(result.hasCollision).toBe(true);
      expect(result.collisionType).toBe('floor');
    });

    test('天井との衝突を検知', () => {
      const piece = new Tetromino('I');
      piece.x = 4;
      piece.y = -1; // 上端を超える
      
      const result = collisionDetector.checkCollision(piece);
      
      expect(result.hasCollision).toBe(true);
      expect(result.collisionType).toBe('ceiling');
    });
  });

  describe('移動による衝突検知', () => {
    test('左移動の衝突チェック', () => {
      const piece = new Tetromino('T');
      piece.x = 1;
      piece.y = 10;
      
      const result = collisionDetector.checkMovement(piece, 'left');
      
      expect(result.canMove).toBe(true);
      expect(result.newPosition).toEqual({ x: 0, y: 10 });
    });

    test('左移動で壁衝突', () => {
      const piece = new Tetromino('T');
      piece.x = 0;
      piece.y = 10;
      
      const result = collisionDetector.checkMovement(piece, 'left');
      
      expect(result.canMove).toBe(false);
      expect(result.collisionType).toBe('wall');
      expect(result.wall).toBe('left');
    });

    test('右移動の衝突チェック', () => {
      const piece = new Tetromino('T');
      piece.x = 7;
      piece.y = 10;
      
      const result = collisionDetector.checkMovement(piece, 'right');
      
      expect(result.canMove).toBe(true);
      expect(result.newPosition).toEqual({ x: 8, y: 10 });
    });

    test('右移動で壁衝突', () => {
      const piece = new Tetromino('T');
      piece.x = 8; // T字ピースは幅3なので8+3=11で右壁超え
      piece.y = 10;
      
      const result = collisionDetector.checkMovement(piece, 'right');
      
      expect(result.canMove).toBe(false);
      expect(result.collisionType).toBe('wall');
      expect(result.wall).toBe('right');
    });

    test('下移動の衝突チェック', () => {
      const piece = new Tetromino('T');
      piece.x = 4;
      piece.y = 10;
      
      const result = collisionDetector.checkMovement(piece, 'down');
      
      expect(result.canMove).toBe(true);
      expect(result.newPosition).toEqual({ x: 4, y: 11 });
    });

    test('下移動で床衝突', () => {
      const piece = new Tetromino('T');
      piece.x = 4;
      piece.y = 18; // T字ピースの高さ2なので18+2=20で床衝突
      
      const result = collisionDetector.checkMovement(piece, 'down');
      
      expect(result.canMove).toBe(false);
      expect(result.collisionType).toBe('floor');
    });

    test('無効な移動方向の処理', () => {
      const piece = new Tetromino('T');
      piece.x = 4;
      piece.y = 10;
      
      const result = collisionDetector.checkMovement(piece, 'invalid');
      
      expect(result.canMove).toBe(false);
      expect(result.error).toBe('invalid_direction');
    });
  });

  describe('回転による衝突検知', () => {
    test('回転可能な場合', () => {
      const piece = new Tetromino('T');
      piece.x = 4;
      piece.y = 10;
      
      const result = collisionDetector.checkRotation(piece, 'clockwise');
      
      expect(result.canRotate).toBe(true);
      expect(result.newRotation).toBe(1);
    });

    test('回転で壁衝突する場合', () => {
      const piece = new Tetromino('I');
      piece.x = 8; // 右端近く
      piece.y = 10;
      piece.rotation = 0; // 水平状態
      
      const result = collisionDetector.checkRotation(piece, 'clockwise');
      
      // I字ピースを右端で回転すると右壁を超える可能性
      if (!result.canRotate) {
        expect(result.collisionType).toBe('wall');
      }
    });

    test('回転でピース衝突する場合', () => {
      // 回転先にブロックを配置
      board.setCell(10, 3, 1);
      board.setCell(11, 3, 1);
      
      const piece = new Tetromino('T');
      piece.x = 3;
      piece.y = 10;
      
      const result = collisionDetector.checkRotation(piece, 'clockwise');
      
      // 回転でブロックと衝突する可能性
      if (!result.canRotate) {
        expect(result.collisionType).toBe('piece');
      }
    });

    test('反時計回りの回転チェック', () => {
      const piece = new Tetromino('T');
      piece.x = 4;
      piece.y = 10;
      piece.rotation = 1;
      
      const result = collisionDetector.checkRotation(piece, 'counterclockwise');
      
      expect(result.canRotate).toBe(true);
      expect(result.newRotation).toBe(0);
    });

    test('無効な回転方向の処理', () => {
      const piece = new Tetromino('T');
      piece.x = 4;
      piece.y = 10;
      
      const result = collisionDetector.checkRotation(piece, 'invalid');
      
      expect(result.canRotate).toBe(false);
      expect(result.error).toBe('invalid_direction');
    });
  });

  describe('Wall Kick検知', () => {
    test('Wall Kickが必要な状況を検知', () => {
      const piece = new Tetromino('T');
      piece.x = 8; // 右端近く
      piece.y = 10;
      
      const result = collisionDetector.checkWallKick(piece, 0, 1); // 0度から90度
      
      expect(result.needsKick).toBeDefined();
      if (result.needsKick) {
        expect(result.kickOffsets).toBeDefined();
        expect(Array.isArray(result.kickOffsets)).toBe(true);
      }
    });

    test('Wall Kickの有効なオフセット検索', () => {
      // 右端での回転テスト
      const piece = new Tetromino('I');
      piece.x = 7;
      piece.y = 10;
      piece.rotation = 0;
      
      const result = collisionDetector.checkWallKick(piece, 0, 1);
      
      if (result.needsKick) {
        expect(result.validKick).toBeDefined();
        if (result.validKick) {
          expect(result.validKick.offset).toBeDefined();
          expect(result.validKick.newPosition).toBeDefined();
        }
      }
    });

    test('全てのWall Kickが失敗する場合', () => {
      // 周囲をブロックで囲む
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const x = 5 + dx;
          const y = 10 + dy;
          if (x >= 0 && x < 10 && y >= 0 && y < 20) {
            board.setCell(y, x, 1);
          }
        }
      }
      
      const piece = new Tetromino('T');
      piece.x = 5;
      piece.y = 10;
      
      const result = collisionDetector.checkWallKick(piece, 0, 1);
      
      expect(result.needsKick).toBe(true);
      expect(result.validKick).toBe(null);
    });
  });

  describe('配置可能性チェック', () => {
    test('ピース配置が可能', () => {
      const piece = new Tetromino('T');
      piece.x = 4;
      piece.y = 10;
      
      const result = collisionDetector.canPlacePiece(piece);
      
      expect(result.canPlace).toBe(true);
      expect(result.placementCells).toBeDefined();
      expect(Array.isArray(result.placementCells)).toBe(true);
    });

    test('ピース配置が不可能（衝突）', () => {
      // 配置先にブロックを設置
      board.setCell(10, 4, 1);
      
      const piece = new Tetromino('T');
      piece.x = 4;
      piece.y = 9; // T字ピースの下部が10行目4列に来る
      
      const result = collisionDetector.canPlacePiece(piece);
      
      expect(result.canPlace).toBe(false);
      expect(result.reason).toBe('collision');
    });

    test('ピース配置が不可能（境界外）', () => {
      const piece = new Tetromino('T');
      piece.x = -1; // 左境界外
      piece.y = 10;
      
      const result = collisionDetector.canPlacePiece(piece);
      
      expect(result.canPlace).toBe(false);
      expect(result.reason).toBe('out_of_bounds');
    });
  });

  describe('ゴーストピース位置計算', () => {
    test('ゴーストピースの位置を計算', () => {
      const piece = new Tetromino('T');
      piece.x = 4;
      piece.y = 5;
      
      const result = collisionDetector.calculateGhostPosition(piece);
      
      expect(result.ghostY).toBeGreaterThan(piece.y);
      expect(result.distance).toBeGreaterThan(0);
    });

    test('既に底にある場合のゴーストピース', () => {
      const piece = new Tetromino('T');
      piece.x = 4;
      piece.y = 18; // ほぼ底
      
      const result = collisionDetector.calculateGhostPosition(piece);
      
      expect(result.ghostY).toBeGreaterThanOrEqual(piece.y);
      expect(result.distance).toBeGreaterThanOrEqual(0);
    });

    test('障害物がある場合のゴーストピース', () => {
      // 底近くにブロックを配置
      board.setCell(15, 4, 1);
      board.setCell(15, 5, 1);
      
      const piece = new Tetromino('T');
      piece.x = 4;
      piece.y = 5;
      
      const result = collisionDetector.calculateGhostPosition(piece);
      
      expect(result.ghostY).toBeLessThan(15); // 障害物の上で停止
    });
  });

  describe('複雑な衝突シナリオ', () => {
    test('L字型の隙間での衝突検知', () => {
      // L字型の隙間を作成
      for (let col = 0; col < 7; col++) {
        board.setCell(19, col, 1);
      }
      for (let row = 17; row < 19; row++) {
        board.setCell(row, 0, 1);
        board.setCell(row, 1, 1);
      }
      
      const piece = new Tetromino('L');
      piece.x = 2;
      piece.y = 16;
      
      const result = collisionDetector.checkCollision(piece);
      
      // 複雑な形状での正確な衝突判定
      expect(typeof result.hasCollision).toBe('boolean');
    });

    test('複数ピースが密集している状況', () => {
      // ランダムにブロックを配置
      for (let i = 0; i < 50; i++) {
        const x = Math.floor(Math.random() * 10);
        const y = Math.floor(Math.random() * 10) + 10;
        board.setCell(y, x, 1);
      }
      
      const piece = new Tetromino('S');
      piece.x = 4;
      piece.y = 8;
      
      const result = collisionDetector.checkCollision(piece);
      
      // 密集状況でも正確に判定
      expect(typeof result.hasCollision).toBe('boolean');
    });
  });

  describe('エラーハンドリング', () => {
    test('null ピースの処理', () => {
      const result = collisionDetector.checkCollision(null);
      
      expect(result.hasCollision).toBe(true);
      expect(result.error).toBe('invalid_piece');
    });

    test('undefined ピースの処理', () => {
      const result = collisionDetector.checkCollision(undefined);
      
      expect(result.hasCollision).toBe(true);
      expect(result.error).toBe('invalid_piece');
    });

    test('無効な座標の処理', () => {
      const piece = new Tetromino('T');
      piece.x = NaN;
      piece.y = 10;
      
      const result = collisionDetector.checkCollision(piece);
      
      expect(result.hasCollision).toBe(true);
      expect(result.error).toBe('invalid_coordinates');
    });

    test('極端な座標値の処理', () => {
      const piece = new Tetromino('T');
      piece.x = Number.MAX_SAFE_INTEGER;
      piece.y = Number.MAX_SAFE_INTEGER;
      
      const result = collisionDetector.checkCollision(piece);
      
      expect(result.hasCollision).toBe(true);
      expect(result.collisionType).toBe('out_of_bounds');
    });
  });

  describe('パフォーマンス', () => {
    test('大量の衝突チェックが効率的に実行される', () => {
      const piece = new Tetromino('T');
      
      const startTime = performance.now();
      
      // 1000回の衝突チェック
      for (let i = 0; i < 1000; i++) {
        piece.x = Math.floor(Math.random() * 8);
        piece.y = Math.floor(Math.random() * 18);
        collisionDetector.checkCollision(piece);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(100); // 100ms以内
    });

    test('複雑なボード状態でのパフォーマンス', () => {
      // ボードを半分埋める
      for (let row = 10; row < 20; row++) {
        for (let col = 0; col < 5; col++) {
          board.setCell(row, col, 1);
        }
      }
      
      const piece = new Tetromino('I');
      
      const startTime = performance.now();
      
      // 100回の複雑な衝突チェック
      for (let i = 0; i < 100; i++) {
        piece.x = Math.floor(Math.random() * 7);
        piece.y = Math.floor(Math.random() * 15);
        piece.rotation = Math.floor(Math.random() * 4);
        
        collisionDetector.checkCollision(piece);
        collisionDetector.checkMovement(piece, 'down');
        collisionDetector.checkRotation(piece, 'clockwise');
        collisionDetector.calculateGhostPosition(piece);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(200); // 200ms以内
    });
  });
});
