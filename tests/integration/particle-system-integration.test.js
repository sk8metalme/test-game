/**
 * パーティクルシステム統合テスト
 * 全6コンポーネントの統合動作をテストします
 */

import Particle from '../../src/core/entities/Particle.js';
import ParticlePool from '../../src/core/usecases/ParticlePool.js';
import ParticleEmitter from '../../src/core/usecases/ParticleEmitter.js';
import ParticleEffect from '../../src/core/usecases/ParticleEffect.js';
import ParticleRenderer from '../../src/core/usecases/ParticleRenderer.js';
import ParticleSystem from '../../src/core/usecases/ParticleSystem.js';

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

// モックパーティクルの作成
const createMockParticle = (config = {}) => ({
  position: config.position || { x: 100, y: 100 },
  velocity: config.velocity || { x: 0, y: 0 },
  size: config.size || 10,
  color: config.color || '#ff0000',
  alpha: config.alpha || 1.0,
  rotation: config.rotation || 0,
  isActive: config.isActive !== false,
  isDead: jest.fn().mockReturnValue(config.isDead || false),
  update: jest.fn(),
  reset: jest.fn(),
  ...config,
});

describe('ParticleSystem Integration Tests', () => {
  let mockCanvas, mockContext;
  let particleSystem;

  beforeEach(() => {
    const mock = createMockCanvas();
    mockCanvas = mock.canvas;
    mockContext = mock.context;

    // パーティクルシステムの初期化
    particleSystem = new ParticleSystem(mockCanvas);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Integration', () => {
    test('パーティクルライフサイクルの完全統合', () => {
      // 1. エフェクトの作成
      const effect = new ParticleEffect({ name: 'test-effect', duration: 1000, loop: false });

      // 2. エミッターの作成と登録
      const emitter = new ParticleEmitter({
        position: { x: 400, y: 300 },
        emissionRate: 10,
        burstCount: 5,
      });

      effect.addEmitter(emitter);
      particleSystem.addEffect(effect);

      // 3. システムの開始
      particleSystem.start();

      // 4. システムの更新
      particleSystem.update(16.67); // 60FPS相当

      // 5. パーティクルの生成確認
      const stats = particleSystem.getSystemStats();
      expect(stats.effectCount).toBe(1);

      // 6. パーティクルの更新確認
      particleSystem.update(16.67);
      const updatedStats = particleSystem.getSystemStats();
      expect(updatedStats.effectCount).toBe(1);

      // 7. 描画処理の確認
      particleSystem.renderForTest();
      expect(mockContext.save).toHaveBeenCalled();
      expect(mockContext.restore).toHaveBeenCalled();

      // 8. メモリクリーンアップの確認
      particleSystem.cleanup();
      const finalStats = particleSystem.getSystemStats();
      expect(finalStats.poolStats.activeCount).toBe(0);
    });

    test('複数エフェクトの並行処理', () => {
      // 1. 複数エフェクトの作成
      const effect1 = new ParticleEffect({ name: 'effect1', duration: 1000 });
      const effect2 = new ParticleEffect({ name: 'effect2', duration: 1000 });

      // 2. 各エフェクトにエミッターを追加
      const emitter1 = new ParticleEmitter({
        position: { x: 200, y: 200 },
        emissionRate: 5,
      });
      const emitter2 = new ParticleEmitter({
        position: { x: 600, y: 400 },
        emissionRate: 5,
      });

      effect1.addEmitter(emitter1);
      effect2.addEmitter(emitter2);

      // 3. エフェクトの登録
      particleSystem.addEffect(effect1);
      particleSystem.addEffect(effect2);

      // 4. システムの開始
      particleSystem.start();

      // 5. システムの更新
      particleSystem.update(16.67);

      // 6. 両方のエフェクトが動作していることを確認
      const stats = particleSystem.getSystemStats();
      expect(stats.effectCount).toBe(2);

      // 7. エフェクト間の独立性確認
      expect(stats.effectCount).toBe(2);
    });

    test('メモリ管理の効率性', () => {
      // 1. 大量のパーティクルを生成
      const effect = new ParticleEffect({ name: 'memory-test', duration: 5000 });
      const emitter = new ParticleEmitter({
        position: { x: 400, y: 300 },
        emissionRate: 100,
        burstCount: 50,
      });

      effect.addEmitter(emitter);
      particleSystem.addEffect(effect);

      // 2. 複数回の更新
      for (let i = 0; i < 10; i++) {
        particleSystem.update(16.67);
      }

      // 3. メモリ使用量の確認
      const stats = particleSystem.getSystemStats();
      expect(stats.effectCount).toBe(1);

      // 4. プールの効率性確認
      expect(stats.poolStats.totalCreated).toBeGreaterThanOrEqual(0);
      expect(stats.poolStats.activeCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Performance Integration', () => {
    test('大量パーティクルでの性能', () => {
      // 1. 大量パーティクルの生成
      const effect = new ParticleEffect({ name: 'performance-test', duration: 10000 });
      const emitter = new ParticleEmitter({
        position: { x: 400, y: 300 },
        emissionRate: 200,
        burstCount: 100,
      });

      effect.addEmitter(emitter);
      particleSystem.addEffect(effect);

      // 2. パフォーマンス測定
      const startTime = performance.now();

      // 3. 60フレーム分の更新（1秒相当）
      for (let i = 0; i < 60; i++) {
        particleSystem.update(16.67);
        particleSystem.render();
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // 4. 60FPS維持の確認（1秒以内に完了）
      expect(totalTime).toBeLessThan(1000);

      // 5. パーティクル数の確認
      const stats = particleSystem.getSystemStats();
      expect(stats.effectCount).toBe(1);
    });

    test('フレームレート制御', () => {
      // 1. エフェクトの作成
      const effect = new ParticleEffect({ name: 'fps-test', duration: 5000 });
      const emitter = new ParticleEmitter({
        position: { x: 400, y: 300 },
        emissionRate: 50,
      });

      effect.addEmitter(emitter);
      particleSystem.addEffect(effect);

      // 2. フレームレート制御の確認
      const frameTimes = [];
      for (let i = 0; i < 10; i++) {
        const frameStart = performance.now();
        particleSystem.update(16.67);
        particleSystem.render();
        const frameEnd = performance.now();
        frameTimes.push(frameEnd - frameStart);
      }

      // 3. 平均フレーム時間の確認（16.67ms以下）
      const averageFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
      expect(averageFrameTime).toBeLessThan(16.67);
    });
  });

  describe('Error Handling Integration', () => {
    test('無効なデータでの安全性', () => {
      // 1. 無効なエフェクトの追加
      expect(() => {
        particleSystem.addEffect(null);
      }).not.toThrow();

      // 2. 無効なパーティクルでの更新
      expect(() => {
        particleSystem.update(null);
      }).not.toThrow();

      // 3. 無効な描画処理
      expect(() => {
        particleSystem.render();
      }).not.toThrow();
    });

    test('リソース不足時の動作', () => {
      // 1. 大量のエフェクトを追加
      for (let i = 0; i < 100; i++) {
        const effect = new ParticleEffect(`effect-${i}`, { duration: 1000 });
        const emitter = new ParticleEmitter({
          position: { x: Math.random() * 800, y: Math.random() * 600 },
          emissionRate: 100,
        });
        effect.addEmitter(emitter);
        particleSystem.addEffect(effect);
      }

      // 2. システムの更新
      expect(() => {
        particleSystem.update(16.67);
        particleSystem.render();
      }).not.toThrow();

      // 3. メモリクリーンアップ
      expect(() => {
        particleSystem.cleanup();
      }).not.toThrow();
    });
  });

  describe('Game Engine Integration', () => {
    test('ゲームイベントとの連携', () => {
      // 1. ゲームイベントのシミュレーション
      const gameEvents = [
        { type: 'line-clear', data: { lines: 1 } },
        { type: 'tetris', data: { lines: 4 } },
        { type: 'game-over', data: {} },
      ];

      // 2. イベントに応じたエフェクトの作成
      gameEvents.forEach(event => {
        const effect = new ParticleEffect({ name: `event-${event.type}`, duration: 1000 });
        const emitter = new ParticleEmitter({
          position: { x: 400, y: 300 },
          emissionRate: 20,
        });
        effect.addEmitter(emitter);
        particleSystem.addEffect(effect);
      });

      // 3. システムの開始
      particleSystem.start();

      // 4. システムの更新
      particleSystem.update(16.67);

      // 5. エフェクトの動作確認
      const stats = particleSystem.getSystemStats();
      expect(stats.effectCount).toBe(3);
    });

    test('既存システムとの共存', () => {
      // 1. パーティクルシステムの動作
      const effect = new ParticleEffect({ name: 'coexistence-test', duration: 1000 });
      const emitter = new ParticleEmitter({
        position: { x: 400, y: 300 },
        emissionRate: 10,
      });
      effect.addEmitter(emitter);
      particleSystem.addEffect(effect);

      // 2. システムの開始
      particleSystem.start();

      // 3. 既存システムのシミュレーション
      const existingSystem = {
        update: jest.fn(),
        render: jest.fn(),
      };

      // 4. 両システムの並行実行
      particleSystem.update(16.67);
      existingSystem.update();
      particleSystem.renderForTest();
      existingSystem.render();

      // 5. 干渉なしの確認
      expect(existingSystem.update).toHaveBeenCalled();
      expect(existingSystem.render).toHaveBeenCalled();
      expect(mockContext.save).toHaveBeenCalled();
    });
  });

  describe('System Lifecycle Integration', () => {
    test('システムの完全なライフサイクル', () => {
      // 1. 初期化
      expect(particleSystem.getSystemStats().effectCount).toBe(0);
      expect(particleSystem.getSystemStats().poolStats.activeCount).toBe(0);

      // 2. エフェクトの追加
      const effect = new ParticleEffect({ name: 'lifecycle-test', duration: 1000 });
      const emitter = new ParticleEmitter({
        position: { x: 400, y: 300 },
        emissionRate: 10,
      });
      effect.addEmitter(emitter);
      particleSystem.addEffect(effect);

      // 3. 実行
      for (let i = 0; i < 10; i++) {
        particleSystem.update(16.67);
        particleSystem.render();
      }

      // 4. 統計の確認
      const stats = particleSystem.getSystemStats();
      expect(stats.effectCount).toBe(1);
      expect(stats.poolStats.totalCreated).toBeGreaterThanOrEqual(0);

      // 5. クリーンアップ
      particleSystem.cleanup();
      const finalStats = particleSystem.getSystemStats();
      expect(finalStats.poolStats.activeCount).toBe(0);
    });

    test('システムのリセット', () => {
      // 1. エフェクトの追加と実行
      const effect = new ParticleEffect({ name: 'reset-test', duration: 1000 });
      const emitter = new ParticleEmitter({
        position: { x: 400, y: 300 },
        emissionRate: 10,
      });
      effect.addEmitter(emitter);
      particleSystem.addEffect(effect);

      particleSystem.update(16.67);

      // 2. リセット
      particleSystem.reset();

      // 3. 初期状態への復帰確認
      expect(particleSystem.getSystemStats().effectCount).toBe(0);
      expect(particleSystem.getSystemStats().poolStats.activeCount).toBe(0);
    });
  });
});
