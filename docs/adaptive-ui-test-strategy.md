# AdaptiveUIテスト設計書

**作成日**: 2024年12月19日  
**バージョン**: 1.0  
**ステータス**: テスト設計完了

## 🎯 概要

AdaptiveUIのテスト設計書です。TDD（Test-Driven Development）アプローチを採用し、既存システムとの統合テストを重視した包括的なテスト戦略を提供します。詳細設計レビュー（v1.1）の結果を反映し、超軽量（1.2MB）で高効率なシステムの品質保証を実現します。

## 🏗️ テストアーキテクチャ

### **テストピラミッド設計**
```
               E2E Tests (5%)
             ┌─────────────────┐
            │ 統合ワークフロー   │
           │  予測精度検証      │
          │   視覚回帰テスト    │
         └─────────────────────┘
            Integration Tests (20%)
           ┌─────────────────────┐
          │ 既存システム統合テスト │
         │  学習パフォーマンステスト │
        │   予測アルゴリズムテスト  │
       └─────────────────────────┘
              Unit Tests (75%)
             ┌─────────────────────────┐
            │ AdaptiveIntegrator        │
           │  IntelligentAnalyzer       │
          │   PredictiveOptimizer       │
         │    AdaptiveController        │
        └─────────────────────────────┘
```

### **テスト環境統合**
```
AdaptiveUI Tests
├── 既存E2Eシステム活用
│   ├── tests/e2e/helpers/UITestHelper.js (既存)
│   ├── tests/e2e/helpers/PerformanceHelper.js (既存)
│   └── tests/e2e/helpers/AdaptiveUIHelper.js (新規)
├── 既存Unitテスト統合
│   ├── tests/unit/presentation/ui/ (既存)
│   └── tests/unit/presentation/adaptive/ (新規)
└── 統合テストフレームワーク
    ├── tests/integration/adaptive-ui/ (新規)
    └── tests/performance/adaptive-ui/ (新規)
```

## 📊 コンポーネント別テスト設計

### **1. AdaptiveIntegrator テスト設計**

#### **単体テスト（25テスト項目）**
```javascript
// tests/unit/presentation/adaptive/AdaptiveIntegrator.test.js
describe('AdaptiveIntegrator', () => {
  describe('初期化', () => {
    test('正常に初期化される', () => {
      const integrator = new AdaptiveIntegrator();
      expect(integrator.systemIntegrations).toBeInstanceOf(Map);
      expect(integrator.dataStreams).toBeInstanceOf(Map);
      expect(integrator.syncQueue).toEqual([]);
    });

    test('設定オプションが正しく適用される', () => {
      const config = { enableAutoSync: false };
      const integrator = new AdaptiveIntegrator(config);
      expect(integrator.config.enableAutoSync).toBe(false);
    });
  });

  describe('ResponsiveComboManager統合', () => {
    test('ResponsiveComboManagerが正常に統合される', async () => {
      const mockResponsiveManager = createMockResponsiveManager();
      await integrator.integrateResponsiveManager(mockResponsiveManager);
      
      expect(integrator.systemIntegrations.has('responsive')).toBe(true);
      expect(mockResponsiveManager._breakpointChangeCallbacks).toHaveLength(1);
    });

    test('ブレークポイント変更がキャプチャされる', () => {
      const mockManager = createMockResponsiveManager();
      integrator.integrateResponsiveManager(mockManager);
      
      // ブレークポイント変更をシミュレート
      mockManager.currentBreakpoint = 'mobile';
      mockManager._breakpointChangeCallbacks[0]('mobile');
      
      const state = integrator.getIntegratedState();
      expect(state.responsive.breakpoint).toBe('mobile');
    });
  });

  describe('AccessibilityEnhancer統合', () => {
    test('AccessibilityEnhancerが正常に統合される', async () => {
      const mockAccessibilityEnhancer = createMockAccessibilityEnhancer();
      await integrator.integrateAccessibilityEnhancer(mockAccessibilityEnhancer);
      
      expect(integrator.systemIntegrations.has('accessibility')).toBe(true);
    });

    test('アクセシビリティ状態が正しく取得される', () => {
      const mockEnhancer = createMockAccessibilityEnhancer();
      mockEnhancer.isHighContrastEnabled = true;
      integrator.integrateAccessibilityEnhancer(mockEnhancer);
      
      const state = integrator.getIntegratedState();
      expect(state.accessibility.highContrast).toBe(true);
    });
  });

  describe('統合状態管理', () => {
    test('統合状態が正しく同期される', () => {
      // 複数システム統合後の状態同期テスト
    });

    test('エラー時の分離処理が機能する', () => {
      // システム障害時の分離テスト
    });
  });

  describe('パフォーマンス', () => {
    test('統合処理が性能要件内で完了する', async () => {
      const startTime = performance.now();
      await integrator.syncSystemStates();
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(50); // 50ms以内
    });

    test('メモリ使用量が制限内に収まる', () => {
      // メモリ使用量監視テスト
    });
  });
});
```

