import ParticleEmitter from '../../../src/core/usecases/ParticleEmitter';

// ParticlePoolのモック
jest.mock('../../../src/core/usecases/ParticlePool');

describe('ParticleEmitter', () => {
  let particleEmitter;
  let mockParticlePool;

  beforeEach(() => {
    // ParticlePoolのモックをリセット
    jest.clearAllMocks();

    // モックParticlePoolの設定
    mockParticlePool = {
      createParticle: jest.fn(),
      resetParticle: jest.fn(),
      getActiveCount: jest.fn().mockReturnValue(0),
    };

    // モックパーティクルの作成
    const createMockParticle = (config = {}) => ({
      position: { x: config.x || 0, y: config.y || 0 },
      updateConfig: jest.fn(),
      ...config,
    });

    mockParticlePool.createParticle.mockImplementation(() => createMockParticle());

    // ParticleEmitterのインスタンスを作成
    particleEmitter = new ParticleEmitter({
      name: 'testEmitter',
      particleConfig: {
        size: 5,
        color: '#ff0000',
        life: 1000,
      },
      emissionRate: 10,
      burstCount: 5,
      duration: 2000,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('初期化', () => {
    test('設定が正しく適用される', () => {
      expect(particleEmitter.name).toBe('testEmitter');
      expect(particleEmitter.particleConfig).toEqual({
        size: 5,
        color: '#ff0000',
        life: 1000,
      });
      expect(particleEmitter.emissionRate).toBe(10);
      expect(particleEmitter.burstCount).toBe(5);
      expect(particleEmitter.duration).toBe(2000);
      expect(particleEmitter.active).toBe(true);
    });

    test('デフォルト値が適切に設定される', () => {
      const defaultEmitter = new ParticleEmitter({ name: 'default' });

      expect(defaultEmitter.emissionRate).toBe(10);
      expect(defaultEmitter.burstCount).toBe(1);
      expect(defaultEmitter.duration).toBe(-1);
      expect(defaultEmitter.active).toBe(true);
    });

    test('無効な設定値は適切に処理される', () => {
      const emitter = new ParticleEmitter({
        name: 'invalid',
        emissionRate: -5,
        burstCount: 0,
        duration: -100,
      });

      expect(emitter.emissionRate).toBe(1);
      expect(emitter.burstCount).toBe(1);
      expect(emitter.duration).toBe(-100); // 負の値は許可（-1で無限を意味）
    });
  });

  describe('パーティクル発射', () => {
    test('指定された数のパーティクルが発射される', () => {
      const particles = particleEmitter.emit({ x: 100, y: 100 }, 3, mockParticlePool);

      expect(particles).toHaveLength(3);
      expect(mockParticlePool.createParticle).toHaveBeenCalledTimes(3);
    });

    test('発射率が正しく制御される', () => {
      const emitter = new ParticleEmitter({
        name: 'rateTest',
        emissionRate: 5,
        burstCount: 15, // burstCountを大きくして制限しないようにする
      });

      const particles = emitter.emit({ x: 0, y: 0 }, 10, mockParticlePool);

      // 発射率5の場合、10個のパーティクルを発射
      expect(particles).toHaveLength(10);
    });

    test('バースト発射が正しく動作する', () => {
      const emitter = new ParticleEmitter({
        name: 'burstTest',
        burstCount: 8,
      });

      const particles = emitter.emit({ x: 0, y: 0 }, 10, mockParticlePool);

      // burstCountが8の場合、10個要求しても8個しか発射されない
      expect(particles).toHaveLength(8);
    });

    test('継続発射が正しく動作する', () => {
      const emitter = new ParticleEmitter({
        name: 'continuous',
        emissionRate: 2,
        duration: 1000,
      });

      // 継続発射のテスト
      const particles1 = emitter.emit({ x: 0, y: 0 }, 1, mockParticlePool);
      const particles2 = emitter.emit({ x: 0, y: 0 }, 1, mockParticlePool);

      expect(particles1).toHaveLength(1);
      expect(particles2).toHaveLength(1);
    });

    test('位置が正しく設定される', () => {
      const position = { x: 150, y: 200 };
      const mockParticle = {
        position: { x: 0, y: 0 },
        updateConfig: jest.fn(),
      };

      mockParticlePool.createParticle.mockReturnValue(mockParticle);

      particleEmitter.emit(position, 1, mockParticlePool);

      expect(mockParticle.position.x).toBe(position.x);
      expect(mockParticle.position.y).toBe(position.y);
    });

    test('パーティクル設定が正しく適用される', () => {
      const mockParticle = {
        position: { x: 0, y: 0 },
        updateConfig: jest.fn(),
      };

      mockParticlePool.createParticle.mockReturnValue(mockParticle);

      particleEmitter.emit({ x: 0, y: 0 }, 1, mockParticlePool);

      expect(mockParticle.updateConfig).toHaveBeenCalledWith({
        size: 5,
        color: '#ff0000',
        life: 1000,
      });
    });
  });

  describe('ライフサイクル', () => {
    test('指定された時間で自動停止する', () => {
      const emitter = new ParticleEmitter({
        name: 'autoStop',
        duration: 100,
      });

      // エミッターの開始時間をリセット
      emitter.startTime = 0;

      // 時間を進める（Date.nowをモック）
      const dateNowSpy = jest.spyOn(Date, 'now').mockReturnValueOnce(150); // updateで呼ばれる

      emitter.update(0.1);

      expect(emitter.active).toBe(false);

      // モックを復元
      dateNowSpy.mockRestore();
    });

    test('手動停止が正しく動作する', () => {
      particleEmitter.stop();

      expect(particleEmitter.active).toBe(false);
    });

    test('再開が正しく動作する', () => {
      particleEmitter.stop();
      particleEmitter.start();

      expect(particleEmitter.active).toBe(true);
    });

    test('無限継続エミッターは自動停止しない', () => {
      const infiniteEmitter = new ParticleEmitter({
        name: 'infinite',
        duration: -1,
      });

      // エミッターの開始時間をリセット
      infiniteEmitter.startTime = 0;

      // 時間を進める
      const dateNowSpy = jest.spyOn(Date, 'now').mockReturnValueOnce(10000); // updateで呼ばれる

      infiniteEmitter.update(0.1);

      expect(infiniteEmitter.active).toBe(true);

      // モックを復元
      dateNowSpy.mockRestore();
    });
  });

  describe('設定変更', () => {
    test('発射率の動的変更が可能', () => {
      particleEmitter.setEmissionRate(20);

      expect(particleEmitter.emissionRate).toBe(20);
    });

    test('パーティクル設定の動的変更が可能', () => {
      const newConfig = { size: 10, color: '#00ff00' };

      particleEmitter.updateParticleConfig(newConfig);

      expect(particleEmitter.particleConfig.size).toBe(10);
      expect(particleEmitter.particleConfig.color).toBe('#00ff00');
      expect(particleEmitter.particleConfig.life).toBe(1000); // 既存の設定は保持
    });

    test('無効な設定値は適切に処理される', () => {
      particleEmitter.setEmissionRate(-10);
      particleEmitter.setBurstCount(0);

      expect(particleEmitter.emissionRate).toBe(1);
      expect(particleEmitter.burstCount).toBe(1);
    });
  });

  describe('エラー処理', () => {
    test('無効な位置での発射は安全に処理される', () => {
      const particles = particleEmitter.emit(null, 1, mockParticlePool);

      expect(particles).toEqual([]);
    });

    test('無効なカウントでの発射は安全に処理される', () => {
      const particles = particleEmitter.emit({ x: 0, y: 0 }, -5, mockParticlePool);

      expect(particles).toEqual([]);
    });

    test('ParticlePoolが提供されない場合の処理', () => {
      const particles = particleEmitter.emit({ x: 0, y: 0 }, 1);

      expect(particles).toEqual([]);
    });
  });

  describe('パフォーマンス', () => {
    test('大量パーティクルの発射が効率的に処理される', () => {
      const startTime = performance.now();

      particleEmitter.emit({ x: 0, y: 0 }, 1000, mockParticlePool);

      const endTime = performance.now();
      const duration = endTime - startTime;

      // 1000個のパーティクル発射が100ms以内に完了することを期待
      expect(duration).toBeLessThan(100);
    });

    test('非アクティブなエミッターは発射しない', () => {
      particleEmitter.stop();

      const particles = particleEmitter.emit({ x: 0, y: 0 }, 10, mockParticlePool);

      expect(particles).toEqual([]);
      expect(mockParticlePool.createParticle).not.toHaveBeenCalled();
    });
  });

  describe('統計情報', () => {
    test('発射統計が正しく追跡される', () => {
      particleEmitter.emit({ x: 0, y: 0 }, 5, mockParticlePool);
      particleEmitter.emit({ x: 10, y: 10 }, 3, mockParticlePool);

      expect(particleEmitter.getStats().totalEmitted).toBe(8);
    });

    test('アクティブ時間が正しく計算される', () => {
      const emitter = new ParticleEmitter({
        name: 'timeTest',
        duration: 1000,
      });

      // エミッターの開始時間をリセット
      emitter.startTime = 0;

      // 時間を進める
      const dateNowSpy = jest.spyOn(Date, 'now').mockReturnValueOnce(500); // updateで呼ばれる

      emitter.update(0.1);

      expect(emitter.getStats().activeTime).toBe(500);

      // モックを復元
      dateNowSpy.mockRestore();
    });
  });
});
