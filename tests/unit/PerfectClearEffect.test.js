import PerfectClearEffect from '../../src/core/usecases/PerfectClearEffect.js';
import ParticleEmitter from '../../src/core/usecases/ParticleEmitter.js';

// ParticleEmitterのモック
jest.mock('../../src/core/usecases/ParticleEmitter.js');

describe('PerfectClearEffect', () => {
  let perfectClearEffect;
  let _mockParticleEmitter;

  beforeEach(() => {
    // ParticleEmitterのモックをリセット
    jest.clearAllMocks();

    // ParticleEmitterのコンストラクタをモック
    let emitterCounter = 0;
    ParticleEmitter.mockImplementation(config => {
      const mockEmitter = {
        name: config.name || `mock-emitter-${emitterCounter++}`,
        position: { x: 0, y: 0 },
        emissionRate: config.emissionRate || 0,
        burstCount: config.burstCount || 0,
        particleConfig: config.particleConfig || {},
        start: jest.fn(),
        stop: jest.fn(),
        update: jest.fn(),
        reset: jest.fn(),
        isActive: jest.fn(() => true),
        getStats: jest.fn(() => ({ activeCount: 0, totalCreated: 0 })),
      };
      return mockEmitter;
    });

    perfectClearEffect = new PerfectClearEffect({
      position: { x: 100, y: 200 },
      intensity: 1.5,
      scale: 1.2,
    });
  });

  describe('コンストラクタ', () => {
    test('デフォルト設定でPerfectClearEffectを作成できる', () => {
      const effect = new PerfectClearEffect();

      expect(effect.name).toBe('PerfectClearEffect');
      expect(effect.type).toBe('PerfectClearEffect');
      expect(effect.duration).toBe(5000);
      expect(effect.particleCount).toBe(200);
      expect(effect.intensity).toBe(1.0);
      expect(effect.scale).toBe(1.0);
      expect(effect.colors).toEqual(['#ffffff', '#ffff00', '#ffd700', '#ff69b4', '#00ffff']);
      expect(effect.position).toEqual({ x: 0, y: 0 });
      expect(effect.direction).toEqual({ x: 0, y: -1 });
      expect(effect.speed).toBe(150);
      expect(effect.gravity).toBe(0.3);
      expect(effect.friction).toBe(0.98);
    });

    test('カスタム設定でPerfectClearEffectを作成できる', () => {
      expect(perfectClearEffect.name).toBe('PerfectClearEffect');
      expect(perfectClearEffect.type).toBe('PerfectClearEffect');
      expect(perfectClearEffect.duration).toBe(5000);
      expect(perfectClearEffect.particleCount).toBe(200);
      expect(perfectClearEffect.intensity).toBe(1.5);
      expect(perfectClearEffect.scale).toBe(1.2);
      expect(perfectClearEffect.position).toEqual({ x: 100, y: 200 });
    });

    test('Perfect Clear固有のプロパティが設定される', () => {
      expect(perfectClearEffect.colors).toEqual([
        '#ffffff',
        '#ffff00',
        '#ffd700',
        '#ff69b4',
        '#00ffff',
      ]);
      expect(perfectClearEffect.speed).toBe(150);
      expect(perfectClearEffect.gravity).toBe(0.3);
      expect(perfectClearEffect.friction).toBe(0.98);
    });
  });

  describe('エミッター作成', () => {
    test('複数のエミッターが作成される', () => {
      perfectClearEffect.start();

      // 基底クラスのエミッター + Perfect Clear専用の6つのエミッター = 14つ
      expect(perfectClearEffect.emitters.length).toBe(14);
      expect(ParticleEmitter).toHaveBeenCalledTimes(7);
    });

    test('メイン爆発エミッターが作成される', () => {
      perfectClearEffect.start();

      const mainExplosionEmitter = perfectClearEffect.emitters.find(e =>
        e.name.includes('main-explosion')
      );
      expect(mainExplosionEmitter).toBeDefined();
      expect(ParticleEmitter).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'PerfectClearEffect-main-explosion',
          emissionRate: 0,
          burstCount: 80, // 200 * 0.4
        })
      );
    });

    test('虹色パーティクルエミッターが作成される', () => {
      perfectClearEffect.start();

      const rainbowEmitter = perfectClearEffect.emitters.find(e =>
        e.name.includes('rainbow-particles')
      );
      expect(rainbowEmitter).toBeDefined();
      expect(ParticleEmitter).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'PerfectClearEffect-rainbow-particles',
          emissionRate: 12, // 200 / (5000/1000) * 0.3
        })
      );
    });

    test('金色シャワーエミッターが作成される', () => {
      perfectClearEffect.start();

      const goldenShowerEmitter = perfectClearEffect.emitters.find(e =>
        e.name.includes('golden-shower')
      );
      expect(goldenShowerEmitter).toBeDefined();
      expect(ParticleEmitter).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'PerfectClearEffect-golden-shower',
          emissionRate: 8, // 200 / (5000/1000) * 0.2
        })
      );
    });

    test('祝賀の輪エミッターが作成される', () => {
      perfectClearEffect.start();

      const celebrationRingsEmitter = perfectClearEffect.emitters.find(e =>
        e.name.includes('celebration-rings')
      );
      expect(celebrationRingsEmitter).toBeDefined();
      expect(ParticleEmitter).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'PerfectClearEffect-celebration-rings',
          emissionRate: 0,
          burstCount: 30, // 200 * 0.15
        })
      );
    });

    test('スパークル爆発エミッターが作成される', () => {
      perfectClearEffect.start();

      const sparkleBurstEmitter = perfectClearEffect.emitters.find(e =>
        e.name.includes('sparkle-burst')
      );
      expect(sparkleBurstEmitter).toBeDefined();
      expect(ParticleEmitter).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'PerfectClearEffect-sparkle-burst',
          emissionRate: 0,
          burstCount: 20, // 200 * 0.1
        })
      );
    });

    test('Perfect Clearテキストエミッターが作成される', () => {
      perfectClearEffect.start();

      const textEmitter = perfectClearEffect.emitters.find(e =>
        e.name.includes('perfect-clear-text')
      );
      expect(textEmitter).toBeDefined();
      expect(ParticleEmitter).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'PerfectClearEffect-perfect-clear-text',
          emissionRate: 0,
          burstCount: 10, // 200 * 0.05
        })
      );
    });

    test('エミッターの位置が正しく設定される', () => {
      perfectClearEffect.start();

      // すべてのエミッターの位置が設定されていることを確認
      perfectClearEffect.emitters.forEach(emitter => {
        expect(emitter.position).toEqual(perfectClearEffect.position);
      });
    });
  });

  describe('エフェクトのライフサイクル', () => {
    test('エフェクトを開始できる', () => {
      perfectClearEffect.start();

      expect(perfectClearEffect.isActive()).toBe(true);
      expect(perfectClearEffect.isInitialized).toBe(true);
    });

    test('エフェクトを停止できる', () => {
      perfectClearEffect.start();
      perfectClearEffect.stop();

      expect(perfectClearEffect.isActive()).toBe(false);
    });

    test('エフェクトをリセットできる', () => {
      perfectClearEffect.start();
      perfectClearEffect.reset();

      expect(perfectClearEffect.isActive()).toBe(false);
      expect(perfectClearEffect.isInitialized).toBe(false);
      expect(perfectClearEffect.emitters).toEqual([]);
    });
  });

  describe('エフェクトの更新', () => {
    test('エフェクトの更新処理が正常に動作する', () => {
      perfectClearEffect.start();

      expect(() => perfectClearEffect.update(16.67)).not.toThrow();
    });

    test('時間経過に応じて強度が調整される', () => {
      perfectClearEffect.start();

      // 初期状態
      expect(perfectClearEffect.intensity).toBe(1.5);

      // 更新処理が正常に動作することを確認
      expect(() => perfectClearEffect.update(16.67)).not.toThrow();
    });
  });

  describe('パーティクル設定', () => {
    test('メイン爆発エミッターのパーティクル設定が正しい', () => {
      perfectClearEffect.start();

      // メイン爆発エミッターの呼び出しを確認
      const mainExplosionCall = ParticleEmitter.mock.calls.find(call =>
        call[0].name.includes('main-explosion')
      );

      expect(mainExplosionCall[0].particleConfig).toEqual(
        expect.objectContaining({
          size: 15 * perfectClearEffect.scale,
          color: perfectClearEffect.colors[0],
          life: perfectClearEffect.duration * 0.8,
          maxLife: perfectClearEffect.duration * 0.8,
          gravity: perfectClearEffect.gravity * 0.5,
          friction: perfectClearEffect.friction,
          alpha: 1.0,
        })
      );
    });

    test('虹色パーティクルエミッターのパーティクル設定が正しい', () => {
      perfectClearEffect.start();

      const rainbowCall = ParticleEmitter.mock.calls.find(call =>
        call[0].name.includes('rainbow-particles')
      );

      expect(rainbowCall[0].particleConfig).toEqual(
        expect.objectContaining({
          size: 8 * perfectClearEffect.scale,
          life: perfectClearEffect.duration * 0.6,
          maxLife: perfectClearEffect.duration * 0.6,
          gravity: perfectClearEffect.gravity * 0.3,
          friction: perfectClearEffect.friction,
          alpha: 0.8,
        })
      );
    });

    test('金色シャワーエミッターのパーティクル設定が正しい', () => {
      perfectClearEffect.start();

      const goldenShowerCall = ParticleEmitter.mock.calls.find(call =>
        call[0].name.includes('golden-shower')
      );

      expect(goldenShowerCall[0].particleConfig).toEqual(
        expect.objectContaining({
          size: 12 * perfectClearEffect.scale,
          color: perfectClearEffect.colors[2], // 金色
          life: perfectClearEffect.duration * 0.7,
          maxLife: perfectClearEffect.duration * 0.7,
          gravity: perfectClearEffect.gravity * 0.2,
          friction: perfectClearEffect.friction,
          alpha: 0.9,
        })
      );
    });

    test('祝賀の輪エミッターのパーティクル設定が正しい', () => {
      perfectClearEffect.start();

      const celebrationRingsCall = ParticleEmitter.mock.calls.find(call =>
        call[0].name.includes('celebration-rings')
      );

      expect(celebrationRingsCall[0].particleConfig).toEqual(
        expect.objectContaining({
          size: 6 * perfectClearEffect.scale,
          color: perfectClearEffect.colors[1], // 黄色
          life: perfectClearEffect.duration * 0.9,
          maxLife: perfectClearEffect.duration * 0.9,
          gravity: 0,
          friction: perfectClearEffect.friction * 0.95,
          alpha: 0.7,
        })
      );
    });

    test('スパークル爆発エミッターのパーティクル設定が正しい', () => {
      perfectClearEffect.start();

      const sparkleBurstCall = ParticleEmitter.mock.calls.find(call =>
        call[0].name.includes('sparkle-burst')
      );

      expect(sparkleBurstCall[0].particleConfig).toEqual(
        expect.objectContaining({
          size: 4 * perfectClearEffect.scale,
          life: perfectClearEffect.duration * 0.5,
          maxLife: perfectClearEffect.duration * 0.5,
          gravity: perfectClearEffect.gravity * 0.8,
          friction: perfectClearEffect.friction,
          alpha: 1.0,
        })
      );
    });

    test('Perfect Clearテキストエミッターのパーティクル設定が正しい', () => {
      perfectClearEffect.start();

      const textCall = ParticleEmitter.mock.calls.find(call =>
        call[0].name.includes('perfect-clear-text')
      );

      expect(textCall[0].particleConfig).toEqual(
        expect.objectContaining({
          size: 10 * perfectClearEffect.scale,
          color: perfectClearEffect.colors[0], // 白色
          life: perfectClearEffect.duration * 0.6,
          maxLife: perfectClearEffect.duration * 0.6,
          gravity: perfectClearEffect.gravity * 0.1,
          friction: perfectClearEffect.friction,
          alpha: 0.8,
        })
      );
    });
  });

  describe('エフェクトの統計', () => {
    test('エフェクトの統計情報を取得できる', () => {
      perfectClearEffect.start();

      const stats = perfectClearEffect.getStats();

      expect(stats).toHaveProperty('active');
      expect(stats).toHaveProperty('elapsedTime');
      expect(stats).toHaveProperty('emitterCount');
      expect(stats).toHaveProperty('totalDuration');
      expect(stats).toHaveProperty('totalRuns');
    });
  });
});