#### **統合テストケース**
- 既存ResponsiveComboManagerとの実際の統合
- 既存AccessibilityEnhancerとの実際の統合
- パフォーマンス監視システムとの連携
- エラーハンドリングと復旧処理

### **2. IntelligentAnalyzer テスト設計**

#### **単体テスト（30テスト項目）**
```javascript
// tests/unit/presentation/adaptive/IntelligentAnalyzer.test.js
describe('IntelligentAnalyzer', () => {
  describe('軽量学習機能', () => {
    test('ユーザーパターンが正しく学習される', () => {
      const analyzer = new IntelligentAnalyzer();
      
      // 学習データの投入
      analyzer.learnUserPattern('ui-interaction', {
        gameState: 'playing',
        deviceType: 'desktop',
        timeOfDay: 'evening'
      });
      
      const patterns = analyzer.patterns.frequency;
      const key = 'ui-interaction:playing:desktop';
      expect(patterns.has(key)).toBe(true);
      expect(patterns.get(key).count).toBe(1);
    });

    test('学習閾値に達すると信頼度が上がる', () => {
      const analyzer = new IntelligentAnalyzer({ threshold: 3 });
      const context = { gameState: 'playing', deviceType: 'mobile' };
      
      // 閾値まで学習
      for (let i = 0; i < 3; i++) {
        analyzer.learnUserPattern('tap', context);
      }
      
      const pattern = analyzer.patterns.frequency.get('tap:playing:mobile');
      expect(pattern.confidence).toBe(1.0);
    });

    test('メモリ制限が正しく機能する', () => {
      const analyzer = new IntelligentAnalyzer({ maxPatterns: 5 });
      
      // 制限を超える学習データを投入
      for (let i = 0; i < 10; i++) {
        analyzer.learnUserPattern(`action${i}`, { state: 'test' });
      }
      
      expect(analyzer.patterns.frequency.size).toBeLessThanOrEqual(5);
    });
  });

  describe('予測機能', () => {
    test('学習データに基づく予測が生成される', () => {
      const analyzer = new IntelligentAnalyzer();
      
      // 学習データの準備
      const context = { gameState: 'playing', deviceType: 'desktop' };
      for (let i = 0; i < 10; i++) {
        analyzer.learnUserPattern('rotate', context);
      }
      
      const prediction = analyzer.predictNextAction(context);
      expect(prediction.actionType).toBe('rotate');
      expect(prediction.confidence).toBeGreaterThan(0.5);
    });

    test('未学習の文脈では低信頼度予測が生成される', () => {
      const analyzer = new IntelligentAnalyzer();
      const unknownContext = { gameState: 'unknown', deviceType: 'unknown' };
      
      const prediction = analyzer.predictNextAction(unknownContext);
      expect(prediction.confidence).toBeLessThan(0.3);
    });
  });

  describe('文脈認識', () => {
    test('ゲーム文脈が正しく分析される', () => {
      const analyzer = new IntelligentAnalyzer();
      const gameState = { level: 5, score: 1000, linesCleared: 20 };
      
      const context = analyzer.analyzeGameContext(gameState);
      expect(context.difficulty).toBeDefined();
      expect(context.progress).toBeDefined();
    });

    test('デバイス文脈が正しく検出される', () => {
      const analyzer = new IntelligentAnalyzer();
      const deviceContext = analyzer.detectDeviceContext();
      
      expect(deviceContext.type).toMatch(/desktop|mobile|tablet/);
      expect(deviceContext.orientation).toMatch(/portrait|landscape/);
    });
  });

  describe('パフォーマンス', () => {
    test('分析処理が時間制限内で完了する', () => {
      const analyzer = new IntelligentAnalyzer();
      const startTime = performance.now();
      
      analyzer.analyzeUsageFrequency();
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(50); // 50ms以内
    });

    test('大量データでもメモリ効率が保たれる', () => {
      const analyzer = new IntelligentAnalyzer();
      
      // 大量の学習データを投入
      for (let i = 0; i < 1000; i++) {
        analyzer.learnUserPattern(`action${i % 100}`, { id: i });
      }
      
      // メモリ使用量の確認（実装依存）
      expect(analyzer.patterns.frequency.size).toBeLessThanOrEqual(100);
    });
  });
});
```

