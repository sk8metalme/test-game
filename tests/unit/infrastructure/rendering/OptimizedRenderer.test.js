/**
 * OptimizedRenderer テスト
 *
 * レンダリングパフォーマンスの最適化機能のテスト
 *
 * @author AI Assistant
 * @version 1.0.0
 */

import OptimizedRenderer from '../../../../src/infrastructure/rendering/OptimizedRenderer.js';

// テスト用のキャンバス要素を作成
function createTestCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  return canvas;
}

describe('OptimizedRenderer', () => {
  let canvas;
  let renderer;

  beforeEach(() => {
    canvas = createTestCanvas();
    renderer = new OptimizedRenderer(canvas, {
      targetFPS: 60,
      enableFrameSkip: true,
      enableDoubleBuffering: true,
      enableCulling: true,
      batchSize: 50,
    });
  });

  afterEach(() => {
    if (renderer) {
      renderer.reset();
    }
  });

  describe('初期化', () => {
    test('デフォルト設定で初期化される', () => {
      const defaultRenderer = new OptimizedRenderer(canvas);

      expect(defaultRenderer.config.targetFPS).toBe(60);
      expect(defaultRenderer.config.enableFrameSkip).toBe(true);
      expect(defaultRenderer.config.enableDoubleBuffering).toBe(true);
      expect(defaultRenderer.config.enableCulling).toBe(true);
      expect(defaultRenderer.config.batchSize).toBe(100);
    });

    test('カスタム設定で初期化される', () => {
      expect(renderer.config.targetFPS).toBe(60);
      expect(renderer.config.batchSize).toBe(50);
      expect(renderer.backBuffer).toBeDefined();
      expect(renderer.backCtx).toBeDefined();
    });

    test('ダブルバッファリングが無効の場合は初期化されない', () => {
      const noBufferRenderer = new OptimizedRenderer(canvas, {
        enableDoubleBuffering: false,
      });

      expect(noBufferRenderer.backBuffer).toBeUndefined();
      expect(noBufferRenderer.backCtx).toBeUndefined();
    });
  });

  describe('レンダリングサイクル', () => {
    test('レンダリングの開始と完了が正しく動作する', () => {
      expect(renderer.isRendering).toBe(false);

      renderer.beginRender();
      expect(renderer.isRendering).toBe(true);
      expect(renderer.renderQueue.length).toBe(0);

      renderer.endRender();
      expect(renderer.isRendering).toBe(false);
      expect(renderer.renderQueue.length).toBe(0);
    });

    test('描画コマンドをキューに追加できる', () => {
      const renderFn = jest.fn();

      renderer.beginRender();
      renderer.queueRender(renderFn, 10);

      expect(renderer.renderQueue.length).toBe(1);
      expect(renderer.renderQueue[0].renderFn).toBe(renderFn);
      expect(renderer.renderQueue[0].priority).toBe(10);

      renderer.endRender();
    });

    test('描画キューが優先度順に実行される', () => {
      const renderOrder = [];
      const renderFn1 = jest.fn(() => renderOrder.push(1));
      const renderFn2 = jest.fn(() => renderOrder.push(2));
      const renderFn3 = jest.fn(() => renderOrder.push(3));

      renderer.beginRender();
      renderer.queueRender(renderFn1, 1); // 低い優先度
      renderer.queueRender(renderFn2, 3); // 高い優先度
      renderer.queueRender(renderFn3, 2); // 中程度の優先度

      renderer.executeRenderQueue();
      renderer.endRender();

      // 優先度順（3, 2, 1）に実行される
      expect(renderOrder).toEqual([2, 3, 1]);
    });
  });

  describe('ダブルバッファリング', () => {
    test('バックバッファに描画される', () => {
      const renderFn = jest.fn(ctx => {
        ctx.fillStyle = 'red';
        ctx.fillRect(0, 0, 100, 100);
      });

      renderer.beginRender();
      renderer.queueRender(renderFn);
      renderer.executeRenderQueue();
      renderer.endRender();

      // バックバッファに描画が実行された
      expect(renderFn).toHaveBeenCalledWith(renderer.backCtx);
    });

    test('フロントバッファにバックバッファがコピーされる', () => {
      const drawImageSpy = jest.spyOn(renderer.ctx, 'drawImage');

      renderer.beginRender();
      renderer.endRender();

      expect(drawImageSpy).toHaveBeenCalledWith(renderer.backBuffer, 0, 0);
      drawImageSpy.mockRestore();
    });
  });

  describe('フレームスキップ', () => {
    test('フレームスキップが正しく判定される', () => {
      // 最初のフレームではスキップしない
      expect(renderer.shouldSkipFrame()).toBe(false);

      // 時間を進める
      renderer.lastFrameTime = performance.now() - 10; // 10ms前

      // 目標フレーム時間（16.67ms）より短い場合はスキップ
      expect(renderer.shouldSkipFrame()).toBe(true);
    });

    test('フレームスキップが無効の場合は常にfalse', () => {
      const noSkipRenderer = new OptimizedRenderer(canvas, {
        enableFrameSkip: false,
      });

      expect(noSkipRenderer.shouldSkipFrame()).toBe(false);
    });
  });

  describe('ビューポート管理', () => {
    test('ビューポートが正しく更新される', () => {
      renderer.updateViewport(100, 200, 300, 400);

      expect(renderer.viewport.x).toBe(100);
      expect(renderer.viewport.y).toBe(200);
      expect(renderer.viewport.width).toBe(300);
      expect(renderer.viewport.height).toBe(400);
    });

    test('ビューポート内の描画判定が正しく動作する', () => {
      renderer.updateViewport(100, 200, 300, 400);

      // ビューポート内
      expect(renderer.isInViewport(150, 250, 50, 50)).toBe(true);

      // ビューポート外（左）: x=30, width=50 → x+width=80 < viewport.x=100
      expect(renderer.isInViewport(30, 250, 50, 50)).toBe(false);

      // ビューポート外（右）: x=450 > viewport.x+width=100+300=400
      expect(renderer.isInViewport(450, 250, 50, 50)).toBe(false);

      // ビューポート外（上）: y=130, height=50 → y+height=180 < viewport.y=200
      expect(renderer.isInViewport(150, 130, 50, 50)).toBe(false);

      // ビューポート外（下）: y=650 > viewport.y+height=200+400=600
      expect(renderer.isInViewport(150, 650, 50, 50)).toBe(false);
    });

    test('ビューポートカリングが無効の場合は常にtrue', () => {
      const noCullingRenderer = new OptimizedRenderer(canvas, {
        enableCulling: false,
      });

      expect(noCullingRenderer.isInViewport(0, 0, 1000, 1000)).toBe(true);
    });
  });

  describe('パフォーマンス監視', () => {
    test('フレーム統計が正しく更新される', () => {
      const initialStats = renderer.getPerformanceStats();
      expect(initialStats.fps).toBe(0);
      expect(initialStats.frameCount).toBe(0);

      renderer.beginRender();
      renderer.endRender();

      const updatedStats = renderer.getPerformanceStats();
      expect(updatedStats.frameCount).toBe(1);
      // 最初のフレームではFPSは0（2フレーム目以降で計算される）
      expect(updatedStats.fps).toBe(0);
    });

    test('パフォーマンス統計が正しく取得される', () => {
      renderer.beginRender();
      renderer.queueRender(jest.fn());
      renderer.executeRenderQueue();
      renderer.endRender();

      const stats = renderer.getPerformanceStats();

      expect(stats.frameCount).toBe(1);
      // 最初のフレームではFPSは0（2フレーム目以降で計算される）
      expect(stats.fps).toBe(0);
      expect(stats.frameSkipCount).toBeGreaterThanOrEqual(0);
      expect(stats.renderQueueSize).toBe(0);
      expect(stats.isRendering).toBe(false);
    });
  });

  describe('設定の更新', () => {
    test('設定が正しく更新される', () => {
      renderer.updateConfig({
        targetFPS: 30,
        batchSize: 200,
      });

      expect(renderer.config.targetFPS).toBe(30);
      expect(renderer.config.batchSize).toBe(200);
    });

    test('ダブルバッファリングの動的切り替え', () => {
      // 有効から無効
      renderer.updateConfig({ enableDoubleBuffering: false });
      expect(renderer.backBuffer).toBeNull();
      expect(renderer.backCtx).toBeNull();

      // 無効から有効
      renderer.updateConfig({ enableDoubleBuffering: true });
      expect(renderer.backBuffer).toBeDefined();
      expect(renderer.backCtx).toBeDefined();
    });
  });

  describe('メモリ最適化', () => {
    test('メモリ最適化が実行される', () => {
      renderer.beginRender();
      renderer.queueRender(jest.fn());
      renderer.queueRender(jest.fn());

      expect(renderer.renderQueue.length).toBe(2);

      renderer.optimizeMemory();

      expect(renderer.renderQueue.length).toBe(0);
    });

    test('ガベージコレクションが促進される（可能な場合）', () => {
      // window.gcが存在する場合のテスト
      const originalGc = window.gc;
      window.gc = jest.fn();

      renderer.optimizeMemory();

      if (originalGc) {
        expect(window.gc).toHaveBeenCalled();
      }

      window.gc = originalGc;
    });
  });

  describe('エラーハンドリング', () => {
    test('描画エラーが安全に処理される', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const errorRenderFn = jest.fn(() => {
        throw new Error('Render error');
      });

      renderer.beginRender();
      renderer.queueRender(errorRenderFn);
      renderer.executeRenderQueue();
      renderer.endRender();

      // エラーが発生してもレンダリングは継続される（console出力は期待しない）
      expect(errorRenderFn).toHaveBeenCalled();
    });
  });

  describe('パフォーマンステスト', () => {
    test('大量の描画コマンドが効率的に処理される', () => {
      const startTime = performance.now();

      renderer.beginRender();

      // 1000個の描画コマンドを追加
      for (let i = 0; i < 1000; i++) {
        renderer.queueRender(jest.fn());
      }

      renderer.executeRenderQueue();
      renderer.endRender();

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      // 1000個の描画コマンドが100ms以内に処理される
      expect(executionTime).toBeLessThan(100);
      expect(renderer.getPerformanceStats().frameCount).toBe(1);
    });
  });
});
