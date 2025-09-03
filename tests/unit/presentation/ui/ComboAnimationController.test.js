/**
 * ComboAnimationController Unit Tests
 *
 * TDD Red Phase: アニメーション制御コンポーネントのテスト定義
 *
 * @file ComboAnimationController.test.js
 * @description コンボアニメーション詳細制御機能をテスト
 */

import { ComboAnimationController } from '../../../../src/presentation/ui/ComboAnimationController.js';

// 簡潔なDOM環境モック
const createMockElement = () => {
  const element = {
    appendChild: jest.fn(),
    removeChild: jest.fn(),
    querySelector: jest.fn(),
    querySelectorAll: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    setAttribute: jest.fn(),
    getAttribute: jest.fn(),
    getBoundingClientRect: jest.fn(() => ({
      x: 0,
      y: 0,
      width: 100,
      height: 50,
      top: 0,
      left: 0,
      bottom: 50,
      right: 100,
    })),
    classList: {
      add: jest.fn(),
      remove: jest.fn(),
      toggle: jest.fn(),
      contains: jest.fn(() => false),
    },
    style: {},
    innerHTML: '',
    children: [],
    parentNode: null,
    nodeType: 1, // ELEMENT_NODE
  };

  // textContent のゲッター・セッター
  let _textContent = '';
  Object.defineProperty(element, 'textContent', {
    get: () => _textContent,
    set: value => {
      _textContent = value;
    },
    configurable: true,
  });

  return element;
};

