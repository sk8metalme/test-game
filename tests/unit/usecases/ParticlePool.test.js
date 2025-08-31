import ParticlePool from '../../../src/core/usecases/ParticlePool';
import { Particle } from '../../../src/core/entities/Particle';
import ObjectPool from '../../../src/core/usecases/ObjectPool';

// ObjectPoolのモックを無効化して実際のクラスを使用
jest.unmock('../../../src/core/usecases/ObjectPool');

describe('ParticlePool', () => {
  let particlePool;

  beforeEach(() => {
    // ParticlePoolのインスタンスを作成
    particlePool = new ParticlePool();

    // 必要なメソッドをモック
    particlePool.getStats = jest.fn().mockReturnValue({
      poolSize: 0,
      activeCount: 0,
      totalCreated: 0,
      utilization: 0,
      memoryEfficiency: 1,
    });
    particlePool.resize = jest.fn();
  });

  describe('初期化', () => {
    test('デフォルト設定で正しく初期化される', () => {
      expect(particlePool).toBeDefined();
      expect(particlePool.particleConfig).toEqual({});
      expect(particlePool.particleType).toBe('default');
      expect(particlePool._autoOptimizeEnabled).toBe(true);
      expect(particlePool.optimizationThreshold).toBe(0.8);
      expect(particlePool.cleanupInterval).toBe(5000);
    });

    test('カスタム設定で正しく初期化される', () => {
      const config = {
        initialSize: 50,
        maxSize: 500,
        particleConfig: { size: 5, color: '#ff0000' },
        particleType: 'explosion',
        autoOptimize: false,
        optimizationThreshold: 0.9,
        cleanupInterval: 3000,
      };

      const customParticlePool = new ParticlePool(config);

      expect(customParticlePool.particleConfig).toEqual(config.particleConfig);
      expect(customParticlePool.particleType).toBe(config.particleType);
      expect(customParticlePool._autoOptimizeEnabled).toBe(config.autoOptimize);
      expect(customParticlePool.optimizationThreshold).toBe(config.optimizationThreshold);
      expect(customParticlePool.cleanupInterval).toBe(config.cleanupInterval);
    });

    test('ObjectPoolが正しく継承される', () => {
      // ObjectPoolのメソッドが利用可能であることを確認
      expect(typeof particlePool.acquire).toBe('function');
      expect(typeof particlePool.release).toBe('function');
      expect(typeof particlePool.getStats).toBe('function');
    });

    test('パーティクル固有の設定が適用される', () => {
      expect(particlePool.particleStats).toEqual({
        totalEmitted: 0,
        totalRecycled: 0,
        averageLifeTime: 0,
        peakActiveCount: 0,
      });
    });
  });

  describe('パーティクル管理', () => {
    test('createParticleでパーティクルが正しく作成される', () => {
      const mockParticle = new Particle();
      const mockConfig = { size: 5, color: '#ff0000' };

      particlePool.acquire = jest.fn().mockReturnValue(mockParticle);
      mockParticle.updateConfig = jest.fn();

      const result = particlePool.createParticle(mockConfig);

      expect(particlePool.acquire).toHaveBeenCalled();
      expect(mockParticle.updateConfig).toHaveBeenCalledWith(mockConfig);
      expect(result).toBe(mockParticle);
      expect(particlePool.particleStats.totalEmitted).toBe(1);
    });

    test('createParticleで設定なしでも正しく動作する', () => {
      const mockParticle = new Particle();
      particlePool.acquire = jest.fn().mockReturnValue(mockParticle);
      mockParticle.updateConfig = jest.fn();

      const result = particlePool.createParticle();

      expect(particlePool.acquire).toHaveBeenCalled();
      expect(mockParticle.updateConfig).not.toHaveBeenCalled();
      expect(result).toBe(mockParticle);
    });

    test('resetParticleでパーティクルが正しくリセットされる', () => {
      const mockParticle = new Particle();
      particlePool.release = jest.fn();

      particlePool.resetParticle(mockParticle);

      expect(particlePool.release).toHaveBeenCalledWith(mockParticle);
      expect(particlePool.particleStats.totalRecycled).toBe(1);
    });

    test('resetParticleで無効なパーティクルは安全に処理される', () => {
      particlePool.release = jest.fn();

      particlePool.resetParticle(null);
      particlePool.resetParticle(undefined);

      expect(particlePool.release).not.toHaveBeenCalled();
    });

    test('emitParticlesで指定された数のパーティクルが発射される', () => {
      const mockParticle = new Particle();
      particlePool.createParticle = jest.fn().mockReturnValue(mockParticle);

      const result = particlePool.emitParticles(5, { size: 3 });

      expect(particlePool.createParticle).toHaveBeenCalledTimes(5);
      expect(particlePool.createParticle).toHaveBeenCalledWith({ size: 3 });
      expect(result).toHaveLength(5);
      expect(result).toEqual([
        mockParticle,
        mockParticle,
        mockParticle,
        mockParticle,
        mockParticle,
      ]);
    });
  });

  describe('統計・監視', () => {
    test('getPoolStatsで基本統計が正しく取得される', () => {
      const mockStats = {
        poolSize: 100,
        activeCount: 50,
        totalCreated: 200,
        utilization: 0.5,
        memoryEfficiency: 0.8,
      };

      // getStatsメソッドを直接モック
      particlePool.getStats = jest.fn().mockReturnValue(mockStats);

      const result = particlePool.getPoolStats();

      expect(particlePool.getStats).toHaveBeenCalled();
      expect(result).toEqual({
        ...mockStats,
        particleStats: { ...particlePool.particleStats },
        particleType: particlePool.particleType,
        autoOptimize: particlePool._autoOptimizeEnabled,
        optimizationThreshold: particlePool.optimizationThreshold,
        lastCleanup: particlePool._lastCleanup,
      });
    });

    test('getActiveParticlesでアクティブなパーティクルが正しく取得される', () => {
      const mockParticle = new Particle();
      mockParticle.isActive = jest.fn().mockReturnValue(true);

      // プールの状態をモック
      particlePool.pool = [mockParticle];
      particlePool.activeCount = 1;

      const result = particlePool.getActiveParticles();

      expect(result).toHaveLength(1);
      expect(result[0]).toBe(mockParticle);
    });

    test('パーティクル統計が正しく更新される', () => {
      const mockParticle = new Particle();
      mockParticle._lastUpdateTime = Date.now() - 1000; // 1秒前

      particlePool.release = jest.fn();

      particlePool.resetParticle(mockParticle);

      expect(particlePool.particleStats.totalRecycled).toBe(1);
      expect(particlePool.particleStats.averageLifeTime).toBeGreaterThan(0);
    });
  });

  describe('最適化', () => {
    test('optimizePoolで使用率が高い場合のプール拡張', () => {
      const mockStats = {
        utilization: 0.9, // 90%の使用率
        memoryEfficiency: 0.3,
      };

      // getStatsメソッドを直接モック
      particlePool.getStats = jest.fn().mockReturnValue(mockStats);
      particlePool.maxSize = 1000;

      particlePool.optimizePool();

      // 実際の計算: Math.min(1000, Math.ceil(1000 * 1.5)) = Math.min(1000, 1500) = 1000
      expect(particlePool.resize).toHaveBeenCalledWith(1000);
    });

    test('optimizePoolでメモリ効率が低い場合のプール調整', () => {
      const mockStats = {
        utilization: 0.5,
        memoryEfficiency: 0.05, // 5%のメモリ効率
      };

      particlePool.getStats = jest.fn().mockReturnValue(mockStats);
      particlePool.maxSize = 1000;
      particlePool.activeCount = 100;

      particlePool.optimizePool();

      // 実際の計算: Math.max(100 + 10, Math.ceil(1000 * 0.7)) = Math.max(110, 700) = 700
      expect(particlePool.resize).toHaveBeenCalledWith(700);
    });

    test('autoOptimizeで自動最適化のタイミング制御', () => {
      const now = Date.now();
      particlePool._lastCleanup = now - 6000; // 6秒前（5秒間隔を超えている）

      // getStatsメソッドをモックして、resizeが呼ばれる条件を満たす
      particlePool.getStats = jest.fn().mockReturnValue({
        utilization: 0.9, // 90%の使用率（閾値0.8を超える）
        memoryEfficiency: 0.3,
      });
      particlePool.maxSize = 1000;

      // autoOptimizeメソッドを直接呼び出し
      particlePool.autoOptimize();

      expect(particlePool.getStats).toHaveBeenCalled();
      expect(particlePool.resize).toHaveBeenCalled();
    });

    test('autoOptimizeで最適化間隔内では実行されない', () => {
      const now = Date.now();
      particlePool._lastCleanup = now - 2000; // 2秒前（5秒間隔内）

      // autoOptimizeメソッドを直接呼び出し
      particlePool.autoOptimize();

      expect(particlePool.getStats).not.toHaveBeenCalled();
      expect(particlePool.resize).not.toHaveBeenCalled();
    });

    test('cleanupDeadParticlesで死亡パーティクルの自動検出', () => {
      const mockParticle = new Particle();
      mockParticle.isDead = jest.fn().mockReturnValue(true);

      // getActiveParticlesをモック
      particlePool.getActiveParticles = jest.fn().mockReturnValue([mockParticle]);
      particlePool.resetParticle = jest.fn();

      const result = particlePool.cleanupDeadParticles();

      expect(particlePool.getActiveParticles).toHaveBeenCalled();
      expect(particlePool.resetParticle).toHaveBeenCalledWith(mockParticle);
      expect(result).toBe(1);
    });
  });

  describe('境界値テスト', () => {
    test('極端に大きな値での動作', () => {
      const config = {
        initialSize: 10000,
        maxSize: 50000,
        optimizationThreshold: 0.99,
        cleanupInterval: 60000,
      };

      const largeParticlePool = new ParticlePool(config);

      expect(largeParticlePool.optimizationThreshold).toBe(0.99);
      expect(largeParticlePool.cleanupInterval).toBe(60000);
    });

    test('極端に小さな値での動作', () => {
      const config = {
        initialSize: 1,
        maxSize: 5,
        optimizationThreshold: 0.1,
        cleanupInterval: 1000,
      };

      const smallParticlePool = new ParticlePool(config);

      expect(smallParticlePool.optimizationThreshold).toBe(0.1);
      expect(smallParticlePool.cleanupInterval).toBe(1000);
    });
  });

  describe('エラーハンドリング', () => {
    test('無効な設定値での安全な処理', () => {
      const config = {
        optimizationThreshold: -1, // 無効な値
        cleanupInterval: 0, // 無効な値
      };

      const particlePool = new ParticlePool(config);

      // デフォルト値が適用されることを確認
      expect(particlePool.optimizationThreshold).toBe(0.1); // Math.max(-1, 0.1) = 0.1
      expect(particlePool.cleanupInterval).toBe(5000); // Math.max(1000, Math.min(60000, 5000)) = 5000
    });

    test('存在しないリソースへのアクセス', () => {
      // 存在しないパーティクルへのアクセス
      expect(() => particlePool.resetParticle(null)).not.toThrow();
      expect(() => particlePool.resetParticle(undefined)).not.toThrow();
    });
  });

  describe('パフォーマンス', () => {
    test('大量パーティクルの効率的な処理', () => {
      const startTime = Date.now();

      // 1000個のパーティクルを発射
      const particles = particlePool.emitParticles(1000);

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(particles).toHaveLength(1000);
      expect(processingTime).toBeLessThan(100); // 100ms以内で処理されることを期待
    });
  });
});
