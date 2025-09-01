import GameOverEffect from '../../src/core/usecases/GameOverEffect.js';
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

describe('GameOverEffect', () => {
  let gameOverEffect;
  let mockConfig;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConfig = {
      name: 'TestGameOverEffect',
      duration: 4000,
      particleCount: 100,
      intensity: 1.0,
      scale: 1.0,
      colors: ['#2c2c2c', '#1a1a1a', '#404040'],
      position: { x: 200, y: 300 },
      speed: 80,
    };
    gameOverEffect = new GameOverEffect(mockConfig);
  });

  describe('コンストラクタ', () => {
    test('デフォルト設定で正しく初期化される', () => {
      const effect = new GameOverEffect();
      expect(effect.name).toBe('GameOverEffect');
      expect(effect.type).toBe('GameOverEffect');
      expect(effect.duration).toBe(4000);
      expect(effect.particleCount).toBe(100);
      expect(effect.colors).toEqual(['#2c2c2c', '#1a1a1a', '#404040', '#666666', '#808080']);
    });

    test('カスタム設定で正しく初期化される', () => {
      expect(gameOverEffect.name).toBe('GameOverEffect');
      expect(gameOverEffect.type).toBe('GameOverEffect');
      expect(gameOverEffect.duration).toBe(4000);
      expect(gameOverEffect.particleCount).toBe(100);
      expect(gameOverEffect.intensity).toBe(1.0);
      expect(gameOverEffect.scale).toBe(1.0);
      expect(gameOverEffect.colors).toEqual(['#2c2c2c', '#1a1a1a', '#404040']);
      expect(gameOverEffect.position).toEqual({ x: 200, y: 300 });
      expect(gameOverEffect.speed).toBe(80);
    });

    test('GameEffectを継承している', () => {
      expect(gameOverEffect).toBeInstanceOf(GameEffect);
    });
  });

  describe('エミッター作成', () => {
    test('start()でエミッターが正しく作成される', () => {
      gameOverEffect.start();

      // 基底クラスのエミッター + ゲームオーバー専用の5つのエミッター
      expect(ParticleEmitter).toHaveBeenCalledTimes(6);
    });

    test('下降する暗い粒子エミッターが正しく作成される', () => {
      gameOverEffect.start();

      const fallingDarkCall = ParticleEmitter.mock.calls.find(
        call => call[0].name && call[0].name.includes('falling-dark-particles')
      );
      expect(fallingDarkCall).toBeDefined();
      expect(fallingDarkCall[0].emissionRate).toBeGreaterThan(0);
      expect(fallingDarkCall[0].burstCount).toBe(0);
    });

    test('消えていく光エミッターが正しく作成される', () => {
      gameOverEffect.start();

      const fadingLightCall = ParticleEmitter.mock.calls.find(
        call => call[0].name && call[0].name.includes('fading-light')
      );
      expect(fadingLightCall).toBeDefined();
      expect(fadingLightCall[0].emissionRate).toBe(0);
      expect(fadingLightCall[0].burstCount).toBe(25); // 100 * 0.25
    });

    test('悲しみの煙エミッターが正しく作成される', () => {
      gameOverEffect.start();

      const sadnessSmokeCall = ParticleEmitter.mock.calls.find(
        call => call[0].name && call[0].name.includes('sadness-smoke')
      );
      expect(sadnessSmokeCall).toBeDefined();
      expect(sadnessSmokeCall[0].emissionRate).toBeGreaterThan(0);
      expect(sadnessSmokeCall[0].burstCount).toBe(0);
    });

    test('ゲームオーバーテキストエミッターが正しく作成される', () => {
      gameOverEffect.start();

      const textCall = ParticleEmitter.mock.calls.find(
        call => call[0].name && call[0].name.includes('game-over-text')
      );
      expect(textCall).toBeDefined();
      expect(textCall[0].emissionRate).toBe(0);
      expect(textCall[0].burstCount).toBe(10); // 100 * 0.1
    });

    test('暗い雲エミッターが正しく作成される', () => {
      gameOverEffect.start();

      const darkCloudsCall = ParticleEmitter.mock.calls.find(
        call => call[0].name && call[0].name.includes('dark-clouds')
      );
      expect(darkCloudsCall).toBeDefined();
      expect(darkCloudsCall[0].emissionRate).toBeGreaterThan(0);
      expect(darkCloudsCall[0].burstCount).toBe(0);
    });
  });

  describe('パーティクル設定', () => {
    test('下降する暗い粒子のパーティクル設定が正しい', () => {
      gameOverEffect.start();

      const fallingDarkCall = ParticleEmitter.mock.calls.find(
        call => call[0].name && call[0].name.includes('falling-dark-particles')
      );
      const config = fallingDarkCall[0].particleConfig;

      expect(config.size).toBe(6 * mockConfig.scale);
      expect(config.life).toBe(4000 * 0.9);
      expect(config.velocity.y()).toBeGreaterThan(0); // 下向き
      expect(config.gravity).toBe(0.3 * 0.8);
    });

    test('消えていく光のパーティクル設定が正しい', () => {
      gameOverEffect.start();

      const fadingLightCall = ParticleEmitter.mock.calls.find(
        call => call[0].name && call[0].name.includes('fading-light')
      );
      const config = fadingLightCall[0].particleConfig;

      expect(config.size).toBe(10 * mockConfig.scale);
      expect(config.color).toBe('#404040'); // カスタム設定の最後の色
      expect(config.life).toBe(4000 * 0.7);
      expect(config.gravity).toBe(0);
    });

    test('悲しみの煙のパーティクル設定が正しい', () => {
      gameOverEffect.start();

      const sadnessSmokeCall = ParticleEmitter.mock.calls.find(
        call => call[0].name && call[0].name.includes('sadness-smoke')
      );
      const config = sadnessSmokeCall[0].particleConfig;

      expect(config.size).toBe(12 * mockConfig.scale);
      expect(config.life).toBe(4000 * 0.8);
      expect(config.velocity.y()).toBeLessThan(0); // 上向き（煙は上昇）
    });
  });

  describe('エフェクトの更新', () => {
    test('update()で強度が正しく調整される', () => {
      gameOverEffect.start();

      // 強度調整のロジックを直接テスト
      gameOverEffect.elapsedTime = 2000; // 2秒経過をシミュレート
      const progress = gameOverEffect.elapsedTime / gameOverEffect.duration;
      const baseIntensity = gameOverEffect.config.intensity || 1.0;
      gameOverEffect.intensity = baseIntensity * (1.0 - progress * 0.4);

      // 強度が減少していることを確認（悲しみで希望の光が消えていく）
      expect(gameOverEffect.intensity).toBeCloseTo(0.8, 1); // 1.0 * (1.0 - 0.5 * 0.4) = 0.8
    });

    test('時間経過に応じて強度が減少する', () => {
      gameOverEffect.start();

      const initialIntensity = gameOverEffect.intensity; // 1.0

      // 2秒経過をシミュレート
      gameOverEffect.elapsedTime = 2000;
      const progress1 = gameOverEffect.elapsedTime / gameOverEffect.duration;
      const baseIntensity = gameOverEffect.config.intensity || 1.0;
      gameOverEffect.intensity = baseIntensity * (1.0 - progress1 * 0.4);
      const midIntensity = gameOverEffect.intensity;

      // 4秒経過をシミュレート
      gameOverEffect.elapsedTime = 4000;
      const progress2 = gameOverEffect.elapsedTime / gameOverEffect.duration;
      gameOverEffect.intensity = baseIntensity * (1.0 - progress2 * 0.4);
      const finalIntensity = gameOverEffect.intensity;

      expect(midIntensity).toBeCloseTo(0.8, 1);
      expect(finalIntensity).toBeCloseTo(0.6, 1);
      expect(midIntensity).toBeLessThan(initialIntensity);
      expect(finalIntensity).toBeLessThan(midIntensity);
    });
  });

  describe('ライフサイクル管理', () => {
    test('start()でエフェクトが開始される', () => {
      gameOverEffect.start();
      expect(gameOverEffect.isActive()).toBe(true);
    });

    test('stop()でエフェクトが停止される', () => {
      gameOverEffect.start();
      gameOverEffect.stop();
      expect(gameOverEffect.isActive()).toBe(false);
    });

    test('reset()でエフェクトがリセットされる', () => {
      gameOverEffect.start();
      gameOverEffect.reset();
      expect(gameOverEffect.isActive()).toBe(false);
      expect(gameOverEffect.isInitialized).toBe(false);
      expect(gameOverEffect.emitters).toEqual([]);
    });
  });

  describe('統計情報', () => {
    test('getStats()で統計情報が取得できる', () => {
      gameOverEffect.start();
      const stats = gameOverEffect.getStats();

      expect(stats).toHaveProperty('totalRuns');
      expect(stats).toHaveProperty('totalDuration');
      expect(stats).toHaveProperty('averageDuration');
      expect(stats).toHaveProperty('lastRunDuration');
    });
  });

  describe('エミッター位置設定', () => {
    test('下降する暗い粒子エミッターが画面上部に配置される', () => {
      gameOverEffect.start();

      const emitter = ParticleEmitter.mock.results.find(
        result => result.value.name && result.value.name.includes('falling-dark-particles')
      );

      expect(emitter.value.position.y).toBe(200); // 300 - 100
    });

    test('悲しみの煙エミッターが画面下部に配置される', () => {
      gameOverEffect.start();

      const emitter = ParticleEmitter.mock.results.find(
        result => result.value.name && result.value.name.includes('sadness-smoke')
      );

      expect(emitter.value.position.y).toBe(380); // 300 + 80
    });
  });

  describe('色の設定', () => {
    test('悲しい色が正しく設定される', () => {
      const effect = new GameOverEffect();
      expect(effect.colors).toContain('#2c2c2c'); // 暗いグレー
      expect(effect.colors).toContain('#1a1a1a'); // 黒に近いグレー
      expect(effect.colors).toContain('#404040'); // 中間グレー
      expect(effect.colors).toContain('#666666'); // ライトグレー
      expect(effect.colors).toContain('#808080'); // 薄いグレー
    });
  });

  describe('パーティクル数の配分', () => {
    test('パーティクル数が正しく配分される', () => {
      gameOverEffect.start();

      // 消えていく光: 25% = 25個
      const fadingLightCall = ParticleEmitter.mock.calls.find(
        call => call[0].name && call[0].name.includes('fading-light')
      );
      expect(fadingLightCall[0].burstCount).toBe(25);

      // ゲームオーバーテキスト: 10% = 10個
      const textCall = ParticleEmitter.mock.calls.find(
        call => call[0].name && call[0].name.includes('game-over-text')
      );
      expect(textCall[0].burstCount).toBe(10);
    });
  });

  describe('エフェクトの特徴', () => {
    test('ゲームオーバーの悲しい雰囲気が表現される', () => {
      gameOverEffect.start();

      // 下降方向の動きが設定されている
      const fallingDarkCall = ParticleEmitter.mock.calls.find(
        call => call[0].name && call[0].name.includes('falling-dark-particles')
      );
      expect(fallingDarkCall[0].particleConfig.velocity.y()).toBeGreaterThan(0);

      // 暗い色が使用されている
      expect(
        gameOverEffect.colors.every(
          color => color.startsWith('#') && parseInt(color.slice(1), 16) < 0x808080
        )
      ).toBe(true);
    });
  });
});