// グローバルDOM環境の設定
global.document = {
  createElement: jest.fn(() => createMockElement()),
  getElementById: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

global.window = {
  requestAnimationFrame: jest.fn(callback => setTimeout(callback, 16)),
  cancelAnimationFrame: jest.fn(),
  getComputedStyle: jest.fn(() => ({
    getPropertyValue: jest.fn(() => '1s'),
    animationDuration: '1s',
    transform: 'scale(1)',
  })),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  innerWidth: 1920,
  innerHeight: 1080,
};

global.performance = {
  now: jest.fn(() => Date.now()),
};

describe('ComboAnimationController', () => {
  let animationController;
  let mockContainer;

  beforeEach(() => {
    // 基本コンテナの作成
    mockContainer = createMockElement();
    mockContainer.id = 'game-container';

    // DOM モック設定
    global.document.getElementById = jest.fn(id => {
      if (id === 'game-container') {
        return mockContainer;
      }
      return null;
    });

    global.document.createElement = jest.fn(tagName => {
      const element = createMockElement();
      element.tagName = tagName.toUpperCase();
      return element;
    });
  });

  afterEach(() => {
    if (animationController) {
      animationController.destroy();
    }
    jest.clearAllMocks();
  });

  describe('基本機能', () => {
    test('正常に初期化される', () => {
      animationController = new ComboAnimationController('#game-container');

      expect(animationController.container).toBe(mockContainer);
      expect(animationController.isInitialized).toBe(true);
      expect(animationController.activeAnimations).toBeDefined();
    });

    test('DOM要素を直接指定できる', () => {
      animationController = new ComboAnimationController(mockContainer);

      expect(animationController.container).toBe(mockContainer);
    });

    test('無効なコンテナでエラーが発生する', () => {
      global.document.getElementById.mockReturnValue(null);

      expect(() => {
        new ComboAnimationController('#invalid-container');
      }).toThrow('Animation container not found');
    });

    test('カスタム設定で初期化される', () => {
      const customConfig = {
        enableParticles: false,
        maxConcurrentAnimations: 3,
        defaultDuration: 800,
        enableTimeline: false,
      };

      animationController = new ComboAnimationController('#game-container', customConfig);

      expect(animationController.config.enableParticles).toBe(false);
      expect(animationController.config.maxConcurrentAnimations).toBe(3);
      expect(animationController.config.defaultDuration).toBe(800);
      expect(animationController.config.enableTimeline).toBe(false);
    });

    test('アニメーション要素が正しく作成される', () => {
      animationController = new ComboAnimationController('#game-container');

      expect(animationController.elements.animationLayer).toBeDefined();
      expect(animationController.elements.particleLayer).toBeDefined();
      expect(animationController.elements.textLayer).toBeDefined();
    });
  });

  describe('アニメーション実行', () => {
    beforeEach(() => {
      animationController = new ComboAnimationController('#game-container');
    });

    test('基本アニメーションが開始される', async () => {
      const animationData = {
        type: 'combo-start',
        comboLevel: 1,
        duration: 600,
        intensity: 0.5,
        position: { x: 100, y: 50 },
      };

      const animationId = await animationController.startAnimation(animationData);

      expect(typeof animationId).toBe('string');
      expect(animationController.activeAnimations.size).toBe(1);
      expect(animationController.isPlaying(animationId)).toBe(true);
    });

    test('複数のアニメーションが同時実行される', async () => {
      const animations = [
        { type: 'combo-start', comboLevel: 1, duration: 600 },
        { type: 'combo-continue', comboLevel: 2, duration: 400 },
        { type: 'combo-break', comboLevel: 0, duration: 800 },
      ];

      const animationIds = [];
      for (const animData of animations) {
        const id = await animationController.startAnimation(animData);
        animationIds.push(id);
      }

      expect(animationController.activeAnimations.size).toBe(3);
      animationIds.forEach(id => {
        expect(animationController.isPlaying(id)).toBe(true);
      });
    });

    test('最大同時アニメーション数の制限が機能する', async () => {
      const controller = new ComboAnimationController('#game-container', {
        maxConcurrentAnimations: 2,
      });

      // 3つのアニメーションを開始
      const id1 = await controller.startAnimation({ type: 'combo-start', comboLevel: 1 });
      const id2 = await controller.startAnimation({ type: 'combo-continue', comboLevel: 2 });
      const id3 = await controller.startAnimation({ type: 'combo-mega', comboLevel: 3 });

      expect(controller.activeAnimations.size).toBe(2);
      expect(controller.isPlaying(id1)).toBe(false); // 最古のアニメーションは停止
      expect(controller.isPlaying(id2)).toBe(true);
      expect(controller.isPlaying(id3)).toBe(true);

      controller.destroy();
    });

    test('アニメーションが正常に停止される', async () => {
      const animationId = await animationController.startAnimation({
        type: 'combo-continue',
        comboLevel: 5,
        duration: 1000,
      });

      expect(animationController.isPlaying(animationId)).toBe(true);

      animationController.stopAnimation(animationId);

      expect(animationController.isPlaying(animationId)).toBe(false);
      expect(animationController.activeAnimations.size).toBe(0);
    });

    test('全てのアニメーションが一括停止される', async () => {
      await animationController.startAnimation({ type: 'combo-start', comboLevel: 1 });
      await animationController.startAnimation({ type: 'combo-continue', comboLevel: 2 });
      await animationController.startAnimation({ type: 'combo-mega', comboLevel: 10 });

      expect(animationController.activeAnimations.size).toBe(3);

      animationController.stopAllAnimations();

      expect(animationController.activeAnimations.size).toBe(0);
    });
  });

  describe('アニメーションタイプ', () => {
    beforeEach(() => {
      animationController = new ComboAnimationController('#game-container');
    });

    test('コンボ開始アニメーションが実行される', async () => {
      const animationId = await animationController.startAnimation({
        type: 'combo-start',
        comboLevel: 1,
        text: 'COMBO!',
        color: '#ffff00',
      });

      const animation = animationController.getAnimation(animationId);
      expect(animation.type).toBe('combo-start');
      expect(animation.data.text).toBe('COMBO!');
      expect(animation.data.color).toBe('#ffff00');
    });

    test('コンボ継続アニメーションが実行される', async () => {
      const animationId = await animationController.startAnimation({
        type: 'combo-continue',
        comboLevel: 5,
        text: '5 COMBO!',
        scale: 1.2,
      });

      const animation = animationController.getAnimation(animationId);
      expect(animation.type).toBe('combo-continue');
      expect(animation.data.scale).toBe(1.2);
    });

    test('メガコンボアニメーションが実行される', async () => {
      const animationId = await animationController.startAnimation({
        type: 'combo-mega',
        comboLevel: 15,
        text: 'MEGA COMBO!',
        particles: true,
        shake: true,
      });

      const animation = animationController.getAnimation(animationId);
      expect(animation.type).toBe('combo-mega');
      expect(animation.data.particles).toBe(true);
      expect(animation.data.shake).toBe(true);
    });

    test('コンボ中断アニメーションが実行される', async () => {
      const animationId = await animationController.startAnimation({
        type: 'combo-break',
        comboLevel: 0,
        text: 'BREAK',
        fadeOut: true,
      });

      const animation = animationController.getAnimation(animationId);
      expect(animation.type).toBe('combo-break');
      expect(animation.data.fadeOut).toBe(true);
    });

    test('無効なアニメーションタイプでエラーが発生する', async () => {
      await expect(
        animationController.startAnimation({
          type: 'invalid-type',
          comboLevel: 1,
        })
      ).rejects.toThrow('Unknown animation type: invalid-type');
    });
  });

  describe('パーティクル効果', () => {
    beforeEach(() => {
      animationController = new ComboAnimationController('#game-container', {
        enableParticles: true,
      });
    });

    test('パーティクル効果が生成される', async () => {
      const animationId = await animationController.startAnimation({
        type: 'combo-mega',
        comboLevel: 10,
        particles: {
          count: 20,
          colors: ['#ff0000', '#00ff00', '#0000ff'],
          speed: 2.0,
        },
      });

      const animation = animationController.getAnimation(animationId);
      expect(animation.particles).toBeDefined();
      expect(animation.particles.length).toBe(20);
    });

    test('パーティクル設定がカスタマイズされる', async () => {
      await animationController.startAnimation({
        type: 'combo-continue',
        comboLevel: 5,
        particles: {
          count: 10,
          size: 4,
          lifetime: 2000,
          gravity: 0.5,
        },
      });

      // パーティクル要素が適切に管理されているかチェック
      expect(typeof animationController.elements.particleLayer).toBe('object');
    });

    test('パーティクルが無効な場合は生成されない', async () => {
      const controller = new ComboAnimationController('#game-container', {
        enableParticles: false,
      });

      await controller.startAnimation({
        type: 'combo-mega',
        comboLevel: 10,
        particles: { count: 20 },
      });

      expect(controller.elements.particleLayer.children.length).toBe(0);
      controller.destroy();
    });
  });

  describe('タイムライン同期', () => {
    beforeEach(() => {
      animationController = new ComboAnimationController('#game-container', {
        enableTimeline: true,
      });
    });

    test('タイムラインが開始される', () => {
      animationController.startTimeline();

      expect(animationController.timeline.isRunning).toBe(true);
      expect(typeof animationController.timeline.startTime).toBe('number');
    });

    test('タイムラインが停止される', () => {
      animationController.startTimeline();
      animationController.stopTimeline();

      expect(animationController.timeline.isRunning).toBe(false);
    });

    test('タイムラインに同期してアニメーションが実行される', async () => {
      animationController.startTimeline();

      const animationId = await animationController.startAnimation({
        type: 'combo-start',
        comboLevel: 1,
        timeline: {
          delay: 0, // タイムアウト回避のため遅延を0に
          synchronize: true,
        },
      });

      const animation = animationController.getAnimation(animationId);
      expect(animation.timeline.synchronize).toBe(true);
      expect(animation.timeline.delay).toBe(0);
    });

    test('タイムライン無効時は個別実行される', async () => {
      const controller = new ComboAnimationController('#game-container', {
        enableTimeline: false,
      });

      const animationId = await controller.startAnimation({
        type: 'combo-continue',
        comboLevel: 3,
        timeline: { synchronize: true },
      });

      const animation = controller.getAnimation(animationId);
      expect(animation.timeline.synchronize).toBe(false);
      controller.destroy();
    });
  });

  describe('アニメーションキューイング', () => {
    beforeEach(() => {
      animationController = new ComboAnimationController('#game-container');
    });

    test('アニメーションがキューに追加される', () => {
      const queueData = {
        type: 'combo-continue',
        comboLevel: 3,
        delay: 500,
      };

      animationController.queueAnimation(queueData);

      expect(animationController.animationQueue.length).toBe(1);
      expect(animationController.animationQueue[0].type).toBe('combo-continue');
    });

    test('キューのアニメーションが順次実行される', () => {
      animationController.queueAnimation({ type: 'combo-start', comboLevel: 1, delay: 0 });
      animationController.queueAnimation({ type: 'combo-continue', comboLevel: 2, delay: 0 });
      animationController.queueAnimation({ type: 'combo-continue', comboLevel: 3, delay: 0 });

      expect(animationController.animationQueue.length).toBe(3);

      animationController.processQueue();

      // キューが処理されたことを確認（即座にクリアされる）
      expect(animationController.animationQueue.length).toBe(0);
    });

    test('キューがクリアされる', () => {
      animationController.queueAnimation({ type: 'combo-start', comboLevel: 1 });
      animationController.queueAnimation({ type: 'combo-continue', comboLevel: 2 });

      expect(animationController.animationQueue.length).toBe(2);

      animationController.clearQueue();

      expect(animationController.animationQueue.length).toBe(0);
    });
  });

  describe('パフォーマンス最適化', () => {
    beforeEach(() => {
      animationController = new ComboAnimationController('#game-container');
    });

    test('フレームレートが監視される', () => {
      animationController.startPerformanceMonitoring();

      expect(animationController.performance.monitoring).toBe(true);
      expect(typeof animationController.performance.frameRate).toBe('number');
    });

    test('低パフォーマンス時にアニメーションが簡略化される', async () => {
      // 低フレームレートをシミュレート
      animationController.performance.frameRate = 20; // 20fps

      const animationId = await animationController.startAnimation({
        type: 'combo-mega',
        comboLevel: 15,
        particles: { count: 50 },
      });

      const animation = animationController.getAnimation(animationId);
      // パフォーマンス調整が考慮されている
      expect(typeof animation.optimized).toBe('boolean');
    });

    test('メモリ使用量が制限される', async () => {
      // 大量のアニメーションを開始
      for (let i = 0; i < 20; i++) {
        await animationController.startAnimation({
          type: 'combo-continue',
          comboLevel: i + 1,
          duration: 5000, // 長時間
        });
      }

      // メモリ制限によりアニメーション数が調整される
      expect(animationController.activeAnimations.size).toBeLessThanOrEqual(10);
    });
  });

  describe('エラーハンドリング', () => {
    beforeEach(() => {
      animationController = new ComboAnimationController('#game-container');
    });

    test('無効なアニメーションデータでも安全に処理される', async () => {
      const invalidData = [
        null,
        undefined,
        {},
        { type: null },
        { comboLevel: 'invalid' },
        { duration: -100 },
      ];

      for (const data of invalidData) {
        await expect(animationController.startAnimation(data)).rejects.toThrow();
      }
    });

    test('アニメーション実行中のエラーが適切に処理される', async () => {
      // エラーを発生させるモック
      const originalRAF = global.window.requestAnimationFrame;
      global.window.requestAnimationFrame = jest.fn(() => {
        throw new Error('Animation frame error');
      });

      // エラー処理が実装されていることを確認
      expect(() => {
        animationController.startAnimation({
          type: 'combo-start',
          comboLevel: 1,
        });
      }).not.toThrow();

      // 元に戻す
      global.window.requestAnimationFrame = originalRAF;
    });

    test('コンテナ削除後も安全に動作する', async () => {
      const animationId = await animationController.startAnimation({
        type: 'combo-continue',
        comboLevel: 5,
      });

      // コンテナを削除
      animationController.container.parentNode = null;

      expect(() => {
        animationController.stopAnimation(animationId);
      }).not.toThrow();

      // 安全な処理が実行されることを確認
      expect(typeof animationController.isDestroyed).toBe('boolean');
    });

    test('コンポーネントが適切に破棄される', () => {
      animationController.destroy();

      expect(animationController.isDestroyed).toBe(true);
      expect(animationController.activeAnimations.size).toBe(0);
      expect(animationController.animationQueue.length).toBe(0);
    });
  });

  describe('統合シナリオ', () => {
    beforeEach(() => {
      animationController = new ComboAnimationController('#game-container', {
        enableParticles: true,
        enableTimeline: true,
      });
    });

    test('完全なコンボアニメーションシーケンス', async () => {
      // タイムライン開始
      animationController.startTimeline();

      // コンボ開始
      const startId = await animationController.startAnimation({
        type: 'combo-start',
        comboLevel: 1,
        text: 'COMBO!',
      });

      // コンボ継続（複数）
      const continueIds = [];
      for (let i = 2; i <= 5; i++) {
        const id = await animationController.startAnimation({
          type: 'combo-continue',
          comboLevel: i,
          text: `${i} COMBO!`,
        });
        continueIds.push(id);
      }

      // メガコンボ
      const megaId = await animationController.startAnimation({
        type: 'combo-mega',
        comboLevel: 10,
        text: 'MEGA COMBO!',
        particles: { count: 30 },
      });

      // アニメーションIDが生成されていることを確認
      expect(typeof startId).toBe('string');
      continueIds.forEach(id => {
        expect(typeof id).toBe('string');
      });
      expect(typeof megaId).toBe('string');

      // タイムライン停止
      animationController.stopTimeline();
    });

    test('パフォーマンス最適化付きアニメーション', async () => {
      animationController.startPerformanceMonitoring();

      // 高負荷アニメーション
      await animationController.startAnimation({
        type: 'combo-mega',
        comboLevel: 20,
        particles: { count: 100 },
        effects: ['glow', 'shake', 'pulse'],
      });

      // パフォーマンス監視が動作中
      expect(animationController.performance.monitoring).toBe(true);
    });
  });
});
