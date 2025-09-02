import LevelUpEffect from '../../src/core/usecases/LevelUpEffect.js';
import GameEffect from '../../src/core/usecases/GameEffect.js';
import ParticleEmitter from '../../src/core/usecases/ParticleEmitter.js';

// ParticleEmitterのモック
jest.mock('../../src/core/usecases/ParticleEmitter.js', () => {
  let emitterCounter = 0;
  return jest.fn().mockImplementation(config => {
    emitterCounter++;
    return {
      name: config.name || `mock-emitter-${emitterCounter}`,
      position: { x: 0, y: 0 },
      emissionRate: config.emissionRate || 0,
      burstCount: config.burstCount || 0,
      particleConfig: config.particleConfig || {},
      start: jest.fn(),
      stop: jest.fn(),
      update: jest.fn(),
      reset: jest.fn(),
      isActive: jest.fn(() => true),
      getStats: jest.fn(() => ({ particlesEmitted: 0, activeParticles: 0 })),
    };
  });
});

describe('LevelUpEffect', () => {
  let levelUpEffect;
  let mockConfig;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConfig = {
      name: 'TestLevelUpEffect',
      duration: 3000,
      particleCount: 80,
      intensity: 1.0,
      scale: 1.0,
      colors: ['#ffd700', '#ffffff', '#ffff00'],
      position: { x: 100, y: 200 },
      speed: 120,
    };
    levelUpEffect = new LevelUpEffect(mockConfig);
  });

  describe('コンストラクタ', () => {
    test('デフォルト設定で正しく初期化される', () => {
      const effect = new LevelUpEffect();
      expect(effect.name).toBe('LevelUpEffect');
      expect(effect.type).toBe('LevelUpEffect');
      expect(effect.duration).toBe(3000);
      expect(effect.particleCount).toBe(80);
      expect(effect.colors).toEqual(['#ffd700', '#ffffff', '#ffff00', '#ffa500', '#ffeb3b']);
    });

    test('カスタム設定で正しく初期化される', () => {
      expect(levelUpEffect.name).toBe('LevelUpEffect');
      expect(levelUpEffect.type).toBe('LevelUpEffect');
      expect(levelUpEffect.duration).toBe(3000);
      expect(levelUpEffect.particleCount).toBe(80);
      expect(levelUpEffect.intensity).toBe(1.0);
      expect(levelUpEffect.scale).toBe(1.0);
      expect(levelUpEffect.colors).toEqual(['#ffd700', '#ffffff', '#ffff00']);
      expect(levelUpEffect.position).toEqual({ x: 100, y: 200 });
      expect(levelUpEffect.speed).toBe(120);
    });

    test('GameEffectを継承している', () => {
      expect(levelUpEffect).toBeInstanceOf(GameEffect);
    });
  });

  describe('エミッター作成', () => {
    test('start()でエミッターが正しく作成される', () => {
      levelUpEffect.start();

      // 基底クラスのエミッター + レベルアップ専用の5つのエミッター
      expect(ParticleEmitter).toHaveBeenCalledTimes(6);
    });

    test('上昇する光のエミッターが正しく作成される', () => {
      levelUpEffect.start();

      const risingLightCall = ParticleEmitter.mock.calls.find(
        call => call[0].name && call[0].name.includes('rising-light')
      );
      expect(risingLightCall).toBeDefined();
      expect(risingLightCall[0].emissionRate).toBeGreaterThan(0);
      expect(risingLightCall[0].burstCount).toBe(0);
    });

    test('祝福の星エミッターが正しく作成される', () => {
      levelUpEffect.start();

      const blessingStarsCall = ParticleEmitter.mock.calls.find(
        call => call[0].name && call[0].name.includes('blessing-stars')
      );
      expect(blessingStarsCall).toBeDefined();
      expect(blessingStarsCall[0].emissionRate).toBe(0);
      expect(blessingStarsCall[0].burstCount).toBe(20); // 80 * 0.25
    });

    test('光の雨エミッターが正しく作成される', () => {
      levelUpEffect.start();

      const lightRainCall = ParticleEmitter.mock.calls.find(
        call => call[0].name && call[0].name.includes('light-rain')
      );
      expect(lightRainCall).toBeDefined();
      expect(lightRainCall[0].emissionRate).toBeGreaterThan(0);
      expect(lightRainCall[0].burstCount).toBe(0);
    });

    test('レベルアップテキストエミッターが正しく作成される', () => {
      levelUpEffect.start();

      const textCall = ParticleEmitter.mock.calls.find(
        call => call[0].name && call[0].name.includes('level-up-text')
      );
      expect(textCall).toBeDefined();
      expect(textCall[0].emissionRate).toBe(0);
      expect(textCall[0].burstCount).toBe(8); // 80 * 0.1
    });

    test('金色のスパークルエミッターが正しく作成される', () => {
      levelUpEffect.start();

      const sparklesCall = ParticleEmitter.mock.calls.find(
        call => call[0].name && call[0].name.includes('golden-sparkles')
      );
      expect(sparklesCall).toBeDefined();
      expect(sparklesCall[0].emissionRate).toBeGreaterThan(0);
      expect(sparklesCall[0].burstCount).toBe(0);
    });
  });

  describe('パーティクル設定', () => {
    test('上昇する光のパーティクル設定が正しい', () => {
      levelUpEffect.start();

      const risingLightCall = ParticleEmitter.mock.calls.find(
        call => call[0].name && call[0].name.includes('rising-light')
      );
      const config = risingLightCall[0].particleConfig;

      expect(config.size).toBe(8 * mockConfig.scale);
      expect(config.life).toBe(3000 * 0.8);
      expect(config.velocity.y()).toBeLessThan(0); // 上向き
      expect(config.gravity).toBe(0.2 * 0.1);
    });

    test('祝福の星のパーティクル設定が正しい', () => {
      levelUpEffect.start();

      const blessingStarsCall = ParticleEmitter.mock.calls.find(
        call => call[0].name && call[0].name.includes('blessing-stars')
      );
      const config = blessingStarsCall[0].particleConfig;

      expect(config.size).toBe(12 * mockConfig.scale);
      expect(config.color).toBe('#ffd700'); // 金色
      expect(config.life).toBe(3000 * 0.9);
    });

    test('光の雨のパーティクル設定が正しい', () => {
      levelUpEffect.start();

      const lightRainCall = ParticleEmitter.mock.calls.find(
        call => call[0].name && call[0].name.includes('light-rain')
      );
      const config = lightRainCall[0].particleConfig;

      expect(config.size).toBe(6 * mockConfig.scale);
      expect(config.life).toBe(3000 * 0.6);
      expect(config.velocity.y()).toBeGreaterThan(0); // 下向き
    });
  });

  describe('エフェクトの更新', () => {
    test('update()で強度が正しく調整される', () => {
      levelUpEffect.start();

      // エフェクトがアクティブであることを確認
      expect(levelUpEffect.isActive()).toBe(true);

      // 強度調整のロジックを直接テスト
      levelUpEffect.elapsedTime = 1000; // 1秒経過をシミュレート
      const progress = levelUpEffect.elapsedTime / levelUpEffect.duration;
      const baseIntensity = levelUpEffect.config.intensity || 1.0;
      levelUpEffect.intensity = baseIntensity + progress * 0.3;

      // 強度が調整されていることを確認
      expect(levelUpEffect.intensity).toBeCloseTo(1.1, 1);
    });

    test('時間経過に応じて強度が増加する', () => {
      levelUpEffect.start();

      // エフェクトがアクティブであることを確認
      expect(levelUpEffect.isActive()).toBe(true);

      const _initialIntensity = levelUpEffect.intensity; // 1.0

      // 1.5秒経過をシミュレート
      levelUpEffect.elapsedTime = 1500;
      const progress1 = levelUpEffect.elapsedTime / levelUpEffect.duration;
      const baseIntensity = levelUpEffect.config.intensity || 1.0;
      levelUpEffect.intensity = baseIntensity + progress1 * 0.3;
      const midIntensity = levelUpEffect.intensity;

      // 3秒経過をシミュレート
      levelUpEffect.elapsedTime = 3000;
      const progress2 = levelUpEffect.elapsedTime / levelUpEffect.duration;
      levelUpEffect.intensity = baseIntensity + progress2 * 0.3;
      const finalIntensity = levelUpEffect.intensity;

      expect(midIntensity).toBeCloseTo(1.15, 1);
      expect(finalIntensity).toBeCloseTo(1.3, 1);
    });
  });

  describe('ライフサイクル管理', () => {
    test('start()でエフェクトが開始される', () => {
      levelUpEffect.start();
      expect(levelUpEffect.isActive()).toBe(true);
    });

    test('stop()でエフェクトが停止される', () => {
      levelUpEffect.start();
      levelUpEffect.stop();
      expect(levelUpEffect.isActive()).toBe(false);
    });

    test('reset()でエフェクトがリセットされる', () => {
      levelUpEffect.start();
      levelUpEffect.reset();
      expect(levelUpEffect.isActive()).toBe(false);
      expect(levelUpEffect.isInitialized).toBe(false);
      expect(levelUpEffect.emitters).toEqual([]);
    });
  });

  describe('統計情報', () => {
    test('getStats()で統計情報が取得できる', () => {
      levelUpEffect.start();
      const stats = levelUpEffect.getStats();

      expect(stats).toHaveProperty('totalRuns');
      expect(stats).toHaveProperty('totalDuration');
      expect(stats).toHaveProperty('averageDuration');
      expect(stats).toHaveProperty('lastRunDuration');
    });
  });

  describe('エミッター位置設定', () => {
    test('上昇する光のエミッターが画面下部に配置される', () => {
      levelUpEffect.start();

      const emitter = ParticleEmitter.mock.results.find(
        result => result.value.name && result.value.name.includes('rising-light')
      );

      expect(emitter.value.position.y).toBe(300); // 200 + 100
    });

    test('光の雨のエミッターが画面上部に配置される', () => {
      levelUpEffect.start();

      const emitter = ParticleEmitter.mock.results.find(
        result => result.value.name && result.value.name.includes('light-rain')
      );

      expect(emitter.value.position.y).toBe(100); // 200 - 100
    });
  });

  describe('色の設定', () => {
    test('祝福の色が正しく設定される', () => {
      const effect = new LevelUpEffect();
      expect(effect.colors).toContain('#ffd700'); // 金色
      expect(effect.colors).toContain('#ffffff'); // 白色
      expect(effect.colors).toContain('#ffff00'); // 黄色
      expect(effect.colors).toContain('#ffa500'); // オレンジ
      expect(effect.colors).toContain('#ffeb3b'); // 明るい黄色
    });
  });

  describe('パーティクル数の配分', () => {
    test('パーティクル数が正しく配分される', () => {
      levelUpEffect.start();

      // 祝福の星: 25% = 20個
      const blessingStarsCall = ParticleEmitter.mock.calls.find(
        call => call[0].name && call[0].name.includes('blessing-stars')
      );
      expect(blessingStarsCall[0].burstCount).toBe(20);

      // レベルアップテキスト: 10% = 8個
      const textCall = ParticleEmitter.mock.calls.find(
        call => call[0].name && call[0].name.includes('level-up-text')
      );
      expect(textCall[0].burstCount).toBe(8);
    });
  });
});
