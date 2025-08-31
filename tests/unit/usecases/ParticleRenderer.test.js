import ParticleRenderer from '../../../src/core/usecases/ParticleRenderer.js';

// モックCanvasとコンテキストの作成
const createMockCanvas = () => {
  const canvas = {
    width: 800,
    height: 600,
    getContext: jest.fn(),
  };

  const context = {
    save: jest.fn(),
    restore: jest.fn(),
    beginPath: jest.fn(),
    arc: jest.fn(),
    fill: jest.fn(),
    fillStyle: '',
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    translate: jest.fn(),
    rotate: jest.fn(),
    imageSmoothingEnabled: true,
    lineCap: 'butt',
    lineJoin: 'miter',
  };

  canvas.getContext.mockReturnValue(context);
  return { canvas, context };
};

// モックパーティクルの作成
const createMockParticle = (config = {}) => ({
  position: config.position || { x: 100, y: 100 },
  size: config.size || 10,
  color: config.color || '#ff0000',
  alpha: config.alpha || 1.0,
  rotation: config.rotation || 0,
  isActive: config.isActive !== false,
  isDead: jest.fn().mockReturnValue(config.isDead || false),
  ...config,
});

// performance.nowのモック
const mockPerformanceNow = () => {
  let time = 0;
  return {
    now: jest.fn(() => (time += 16.67)), // 60FPS相当
    reset: () => {
      time = 0;
    },
  };
};

