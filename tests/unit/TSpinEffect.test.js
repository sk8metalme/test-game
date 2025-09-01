import TSpinEffect from '../../src/core/usecases/TSpinEffect.js';

describe('TSpinEffect', () => {
  let tSpinEffect;

  beforeEach(() => {
    tSpinEffect = new TSpinEffect({
      position: { x: 300, y: 400 },
      spinType: 'double',
      intensity: 1.0,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('コンストラクタ', () => {
    test('デフォルト設定でTSpinEffectを作成できる', () => {
      const effect = new TSpinEffect();

      expect(effect.name).toBe('t-spin');
      expect(effect.type).toBe('TSpinEffect');
      expect(effect.duration).toBe(2500);
      expect(effect.particleCount).toBe(60);
      expect(effect.colors).toEqual(['#4a90e2', '#7b68ee', '#ffffff', '#e6e6fa']);
      expect(effect.rotationSpeed).toBe(0.1);
      expect(effect.spiralRadius).toBe(80);
      expect(effect.starCount).toBe(8);
      expect(effect.spinType).toBe('single');
      expect(effect.rotationAngle).toBe(0);
    });

    test('カスタム設定でTSpinEffectを作成できる', () => {
      expect(tSpinEffect.position).toEqual({ x: 300, y: 400 });
      expect(tSpinEffect.spinType).toBe('double');
      expect(tSpinEffect.intensity).toBe(1.0);
    });
  });

  describe('エミッター作成', () => {
    test('複数のエミッターが作成される', () => {
      tSpinEffect.initialize();

      expect(tSpinEffect.emitters.length).toBe(8); // 基底クラス + 4つのエミッター
    });

    test('螺旋状エミッターが作成される', () => {
      tSpinEffect.initialize();

      const spiralEmitter = tSpinEffect.emitters.find(e => e.name.includes('spiral'));
      expect(spiralEmitter).toBeDefined();
      expect(spiralEmitter.emissionRate).toBe(30);
      expect(spiralEmitter.particleConfig.color).toBe('#4a90e2');
    });

    test('回転する光の輪エミッターが作成される', () => {
      tSpinEffect.initialize();

      const ringEmitter = tSpinEffect.emitters.find(e => e.name.includes('rotating-ring'));
      expect(ringEmitter).toBeDefined();
      expect(ringEmitter.burstCount).toBe(tSpinEffect.starCount);
      expect(ringEmitter.particleConfig.color).toBe('#7b68ee');
    });

    test('星型爆発エミッターが作成される', () => {
      tSpinEffect.initialize();

      const starEmitter = tSpinEffect.emitters.find(e => e.name.includes('star-burst'));
      expect(starEmitter).toBeDefined();
      expect(starEmitter.burstCount).toBeGreaterThan(0);
      expect(starEmitter.particleConfig.color).toBe('#ffffff');
    });

    test('タイプ固有エミッターが作成される', () => {
      tSpinEffect.initialize();

      const typeEmitter = tSpinEffect.emitters.find(e => e.name.includes('type-specific'));
      expect(typeEmitter).toBeDefined();
      expect(typeEmitter.burstCount).toBe(20); // double
      expect(typeEmitter.particleConfig.color).toBe('#4a90e2');
    });
  });

  describe('回転更新', () => {
    test('回転角度が更新される', () => {
      const initialAngle = tSpinEffect.rotationAngle;

      tSpinEffect.update(100); // 100ms

      expect(tSpinEffect.rotationAngle).toBeGreaterThan(initialAngle);
    });

    test('回転速度に応じて角度が更新される', () => {
      tSpinEffect.rotationSpeed = 0.2;
      const initialAngle = tSpinEffect.rotationAngle;

      tSpinEffect.update(100);

      const expectedAngle = initialAngle + 0.2 * 100;
      expect(tSpinEffect.rotationAngle).toBeCloseTo(expectedAngle, 5);
    });
  });

  describe('T-Spinタイプ設定', () => {
    test('singleタイプを設定できる', () => {
      tSpinEffect.setSpinType('single');

      expect(tSpinEffect.spinType).toBe('single');
      expect(tSpinEffect.particleCount).toBe(60);
      expect(tSpinEffect.intensity).toBe(1.0);
    });

    test('doubleタイプを設定できる', () => {
      tSpinEffect.setSpinType('double');

      expect(tSpinEffect.spinType).toBe('double');
      expect(tSpinEffect.particleCount).toBe(80);
      expect(tSpinEffect.intensity).toBe(1.2);
    });

    test('tripleタイプを設定できる', () => {
      tSpinEffect.setSpinType('triple');

      expect(tSpinEffect.spinType).toBe('triple');
      expect(tSpinEffect.particleCount).toBe(100);
      expect(tSpinEffect.intensity).toBe(1.5);
    });
  });

  describe('統計情報', () => {
    test('T-Spinエフェクト統計を取得できる', () => {
      tSpinEffect.initialize();

      const stats = tSpinEffect.getEffectStats();

      expect(stats.type).toBe('TSpinEffect');
      expect(stats.rotationSpeed).toBe(tSpinEffect.rotationSpeed);
      expect(stats.spiralRadius).toBe(tSpinEffect.spiralRadius);
      expect(stats.starCount).toBe(tSpinEffect.starCount);
      expect(stats.spinType).toBe(tSpinEffect.spinType);
      expect(stats.rotationAngle).toBe(tSpinEffect.rotationAngle);
    });
  });

  describe('文字列表現', () => {
    test('文字列表現を取得できる', () => {
      tSpinEffect.initialize();

      const str = tSpinEffect.toString();

      expect(str).toContain('TSpinEffect');
      expect(str).toContain('t-spin');
      expect(str).toContain('double'); // spinType
    });
  });

  describe('エフェクト実行', () => {
    test('エフェクトを開始できる', () => {
      tSpinEffect.start();

      expect(tSpinEffect.isActive()).toBe(true);
      expect(tSpinEffect.isInitialized).toBe(true);
    });

    test('エフェクトを停止できる', () => {
      tSpinEffect.start();
      tSpinEffect.stop();

      expect(tSpinEffect.isActive()).toBe(false);
    });

    test('更新中に回転角度が変化する', () => {
      tSpinEffect.start();
      const initialAngle = tSpinEffect.rotationAngle;

      tSpinEffect.update(50);

      expect(tSpinEffect.rotationAngle).toBeGreaterThan(initialAngle);
    });
  });
});
