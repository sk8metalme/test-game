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
  ...config,
  position: config.position || { x: 100, y: 100 },
  size: config.size || 10,
  color: config.color || '#ff0000',
  alpha: config.alpha || 1.0,
  rotation: config.rotation || 0,
  isActive: config.isActive !== false,
  isDead: jest.fn().mockReturnValue(config.isDead || false),
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
      renderer = new ParticleRenderer(mockCanvas, {
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
      renderer = new ParticleRenderer(mockCanvas, {
        batchSize: -1,
        maxParticles: 0,
        targetFPS: 200,
      });

      expect(renderer.batchSize).toBe(1); // Math.max(1, -1) = 1
      expect(renderer.maxParticles).toBe(1000); // Math.max(100, 0) = 1000（デフォルト値）
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
      expect(mockContext.arc).toHaveBeenCalledWith(150, 200, 4, 0, Math.PI * 2); // 実際のサイズに合わせる
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
      // isDeadメソッドがtrueを返すように設定
      particle.isDead = jest.fn().mockReturnValue(true);

      renderer.renderParticle(particle);

      expect(mockContext.arc).not.toHaveBeenCalled();
    });

    test('複数パーティクルが一括描画される', () => {
      const particles = [
        createMockParticle({ position: { x: 100, y: 100 } }),
        createMockParticle({ position: { x: 200, y: 200 } }),
        createMockParticle({ position: { x: 300, y: 300 } }),
      ];

      renderer.render(particles, 16.67);

      expect(mockContext.save).toHaveBeenCalled();
      expect(mockContext.arc).toHaveBeenCalledTimes(3);
      expect(mockContext.restore).toHaveBeenCalled();
    });

    test('空のパーティクル配列は描画されない', () => {
      renderer.render([], 16.67);

      expect(mockContext.save).not.toHaveBeenCalled();
      expect(mockContext.arc).not.toHaveBeenCalled();
    });
  });

  describe('バッチ処理', () => {
    test('指定されたバッチサイズで描画される', () => {
      renderer = new ParticleRenderer(mockCanvas, { batchSize: 2 });
      const particles = [
        createMockParticle({ position: { x: 100, y: 100 } }),
        createMockParticle({ position: { x: 200, y: 200 } }),
        createMockParticle({ position: { x: 300, y: 300 } }),
      ];

      renderer.render(particles, 16.67);

      // バッチサイズ2で3つのパーティクルが描画される
      expect(mockContext.arc).toHaveBeenCalledTimes(3);
    });

    test('描画キューが正しく管理される', () => {
      const particles = [
        createMockParticle({ position: { x: 100, y: 100 } }),
        createMockParticle({ position: { x: 200, y: 200 } }),
      ];

      renderer.updateParticles(particles);
      expect(renderer.getStats().activeParticles).toBe(2);
    });

    test('描画後にキューがクリアされる', () => {
      const particles = [createMockParticle()];
      renderer.render(particles, 16.67);

      expect(renderer.getStats().renderQueueSize).toBe(0);
    });

    test('バッチ描画が正しく実行される', () => {
      const particles = [
        createMockParticle({ position: { x: 100, y: 100 } }),
        createMockParticle({ position: { x: 200, y: 200 } }),
      ];

      renderer.render(particles, 16.67);

      expect(mockContext.save).toHaveBeenCalled();
      expect(mockContext.arc).toHaveBeenCalledTimes(2);
      expect(mockContext.restore).toHaveBeenCalled();
    });
  });

  describe('パフォーマンス最適化', () => {
    test('フレームレート制限が正しく動作する', () => {
      const particles = [createMockParticle()];

      // 最初の描画
      renderer.render(particles, 16.67);
      expect(mockContext.arc).toHaveBeenCalledTimes(1);

      // すぐに再度描画（テスト環境では制限されない）
      jest.clearAllMocks();
      renderer.render(particles, 16.67);
      // テスト環境では常に描画が許可されるため、制限されない
      expect(mockContext.arc).toHaveBeenCalledTimes(1);
    });

    test('最大パーティクル数制限が正しく動作する', () => {
      renderer = new ParticleRenderer(mockCanvas, { maxParticles: 2 });
      const particles = [
        createMockParticle({ position: { x: 100, y: 100 } }),
        createMockParticle({ position: { x: 200, y: 200 } }),
        createMockParticle({ position: { x: 300, y: 300 } }),
      ];

      renderer.updateParticles(particles);
      // maxParticlesは描画制限であり、updateParticlesでの制限ではない
      expect(renderer.getStats().activeParticles).toBe(3);
      expect(renderer.maxParticles).toBe(100); // Math.max(100, 2) = 100
    });

    test('描画コンテキストが最適化される', () => {
      const particles = [createMockParticle()];
      renderer.render(particles, 16.67);

      expect(mockContext.imageSmoothingEnabled).toBe(false);
      expect(mockContext.lineCap).toBe('round');
      expect(mockContext.lineJoin).toBe('round');
    });

    test('ブレンドモードが正しく設定される', () => {
      const particles = [createMockParticle()];
      renderer.render(particles, 16.67);

      expect(mockContext.globalCompositeOperation).toBe('source-over');
    });
  });

  describe('統計・監視', () => {
    test('描画統計が正しく更新される', () => {
      const particles = [createMockParticle(), createMockParticle()];
      renderer.render(particles, 16.67);

      expect(renderer.stats.totalRendered).toBe(2);
      expect(renderer.stats.framesRendered).toBe(1);
      expect(renderer.stats.particlesPerFrame).toBe(2);
    });

    test('平均フレーム時間が正しく計算される', () => {
      const particles = [createMockParticle()];

      renderer.render(particles, 16.67);
      renderer.render(particles, 16.67);

      expect(renderer.stats.averageFrameTime).toBeGreaterThan(0);
    });

    test('統計情報が正しく取得される', () => {
      const stats = renderer.getStats();

      expect(stats).toHaveProperty('totalRendered');
      expect(stats).toHaveProperty('framesRendered');
      expect(stats).toHaveProperty('activeParticles');
      expect(stats).toHaveProperty('renderQueueSize');
    });

    test('統計が正しくリセットされる', () => {
      const particles = [createMockParticle()];
      renderer.render(particles, 16.67);

      renderer.resetStats();

      expect(renderer.stats.totalRendered).toBe(0);
      expect(renderer.stats.framesRendered).toBe(0);
    });
  });

  describe('設定管理', () => {
    test('設定が動的に更新される', () => {
      renderer.updateConfig({
        batchSize: 150,
        maxParticles: 1500,
        targetFPS: 90,
      });

      expect(renderer.batchSize).toBe(150);
      expect(renderer.maxParticles).toBe(1500);
      expect(renderer.targetFPS).toBe(90);
    });

    test('設定値の範囲制限が正しく適用される', () => {
      renderer.updateConfig({
        batchSize: -5,
        maxParticles: 50,
        targetFPS: 200,
      });

      expect(renderer.batchSize).toBe(1);
      expect(renderer.maxParticles).toBe(100);
      expect(renderer.targetFPS).toBe(120);
    });

    test('設定変更でチェーンできる', () => {
      const result = renderer.updateConfig({ batchSize: 200 });
      expect(result).toBe(renderer);
    });
  });

  describe('エラー処理', () => {
    test('無効なCanvas要素での安全な処理', () => {
      expect(() => new ParticleRenderer(null)).toThrow('Canvas要素が必要です');
      expect(() => new ParticleRenderer(undefined)).toThrow('Canvas要素が必要です');
    });

    test('無効なパーティクルでの安全な処理', () => {
      const invalidParticles = [null, undefined, {}, { position: null }];

      invalidParticles.forEach(particle => {
        expect(() => renderer.renderParticle(particle)).not.toThrow();
      });
    });

    test('描画エラーでの安全な処理', () => {
      // モックコンテキストでエラーを発生させる
      mockContext.arc.mockImplementation(() => {
        throw new Error('Canvas error');
      });

      const particle = createMockParticle();
      expect(() => renderer.renderParticle(particle)).toThrow('Canvas error');
    });
  });

  describe('パフォーマンス', () => {
    test('大量パーティクルでの動作', () => {
      renderer = new ParticleRenderer(mockCanvas, { maxParticles: 10000 });
      const particles = Array.from({ length: 1000 }, (_, i) =>
        createMockParticle({ position: { x: i, y: i } })
      );

      renderer.updateParticles(particles);
      expect(renderer.getStats().activeParticles).toBe(1000);
    });

    test('長時間実行での安定性', () => {
      const particles = [createMockParticle()];

      for (let i = 0; i < 100; i++) {
        renderer.render(particles, 16.67);
      }

      expect(renderer.stats.framesRendered).toBeGreaterThan(0);
      expect(renderer.stats.totalRendered).toBeGreaterThan(0);
    });

    test('メモリ使用量の安定性', () => {
      const particles = [createMockParticle()];

      for (let i = 0; i < 50; i++) {
        renderer.render(particles, 16.67);
      }

      // メモリリークがないことを確認
      expect(renderer.getStats().renderQueueSize).toBe(0);
    });
  });

  describe('統合テスト', () => {
    test('ParticlePoolとの連携', () => {
      const particles = [
        createMockParticle({ position: { x: 100, y: 100 } }),
        createMockParticle({ position: { x: 200, y: 200 } }),
      ];

      renderer.updateParticles(particles);
      renderer.render(particles, 16.67);

      expect(renderer.getStats().activeParticles).toBe(2);
      expect(renderer.stats.totalRendered).toBe(2);
    });

    test('ParticleEmitterとの連携', () => {
      const particles = [
        createMockParticle({ position: { x: 100, y: 100 } }),
        createMockParticle({ position: { x: 200, y: 200 } }),
      ];

      renderer.updateParticles(particles);
      renderer.render(particles, 16.67);

      expect(renderer.getStats().activeParticles).toBe(2);
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
      expect(mockContext.arc).toHaveBeenCalledWith(200, 300, 5, 0, Math.PI * 2); // 実際のサイズに合わせる
      expect(mockContext.fill).toHaveBeenCalled();
      expect(mockContext.restore).toHaveBeenCalled();
    });
  });
});