describe('ParticleRenderer', () => {
  let renderer, mockCanvas, mockContext, performanceNow;

  beforeEach(() => {
    const mock = createMockCanvas();
    mockCanvas = mock.canvas;
    mockContext = mock.context;

    performanceNow = mockPerformanceNow();
    global.performance = performanceNow;

    renderer = new ParticleRenderer(mockCanvas);
  });

  afterEach(() => {
    jest.clearAllMocks();
    performanceNow.reset();
  });

  describe('初期化', () => {
    test('正常な設定でレンダラーが作成される', () => {
      const renderer = new ParticleRenderer(mockCanvas, {
        batchSize: 200,
        maxParticles: 2000,
        targetFPS: 120,
      });

      expect(renderer.canvas).toBe(mockCanvas);
      expect(renderer.context).toBe(mockContext);
      expect(renderer.batchSize).toBe(200);
      expect(renderer.maxParticles).toBe(2000);
      expect(renderer.targetFPS).toBe(120);
    });

    test('デフォルト値が正しく設定される', () => {
      expect(renderer.batchSize).toBe(100);
      expect(renderer.maxParticles).toBe(1000);
      expect(renderer.enableBlending).toBe(true);
      expect(renderer.enableLOD).toBe(true);
      expect(renderer.targetFPS).toBe(60);
      expect(renderer.frameTime).toBeCloseTo(16.67, 1);
    });

    test('無効な設定値は適切に処理される', () => {
      const renderer = new ParticleRenderer(mockCanvas, {
        batchSize: -1,
        maxParticles: 0,
        targetFPS: 200,
      });

      expect(renderer.batchSize).toBe(1); // Math.max(1, -1) = 1
      expect(renderer.maxParticles).toBe(100); // Math.max(100, 0) = 100
      expect(renderer.targetFPS).toBe(120); // Math.min(120, 200) = 120
    });

    test('Canvas要素が正しく設定される', () => {
      expect(renderer.canvas).toBe(mockCanvas);
      expect(renderer.context).toBe(mockContext);
    });
  });

  describe('描画処理', () => {
    test('個別パーティクルが正しく描画される', () => {
      const particle = createMockParticle({
        position: { x: 150, y: 200 },
        size: 20,
        color: '#00ff00',
        alpha: 0.8,
        rotation: Math.PI / 4,
      });

      renderer.renderParticle(particle);

      expect(mockContext.save).toHaveBeenCalled();
      expect(mockContext.globalAlpha).toBe(0.8);
      expect(mockContext.fillStyle).toBe('#00ff00');
      expect(mockContext.arc).toHaveBeenCalledWith(150, 200, 10, 0, Math.PI * 2);
      expect(mockContext.fill).toHaveBeenCalled();
      expect(mockContext.restore).toHaveBeenCalled();
    });

    test('回転が0の場合はtranslate/rotateが呼ばれない', () => {
      const particle = createMockParticle({ rotation: 0 });

      renderer.renderParticle(particle);

      expect(mockContext.translate).not.toHaveBeenCalled();
      expect(mockContext.rotate).not.toHaveBeenCalled();
    });

    test('無効なパーティクルは描画されない', () => {
      const invalidParticles = [null, undefined, {}, { position: null }];

      invalidParticles.forEach(particle => {
        expect(() => renderer.renderParticle(particle)).not.toThrow();
      });
    });

    test('非アクティブなパーティクルは描画されない', () => {
      const particle = createMockParticle({ isActive: false });

      renderer.renderParticle(particle);

      expect(mockContext.arc).not.toHaveBeenCalled();
    });

    test('死んだパーティクルは描画されない', () => {
      const particle = createMockParticle({ isDead: true });

      renderer.renderParticle(particle);

      expect(mockContext.arc).not.toHaveBeenCalled();
    });

    test('複数パーティクルが一括描画される', () => {
      const particles = [createMockParticle(), createMockParticle(), createMockParticle()];

      const spy = jest.spyOn(renderer, 'renderParticle');

      renderer.render(particles, 0.016);

      expect(spy).toHaveBeenCalledTimes(3);
    });

    test('空のパーティクル配列は描画されない', () => {
      const spy = jest.spyOn(renderer, 'renderParticle');

      renderer.render([], 0.016);

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('バッチ処理', () => {
    test('指定されたバッチサイズで描画される', () => {
      const renderer = new ParticleRenderer(mockCanvas, { batchSize: 50 });
      const particles = Array.from({ length: 150 }, () => createMockParticle());

      const batchSpy = jest.spyOn(renderer, '_renderBatch');

      renderer.render(particles, 0.016);

      expect(batchSpy).toHaveBeenCalledTimes(3); // 150 / 50 = 3
    });

    test('描画キューが正しく管理される', () => {
      const particles = [createMockParticle(), createMockParticle()];

      renderer.render(particles, 0.016);

      expect(renderer._renderQueue).toHaveLength(2);
    });

    test('描画後にキューがクリアされる', () => {
      const particles = [createMockParticle()];

      renderer.render(particles, 0.016);

      expect(renderer._renderQueue).toHaveLength(0);
    });

    test('バッチ描画が正しく実行される', () => {
      const particles = [createMockParticle(), createMockParticle()];
      renderer._renderQueue = [...particles];

      const particleSpy = jest.spyOn(renderer, 'renderParticle');

      renderer._executeBatchRender();

      expect(particleSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('パフォーマンス最適化', () => {
    test('フレームレート制限が正しく動作する', () => {
      const renderer = new ParticleRenderer(mockCanvas, { targetFPS: 30 });

      // 最初の描画は許可される
      expect(renderer._shouldRender(0.016)).toBe(true);

      // 短時間での再描画は制限される
      expect(renderer._shouldRender(0.016)).toBe(false);
    });

    test('最大パーティクル数制限が正しく動作する', () => {
      const renderer = new ParticleRenderer(mockCanvas, { maxParticles: 100 });

      // 最大数以下の場合は描画可能
      renderer._activeParticles = new Set(Array.from({ length: 50 }));
      expect(renderer._shouldRender(0.016)).toBe(true);

      // 最大数を超える場合は描画制限
      renderer._activeParticles = new Set(Array.from({ length: 150 }));
      expect(renderer._shouldRender(0.016)).toBe(false);
    });

    test('描画コンテキストが最適化される', () => {
      renderer._setupRenderContext();

      expect(mockContext.imageSmoothingEnabled).toBe(false);
      expect(mockContext.lineCap).toBe('round');
      expect(mockContext.lineJoin).toBe('round');
    });

    test('ブレンドモードが正しく設定される', () => {
      renderer.enableBlending = true;
      renderer._setupRenderContext();

      expect(mockContext.globalCompositeOperation).toBe('source-over');
    });
  });

  describe('統計・監視', () => {
    test('描画統計が正しく更新される', () => {
      const startTime = performance.now();
      const particleCount = 5;

      renderer._updateStats(particleCount, startTime);

      expect(renderer.stats.totalRendered).toBe(5);
      expect(renderer.stats.framesRendered).toBe(1);
      expect(renderer.stats.particlesPerFrame).toBe(5);
      expect(renderer.stats.renderCalls).toBe(1);
    });

    test('平均フレーム時間が正しく計算される', () => {
      const startTime = performance.now();

      // 複数回の統計更新
      renderer._updateStats(10, startTime);
      renderer._updateStats(15, startTime);
      renderer._updateStats(20, startTime);

      expect(renderer.stats.framesRendered).toBe(3);
      expect(renderer.stats.averageFrameTime).toBeGreaterThan(0);
    });

    test('統計情報が正しく取得される', () => {
      const stats = renderer.getStats();

      expect(stats).toHaveProperty('totalRendered');
      expect(stats).toHaveProperty('framesRendered');
      expect(stats).toHaveProperty('averageFrameTime');
      expect(stats).toHaveProperty('particlesPerFrame');
      expect(stats).toHaveProperty('renderCalls');
      expect(stats).toHaveProperty('activeParticles');
      expect(stats).toHaveProperty('renderQueueSize');
      expect(stats).toHaveProperty('canvasSize');
    });

    test('統計が正しくリセットされる', () => {
      // 統計を更新
      renderer._updateStats(10, performance.now());

      renderer.reset();

      expect(renderer.stats.totalRendered).toBe(0);
      expect(renderer.stats.framesRendered).toBe(0);
      expect(renderer.stats.averageFrameTime).toBe(0);
      expect(renderer.stats.particlesPerFrame).toBe(0);
      expect(renderer.stats.renderCalls).toBe(0);
      expect(renderer._renderQueue).toHaveLength(0);
      expect(renderer._activeParticles.size).toBe(0);
    });
  });

  describe('設定管理', () => {
    test('設定が動的に更新される', () => {
      const result = renderer.updateConfig({
        batchSize: 200,
        maxParticles: 2000,
        enableBlending: false,
        enableLOD: false,
        targetFPS: 120,
      });

      expect(renderer.batchSize).toBe(200);
      expect(renderer.maxParticles).toBe(2000);
      expect(renderer.enableBlending).toBe(false);
      expect(renderer.enableLOD).toBe(false);
      expect(renderer.targetFPS).toBe(120);
      expect(renderer.frameTime).toBeCloseTo(8.33, 1);
      expect(result).toBe(renderer);
    });

    test('設定値の範囲制限が正しく適用される', () => {
      renderer.updateConfig({
        batchSize: -1,
        maxParticles: 50,
        targetFPS: 200,
      });

      expect(renderer.batchSize).toBe(1);
      expect(renderer.maxParticles).toBe(100);
      expect(renderer.targetFPS).toBe(120);
    });

    test('設定変更でチェーンできる', () => {
      const result = renderer.updateConfig({ batchSize: 150 });

      expect(result).toBe(renderer);
    });
  });

  describe('エラー処理', () => {
    test('無効なCanvas要素での安全な処理', () => {
      expect(() => new ParticleRenderer(null)).toThrow();
      expect(() => new ParticleRenderer(undefined)).toThrow();
    });

    test('無効なパーティクルでの安全な処理', () => {
      const invalidParticles = [null, undefined, {}, { position: null }];

      invalidParticles.forEach(particle => {
        expect(() => renderer.renderParticle(particle)).not.toThrow();
      });
    });

    test('描画エラーでの安全な処理', () => {
      // コンテキストメソッドでエラーを発生させる
      mockContext.arc.mockImplementation(() => {
        throw new Error('Canvas error');
      });

      const particle = createMockParticle();

      expect(() => renderer.renderParticle(particle)).not.toThrow();
    });
  });

  describe('パフォーマンス', () => {
    test('大量パーティクルでの動作', () => {
      const particleCount = 1000;
      const particles = Array.from({ length: particleCount }, () => createMockParticle());

      const startTime = performance.now();
      renderer.render(particles, 0.016);
      const endTime = performance.now();

      // パフォーマンステストは緩い制限で実行
      expect(endTime - startTime).toBeLessThan(100); // 100ms以内
      expect(renderer.stats.totalRendered).toBe(particleCount);
    });

    test('長時間実行での安定性', () => {
      const renderer = new ParticleRenderer(mockCanvas, { targetFPS: 60 });

      // 長時間の描画をシミュレート
      for (let i = 0; i < 100; i++) {
        const particles = Array.from({ length: 100 }, () => createMockParticle());
        renderer.render(particles, 0.016);
      }

      expect(renderer.stats.framesRendered).toBe(100);
      expect(renderer.stats.totalRendered).toBe(10000);
    });

    test('メモリ使用量の安定性', () => {
      const initialMemory = performance.memory?.usedJSHeapSize || 0;

      // 大量のパーティクルを描画
      for (let i = 0; i < 10; i++) {
        const particles = Array.from({ length: 1000 }, () => createMockParticle());
        renderer.render(particles, 0.016);
      }

      const finalMemory = performance.memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      // メモリ増加が適切な範囲内
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // 10MB以下
    });
  });

  describe('統合テスト', () => {
    test('ParticlePoolとの連携', () => {
      const mockParticlePool = {
        getActiveParticles: jest.fn().mockReturnValue([createMockParticle(), createMockParticle()]),
      };

      const particles = mockParticlePool.getActiveParticles();
      const spy = jest.spyOn(renderer, 'renderParticle');

      renderer.render(particles, 0.016);

      expect(spy).toHaveBeenCalledTimes(2);
    });

    test('ParticleEmitterとの連携', () => {
      const mockEmitter = {
        emit: jest.fn().mockReturnValue([createMockParticle(), createMockParticle()]),
      };

      const particles = mockEmitter.emit({ x: 100, y: 100 }, 2);
      const spy = jest.spyOn(renderer, 'renderParticle');

      renderer.render(particles, 0.016);

      expect(spy).toHaveBeenCalledTimes(2);
    });

    test('Canvas APIとの完全な連携', () => {
      const particle = createMockParticle({
        position: { x: 200, y: 300 },
        size: 25,
        color: '#0000ff',
        alpha: 0.6,
        rotation: Math.PI / 2,
      });

      renderer.renderParticle(particle);

      // Canvas APIの呼び出しを確認
      expect(mockContext.save).toHaveBeenCalled();
      expect(mockContext.translate).toHaveBeenCalledWith(200, 300);
      expect(mockContext.rotate).toHaveBeenCalledWith(Math.PI / 2);
      expect(mockContext.translate).toHaveBeenCalledWith(-200, -300);
      expect(mockContext.globalAlpha).toBe(0.6);
      expect(mockContext.fillStyle).toBe('#0000ff');
      expect(mockContext.arc).toHaveBeenCalledWith(200, 300, 12.5, 0, Math.PI * 2);
      expect(mockContext.fill).toHaveBeenCalled();
      expect(mockContext.restore).toHaveBeenCalled();
    });
  });
});