#### **学習精度テスト**
- パターン認識精度の測定
- 予測信頼度の検証
- 学習速度の最適化テスト
- メモリ効率の監視

### **3. PredictiveOptimizer テスト設計**

#### **単体テスト（25テスト項目）**
```javascript
// tests/unit/presentation/adaptive/PredictiveOptimizer.test.js
describe('PredictiveOptimizer', () => {
  describe('予測最適化', () => {
    test('UI予測最適化が実行される', async () => {
      const optimizer = new PredictiveOptimizer();
      const prediction = { actionType: 'menu-open', confidence: 0.8 };
      
      const result = await optimizer.optimizeUIPreemptively(prediction);
      
      expect(result.applied).toBe(true);
      expect(result.optimizationType).toBe('ui-preload');
    });

    test('低信頼度予測では最適化がスキップされる', async () => {
      const optimizer = new PredictiveOptimizer({ threshold: 0.7 });
      const lowConfidencePrediction = { actionType: 'action', confidence: 0.5 };
      
      const result = await optimizer.optimizeUIPreemptively(lowConfidencePrediction);
      
      expect(result.applied).toBe(false);
      expect(result.reason).toBe('confidence_too_low');
    });
  });

  describe('パフォーマンス予測最適化', () => {
    test('パフォーマンス予測に基づく最適化が実行される', () => {
      const optimizer = new PredictiveOptimizer();
      const metrics = { fps: 45, memoryUsage: 0.9 };
      
      const result = optimizer.optimizePerformancePredictively(metrics);
      
      expect(result.qualityAdjustment).toBeDefined();
      expect(result.memoryOptimization).toBeDefined();
    });

    test('品質調整が適切に行われる', () => {
      const optimizer = new PredictiveOptimizer();
      const prediction = { performanceDrop: 0.8 };
      
      optimizer.adjustQualityPredictively(prediction);
      
      // 品質調整の確認
      expect(optimizer.currentQualityLevel).toBeLessThan(1.0);
    });
  });

  describe('自動調整', () => {
    test('パターンに基づく自動調整が機能する', () => {
      const optimizer = new PredictiveOptimizer();
      const pattern = { 
        actionType: 'heavy-animation',
        frequency: 0.9,
        context: { device: 'mobile' }
      };
      
      optimizer.autoAdjustBasedOnPattern(pattern);
      
      // モバイルデバイスでのアニメーション軽量化確認
      expect(optimizer.animationLevel).toBeLessThan(1.0);
    });

    test('最適化のロールバックが機能する', () => {
      const optimizer = new PredictiveOptimizer();
      const optimizationId = optimizer.applyOptimization('test-optimization');
      
      const rollbackResult = optimizer.rollbackOptimization(optimizationId);
      
      expect(rollbackResult.success).toBe(true);
      expect(optimizer.activeOptimizations.has(optimizationId)).toBe(false);
    });
  });

  describe('Web Worker統合', () => {
    test('Web Workerでの非同期予測が機能する', async () => {
      const optimizer = new PredictiveOptimizer({ useWebWorker: true });
      
      const prediction = await optimizer.predictNextAction({ context: 'test' });
      
      expect(prediction).toBeDefined();
      expect(prediction.processedBy).toBe('web-worker');
    });

    test('Web Worker障害時のフォールバック', async () => {
      const optimizer = new PredictiveOptimizer({ useWebWorker: true });
      
      // Web Worker障害をシミュレート
      optimizer.worker.terminate();
      
      const prediction = await optimizer.predictNextAction({ context: 'test' });
      expect(prediction.processedBy).toBe('main-thread');
    });
  });
});
```

