/**
 * IntelligentAnalyzer.test.js - IntelligentAnalyzer テスト
 *
 * TDD Red Phase: テストを通すための実装
 *
 * 責任:
 * - 軽量学習アルゴリズム（周波数ベースパターン認識）
 * - ユーザー行動パターンの学習と分析
 * - 文脈認識（ゲーム状況・デバイス種別）
 * - 予測機能（次の操作の先読み）
 * - メモリ効率管理（制限内での学習データ保持）
 */

import { IntelligentAnalyzer } from '../../../../src/presentation/adaptive/IntelligentAnalyzer.js';

describe('IntelligentAnalyzer', () => {
  let analyzer;

  beforeEach(() => {
    jest.clearAllMocks();
    analyzer = null;
  });

  afterEach(() => {
    if (analyzer) {
      analyzer.destroy();
    }
  });

  describe('初期化', () => {
    test('デフォルト設定で初期化される', () => {
      analyzer = new IntelligentAnalyzer();

      expect(analyzer.patterns).toBeInstanceOf(Object);
      expect(analyzer.patterns.frequency).toBeInstanceOf(Map);
      expect(analyzer.patterns.sequence).toBeInstanceOf(Map);
      expect(analyzer.patterns.context).toBeInstanceOf(Map);
      expect(analyzer.patterns.timing).toBeInstanceOf(Map);
      expect(analyzer.isDestroyed).toBe(false);
    });

    test('カスタム設定で初期化される', () => {
      const config = {
        threshold: 3,
        decayRate: 0.9,
        maxPatterns: 50,
      };
      analyzer = new IntelligentAnalyzer(config);

      expect(analyzer.simpleLearning.threshold).toBe(3);
      expect(analyzer.simpleLearning.decayRate).toBe(0.9);
      expect(analyzer.simpleLearning.maxPatterns).toBe(50);
    });

    test('デフォルト学習設定が正しく適用される', () => {
      analyzer = new IntelligentAnalyzer();

      expect(analyzer.simpleLearning.threshold).toBe(5);
      expect(analyzer.simpleLearning.decayRate).toBe(0.95);
      expect(analyzer.simpleLearning.maxPatterns).toBe(100);
    });
  });

  describe('軽量学習機能', () => {
    beforeEach(() => {
      analyzer = new IntelligentAnalyzer();
    });

    test('ユーザーパターンが正しく学習される', () => {
      const context = {
        gameState: 'playing',
        deviceType: 'desktop',
        timeOfDay: 'evening',
      };

      analyzer.learnUserPattern('ui-interaction', context);

      const patterns = analyzer.patterns.frequency;
      const key = 'ui-interaction:playing:desktop';
      expect(patterns.has(key)).toBe(true);
      expect(patterns.get(key).count).toBe(1);
      expect(patterns.get(key).confidence).toBeGreaterThan(0);
    });

    test('学習閾値に達すると信頼度が上がる', () => {
      analyzer = new IntelligentAnalyzer({ threshold: 3 });
      const context = { gameState: 'playing', deviceType: 'mobile' };

      // 閾値まで学習
      for (let i = 0; i < 3; i++) {
        analyzer.learnUserPattern('tap', context);
      }

      const pattern = analyzer.patterns.frequency.get('tap:playing:mobile');
      expect(pattern.confidence).toBe(1.0);
    });

    test('メモリ制限が正しく機能する', () => {
      analyzer = new IntelligentAnalyzer({ maxPatterns: 5 });

      // 制限を超える学習データを投入
      for (let i = 0; i < 10; i++) {
        analyzer.learnUserPattern(`action${i}`, { state: 'test' });
      }

      expect(analyzer.patterns.frequency.size).toBeLessThanOrEqual(5);
    });

    test('古いパターンが減衰される', () => {
      analyzer = new IntelligentAnalyzer({ decayRate: 0.5 });
      const context = { gameState: 'playing', deviceType: 'desktop' };

      // 初回学習
      analyzer.learnUserPattern('action', context);
      const initialCount = analyzer.patterns.frequency.get('action:playing:desktop').count;

      // 時間経過シミュレーション
      analyzer.applyDecay();

      const decayedCount = analyzer.patterns.frequency.get('action:playing:desktop').count;
      expect(decayedCount).toBeLessThan(initialCount);
    });

    test('コンテキスト関連パターンが学習される', () => {
      const context = { gameState: 'menu', deviceType: 'tablet' };

      analyzer.learnUserPattern('navigation', context);

      const contextKey = 'navigation:menu:tablet';
      expect(analyzer.patterns.frequency.has(contextKey)).toBe(true);
    });
  });

  describe('予測機能', () => {
    beforeEach(() => {
      analyzer = new IntelligentAnalyzer();
    });

    test('学習データに基づく予測が生成される', () => {
      const context = { gameState: 'playing', deviceType: 'desktop' };

      // 学習データの準備
      for (let i = 0; i < 10; i++) {
        analyzer.learnUserPattern('rotate', context);
      }

      const prediction = analyzer.predictNextAction(context);
      expect(prediction.actionType).toBe('rotate');
      expect(prediction.confidence).toBeGreaterThan(0.5);
    });

    test('未学習の文脈では低信頼度予測が生成される', () => {
      const unknownContext = { gameState: 'unknown', deviceType: 'unknown' };

      const prediction = analyzer.predictNextAction(unknownContext);
      expect(prediction.confidence).toBeLessThan(0.3);
    });

    test('複数の候補がある場合は最も頻度の高いものが選ばれる', () => {
      const context = { gameState: 'playing', deviceType: 'mobile' };

      // 異なる頻度で学習
      for (let i = 0; i < 5; i++) {
        analyzer.learnUserPattern('move', context);
      }
      for (let i = 0; i < 10; i++) {
        analyzer.learnUserPattern('rotate', context);
      }

      const prediction = analyzer.predictNextAction(context);
      expect(prediction.actionType).toBe('rotate');
    });

    test('信頼度が正しく計算される', () => {
      analyzer = new IntelligentAnalyzer({ threshold: 5 });
      const context = { gameState: 'playing', deviceType: 'desktop' };

      // 閾値の半分まで学習
      for (let i = 0; i < 3; i++) {
        analyzer.learnUserPattern('action', context);
      }

      const prediction = analyzer.predictNextAction(context);
      expect(prediction.confidence).toBe(0.6); // 3/5 = 0.6
    });
  });

  describe('文脈認識', () => {
    beforeEach(() => {
      analyzer = new IntelligentAnalyzer();
    });

    test('ゲーム文脈が正しく分析される', () => {
      const gameState = { level: 5, score: 1000, linesCleared: 20 };

      const context = analyzer.analyzeGameContext(gameState);

      expect(context.difficulty).toBeDefined();
      expect(context.progress).toBeDefined();
      expect(context.performance).toBeDefined();
    });

    test('デバイス文脈が正しく検出される', () => {
      const deviceContext = analyzer.detectDeviceContext();

      expect(deviceContext.type).toMatch(/desktop|mobile|tablet/);
      expect(deviceContext.orientation).toMatch(/portrait|landscape/);
      expect(deviceContext.performance).toBeDefined();
    });

    test('時間的文脈が認識される', () => {
      const timeContext = analyzer.analyzeTimeContext();

      expect(timeContext.timeOfDay).toMatch(/morning|afternoon|evening|night/);
      expect(timeContext.dayOfWeek).toBeDefined();
      expect(timeContext.sessionDuration).toBeDefined();
    });

    test('ユーザーパフォーマンス文脈が分析される', () => {
      const performanceData = {
        averageActionTime: 150,
        errorRate: 0.05,
        consecutiveActions: 10,
      };

      const context = analyzer.analyzeUserPerformance(performanceData);

      expect(context.skillLevel).toBeDefined();
      expect(context.concentration).toBeDefined();
      expect(context.fatigue).toBeDefined();
    });
  });

  describe('使用頻度分析', () => {
    beforeEach(() => {
      analyzer = new IntelligentAnalyzer();
    });

    test('アクション頻度が正しく分析される', () => {
      // 様々なアクションを学習
      const actions = ['move', 'rotate', 'drop', 'hold'];
      const context = { gameState: 'playing', deviceType: 'desktop' };

      actions.forEach((action, index) => {
        for (let i = 0; i <= index * 2; i++) {
          analyzer.learnUserPattern(action, context);
        }
      });

      const analysis = analyzer.analyzeUsageFrequency();

      expect(analysis.mostFrequent).toBe('hold');
      expect(analysis.leastFrequent).toBe('move');
      expect(analysis.totalActions).toBeGreaterThan(0);
    });

    test('時間帯別の使用パターンが分析される', () => {
      const morningContext = { gameState: 'playing', timeOfDay: 'morning' };
      const eveningContext = { gameState: 'playing', timeOfDay: 'evening' };

      // 時間帯別の学習
      analyzer.learnUserPattern('slow-action', morningContext);
      analyzer.learnUserPattern('fast-action', eveningContext);

      const analysis = analyzer.analyzeTimeBasedPatterns();

      expect(analysis.morning).toBeDefined();
      expect(analysis.evening).toBeDefined();
    });
  });

  describe('パフォーマンス', () => {
    beforeEach(() => {
      analyzer = new IntelligentAnalyzer();
    });

    test('分析処理が時間制限内で完了する', () => {
      // 大量のデータを学習
      for (let i = 0; i < 100; i++) {
        analyzer.learnUserPattern(`action${i % 10}`, { state: 'test' });
      }

      const startTime = performance.now();
      analyzer.analyzeUsageFrequency();
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(50); // 50ms以内
    });

    test('大量データでもメモリ効率が保たれる', () => {
      const initialMemory = process.memoryUsage ? process.memoryUsage().heapUsed : 0;

      // 大量の学習データを投入
      for (let i = 0; i < 1000; i++) {
        analyzer.learnUserPattern(`action${i % 100}`, { id: i });
      }

      const finalMemory = process.memoryUsage ? process.memoryUsage().heapUsed : 0;
      const memoryIncrease = (finalMemory - initialMemory) / (1024 * 1024);

      // メモリ増加が1MB以下であることを確認
      expect(memoryIncrease).toBeLessThan(1.0);

      // パターン数が制限内であることを確認
      expect(analyzer.patterns.frequency.size).toBeLessThanOrEqual(100);
    });

    test('予測処理が高速で実行される', () => {
      // 学習データの準備
      for (let i = 0; i < 50; i++) {
        analyzer.learnUserPattern('test-action', { state: 'playing' });
      }

      const startTime = performance.now();
      for (let i = 0; i < 100; i++) {
        analyzer.predictNextAction({ state: 'playing' });
      }
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // 100ms以内で100回予測
    });
  });

  describe('学習データ管理', () => {
    beforeEach(() => {
      analyzer = new IntelligentAnalyzer();
    });

    test('学習データをエクスポートできる', () => {
      analyzer.learnUserPattern('test', { state: 'test' });

      const exportedData = analyzer.exportLearningData();

      expect(exportedData).toHaveProperty('patterns');
      expect(exportedData).toHaveProperty('metadata');
      expect(exportedData.metadata).toHaveProperty('totalPatterns');
    });

    test('学習データをインポートできる', () => {
      const importData = {
        patterns: {
          frequency: [['test:test', { count: 5, confidence: 1.0 }]],
        },
        metadata: { totalPatterns: 1 },
      };

      analyzer.importLearningData(importData);

      expect(analyzer.patterns.frequency.has('test:test')).toBe(true);
      expect(analyzer.patterns.frequency.get('test:test').count).toBe(5);
    });

    test('学習データをリセットできる', () => {
      analyzer.learnUserPattern('test', { state: 'test' });
      expect(analyzer.patterns.frequency.size).toBeGreaterThan(0);

      analyzer.resetLearningData();

      expect(analyzer.patterns.frequency.size).toBe(0);
      expect(analyzer.patterns.sequence.size).toBe(0);
    });
  });

  describe('統計情報', () => {
    beforeEach(() => {
      analyzer = new IntelligentAnalyzer();
    });

    test('学習統計が正しく取得される', () => {
      analyzer.learnUserPattern('action1', { state: 'test' });
      analyzer.learnUserPattern('action2', { state: 'test' });

      const stats = analyzer.getLearningStats();

      expect(stats.totalPatterns).toBe(2);
      expect(stats.averageConfidence).toBeDefined();
      expect(stats.memoryUsage).toBeDefined();
    });

    test('予測統計が正しく追跡される', () => {
      // 学習と予測を実行
      analyzer.learnUserPattern('action', { state: 'test' });
      analyzer.predictNextAction({ state: 'test' });

      const stats = analyzer.getPredictionStats();

      expect(stats.totalPredictions).toBe(1);
      expect(stats.averageConfidence).toBeDefined();
    });
  });

  describe('破棄処理', () => {
    beforeEach(() => {
      analyzer = new IntelligentAnalyzer();
    });

    test('破棄処理が正常に実行される', () => {
      analyzer.learnUserPattern('test', { state: 'test' });

      analyzer.destroy();

      expect(analyzer.isDestroyed).toBe(true);
      expect(analyzer.patterns.frequency.size).toBe(0);
    });

    test('破棄後の操作でエラーが発生する', () => {
      analyzer.destroy();

      expect(() => {
        analyzer.learnUserPattern('test', { state: 'test' });
      }).toThrow('IntelligentAnalyzer has been destroyed');
    });
  });
});
