import GameEffect from '../../src/core/usecases/GameEffect.js';
import ParticleEmitter from '../../src/core/usecases/ParticleEmitter.js';

describe('GameEffect', () => {
  let gameEffect;

  beforeEach(() => {
    gameEffect = new GameEffect('test-effect', {
      duration: 1000,
      particleCount: 50,
      intensity: 1.0,
      scale: 1.0,
      colors: ['#ff0000', '#00ff00'],
      position: { x: 100, y: 200 },
      direction: { x: 1, y: 0 },
      speed: 100,
      gravity: 0.5,
      friction: 0.98,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('コンストラクタ', () => {
    test('デフォルト設定でGameEffectを作成できる', () => {
      const effect = new GameEffect('default-effect');

      expect(effect.name).toBe('default-effect');
      expect(effect.type).toBe('GameEffect');
      expect(effect.duration).toBe(2000);
      expect(effect.particleCount).toBe(50);
      expect(effect.intensity).toBe(1.0);
      expect(effect.scale).toBe(1.0);
      expect(effect.colors).toEqual(['#ffffff']);
      expect(effect.position).toEqual({ x: 400, y: 300 });
      expect(effect.direction).toEqual({ x: 0, y: -1 });
      expect(effect.speed).toBe(100);
      expect(effect.gravity).toBe(0);
      expect(effect.friction).toBe(0.98);
    });

    test('カスタム設定でGameEffectを作成できる', () => {
      expect(gameEffect.name).toBe('test-effect');
      expect(gameEffect.duration).toBe(1000);
      expect(gameEffect.particleCount).toBe(50);
      expect(gameEffect.intensity).toBe(1.0);
      expect(gameEffect.scale).toBe(1.0);
      expect(gameEffect.colors).toEqual(['#ff0000', '#00ff00']);
      expect(gameEffect.position).toEqual({ x: 100, y: 200 });
      expect(gameEffect.direction).toEqual({ x: 1, y: 0 });
      expect(gameEffect.speed).toBe(100);
      expect(gameEffect.gravity).toBe(0.5);
      expect(gameEffect.friction).toBe(0.98);
    });
  });

  describe('初期化', () => {
    test('エフェクトを初期化できる', () => {
      expect(gameEffect.isInitialized).toBe(false);

      gameEffect.initialize();

      expect(gameEffect.isInitialized).toBe(true);
      expect(gameEffect.emitters.length).toBeGreaterThan(0);
    });

    test('重複初期化は無視される', () => {
      gameEffect.initialize();
      const emitterCount = gameEffect.emitters.length;

      gameEffect.initialize();

      expect(gameEffect.emitters.length).toBe(emitterCount);
    });
  });

  describe('エミッター作成', () => {
    test('基本的なエミッターが作成される', () => {
      gameEffect.initialize();

      expect(gameEffect.emitters.length).toBe(2); // 基底クラス + サブクラス

      const emitter = gameEffect.emitters[0];
      expect(emitter).toBeInstanceOf(ParticleEmitter);
      // エミッターの位置は設定されていることを確認
      expect(emitter.position).toBeDefined();
    });
  });

  describe('エフェクト開始', () => {
    test('エフェクトを開始できる', () => {
      gameEffect.start();

      expect(gameEffect.isInitialized).toBe(true);
      expect(gameEffect.isActive()).toBe(true);
    });

    test('未初期化のエフェクトは自動初期化される', () => {
      expect(gameEffect.isInitialized).toBe(false);

      gameEffect.start();

      expect(gameEffect.isInitialized).toBe(true);
      expect(gameEffect.isActive()).toBe(true);
    });
  });

  describe('設定変更', () => {
    beforeEach(() => {
      gameEffect.initialize();
    });

    test('強度を設定できる', () => {
      gameEffect.setIntensity(0.5);

      expect(gameEffect.intensity).toBe(0.5);
    });

    test('強度は0.0-1.0の範囲に制限される', () => {
      gameEffect.setIntensity(-0.5);
      expect(gameEffect.intensity).toBe(0);

      gameEffect.setIntensity(1.5);
      expect(gameEffect.intensity).toBe(1);
    });

    test('スケールを設定できる', () => {
      gameEffect.setScale(2.0);

      expect(gameEffect.scale).toBe(2.0);
    });

    test('スケールは0.1以上に制限される', () => {
      gameEffect.setScale(0.05);
      expect(gameEffect.scale).toBe(0.1);
    });

    test('位置を設定できる', () => {
      const newPosition = { x: 300, y: 400 };
      gameEffect.setPosition(newPosition);

      expect(gameEffect.position).toEqual(newPosition);
    });

    test('色を設定できる', () => {
      const newColors = ['#0000ff', '#ffff00'];
      gameEffect.setColors(newColors);

      expect(gameEffect.colors).toEqual(newColors);
    });

    test('設定を一括更新できる', () => {
      const newConfig = {
        intensity: 0.8,
        scale: 1.5,
        position: { x: 500, y: 600 },
        colors: ['#purple', '#pink'],
      };

      gameEffect.updateConfig(newConfig);

      expect(gameEffect.intensity).toBe(0.8);
      expect(gameEffect.scale).toBe(1.5);
      expect(gameEffect.position).toEqual({ x: 500, y: 600 });
      expect(gameEffect.colors).toEqual(['#purple', '#pink']);
    });
  });

  describe('統計情報', () => {
    test('エフェクト統計を取得できる', () => {
      gameEffect.initialize();

      const stats = gameEffect.getEffectStats();

      expect(stats.type).toBe('GameEffect');
      expect(stats.intensity).toBe(gameEffect.intensity);
      expect(stats.scale).toBe(gameEffect.scale);
      expect(stats.colors).toEqual(gameEffect.colors);
      expect(stats.position).toEqual(gameEffect.position);
      expect(stats.emitterCount).toBe(gameEffect.emitters.length);
      expect(stats.isInitialized).toBe(true);
    });
  });

  describe('リセット', () => {
    test('エフェクトをリセットできる', () => {
      gameEffect.initialize();
      gameEffect.start();

      gameEffect.reset();

      expect(gameEffect.isInitialized).toBe(false);
      expect(gameEffect.emitters.length).toBe(0);
      expect(gameEffect.isActive()).toBe(false);
    });
  });

  describe('文字列表現', () => {
    test('文字列表現を取得できる', () => {
      gameEffect.initialize();

      const str = gameEffect.toString();

      expect(str).toContain('GameEffect');
      expect(str).toContain('test-effect');
      expect(str).toContain('GameEffect');
      expect(str).toContain('1');
      expect(str).toContain('1');
    });
  });
});