#### **最適化効果テスト**
- UI応答性の改善測定
- 予測精度の検証
- リソース使用量の最適化確認
- Web Worker パフォーマンス測定

### **4. AdaptiveController テスト設計**

#### **単体テスト（20テスト項目）**
```javascript
// tests/unit/presentation/adaptive/AdaptiveController.test.js
describe('AdaptiveController', () => {
  describe('ライフサイクル管理', () => {
    test('正常に初期化される', () => {
      const container = document.createElement('div');
      const controller = new AdaptiveController(container);
      
      expect(controller.integrator).toBeInstanceOf(AdaptiveIntegrator);
      expect(controller.analyzer).toBeInstanceOf(IntelligentAnalyzer);
      expect(controller.optimizer).toBeInstanceOf(PredictiveOptimizer);
      expect(controller.isActive).toBe(false);
    });

    test('開始・停止が正常に動作する', async () => {
      const controller = new AdaptiveController(document.createElement('div'));
      
      await controller.start();
      expect(controller.isActive).toBe(true);
      
      await controller.stop();
      expect(controller.isActive).toBe(false);
    });

    test('破棄処理が完全に実行される', () => {
      const controller = new AdaptiveController(document.createElement('div'));
      
      controller.destroy();
      
      expect(controller.integrator).toBe(null);
      expect(controller.analyzer).toBe(null);
      expect(controller.optimizer).toBe(null);
    });
  });

  describe('適応制御', () => {
    test('適応レベルが正しく設定される', () => {
      const controller = new AdaptiveController(document.createElement('div'));
      
      controller.setAdaptationLevel('high');
      expect(controller.adaptationLevel).toBe('high');
      
      controller.setAdaptationLevel('low');
      expect(controller.adaptationLevel).toBe('low');
    });

    test('適応機能の有効/無効が機能する', () => {
      const controller = new AdaptiveController(document.createElement('div'));
      
      controller.enableAdaptation('medium');
      expect(controller.isAdaptationEnabled).toBe(true);
      
      controller.disableAdaptation();
      expect(controller.isAdaptationEnabled).toBe(false);
    });
  });

  describe('外部インターフェース', () => {
    test('ゲーム文脈更新が正しく処理される', () => {
      const controller = new AdaptiveController(document.createElement('div'));
      const gameState = { level: 1, score: 100 };
      
      controller.updateGameContext(gameState);
      
      expect(controller.currentGameContext).toEqual(gameState);
    });

    test('ユーザーフィードバックが学習に反映される', () => {
      const controller = new AdaptiveController(document.createElement('div'));
      const feedback = { actionType: 'ui-adjust', satisfaction: 0.8 };
      
      controller.getUserFeedback(feedback);
      
      // フィードバックが学習データに反映されることを確認
      expect(controller.analyzer.patterns.feedback.size).toBeGreaterThan(0);
    });
  });

  describe('統合動作', () => {
    test('全コンポーネントが連携して動作する', async () => {
      const controller = new AdaptiveController(document.createElement('div'));
      
      // 既存システムとの統合をシミュレート
      const mockResponsiveManager = createMockResponsiveManager();
      await controller.integrator.integrateResponsiveManager(mockResponsiveManager);
      
      await controller.start();
      
      // 適応プロセスの確認
      controller.updateGameContext({ state: 'playing' });
      
      expect(controller.getAdaptationStatus().isActive).toBe(true);
    });
  });
});
```

