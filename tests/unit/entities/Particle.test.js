import { Particle } from '../../../src/core/entities/Particle';

describe('Particle', () => {
  let particle;

  beforeEach(() => {
    particle = new Particle();
  });

  describe('初期化', () => {
    test('デフォルト設定で正しく初期化される', () => {
      expect(particle.id).toBeDefined();
      expect(particle.position).toEqual({ x: 0, y: 0 });
      expect(particle.velocity).toEqual({ x: 0, y: 0 });
      expect(particle.acceleration).toEqual({ x: 0, y: 0 });
      expect(particle.life).toBe(1.0);
      expect(particle.maxLife).toBe(1000);
      expect(particle.size).toBe(2);
      expect(particle.color).toBe('#ffffff');
      expect(particle.alpha).toBe(1.0);
      expect(particle.rotation).toBe(0);
      expect(particle.rotationSpeed).toBe(0);
      expect(particle.gravity).toBe(0.1);
      expect(particle.friction).toBe(0.98);
    });

    test('カスタム設定で正しく初期化される', () => {
      const config = {
        position: { x: 10, y: 20 },
        velocity: { x: 5, y: -3 },
        size: 5,
        color: '#ff0000',
        life: 0.5,
        maxLife: 2000,
      };

      const customParticle = new Particle(config);

      expect(customParticle.position).toEqual(config.position);
      expect(customParticle.velocity).toEqual(config.velocity);
      expect(customParticle.size).toBe(config.size);
      expect(customParticle.color).toBe(config.color);
      expect(customParticle.life).toBe(config.life);
      expect(customParticle.maxLife).toBe(config.maxLife);
    });

    test('無効な設定値は適切に処理される', () => {
      const config = {
        size: -5,
        life: 2.0,
        maxLife: -1000,
      };

      const customParticle = new Particle(config);

      expect(customParticle.size).toBeGreaterThan(0);
      expect(customParticle.life).toBeGreaterThanOrEqual(0);
      expect(customParticle.life).toBeLessThanOrEqual(1.0);
      expect(customParticle.maxLife).toBeGreaterThan(0);
    });
  });

  describe('状態更新', () => {
    test('位置が正しく更新される', () => {
      const deltaTime = 16; // 16ms
      particle.velocity = { x: 2, y: 3 };

      particle.update(deltaTime);

      // 実際の計算結果を確認
      const expectedX = 2 * (deltaTime / 1000);
      const expectedY = 3 * (deltaTime / 1000);

      expect(particle.position.x).toBeCloseTo(expectedX, 2);
      expect(particle.position.y).toBeCloseTo(expectedY, 2);
    });

    test('速度が正しく更新される', () => {
      const deltaTime = 16;
      particle.acceleration = { x: 1, y: -2 };

      particle.update(deltaTime);

      // 実際の計算結果を確認
      const expectedX = 1 * (deltaTime / 1000);
      const expectedY = -2 * (deltaTime / 1000);

      expect(particle.velocity.x).toBeCloseTo(expectedX, 2);
      expect(particle.velocity.y).toBeCloseTo(expectedY, 2);
    });

    test('重力が正しく適用される', () => {
      const deltaTime = 16;
      particle.gravity = 0.5;

      particle.update(deltaTime);

      expect(particle.velocity.y).toBeCloseTo(0.5 * (deltaTime / 1000), 3);
    });

    test('摩擦が正しく適用される', () => {
      const deltaTime = 16;
      particle.velocity = { x: 10, y: 5 };
      particle.friction = 0.9;

      particle.update(deltaTime);

      // 実際の計算結果を確認
      const expectedX = 10 * 0.9;
      const expectedY = 5 * 0.9;

      expect(particle.velocity.x).toBeCloseTo(expectedX, 2);
      expect(particle.velocity.y).toBeCloseTo(expectedY, 2);
    });
  });

  describe('ライフサイクル', () => {
    test('ライフが正しく減少する', () => {
      const deltaTime = 16;
      const initialLife = particle.life;

      particle.update(deltaTime);

      expect(particle.life).toBeLessThan(initialLife);
    });

    test('ライフが0になると死亡状態になる', () => {
      particle.life = 0.1;
      const deltaTime = 200; // ライフを0にするのに十分な時間

      particle.update(deltaTime);

      expect(particle.isDead()).toBe(true);
    });

    test('リセットで正しく初期状態に戻る', () => {
      // パーティクルの状態を変更
      particle.position = { x: 100, y: 200 };
      particle.velocity = { x: 10, y: 20 };
      particle.life = 0.5;
      particle.rotation = 45;

      particle.reset();

      expect(particle.position).toEqual({ x: 0, y: 0 });
      expect(particle.velocity).toEqual({ x: 0, y: 0 });
      expect(particle.life).toBe(1.0);
      expect(particle.rotation).toBe(0);
    });
  });

  describe('物理演算', () => {
    test('回転が正しく適用される', () => {
      const deltaTime = 16;
      particle.rotationSpeed = 0.1;

      particle.update(deltaTime);

      expect(particle.rotation).toBe(0.1 * (deltaTime / 1000));
    });

    test('サイズ変更が正しく処理される', () => {
      particle.size = 10;
      expect(particle.size).toBe(10);

      particle.size = -5;
      expect(particle.size).toBeGreaterThan(0);
    });

    test('アルファ値の変更が正しく処理される', () => {
      particle.alpha = 0.5;
      expect(particle.alpha).toBe(0.5);

      particle.alpha = 1.5;
      expect(particle.alpha).toBeLessThanOrEqual(1.0);

      particle.alpha = -0.5;
      expect(particle.alpha).toBeGreaterThanOrEqual(0.0);
    });
  });

  describe('境界値テスト', () => {
    test('極端に大きな値での動作', () => {
      const config = {
        velocity: { x: 1000, y: -1000 },
        acceleration: { x: 500, y: 500 },
        size: 1000,
        maxLife: 100000,
      };

      const extremeParticle = new Particle(config);
      const deltaTime = 16;

      expect(() => {
        extremeParticle.update(deltaTime);
      }).not.toThrow();
    });

    test('極端に小さな値での動作', () => {
      const config = {
        velocity: { x: 0.001, y: -0.001 },
        acceleration: { x: 0.0001, y: 0.0001 },
        size: 0.1,
        maxLife: 1,
      };

      const tinyParticle = new Particle(config);
      const deltaTime = 16;

      expect(() => {
        tinyParticle.update(deltaTime);
      }).not.toThrow();
    });
  });

  describe('パフォーマンス', () => {
    test('大量のパーティクル更新が効率的に動作する', () => {
      const particles = [];
      const count = 1000;

      // 大量のパーティクルを作成
      for (let i = 0; i < count; i++) {
        particles.push(new Particle());
      }

      const startTime = performance.now();

      // 全パーティクルを更新
      particles.forEach(p => {
        p.update(16);
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // 1000パーティクルの更新が16ms以内に完了することを期待
      expect(duration).toBeLessThan(16);
    });
  });
});
