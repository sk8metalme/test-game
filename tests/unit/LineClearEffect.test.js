import LineClearEffect from '../../src/core/usecases/LineClearEffect.js';

describe('LineClearEffect', () => {
  let lineClearEffect;

  beforeEach(() => {
    lineClearEffect = new LineClearEffect({
      position: { x: 200, y: 300 },
      lineCount: 2,
      intensity: 1.0,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('コンストラクタ', () => {
    test('デフォルト設定でLineClearEffectを作成できる', () => {
      const effect = new LineClearEffect();

      expect(effect.name).toBe('line-clear');
      expect(effect.type).toBe('LineClearEffect');
      expect(effect.duration).toBe(1500);
      expect(effect.particleCount).toBe(80);
      expect(effect.colors).toEqual(['#ff6b35', '#f7931e', '#ffd23f', '#ffffff']);
      expect(effect.lineHeight).toBe(20);
      expect(effect.explosionRadius).toBe(100);
      expect(effect.smokeIntensity).toBe(0.8);
      expect(effect.lineCount).toBe(1);
    });

    test('カスタム設定でLineClearEffectを作成できる', () => {
      expect(lineClearEffect.position).toEqual({ x: 200, y: 300 });
      expect(lineClearEffect.lineCount).toBe(2);
      expect(lineClearEffect.intensity).toBe(1.0);
    });
  });

  describe('エミッター作成', () => {
    test('複数のエミッターが作成される', () => {
      lineClearEffect.initialize();

      expect(lineClearEffect.emitters.length).toBe(8); // 基底クラス + 4つのエミッター
    });

    test('メイン爆発エミッターが作成される', () => {
      lineClearEffect.initialize();

      const mainEmitter = lineClearEffect.emitters.find(e => e.name.includes('main-explosion'));
      expect(mainEmitter).toBeDefined();
      expect(mainEmitter.burstCount).toBeGreaterThan(0);
      expect(mainEmitter.particleConfig.color).toBe('#ff6b35');
    });

    test('光の粒子エミッターが作成される', () => {
      lineClearEffect.initialize();

      const lightEmitter = lineClearEffect.emitters.find(e => e.name.includes('light-particles'));
      expect(lightEmitter).toBeDefined();
      expect(lightEmitter.burstCount).toBeGreaterThan(0);
      expect(lightEmitter.particleConfig.color).toBe('#ffffff');
    });

    test('煙のエミッターが作成される', () => {
      lineClearEffect.initialize();

      const smokeEmitter = lineClearEffect.emitters.find(e => e.name.includes('smoke'));
      expect(smokeEmitter).toBeDefined();
      expect(smokeEmitter.emissionRate).toBe(20);
      expect(smokeEmitter.particleConfig.color).toBe('#666666');
    });

    test('複数ライン削除時の追加エミッターが作成される', () => {
      lineClearEffect.initialize();

      const multiLineEmitter = lineClearEffect.emitters.find(e => e.name.includes('multi-line'));
      expect(multiLineEmitter).toBeDefined();
      expect(multiLineEmitter.burstCount).toBeGreaterThan(0);
      expect(multiLineEmitter.particleConfig.color).toBe('#ff0000');
    });
  });

  describe('ライン数設定', () => {
    test('ライン数を設定できる', () => {
      lineClearEffect.setLineCount(4);

      expect(lineClearEffect.lineCount).toBe(4);
      expect(lineClearEffect.particleCount).toBe(140); // 80 + (4-1) * 20
      expect(lineClearEffect.intensity).toBe(1.0); // 0.7 + 4 * 0.1
    });

    test('ライン数は1以上に制限される', () => {
      lineClearEffect.setLineCount(0);
      expect(lineClearEffect.lineCount).toBe(1);
    });

    test('強度は1.0以下に制限される', () => {
      lineClearEffect.setLineCount(10);
      expect(lineClearEffect.intensity).toBe(1.0);
    });
  });

  describe('統計情報', () => {
    test('ライン削除エフェクト統計を取得できる', () => {
      lineClearEffect.initialize();

      const stats = lineClearEffect.getEffectStats();

      expect(stats.type).toBe('LineClearEffect');
      expect(stats.lineHeight).toBe(lineClearEffect.lineHeight);
      expect(stats.explosionRadius).toBe(lineClearEffect.explosionRadius);
      expect(stats.smokeIntensity).toBe(lineClearEffect.smokeIntensity);
      expect(stats.lineCount).toBe(lineClearEffect.lineCount);
    });
  });

  describe('文字列表現', () => {
    test('文字列表現を取得できる', () => {
      lineClearEffect.initialize();

      const str = lineClearEffect.toString();

      expect(str).toContain('LineClearEffect');
      expect(str).toContain('line-clear');
      expect(str).toContain('2'); // lineCount
    });
  });

  describe('エフェクト実行', () => {
    test('エフェクトを開始できる', () => {
      lineClearEffect.start();

      expect(lineClearEffect.isActive()).toBe(true);
      expect(lineClearEffect.isInitialized).toBe(true);
    });

    test('エフェクトを停止できる', () => {
      lineClearEffect.start();
      lineClearEffect.stop();

      expect(lineClearEffect.isActive()).toBe(false);
    });
  });
});
