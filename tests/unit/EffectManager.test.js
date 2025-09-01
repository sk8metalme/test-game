import EffectManager from '../../src/core/usecases/EffectManager.js';
import LineClearEffect from '../../src/core/usecases/LineClearEffect.js';
import TSpinEffect from '../../src/core/usecases/TSpinEffect.js';

// モックCanvasの作成
const createMockCanvas = () => {
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

  const canvas = {
    width: 800,
    height: 600,
    getContext: jest.fn().mockReturnValue(context),
  };

  return { canvas, context };
};

describe('EffectManager', () => {
  let mockCanvas, mockContext;
  let effectManager;

  beforeEach(() => {
    const mock = createMockCanvas();
    mockCanvas = mock.canvas;
    mockContext = mock.context;

    effectManager = new EffectManager(mockCanvas, {
      maxConcurrentEffects: 5,
      enableEffects: true,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('コンストラクタ', () => {
    test('デフォルト設定でEffectManagerを作成できる', () => {
      const manager = new EffectManager(mockCanvas);

      expect(manager.canvas).toBe(mockCanvas);
      expect(manager.config.maxConcurrentEffects).toBe(10);
      expect(manager.config.enableEffects).toBe(true);
      expect(manager.effects.size).toBeGreaterThan(0);
      expect(manager.activeEffects.size).toBe(0);
      expect(manager.effectQueue.length).toBe(0);
    });

    test('カスタム設定でEffectManagerを作成できる', () => {
      expect(effectManager.config.maxConcurrentEffects).toBe(5);
      expect(effectManager.config.enableEffects).toBe(true);
    });

    test('Canvas要素が必須', () => {
      expect(() => new EffectManager(null)).toThrow('EffectManager: Canvas要素が必要です');
    });
  });

  describe('エフェクト登録', () => {
    test('デフォルトエフェクトが登録されている', () => {
      expect(effectManager.effects.has('line-clear')).toBe(true);
      expect(effectManager.effects.has('t-spin')).toBe(true);
    });

    test('エフェクトを登録できる', () => {
      class CustomEffect {}

      effectManager.registerEffect('custom', CustomEffect);

      expect(effectManager.effects.has('custom')).toBe(true);
    });

    test('エフェクトの登録を解除できる', () => {
      effectManager.unregisterEffect('line-clear');

      expect(effectManager.effects.has('line-clear')).toBe(false);
    });
  });

  describe('エフェクト再生', () => {
    test('ライン削除エフェクトを再生できる', () => {
      const result = effectManager.playEffect('line-clear', {
        position: { x: 100, y: 200 },
        intensity: 1.0,
      });

      expect(result).toBe(true);
      expect(effectManager.activeEffects.size).toBe(1);
      expect(effectManager.stats.totalEffectsPlayed).toBe(1);
    });

    test('T-Spinエフェクトを再生できる', () => {
      const result = effectManager.playEffect('t-spin', {
        position: { x: 300, y: 400 },
        spinType: 'double',
      });

      expect(result).toBe(true);
      expect(effectManager.activeEffects.size).toBe(1);
    });

    test('存在しないエフェクトは再生できない', () => {
      const result = effectManager.playEffect('nonexistent', {});

      expect(result).toBe(false);
      expect(effectManager.activeEffects.size).toBe(0);
    });

    test('エフェクト無効時は再生できない', () => {
      effectManager.config.enableEffects = false;

      const result = effectManager.playEffect('line-clear', {});

      expect(result).toBe(false);
    });

    test('同時実行数制限時にキューに追加される', () => {
      // 制限数までエフェクトを再生
      for (let i = 0; i < 5; i++) {
        const result = effectManager.playEffect('line-clear', {});
        // エフェクトが正常に作成されることを確認
        expect(result).toBe(true);
        // console.log(`Effect ${i + 1}: result=${result}, activeEffects=${effectManager.activeEffects.size}`);
      }

      // アクティブエフェクト数を確認（実際の数を確認）
      // console.log('Final active effects:', effectManager.activeEffects.size);
      // console.log('Max concurrent effects:', effectManager.config.maxConcurrentEffects);
      expect(effectManager.activeEffects.size).toBeGreaterThan(0);

      // 6個目はキューに追加される
      const result = effectManager.playEffect('line-clear', {});
      // console.log('6th effect result:', result);

      // 同時実行数制限により、キューに追加される
      expect(result).toBe(false);
      expect(effectManager.effectQueue.length).toBe(1);
      expect(effectManager.stats.queuedEffectsCount).toBe(1);
    });
  });

  describe('エフェクト停止', () => {
    test('エフェクトを停止できる', () => {
      effectManager.playEffect('line-clear', {});
      expect(effectManager.activeEffects.size).toBe(1);

      const result = effectManager.stopEffect('line-clear');

      expect(result).toBe(true);
      expect(effectManager.activeEffects.size).toBe(0);
    });

    test('存在しないエフェクトは停止できない', () => {
      const result = effectManager.stopEffect('nonexistent');

      expect(result).toBe(false);
    });

    test('全エフェクトを停止できる', () => {
      effectManager.playEffect('line-clear', {});
      effectManager.playEffect('t-spin', {});

      effectManager.stopAllEffects();

      expect(effectManager.activeEffects.size).toBe(0);
      expect(effectManager.effectQueue.length).toBe(0);
    });
  });

  describe('システム更新', () => {
    test('システムを更新できる', () => {
      effectManager.playEffect('line-clear', {});

      expect(() => effectManager.update(16.67)).not.toThrow();
    });

    test('エフェクト無効時は更新されない', () => {
      effectManager.config.enableEffects = false;

      expect(() => effectManager.update(16.67)).not.toThrow();
    });

    test('キューが処理される', () => {
      // 制限数までエフェクトを再生
      for (let i = 0; i < 5; i++) {
        effectManager.playEffect('line-clear', {});
      }

      // アクティブエフェクト数を確認（実際の数を確認）
      // console.log('Active effects:', effectManager.activeEffects.size);
      expect(effectManager.activeEffects.size).toBeGreaterThan(0);

      // キューに追加
      const queuedResult = effectManager.playEffect('t-spin', {});
      expect(queuedResult).toBe(false);
      expect(effectManager.effectQueue.length).toBe(1);

      // エフェクトを停止してキューを処理
      effectManager.stopEffect('line-clear');
      effectManager.update(16.67);

      expect(effectManager.effectQueue.length).toBe(0);
    });
  });

  describe('描画', () => {
    test('システムを描画できる', () => {
      effectManager.playEffect('line-clear', {});

      expect(() => effectManager.render()).not.toThrow();
    });

    test('エフェクト無効時は描画されない', () => {
      effectManager.config.enableEffects = false;

      expect(() => effectManager.render()).not.toThrow();
    });
  });

  describe('設定更新', () => {
    test('設定を更新できる', () => {
      effectManager.updateConfig({
        maxConcurrentEffects: 3,
        enableEffects: false,
      });

      expect(effectManager.config.maxConcurrentEffects).toBe(3);
      expect(effectManager.config.enableEffects).toBe(false);
    });
  });

  describe('統計情報', () => {
    test('統計情報を取得できる', () => {
      effectManager.playEffect('line-clear', {});

      const stats = effectManager.getStats();

      expect(stats.totalEffectsPlayed).toBe(1);
      expect(stats.activeEffectsCount).toBe(1);
      expect(stats.registeredEffects).toBe(effectManager.effects.size);
      expect(stats.particleSystemStats).toBeDefined();
      expect(stats.config).toBeDefined();
    });
  });

  describe('イベントシステム', () => {
    test('イベントリスナーを追加できる', () => {
      const callback = jest.fn();

      effectManager.addEventListener('effectStarted', callback);

      expect(effectManager.listeners.has('effectStarted')).toBe(true);
    });

    test('イベントリスナーを削除できる', () => {
      const callback = jest.fn();

      effectManager.addEventListener('effectStarted', callback);
      effectManager.removeEventListener('effectStarted', callback);

      expect(effectManager.listeners.get('effectStarted')).toEqual([]);
    });

    test('イベントが発火される', () => {
      const callback = jest.fn();

      effectManager.addEventListener('effectStarted', callback);
      effectManager.playEffect('line-clear', {});

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          effectName: 'line-clear',
          effect: expect.any(Object),
        })
      );
    });
  });

  describe('システム制御', () => {
    test('システムを開始できる', () => {
      expect(() => effectManager.start()).not.toThrow();
    });

    test('システムを停止できる', () => {
      effectManager.playEffect('line-clear', {});

      effectManager.stop();

      expect(effectManager.activeEffects.size).toBe(0);
    });

    test('システムをリセットできる', () => {
      effectManager.playEffect('line-clear', {});
      effectManager.reset();

      expect(effectManager.activeEffects.size).toBe(0);
      expect(effectManager.stats.totalEffectsPlayed).toBe(0);
    });
  });

  describe('妥当性検証', () => {
    test('システムの妥当性を検証できる', () => {
      expect(effectManager.validate()).toBe(true);
    });
  });

  describe('文字列表現', () => {
    test('文字列表現を取得できる', () => {
      effectManager.playEffect('line-clear', {});

      const str = effectManager.toString();

      expect(str).toContain('EffectManager');
      expect(str).toContain('2'); // registered effects
      expect(str).toContain('1'); // active effects
      expect(str).toContain('0'); // queued effects
    });
  });
});