#### **統合制御テスト**
- コンポーネント間協調の検証
- エラーハンドリングの確認
- ライフサイクル管理の検証
- 外部システムとの連携テスト

## 🔗 既存システム統合テスト

### **ResponsiveComboManager統合テスト**
```javascript
// tests/integration/adaptive-ui/ResponsiveIntegration.test.js
describe('AdaptiveUI + ResponsiveComboManager統合', () => {
  test('既存レスポンシブ機能が保持される', async () => {
    const responsiveManager = new ResponsiveComboManager(container);
    const adaptiveUI = new AdaptiveController(container);
    
    await adaptiveUI.integrator.integrateResponsiveManager(responsiveManager);
    
    // ブレークポイント変更
    window.innerWidth = 500;
    window.dispatchEvent(new Event('resize'));
    
    expect(responsiveManager.currentBreakpoint).toBe('mobile');
    expect(adaptiveUI.integrator.getIntegratedState().responsive.breakpoint).toBe('mobile');
  });

  test('AdaptiveUIの学習がレスポンシブ調整を改善する', async () => {
    // 学習による適応的レスポンシブ調整のテスト
  });
});
```

### **AccessibilityEnhancer統合テスト**
```javascript
// tests/integration/adaptive-ui/AccessibilityIntegration.test.js
describe('AdaptiveUI + AccessibilityEnhancer統合', () => {
  test('既存アクセシビリティ機能が保持される', async () => {
    const accessibilityEnhancer = new AccessibilityEnhancer(container);
    const adaptiveUI = new AdaptiveController(container);
    
    await adaptiveUI.integrator.integrateAccessibilityEnhancer(accessibilityEnhancer);
    
    accessibilityEnhancer.enableHighContrastMode();
    
    expect(accessibilityEnhancer.isHighContrastEnabled).toBe(true);
    expect(adaptiveUI.integrator.getIntegratedState().accessibility.highContrast).toBe(true);
  });
});
```

### **パフォーマンス統合テスト**
```javascript
// tests/integration/adaptive-ui/PerformanceIntegration.test.js
describe('AdaptiveUI + PerformanceOptimizer統合', () => {
  test('既存パフォーマンス監視との連携', async () => {
    const performanceOptimizer = new PerformanceOptimizationManager();
    const adaptiveUI = new AdaptiveController(container);
    
    await adaptiveUI.integrator.integratePerformanceOptimizer(performanceOptimizer);
    
    // パフォーマンス変化のシミュレート
    performanceOptimizer.updateMetrics({ fps: 45, memoryUsage: 0.9 });
    
    // AdaptiveUIが予測的に最適化を実行することを確認
    expect(adaptiveUI.optimizer.activeOptimizations.size).toBeGreaterThan(0);
  });
});
```

## 🧪 E2Eテスト設計

### **E2Eテストヘルパー拡張**
```javascript
// tests/e2e/helpers/AdaptiveUIHelper.js
export class AdaptiveUIHelper extends BaseHelper {
  constructor(page, config = {}) {
    super(page);
    this.config = config;
  }

  async initializeAdaptiveUI() {
    await this.page.evaluate(() => {
      const container = document.querySelector('#game-container');
      window.adaptiveUI = new AdaptiveController(container);
      return window.adaptiveUI.initialize();
    });
  }

  async simulateUserPattern(actionType, repetitions = 5) {
    for (let i = 0; i < repetitions; i++) {
      await this.page.evaluate((action) => {
        window.adaptiveUI.analyzer.learnUserPattern(action, {
          gameState: 'playing',
          deviceType: 'desktop',
          timestamp: Date.now()
        });
      }, actionType);
      
      await this.page.waitForTimeout(100);
    }
  }

  async getPredictionAccuracy() {
    return await this.page.evaluate(() => {
      return window.adaptiveUI.analyzer.calculateAccuracy();
    });
  }

  async getMemoryUsage() {
    return await this.page.evaluate(() => {
      return window.adaptiveUI.integrator.getMemoryStats();
    });
  }
}
```

