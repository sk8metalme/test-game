import ParticleEffect from '../../../src/core/usecases/ParticleEffect.js';

// ParticleEmitterのモック
const createMockEmitter = (name, config = {}) => ({
  name,
  position: config.position || { x: 0, y: 0 },
  start: jest.fn(),
  stop: jest.fn(),
  update: jest.fn(),
  reset: jest.fn(),
  isActive: jest.fn().mockReturnValue(config.active || false),
  getStats: jest.fn().mockReturnValue(config.stats || {}),
});

describe('ParticleEffect', () => {
  let effect;

  beforeEach(() => {
    effect = new ParticleEffect();
  });

  describe('初期化', () => {
    test('正常な設定でエフェクトが作成される', () => {
      const testEffect = new ParticleEffect({
        name: 'testEffect',
        duration: 1000,
        loop: true,
      });

      expect(effect.name).toBe('testEffect');
      expect(effect.duration).toBe(1000);
      expect(effect.loop).toBe(true);
      expect(effect.active).toBe(false);
    });

    test('デフォルト値が正しく設定される', () => {
      const effect = new ParticleEffect();

      expect(effect.name).toBe('unnamed');
      expect(effect.duration).toBe(-1);
      expect(effect.loop).toBe(false);
      expect(effect.active).toBe(false);
      expect(effect.emitters).toEqual([]);
      expect(effect.emitterMap).toBeInstanceOf(Map);
    });

    test('無効な設定値は適切に処理される', () => {
      const testEffect = new ParticleEffect({
        name: '',
        duration: -100,
        loop: null,
      });

      expect(effect.name).toBe('');
      expect(effect.duration).toBe(-100);
      expect(effect.loop).toBe(false);
    });
  });

  describe('ライフサイクル', () => {
    test('エフェクトが開始される', () => {
      const testEffect = new ParticleEffect({ duration: 1000 });
      const mockEmitter = createMockEmitter('test');
      effect.addEmitter(mockEmitter);

      const result = effect.start();

      expect(result).toBe(true);
      expect(effect.active).toBe(true);
      expect(effect.startTime).toBeGreaterThan(0);
      expect(mockEmitter.start).toHaveBeenCalled();
    });

    test('既にアクティブな場合は開始できない', () => {
      effect.start();
      const result = effect.start();

      expect(result).toBe(false);
    });

    test('エフェクトが停止される', () => {
      const mockEmitter = createMockEmitter('test');
      effect.addEmitter(mockEmitter);
      effect.start();

      const result = effect.stop();

      expect(result).toBe(true);
      expect(effect.active).toBe(false);
      expect(mockEmitter.stop).toHaveBeenCalled();
    });

    test('非アクティブな場合は停止できない', () => {
      const result = effect.stop();

      expect(result).toBe(false);
    });

    test('継続時間で自動停止される', () => {
      const testEffect = new ParticleEffect({ duration: 100 });
      const mockEmitter = createMockEmitter('test');
      effect.addEmitter(mockEmitter);
      effect.start();

      // 時間を進める
      const originalDateNow = Date.now;
      Date.now = jest.fn().mockReturnValue(effect.startTime + 150);

      effect.update(0.15);

      expect(effect.active).toBe(false);

      Date.now = originalDateNow;
    });

    test('ループ設定で自動再開始される', () => {
      const testEffect = new ParticleEffect({ duration: 100, loop: true });
      const mockEmitter = createMockEmitter('test');
      effect.addEmitter(mockEmitter);
      effect.start();

      // 時間を進める
      const originalDateNow = Date.now;
      Date.now = jest.fn().mockReturnValue(effect.startTime + 150);

      effect.update(0.15);

      expect(effect.active).toBe(true);
      expect(effect.currentLoop).toBe(1);

      Date.now = originalDateNow;
    });

    test('無限継続の場合は自動停止しない', () => {
      const testEffect = new ParticleEffect({ duration: -1 });
      const mockEmitter = createMockEmitter('test');
      effect.addEmitter(mockEmitter);
      effect.start();

      effect.update(1.0);

      expect(effect.active).toBe(true);
    });
  });

  describe('エミッター管理', () => {
    test('エミッターが追加される', () => {
      const emitter = createMockEmitter('test');

      effect.addEmitter(emitter);

      expect(effect.emitters).toContain(emitter);
      expect(effect.emitterMap.get('test')).toBe(emitter);
    });

    test('同じ名前のエミッターは追加できない', () => {
      const emitter1 = createMockEmitter('test');
      const emitter2 = createMockEmitter('test');

      effect.addEmitter(emitter1);

      expect(() => effect.addEmitter(emitter2)).toThrow(
        'ParticleEffect: エミッター名 "test" は既に存在します'
      );
    });

    test('無効なエミッターは追加できない', () => {
      expect(() => effect.addEmitter(null)).toThrow('ParticleEffect: 無効なエミッターです');

      expect(() => effect.addEmitter({})).toThrow('ParticleEffect: 無効なエミッターです');
    });

    test('エミッターが削除される（エミッターオブジェクト指定）', () => {
      const emitter = createMockEmitter('test');
      effect.addEmitter(emitter);

      const result = effect.removeEmitter(emitter);

      expect(result).toBe(true);
      expect(effect.emitters).not.toContain(emitter);
      expect(effect.emitterMap.get('test')).toBeUndefined();
    });

    test('エミッターが削除される（名前指定）', () => {
      const emitter = createMockEmitter('test');
      effect.addEmitter(emitter);

      const result = effect.removeEmitter('test');

      expect(result).toBe(true);
      expect(effect.emitters).not.toContain(emitter);
      expect(effect.emitterMap.get('test')).toBeUndefined();
    });

    test('存在しないエミッターの削除は失敗する', () => {
      const result = effect.removeEmitter('nonexistent');

      expect(result).toBe(false);
    });

    test('エミッターが取得される', () => {
      const emitter = createMockEmitter('test');
      effect.addEmitter(emitter);

      const result = effect.getEmitter('test');

      expect(result).toBe(emitter);
    });

    test('存在しないエミッターの取得はnullを返す', () => {
      const result = effect.getEmitter('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('設定管理', () => {
    test('設定が動的に更新される', () => {
      const effect = new ParticleEffect();

      effect.updateConfig({
        name: 'newName',
        duration: 2000,
        loop: true,
      });

      expect(effect.name).toBe('newName');
      expect(effect.duration).toBe(2000);
      expect(effect.loop).toBe(true);
    });

    test('設定の更新でチェーンできる', () => {
      const result = effect.updateConfig({ name: 'test' });

      expect(result).toBe(effect);
    });

    test('エフェクトがリセットされる', () => {
      const mockEmitter = createMockEmitter('test');
      effect.addEmitter(mockEmitter);
      effect.start();

      const result = effect.reset();

      expect(result).toBe(effect);
      expect(effect.active).toBe(false);
      expect(effect.startTime).toBe(0);
      expect(effect.elapsedTime).toBe(0);
      expect(effect.currentLoop).toBe(0);
      expect(mockEmitter.reset).toHaveBeenCalled();
    });
  });

  describe('状態確認', () => {
    test('アクティブ状態が正しく確認される', () => {
      expect(effect.isActive()).toBe(false);

      effect.start();
      expect(effect.isActive()).toBe(true);

      effect.stop();
      expect(effect.isActive()).toBe(false);
    });

    test('完了状態が正しく確認される', () => {
      const testEffect = new ParticleEffect({ duration: 100 });
      effect.start();

      expect(effect.isFinished()).toBe(false);

      // 時間を進める
      const originalDateNow = Date.now;
      Date.now = jest.fn().mockReturnValue(effect.startTime + 150);

      effect.update(0.15);

      expect(effect.isFinished()).toBe(true);

      Date.now = originalDateNow;
    });

    test('無限継続の場合は完了しない', () => {
      const testEffect = new ParticleEffect({ duration: -1 });
      effect.start();

      expect(effect.isFinished()).toBe(false);
    });

    test('進行状況が正しく計算される', () => {
      const testEffect = new ParticleEffect({ duration: 100 });
      effect.start();

      expect(effect.getProgress()).toBe(0);

      // 時間を進める
      const originalDateNow = Date.now;
      Date.now = jest.fn().mockReturnValue(effect.startTime + 50);

      effect.update(0.05);

      expect(effect.getProgress()).toBe(0.5);

      Date.now = originalDateNow;
    });

    test('進行状況は1.0を超えない', () => {
      const testEffect = new ParticleEffect({ duration: 100 });
      effect.start();

      // 時間を進める
      const originalDateNow = Date.now;
      Date.now = jest.fn().mockReturnValue(effect.startTime + 150);

      effect.update(0.15);

      expect(effect.getProgress()).toBe(1.0);

      Date.now = originalDateNow;
    });
  });

  describe('統計・情報', () => {
    test('統計情報が正しく取得される', () => {
      const stats = effect.getStats();

      expect(stats).toHaveProperty('active');
      expect(stats).toHaveProperty('elapsedTime');
      expect(stats).toHaveProperty('progress');
      expect(stats).toHaveProperty('emitterCount');
      expect(stats).toHaveProperty('totalRuns');
      expect(stats).toHaveProperty('totalDuration');
      expect(stats).toHaveProperty('averageDuration');
      expect(stats).toHaveProperty('lastRunDuration');
    });

    test('エミッター統計が正しく取得される', () => {
      const emitter1 = createMockEmitter('test1');
      const emitter2 = createMockEmitter('test2');
      effect.addEmitter(emitter1);
      effect.addEmitter(emitter2);

      const emitterStats = effect.getEmitterStats();

      expect(emitterStats).toHaveLength(2);
      expect(emitterStats[0]).toHaveProperty('name', 'test1');
      expect(emitterStats[1]).toHaveProperty('name', 'test2');
    });

    test('実行統計が正しく更新される', () => {
      const testEffect = new ParticleEffect({ duration: 100 });
      effect.start();

      // 時間を進める
      const originalDateNow = Date.now;
      Date.now = jest.fn().mockReturnValue(effect.startTime + 100);

      effect.update(0.1);

      const stats = effect.getStats();
      expect(stats.totalRuns).toBe(1);
      expect(stats.lastRunDuration).toBe(100);
      expect(stats.averageDuration).toBe(100);

      Date.now = originalDateNow;
    });
  });

  describe('エラー処理', () => {
    test('無効なエミッターの追加でエラーが発生する', () => {
      expect(() => effect.addEmitter(null)).toThrow();
      expect(() => effect.addEmitter(undefined)).toThrow();
      expect(() => effect.addEmitter({})).toThrow();
      expect(() => effect.addEmitter({ name: 123 })).toThrow();
    });

    test('無効なエミッターの削除は安全に処理される', () => {
      const result = effect.removeEmitter(null);
      expect(result).toBe(false);

      const result2 = effect.removeEmitter('nonexistent');
      expect(result2).toBe(false);
    });
  });

  describe('パフォーマンス', () => {
    test('大量エミッターでの動作', () => {
      const emitterCount = 100;
      const emitters = [];

      for (let i = 0; i < emitterCount; i++) {
        const emitter = createMockEmitter(`emitter${i}`);
        emitters.push(emitter);
        effect.addEmitter(emitter);
      }

      expect(effect.emitters).toHaveLength(emitterCount);
      expect(effect.emitterMap.size).toBe(emitterCount);

      // 全エミッターの検索が高速
      const startTime = performance.now();
      for (let i = 0; i < emitterCount; i++) {
        effect.getEmitter(`emitter${i}`);
      }
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(10); // 10ms以内
    });

    test('長時間実行での安定性', () => {
      const testEffect = new ParticleEffect({ duration: -1, loop: true });
      const mockEmitter = createMockEmitter('test');
      effect.addEmitter(mockEmitter);
      effect.start();

      // 長時間の更新をシミュレート
      for (let i = 0; i < 1000; i++) {
        effect.update(0.016); // 60FPS
      }

      expect(effect.active).toBe(true);
      expect(effect.currentLoop).toBe(0); // 無限継続なのでループしない
    });
  });

  describe('統合テスト', () => {
    test('ParticleEmitterとの連携', () => {
      const mockEmitter = createMockEmitter('test', {
        active: true,
        stats: { totalEmitted: 10 },
      });
      effect.addEmitter(mockEmitter);

      effect.start();
      expect(mockEmitter.start).toHaveBeenCalled();

      effect.update(0.016);
      expect(mockEmitter.update).toHaveBeenCalledWith(0.016);

      effect.stop();
      expect(mockEmitter.stop).toHaveBeenCalled();
    });

    test('複数エミッターの同時制御', () => {
      const emitter1 = createMockEmitter('emitter1');
      const emitter2 = createMockEmitter('emitter2');
      const emitter3 = createMockEmitter('emitter3');

      effect.addEmitter(emitter1);
      effect.addEmitter(emitter2);
      effect.addEmitter(emitter3);

      effect.start();
      expect(emitter1.start).toHaveBeenCalled();
      expect(emitter2.start).toHaveBeenCalled();
      expect(emitter3.start).toHaveBeenCalled();

      effect.update(0.016);
      expect(emitter1.update).toHaveBeenCalledWith(0.016);
      expect(emitter2.update).toHaveBeenCalledWith(0.016);
      expect(emitter3.update).toHaveBeenCalledWith(0.016);

      effect.stop();
      expect(emitter1.stop).toHaveBeenCalled();
      expect(emitter2.stop).toHaveBeenCalled();
      expect(emitter3.stop).toHaveBeenCalled();
    });
  });
});
