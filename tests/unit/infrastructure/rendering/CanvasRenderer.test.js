/**
 * CanvasRenderer.test.js - Canvas描画エンジンのユニットテスト
 *
 * @tdd-development-expert との協力実装
 * TDDアプローチ: RED -> GREEN -> REFACTOR
 */

import CanvasRenderer from '../../../../src/infrastructure/rendering/CanvasRenderer.js';
import { DOMTestHelper } from '../../../utils/test-helpers.js';

describe('CanvasRenderer', () => {
  let canvasRenderer;
  let mockCanvas;
  let mockContext;

  beforeEach(() => {
    // CanvasとContextのモック設定
    mockContext = {
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0,
      clearRect: jest.fn(),
      fillRect: jest.fn(),
      strokeRect: jest.fn(),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      stroke: jest.fn(),
      fill: jest.fn(),
      arc: jest.fn(),
      closePath: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
      translate: jest.fn(),
      rotate: jest.fn(),
      scale: jest.fn(),
      setTransform: jest.fn(),
      getImageData: jest.fn(),
      putImageData: jest.fn(),
      createImageData: jest.fn(),
      drawImage: jest.fn(),
      measureText: jest.fn(() => ({ width: 100, height: 20 })),
      fillText: jest.fn(),
      strokeText: jest.fn(),
      setLineDash: jest.fn(),
      getLineDash: jest.fn(() => []),
      resetTransform: jest.fn(),
    };

    mockCanvas = {
      width: 800,
      height: 600,
      getContext: jest.fn(() => mockContext),
      toDataURL: jest.fn(() => 'data:image/png;base64,mock'),
      style: {},
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };

    // DOMTestHelperでCanvasモック設定
    DOMTestHelper.setupCanvasMock(mockCanvas);

    canvasRenderer = new CanvasRenderer(mockCanvas);
  });

  afterEach(() => {
    if (canvasRenderer) {
      canvasRenderer.destroy();
    }
    // モッククリーンアップ
    jest.clearAllMocks();
  });

  describe('初期化', () => {
    test('CanvasRendererが正しく初期化される', () => {
      expect(canvasRenderer).toBeDefined();
      expect(canvasRenderer).toBeInstanceOf(CanvasRenderer);
    });

    test('Canvas要素が正しく設定される', () => {
      expect(canvasRenderer.canvas).toBe(mockCanvas);
      expect(canvasRenderer.context).toBe(mockContext);
    });

    test('デフォルト設定が正しく適用される', () => {
      const config = canvasRenderer.getConfig();
      expect(config).toBeDefined();
      expect(config.cellSize).toBe(30);
      expect(config.boardOffsetX).toBe(50);
      expect(config.boardOffsetY).toBe(50);
    });
  });

  describe('ボード描画', () => {
    test('空のボードが正しく描画される', () => {
      const emptyBoard = Array(20)
        .fill()
        .map(() => Array(10).fill(0));

      canvasRenderer.drawBoard(emptyBoard);

      expect(mockContext.clearRect).toHaveBeenCalled();
      expect(mockContext.strokeRect).toHaveBeenCalled();
      expect(mockContext.fillRect).toHaveBeenCalled();
    });

    test('ピースが配置されたボードが正しく描画される', () => {
      const boardWithPiece = Array(20)
        .fill()
        .map(() => Array(10).fill(0));
      // テスト用ピースを配置
      boardWithPiece[19][0] = 1; // Iピース
      boardWithPiece[19][1] = 1;
      boardWithPiece[19][2] = 1;
      boardWithPiece[19][3] = 1;

      canvasRenderer.drawBoard(boardWithPiece);

      expect(mockContext.fillRect).toHaveBeenCalled();
      expect(mockContext.strokeRect).toHaveBeenCalled();
    });

    test('ボードの境界線が正しく描画される', () => {
      const emptyBoard = Array(20)
        .fill()
        .map(() => Array(10).fill(0));

      canvasRenderer.drawBoard(emptyBoard);

      // 境界線の描画確認
      expect(mockContext.strokeRect).toHaveBeenCalledWith(
        50,
        50,
        300,
        600 // boardOffsetX, boardOffsetY, width, height
      );
    });

    test('ボードの背景が正しくクリアされる', () => {
      const emptyBoard = Array(20)
        .fill()
        .map(() => Array(10).fill(0));

      canvasRenderer.drawBoard(emptyBoard);

      expect(mockContext.clearRect).toHaveBeenCalledWith(0, 0, 800, 600);
    });
  });

  describe('ピース描画', () => {
    test('テトロミノピースが正しく描画される', () => {
      const piece = {
        type: 'I',
        x: 0,
        y: 0,
        rotation: 0,
        shape: [[1, 1, 1, 1]],
      };

      canvasRenderer.drawPiece(piece);

      expect(mockContext.fillRect).toHaveBeenCalled();
      expect(mockContext.strokeRect).toHaveBeenCalled();
    });

    test('ピースの回転が正しく描画される', () => {
      const piece = {
        type: 'T',
        x: 3,
        y: 0,
        rotation: 1,
        shape: [
          [0, 1, 0],
          [1, 1, 1],
        ],
      };

      canvasRenderer.drawPiece(piece);

      expect(mockContext.save).toHaveBeenCalled();
      expect(mockContext.translate).toHaveBeenCalled();
      expect(mockContext.rotate).toHaveBeenCalled();
      expect(mockContext.restore).toHaveBeenCalled();
    });

    test('ピースの色が正しく設定される', () => {
      const piece = {
        type: 'O',
        x: 4,
        y: 0,
        rotation: 0,
        shape: [
          [1, 1],
          [1, 1],
        ],
      };

      canvasRenderer.drawPiece(piece);

      expect(mockContext.fillStyle).toBeDefined();
      expect(mockContext.strokeStyle).toBeDefined();
    });

    test('ゴーストピースが正しく描画される', () => {
      const ghostPiece = {
        type: 'I',
        x: 0,
        y: 18, // 最下部付近
        rotation: 0,
        shape: [[1, 1, 1, 1]],
      };

      canvasRenderer.drawGhostPiece(ghostPiece);

      expect(mockContext.setLineDash).toHaveBeenCalled();
      expect(mockContext.strokeRect).toHaveBeenCalled();
    });
  });

  describe('UI要素描画', () => {
    test('スコアが正しく描画される', () => {
      const score = 15000;
      const level = 5;
      const lines = 25;

      canvasRenderer.drawScore(score, level, lines);

      expect(mockContext.fillText).toHaveBeenCalled();
      expect(mockContext.strokeText).toHaveBeenCalled();
    });

    test('レベル情報が正しく描画される', () => {
      const level = 8;

      canvasRenderer.drawLevel(level);

      expect(mockContext.fillText).toHaveBeenCalled();
      expect(mockContext.fillStyle).toBeDefined();
    });

    test('ライン数が正しく描画される', () => {
      const lines = 42;

      canvasRenderer.drawLines(lines);

      expect(mockContext.fillText).toHaveBeenCalled();
    });

    test('次のピースが正しく描画される', () => {
      const nextPiece = {
        type: 'T',
        shape: [
          [0, 1, 0],
          [1, 1, 1],
        ],
      };

      canvasRenderer.drawNextPiece(nextPiece);

      expect(mockContext.fillRect).toHaveBeenCalled();
      expect(mockContext.strokeRect).toHaveBeenCalled();
    });

    test('ゲームオーバー画面が正しく描画される', () => {
      const finalScore = 25000;

      canvasRenderer.drawGameOver(finalScore);

      expect(mockContext.fillRect).toHaveBeenCalled();
      expect(mockContext.fillText).toHaveBeenCalled();
      expect(mockContext.strokeText).toHaveBeenCalled();
    });

    test('一時停止画面が正しく描画される', () => {
      canvasRenderer.drawPause();

      expect(mockContext.fillRect).toHaveBeenCalled();
      expect(mockContext.fillText).toHaveBeenCalled();
    });
  });

  describe('アニメーション機能', () => {
    test('ラインクリアアニメーションが正しく描画される', () => {
      const lines = [15, 16, 17]; // クリアされるライン

      canvasRenderer.drawLineClearAnimation(lines);

      expect(mockContext.fillRect).toHaveBeenCalled();
      expect(mockContext.strokeRect).toHaveBeenCalled();
    });

    test('ピース落下アニメーションが正しく描画される', () => {
      const piece = {
        type: 'I',
        x: 0,
        y: 0,
        rotation: 0,
        shape: [[1, 1, 1, 1]],
      };

      canvasRenderer.drawDropAnimation(piece, 0.5); // 50%落下

      expect(mockContext.save).toHaveBeenCalled();
      expect(mockContext.translate).toHaveBeenCalled();
      expect(mockContext.restore).toHaveBeenCalled();
    });

    test('パーティクルエフェクトが正しく描画される', () => {
      const particles = [
        { x: 100, y: 200, vx: 2, vy: -3, life: 1.0 },
        { x: 150, y: 250, vx: -1, vy: -2, life: 0.8 },
      ];

      canvasRenderer.drawParticles(particles);

      expect(mockContext.beginPath).toHaveBeenCalled();
      expect(mockContext.arc).toHaveBeenCalled();
      expect(mockContext.fill).toHaveBeenCalled();
    });
  });

  describe('パフォーマンス最適化', () => {
    test('ダブルバッファリングが正しく動作する', () => {
      const emptyBoard = Array(20)
        .fill()
        .map(() => Array(10).fill(0));

      canvasRenderer.enableDoubleBuffering();
      canvasRenderer.drawBoard(emptyBoard);

      expect(mockContext.getImageData).toHaveBeenCalled();
      expect(mockContext.putImageData).toHaveBeenCalled();
    });

    test('描画領域の最適化が正しく動作する', () => {
      const board = Array(20)
        .fill()
        .map(() => Array(10).fill(0));
      // 変更されたセルのみ描画
      board[19][0] = 1;

      canvasRenderer.drawBoardOptimized(board, [[19, 0]]);

      expect(mockContext.fillRect).toHaveBeenCalledTimes(1); // 1セルのみ描画
    });

    test('フレームレート制限が正しく動作する', () => {
      const startTime = performance.now();

      canvasRenderer.setFrameRateLimit(30);
      canvasRenderer.drawFrame();

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(1000 / 30); // 30FPS制限
    });
  });

  describe('設定管理', () => {
    test('描画設定が正しく更新される', () => {
      const newConfig = {
        cellSize: 40,
        boardOffsetX: 100,
        boardOffsetY: 100,
      };

      canvasRenderer.updateConfig(newConfig);

      const config = canvasRenderer.getConfig();
      expect(config.cellSize).toBe(40);
      expect(config.boardOffsetX).toBe(100);
      expect(config.boardOffsetY).toBe(100);
    });

    test('テーマ設定が正しく適用される', () => {
      const theme = {
        backgroundColor: '#1a1a1a',
        gridColor: '#333333',
        pieceColors: {
          I: '#00f0f0',
          O: '#f0f000',
          T: '#a000f0',
        },
      };

      canvasRenderer.setTheme(theme);

      const currentTheme = canvasRenderer.getTheme();
      expect(currentTheme.backgroundColor).toBe('#1a1a1a');
      expect(currentTheme.pieceColors.I).toBe('#00f0f0');
    });
  });

  describe('エラーハンドリング', () => {
    test('無効なCanvas要素でエラーが発生する', () => {
      expect(() => {
        new CanvasRenderer(null);
      }).toThrow('Invalid canvas element');
    });

    test('描画エラーが適切に処理される', () => {
      // 描画エラーをシミュレート
      mockContext.fillRect = jest.fn(() => {
        throw new Error('Canvas error');
      });

      const emptyBoard = Array(20)
        .fill()
        .map(() => Array(10).fill(0));

      expect(() => {
        canvasRenderer.drawBoard(emptyBoard);
      }).not.toThrow();
    });

    test('メモリ不足時の処理', () => {
      // メモリ不足をシミュレート
      mockContext.getImageData = jest.fn(() => {
        throw new Error('Out of memory');
      });

      canvasRenderer.enableDoubleBuffering();

      expect(() => {
        canvasRenderer.drawBoard(
          Array(20)
            .fill()
            .map(() => Array(10).fill(0))
        );
      }).not.toThrow();
    });
  });

  describe('リソース管理', () => {
    test('destroyでリソースが適切に解放される', () => {
      canvasRenderer.destroy();

      expect(canvasRenderer.canvas).toBeNull();
      expect(canvasRenderer.context).toBeNull();
    });

    test('重複destroyが安全に処理される', () => {
      canvasRenderer.destroy();

      expect(() => {
        canvasRenderer.destroy();
      }).not.toThrow();
    });

    test('イベントリスナーが適切に削除される', () => {
      canvasRenderer.destroy();

      expect(mockCanvas.removeEventListener).toHaveBeenCalled();
    });
  });

  describe('ユーティリティ機能', () => {
    test('座標変換が正しく動作する', () => {
      const boardPos = canvasRenderer.screenToBoard(100, 150);

      expect(boardPos.x).toBeDefined();
      expect(boardPos.y).toBeDefined();
    });

    test('色の変換が正しく動作する', () => {
      const hexColor = '#ff0000';
      const rgbaColor = canvasRenderer.hexToRgba(hexColor, 0.8);

      expect(rgbaColor).toBe('rgba(255, 0, 0, 0.8)');
    });

    test('テキスト測定が正しく動作する', () => {
      const text = 'Score: 15000';
      const metrics = canvasRenderer.measureText(text);

      expect(metrics.width).toBeDefined();
      expect(metrics.height).toBeDefined();
    });
  });
});