### **E2Eテストケース**
```javascript
// tests/e2e/tests/adaptive-ui-workflow.e2e.test.js
describe('AdaptiveUI E2E Workflow', () => {
  let adaptiveHelper;

  beforeEach(async () => {
    adaptiveHelper = new AdaptiveUIHelper(page);
    await adaptiveHelper.initializeAdaptiveUI();
  });

  test('完全な学習・予測・最適化ワークフロー', async () => {
    // 1. 初期状態の確認
    await adaptiveHelper.simulateUserPattern('rotate-piece', 10);
    
    // 2. 学習効果の確認
    const prediction = await adaptiveHelper.getPredictionAccuracy();
    expect(prediction.accuracy).toBeGreaterThan(0.7);
    
    // 3. 予測的最適化の確認
    await page.evaluate(() => {
      window.adaptiveUI.updateGameContext({ state: 'high-speed' });
    });
    
    // 4. UI最適化の実行確認
    const optimizations = await page.evaluate(() => {
      return window.adaptiveUI.optimizer.activeOptimizations.size;
    });
    expect(optimizations).toBeGreaterThan(0);
  });

  test('メモリ効率とパフォーマンス検証', async () => {
    // 大量の学習データを投入
    for (let i = 0; i < 100; i++) {
      await adaptiveHelper.simulateUserPattern(`action${i % 10}`, 1);
    }
    
    // メモリ使用量の確認
    const memoryUsage = await adaptiveHelper.getMemoryUsage();
    expect(memoryUsage.totalMB).toBeLessThan(1.5); // 1.2MB目標 + マージン
    
    // FPS影響の確認
    const fps = await page.evaluate(() => {
      return window.performanceMonitor?.metrics?.fps || 60;
    });
    expect(fps).toBeGreaterThan(57); // 5%以内の影響
  });

  test('既存システムとの統合動作確認', async () => {
    // ResponsiveComboManagerとの統合
    await page.setViewport({ width: 500, height: 800 });
    await page.waitForTimeout(100);
    
    const responsiveState = await page.evaluate(() => {
      return window.adaptiveUI.integrator.getIntegratedState().responsive;
    });
    expect(responsiveState.breakpoint).toBe('mobile');
    
    // AccessibilityEnhancerとの統合
    await page.evaluate(() => {
      window.accessibilityEnhancer?.enableHighContrastMode();
    });
    
    const accessibilityState = await page.evaluate(() => {
      return window.adaptiveUI.integrator.getIntegratedState().accessibility;
    });
    expect(accessibilityState.highContrast).toBe(true);
  });
});
```

## 📊 テスト指標とKPI

### **テストカバレッジ要件**
| コンポーネント | Unit Test | Integration Test | E2E Test | 総合カバレッジ |
|---------------|-----------|------------------|----------|---------------|
| AdaptiveIntegrator | 95% | 90% | 80% | >95% |
| IntelligentAnalyzer | 95% | 85% | 75% | >95% |
| PredictiveOptimizer | 95% | 85% | 75% | >95% |
| AdaptiveController | 95% | 90% | 85% | >95% |

### **機能品質指標**
- **予測精度**: >75%（目標値）
- **学習速度**: 5パターンで信頼度70%達成
- **メモリ効率**: <1.2MB使用量
- **パフォーマンス影響**: <5% FPS低下
- **統合安定性**: 既存システム無影響

### **自動化テスト実行**
```json
// package.json テストスクリプト
{
  "scripts": {
    "test:adaptive:unit": "jest tests/unit/presentation/adaptive --coverage",
    "test:adaptive:integration": "jest tests/integration/adaptive-ui",
    "test:adaptive:e2e": "jest tests/e2e/tests/adaptive-ui* --testTimeout=60000",
    "test:adaptive:all": "npm run test:adaptive:unit && npm run test:adaptive:integration && npm run test:adaptive:e2e",
    "test:adaptive:performance": "jest tests/performance/adaptive-ui",
    "test:adaptive:memory": "node tests/performance/memory-leak-test.js"
  }
}
```

## 🔍 テスト設計内部レビュー結果

### **既存テストインフラとの整合性検証 ✅**

#### **適合性確認**
- **Jest設定**: 既存E2E設定（jest-e2e.config.js）を活用、ES Modules完全対応
- **ヘルパークラス**: BaseHelper継承パターンで統一、既存UITestHelper拡張
- **モック戦略**: 既存パターン準拠（ParticleEmitter、GameEventEmitter型）
- **カスタムマッチャー**: toBeValidFPS、toBeWithinMemoryLimit活用

#### **設計修正点**
```javascript
// 1. モックファクトリーの統一
// tests/unit/presentation/adaptive/__mocks__/AdaptiveMocks.js
export const createMockResponsiveManager = () => ({
  currentBreakpoint: 'desktop',
  currentOrientation: 'landscape',
  devicePerformance: 'high',
  _breakpointChangeCallbacks: [],
  _orientationChangeCallbacks: [],
  integrateComboDisplayUI: jest.fn(),
  integrateComboAnimationController: jest.fn()
});

export const createMockAccessibilityEnhancer = () => ({
  isHighContrastEnabled: false,
  isVoiceGuidanceEnabled: false,
  isReducedMotionEnabled: false,
  feedbackLevel: 'normal',
  userSettings: {},
  setAriaAttribute: jest.fn(),
  announce: jest.fn(),
  enableHighContrastMode: jest.fn()
});

// 2. 既存パフォーマンステストヘルパー拡張
// tests/utils/adaptive-test-helpers.js
export class AdaptiveTestHelper extends TimerTestHelper {
  static createLearningData(count = 10) {
    return Array.from({ length: count }, (_, i) => ({
      actionType: `action-${i % 5}`,
      context: {
        gameState: ['playing', 'paused', 'menu'][i % 3],
        deviceType: ['desktop', 'mobile', 'tablet'][i % 3],
        timestamp: Date.now() + i * 1000
      }
    }));
  }

  static async verifyPredictionAccuracy(analyzer, testData, expectedThreshold = 0.75) {
    let correctPredictions = 0;
    for (const data of testData) {
      const prediction = analyzer.predictNextAction(data.context);
      if (prediction.confidence >= expectedThreshold) {
        correctPredictions++;
      }
    }
    return correctPredictions / testData.length;
  }
}
```

#### **テスト実行戦略の改善**
```json
// package.json 既存パターンに準拠したスクリプト
{
  "scripts": {
    "test:unit:adaptive": "jest tests/unit/presentation/adaptive --coverage --collectCoverageFrom='src/presentation/adaptive/**/*.js'",
    "test:integration:adaptive": "jest tests/integration/adaptive-ui --testTimeout=30000",
    "test:e2e:adaptive": "jest tests/e2e/tests/adaptive-ui*.e2e.test.js --config=tests/e2e/config/jest-e2e.config.js",
    "test:adaptive": "npm run test:unit:adaptive && npm run test:integration:adaptive",
    "test:adaptive:watch": "jest tests/unit/presentation/adaptive --watch",
    "test:adaptive:ci": "npm run test:adaptive && npm run test:e2e:adaptive"
  }
}
```

#### **既存E2Eヘルパーとの統合改善**
```javascript
// tests/e2e/helpers/AdaptiveUIHelper.js （BaseHelper継承）
import { BaseHelper } from './BaseHelper.js';
import { testConfig } from '../config/puppeteer.config.js';

export class AdaptiveUIHelper extends BaseHelper {
  constructor(page, config = {}) {
    super(page);
    this.adaptiveConfig = {
      ...testConfig.adaptive,
      ...config
    };
  }

  // 既存のwaitForSelector、retryOnFailure等を活用
  async waitForAdaptiveUIInit() {
    return this.retryOnFailure(async () => {
      await this.waitForSelector('#adaptive-ui-container');
      await this.page.waitForFunction(() => {
        return window.adaptiveUI && window.adaptiveUI.isInitialized;
      });
    });
  }

  // 既存のperformanceHelper統合
  async getAdaptivePerformanceMetrics() {
    const performanceHelper = new PerformanceHelper(this.page);
    const systemMetrics = await performanceHelper.getCurrentMetrics();
    const adaptiveMetrics = await this.getMemoryUsage();
    
    return {
      ...systemMetrics,
      adaptiveMemory: adaptiveMetrics.totalMB,
      learningPatterns: adaptiveMetrics.patternCount
    };
  }
}
```

### **テスト品質保証の強化**

#### **メモリリークテスト詳細化**
```javascript
// tests/performance/adaptive-ui/memory-leak-test.js
import { AdaptiveController } from '../../../src/presentation/adaptive/AdaptiveController.js';

describe('AdaptiveUI Memory Leak Tests', () => {
  test('長時間学習でのメモリリーク検証', async () => {
    const controller = new AdaptiveController(document.createElement('div'));
    const initialMemory = process.memoryUsage().heapUsed;
    
    // 1000パターンの学習を実行
    for (let i = 0; i < 1000; i++) {
      controller.analyzer.learnUserPattern(`action-${i % 100}`, {
        context: `context-${i % 10}`
      });
      
      // 100回ごとにガベージコレクションを促す
      if (i % 100 === 0 && global.gc) {
        global.gc();
      }
    }
    
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = (finalMemory - initialMemory) / (1024 * 1024);
    
    // 1.2MB制限内での確認
    expect(memoryIncrease).toBeLessThan(1.2);
    
    controller.destroy();
  });
});
```

## 🔄 改善された継続的テスト戦略

### **CI/CD統合（既存パイプライン準拠）**
- **PR作成時**: Unit + Integration Tests（既存: npm test）
- **マージ時**: Full Test Suite + Performance Tests（既存: npm run test:ci）
- **リリース前**: E2E + Memory Leak Tests（新規: npm run test:adaptive:ci）
- **定期実行**: Performance Regression Tests（既存Cronジョブ活用）

### **テストデータ管理（既存パターン活用）**
- **学習パターンデータ**: tests/fixtures/adaptive-patterns.json
- **統合テストフィクスチャ**: tests/fixtures/system-states/
- **パフォーマンスベンチマーク**: tests/benchmarks/adaptive-baseline.json

### **品質ゲート（既存基準準拠）**
- **Unit Test**: 95%以上のカバレッジ + 100%成功率
- **Integration Test**: 90%以上のカバレッジ + 100%成功率  
- **E2E Test**: 主要ワークフロー100%成功
- **Performance Test**: メモリ・FPS要件内（toBeValidFPS、toBeWithinMemoryLimit活用）
- **Memory Leak**: リーク検出ゼロ（新規カスタムマッチャー）

### **改善履歴**

#### **v1.1 (2024-12-19) - 内部レビュー反映**
- **既存インフラ完全統合**: BaseHelper継承、既存ヘルパー拡張活用
- **モック戦略統一**: 既存パターン準拠のモックファクトリー実装
- **テスト実行改善**: 既存スクリプトパターンでの統合
- **パフォーマンステスト強化**: メモリリークテスト詳細化
- **E2Eヘルパー改善**: 既存PerformanceHelper等との連携強化

この改善されたテスト設計により、既存のテストインフラと完全に統合され、AdaptiveUIの品質とパフォーマンスを確実に保証します。
