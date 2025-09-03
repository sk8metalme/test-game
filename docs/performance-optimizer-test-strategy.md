# PerformanceOptimizer テスト設計戦略

## 📋 概要
PerformanceOptimizer Phase 1（Core基盤システム）の包括的テスト戦略。TDD原則に基づき、`PerformanceMonitor`および`PerformanceController`の品質保証を実現します。

## 🎯 テスト方針

### テスト設計原則
1. **TDD準拠**: Red-Green-Refactorサイクルの厳格な実施
2. **カバレッジ目標**: 95%以上のテストカバレッジ
3. **ブラウザ互換性**: 4ブラウザ対応テスト
4. **パフォーマンステスト**: 実際の性能要件検証
5. **統合テスト**: 既存システムとの連携検証

### テストピラミッド
```
     🔺 E2E Tests (5%)
    ────────────────
   🔺🔺 Integration Tests (25%)
  ─────────────────────────────
 🔺🔺🔺 Unit Tests (70%)
```

## 🧪 Unit Tests（単体テスト）

### RealtimePerformanceMonitor Tests

#### テストファイル: `tests/unit/core/PerformanceMonitor.test.js`

#### テストスイート構成
```javascript
describe('PerformanceMonitor', () => {
  describe('初期化', () => {
    // 6 tests
    it('デフォルト設定で正常に初期化される')
    it('カスタム設定で正常に初期化される')
    it('無効な設定値でエラーが発生する')
    it('イベントエミッター機能が初期化される')
    it('初期状態で監視が停止している')
    it('初期化時にメトリクスバッファが空である')
  })

  describe('監視制御', () => {
    // 8 tests
    it('監視を開始できる')
    it('監視を停止できる')
    it('監視を一時停止できる')
    it('監視を再開できる')
    it('重複開始時にエラーが発生する')
    it('未開始状態での停止でエラーが発生しない')
    it('監視間隔が正しく設定される')
    it('監視状態が正確に取得される')
  })

  describe('メトリクス収集', () => {
    // 12 tests
    it('FPSが正確に測定される')
    it('メモリ使用量が正確に測定される')
    it('CPU負荷推定が実行される')
    it('レンダリングメトリクスが収集される')
    it('ネットワークメトリクスが収集される')
    it('performance.memory未サポート環境で代替値が使用される')
    it('測定エラー時にフォールバック値が使用される')
    it('メトリクス収集が指定間隔で実行される')
    it('メトリクスデータ構造が正しい')
    it('タイムスタンプが正確に設定される')
    it('バッファサイズ制限が守られる')
    it('統計計算が正確に実行される')
  })

  describe('閾値監視', () => {
    // 6 tests
    it('FPS警告閾値が正しく検出される')
    it('FPS危険閾値が正しく検出される')
    it('メモリ警告閾値が正しく検出される')
    it('メモリ危険閾値が正しく検出される')
    it('閾値設定を動的に変更できる')
    it('複数閾値の同時検出が正しく処理される')
  })

  describe('イベント管理', () => {
    // 8 tests
    it('metricsイベントが正しく発生する')
    it('threshold-warningイベントが正しく発生する')
    it('threshold-criticalイベントが正しく発生する')
    it('イベントリスナーが正しく登録される')
    it('イベントリスナーが正しく削除される')
    it('複数リスナーが正しく処理される')
    it('イベントデータが正確に渡される')
    it('エラー時にもイベントが適切に処理される')
  })

  describe('データ管理', () => {
    // 6 tests
    it('履歴データが正しく記録される')
    it('履歴サイズ制限が守られる')
    it('平均値計算が正確に実行される')
    it('トレンド分析が正しく実行される')
    it('データ取得APIが正しく動作する')
    it('データクリア機能が正しく動作する')
  })

  describe('ブラウザ互換性', () => {
    // 8 tests
    it('Chrome環境で完全機能が動作する')
    it('Firefox環境で制限機能が動作する')
    it('Safari環境でフォールバック機能が動作する')
    it('Edge環境で完全機能が動作する')
    it('performance.memory未定義時の処理が正しい')
    it('performance.now未定義時の処理が正しい')
    it('古いブラウザでの代替実装が動作する')
    it('機能サポート状況が正しく報告される')
  })

  describe('エラーハンドリング', () => {
    // 6 tests
    it('メトリクス収集エラーが適切に処理される')
    it('イベント発生エラーが適切に処理される')
    it('設定検証エラーが適切に処理される')
    it('メモリ不足時の処理が正しい')
    it('例外発生時にもシステムが継続する')
    it('エラーログが適切に出力される')
  })

  describe('ライフサイクル', () => {
    // 4 tests
    it('破棄処理が正しく実行される')
    it('破棄後の操作でエラーが発生する')
    it('リソースが適切に解放される')
    it('破棄状態が正確に管理される')
  })
})
```

**総テスト数**: 64テスト

#### モック戦略
```javascript
const mockStrategy = {
  'performance.memory': {
    type: 'object mock',
    values: {
      usedJSHeapSize: 47185920,
      totalJSHeapSize: 52428800,
      jsHeapSizeLimit: 2172649472
    },
    undefinedTest: true
  },
  'performance.now': {
    type: 'function mock',
    returnValue: 'incremental timestamps',
    fallback: 'Date.now()'
  },
  'setInterval/clearInterval': {
    type: 'timer mocks',
    library: 'jest.useFakeTimers()',
    control: 'jest.advanceTimersByTime()'
  },
  'console.warn': {
    type: 'spy',
    purpose: 'error message verification'
  }
}
```

### RealtimePerformanceController Tests

#### テストファイル: `tests/unit/core/PerformanceController.test.js`

#### テストスイート構成
```javascript
describe('PerformanceController', () => {
  describe('初期化', () => {
    // 6 tests
    it('デフォルト設定で正常に初期化される')
    it('カスタム設定で正常に初期化される')
    it('無効な設定値でエラーが発生する')
    it('統合コンポーネントマップが初期化される')
    it('購読者リストが初期化される')
    it('統計データが初期化される')
  })

  describe('システム統合', () => {
    // 10 tests
    it('PerformanceMonitorを正しく統合できる')
    it('AdaptiveUIを正しく統合できる')
    it('PerformanceMonitorUIを正しく統合できる')
    it('重複統合時にエラーが発生する')
    it('未統合コンポーネントアクセスでエラーが発生する')
    it('統合状態が正確に取得される')
    it('統合検証が正しく実行される')
    it('統合済みコンポーネント一覧が取得される')
    it('統合解除が正しく実行される')
    it('統合後の自動セットアップが実行される')
  })

  describe('制御機能', () => {
    // 8 tests
    it('システム全体を開始できる')
    it('システム全体を停止できる')
    it('システム全体を一時停止できる')
    it('システム全体を再開できる')
    it('未統合状態での制御でエラーが発生する')
    it('制御状態が正確に管理される')
    it('段階的開始が正しく実行される')
    it('段階的停止が正しく実行される')
  })

  describe('データ配信', () => {
    // 12 tests
    it('メトリクス購読が正しく動作する')
    it('メトリクス購読解除が正しく動作する')
    it('メトリクス配信が正しく実行される')
    it('フィルタリング機能が正しく動作する')
    it('複数購読者への配信が正しく動作する')
    it('購読者エラー時の分離が正しく動作する')
    it('配信間隔制御が正しく動作する')
    it('最大購読者数制限が守られる')
    it('データ配信統計が正確に記録される')
    it('配信失敗時の再試行が実行される')
    it('AdaptiveUIへの配信が正しく動作する')
    it('MonitorUIへの配信が正しく動作する')
  })

  describe('最適化制御', () => {
    // 8 tests
    it('最適化要求が正しく処理される')
    it('最適化実行が正しく制御される')
    it('最適化履歴が正確に記録される')
    it('最適化状態が正確に取得される')
    it('同時最適化数制限が守られる')
    it('最適化クールダウンが正しく動作する')
    it('自動最適化が正しく動作する')
    it('最適化失敗時の処理が正しい')
  })

  describe('設定管理', () => {
    // 6 tests
    it('設定を動的に更新できる')
    it('設定をリセットできる')
    it('設定を取得できる')
    it('無効な設定値でエラーが発生する')
    it('設定変更が統合コンポーネントに反映される')
    it('設定バリデーションが正しく動作する')
  })

  describe('状態同期', () => {
    // 8 tests
    it('コンポーネント状態を同期できる')
    it('状態変更を検出できる')
    it('状態変更通知が正しく処理される')
    it('状態検証が正しく実行される')
    it('状態不整合時の修復が実行される')
    it('状態履歴が正確に記録される')
    it('同期間隔が正しく制御される')
    it('同期エラー時の処理が正しい')
  })

  describe('ヘルスモニタリング', () => {
    // 6 tests
    it('システム健全性チェックが実行される')
    it('コンポーネント応答性が監視される')
    it('異常検出時のアラートが発生する')
    it('自動復旧処理が実行される')
    it('ヘルス状態が正確に報告される')
    it('定期チェックが正しく動作する')
  })

  describe('統計とメトリクス', () => {
    // 6 tests
    it('システム統計が正確に記録される')
    it('パフォーマンスメトリクスが正確に計算される')
    it('統計データを取得できる')
    it('統計をリセットできる')
    it('統計履歴が適切に管理される')
    it('統計レポートが正しく生成される')
  })

  describe('エラーハンドリング', () => {
    // 8 tests
    it('統合エラーが適切に処理される')
    it('配信エラーが適切に処理される')
    it('最適化エラーが適切に処理される')
    it('設定エラーが適切に処理される')
    it('コンポーネントエラーの分離が正しい')
    it('エラー復旧処理が実行される')
    it('エラーログが適切に記録される')
    it('クリティカルエラー時の安全停止が実行される')
  })

  describe('ライフサイクル', () => {
    // 4 tests
    it('破棄処理が正しく実行される')
    it('破棄後の操作でエラーが発生する')
    it('統合コンポーネントが適切に破棄される')
    it('リソースが完全に解放される')
  })
})
```

**総テスト数**: 82テスト

#### モック戦略
```javascript
const controllerMockStrategy = {
  'PerformanceMonitor': {
    type: 'class mock',
    methods: ['startMonitoring', 'stopMonitoring', 'getCurrentMetrics', 'on', 'off', 'destroy'],
    events: ['metrics', 'threshold-warning', 'threshold-critical']
  },
  'AdaptiveController': {
    type: 'object mock',
    methods: ['updatePerformanceData', 'requestOptimization'],
    properties: ['isInitialized', 'config']
  },
  'PerformanceMonitorUI': {
    type: 'object mock',
    methods: ['updateDisplay', 'showAlert', 'updateSettings'],
    events: ['settingsChange', 'userInteraction']
  },
  'subscribers': {
    type: 'function mocks',
    purpose: 'callback testing',
    errorSimulation: true
  }
}
```

## 🔄 Integration Tests（統合テスト）

### テストファイル: `tests/integration/PerformanceOptimizer.integration.test.js`

#### テストシナリオ
```javascript
describe('PerformanceOptimizer Integration', () => {
  describe('Monitor-Controller統合', () => {
    // 8 tests
    it('MonitorからControllerへのデータ流れが正しい')
    it('閾値アラートがControllerに正しく伝播する')
    it('Controllerからの制御コマンドがMonitorに反映される')
    it('統合エラー時の分離が正しく動作する')
    it('設定変更が両コンポーネントに反映される')
    it('ライフサイクル同期が正しく動作する')
    it('パフォーマンス負荷が許容範囲内である')
    it('メモリリークが発生しない')
  })

  describe('AdaptiveUI統合', () => {
    // 6 tests
    it('パフォーマンスデータがAdaptiveUIに正しく配信される')
    it('AdaptiveUIからの最適化要求が処理される')
    it('データフィルタリングが正しく動作する')
    it('更新間隔制御が正しく動作する')
    it('AdaptiveUI接続/切断が正しく処理される')
    it('統合エラー時の自動復旧が動作する')
  })

  describe('PerformanceMonitorUI統合', () => {
    // 6 tests
    it('リアルタイムデータがUIに正しく表示される')
    it('UIからの設定変更が反映される')
    it('アラート表示が正しく動作する')
    it('ユーザーインタラクションが処理される')
    it('UI応答性が維持される')
    it('表示エラー時の処理が正しい')
  })

  describe('フルシステム統合', () => {
    // 5 tests
    it('全コンポーネント統合時の動作が正しい')
    it('高負荷時の安定性が維持される')
    it('システム全体のパフォーマンス要件を満たす')
    it('エラー伝播が適切に制御される')
    it('グレースフルシャットダウンが動作する')
  })
})
```

**総テスト数**: 25テスト

## 🌐 E2E Tests（エンドツーエンドテスト）

### テストファイル: `tests/e2e/performance-optimizer.e2e.test.js`

#### テストシナリオ
```javascript
describe('PerformanceOptimizer E2E', () => {
  describe('実環境パフォーマンス', () => {
    // 3 tests
    it('実際のゲーム環境でのパフォーマンス監視が動作する')
    it('高負荷シナリオでの自動最適化が動作する')
    it('ブラウザ間での一貫した動作が確認される')
  })

  describe('ユーザーシナリオ', () => {
    // 2 tests
    it('ゲームプレイ中のリアルタイム監視が動作する')
    it('設定変更がリアルタイムで反映される')
  })
})
```

**総テスト数**: 5テスト

## 📊 テスト実行計画

### テスト実行順序
1. **Unit Tests**: 個別コンポーネントの品質保証
   - PerformanceMonitor: 64テスト
   - PerformanceController: 82テスト
2. **Integration Tests**: コンポーネント間連携確認 (25テスト)
3. **E2E Tests**: 実環境動作確認 (5テスト)

### TDD実装フロー
```
1. Red Phase
   ├── PerformanceMonitor基本テスト作成 → 失敗確認
   ├── PerformanceController基本テスト作成 → 失敗確認
   └── 統合テスト作成 → 失敗確認

2. Green Phase
   ├── PerformanceMonitor実装 → テスト通過
   ├── PerformanceController実装 → テスト通過
   └── 統合調整 → 統合テスト通過

3. Refactor Phase
   ├── コード品質向上
   ├── パフォーマンス最適化
   └── 追加テストケース実装
```

## 🎯 品質目標

### カバレッジ目標
- **Line Coverage**: 95%以上
- **Branch Coverage**: 90%以上
- **Function Coverage**: 100%
- **Statement Coverage**: 95%以上

### パフォーマンス目標
- **テスト実行時間**: 45秒以内（Unit: 20秒、Integration: 20秒、E2E: 5秒）
- **並列実行**: Unit/Integration並列実行で実効30秒以内
- **メモリ使用量**: テスト環境で50MB以内
- **テスト成功率**: 99%以上

### テスト実行最適化戦略
```javascript
const testOptimization = {
  parallelization: {
    unitTests: 'jest --maxWorkers=4 --testPathPattern=unit',
    integrationTests: 'jest --maxWorkers=2 --testPathPattern=integration',
    e2eTests: 'jest --maxWorkers=1 --testPathPattern=e2e'
  },
  performance: {
    unitTestTimeout: 5000,      // 5秒/テスト
    integrationTimeout: 10000,  // 10秒/テスト  
    e2eTimeout: 30000,          // 30秒/テスト
    setupTimeout: 30000         // セットアップ30秒
  },
  optimization: {
    mockCaching: true,          // モックデータキャッシュ
    testDataReuse: true,        // テストデータ再利用
    lazyLoading: true,          // 遅延ロード
    memoryCleanup: 'afterEach'  // メモリクリーンアップ
  }
}
```

### 品質指標
- **ESLint**: 0エラー
- **Prettier**: 自動フォーマット適用
- **Type Safety**: JSDoc型注釈100%
- **Documentation**: APIドキュメント100%

## 🔧 テスト環境設定

### Jest設定統合
```javascript
// jest.config.performance.js (PerformanceOptimizer専用設定)
module.exports = {
  displayName: 'PerformanceOptimizer',
  testMatch: [
    '**/tests/unit/core/Performance*.test.js',
    '**/tests/integration/PerformanceOptimizer.integration.test.js'
  ],
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup/performance-test-setup.js',
    '<rootDir>/tests/helpers/PerformanceTestHelper.js'
  ],
  collectCoverageFrom: [
    'src/core/PerformanceMonitor.js',
    'src/core/PerformanceController.js'
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 100,
      lines: 95,
      statements: 95
    }
  },
  coverageDirectory: 'coverage/performance-optimizer',
  testEnvironment: 'jsdom',
  setupFiles: ['<rootDir>/tests/mocks/performance-mocks.js'],
  maxWorkers: 4,
  testTimeout: 10000,
  clearMocks: true,
  restoreMocks: true
};

// 既存jest.config.jsとの統合
// jest.config.js (プロジェクト全体)
module.exports = {
  projects: [
    '<rootDir>/jest.config.js',                    // 既存設定
    '<rootDir>/jest.config.performance.js',       // PerformanceOptimizer専用
    '<rootDir>/tests/e2e/jest-e2e.config.js'     // E2E専用
  ],
  collectCoverage: true,
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage'
};
```

### GitHub Actions CI/CD統合
```yaml
# .github/workflows/performance-optimizer-tests.yml
name: PerformanceOptimizer Tests

on:
  push:
    paths:
      - 'src/core/Performance*'
      - 'tests/unit/core/Performance*'
      - 'tests/integration/PerformanceOptimizer*'
  pull_request:
    paths:
      - 'src/core/Performance*'
      - 'tests/unit/core/Performance*'
      - 'tests/integration/PerformanceOptimizer*'

jobs:
  performance-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20]
        browser: [chrome, firefox]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run PerformanceOptimizer Unit Tests
      run: npm run test:performance:unit
      env:
        BROWSER_ENV: ${{ matrix.browser }}
    
    - name: Run PerformanceOptimizer Integration Tests
      run: npm run test:performance:integration
      env:
        BROWSER_ENV: ${{ matrix.browser }}
    
    - name: Generate Coverage Report
      run: npm run test:performance:coverage
    
    - name: Upload Coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/performance-optimizer/lcov.info
        flags: performance-optimizer
        name: codecov-performance-optimizer
```

### モック設定とテストデータ管理
```javascript
// tests/mocks/performance-mocks.js
// performance.memory mock
Object.defineProperty(window, 'performance', {
  value: {
    memory: {
      usedJSHeapSize: 47185920,
      totalJSHeapSize: 52428800,
      jsHeapSizeLimit: 2172649472
    },
    now: jest.fn(() => Date.now())
  },
  writable: true
});

// Timer mocks
jest.useFakeTimers();

// Console mocks
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn()
};
```

### テストデータファクトリー
```javascript
// tests/fixtures/performance-test-data.js
export const TestDataFactory = {
  createMetrics: (overrides = {}) => ({
    timestamp: Date.now(),
    fps: { current: 60, average: 58.5, min: 45, max: 60 },
    memory: { used: 45.2, total: 100.0, percentage: 45.2 },
    cpu: { usage: 35.5, supported: true },
    rendering: { drawCalls: 125, triangles: 15000 },
    network: { latency: 45, bandwidth: 1.5 },
    ...overrides
  }),
  
  createThresholds: (overrides = {}) => ({
    fps: { warning: 45, critical: 30 },
    memory: { warning: 80, critical: 100 },
    cpu: { warning: 70, critical: 90 },
    ...overrides
  }),
  
  createConfig: (overrides = {}) => ({
    monitoring: { interval: 100, bufferSize: 100 },
    thresholds: TestDataFactory.createThresholds(),
    alerts: { enableWarnings: true, enableCritical: true },
    ...overrides
  }),
  
  createErrorScenarios: () => ({
    memoryApiUndefined: () => { delete window.performance.memory; },
    performanceNowFailure: () => { window.performance.now.mockImplementation(() => { throw new Error('API Error'); }); },
    memoryExceeded: () => TestDataFactory.createMetrics({ memory: { percentage: 95 } }),
    fpsDropped: () => TestDataFactory.createMetrics({ fps: { current: 25, average: 28 } })
  })
};
```

### テストヘルパークラス
```javascript
// tests/helpers/PerformanceTestHelper.js
export class PerformanceTestHelper {
  constructor() {
    this.originalPerformance = window.performance;
    this.mockMetrics = [];
  }
  
  setupMockEnvironment(scenario = 'default') {
    const scenarios = {
      default: () => this.setupBasicMocks(),
      chrome: () => this.setupChromeMocks(),
      firefox: () => this.setupFirefoxMocks(),
      safari: () => this.setupSafariMocks(),
      error: () => this.setupErrorMocks()
    };
    scenarios[scenario]();
  }
  
  expectMetricsValid(metrics) {
    expect(metrics).toHaveProperty('timestamp');
    expect(metrics.timestamp).toBeGreaterThan(0);
    expect(metrics).toHaveProperty('fps');
    expect(metrics).toHaveProperty('memory');
    expect(metrics).toHaveProperty('cpu');
  }
  
  expectThresholdAlert(monitor, threshold, expectedType) {
    const alertSpy = jest.fn();
    monitor.on(`threshold-${expectedType}`, alertSpy);
    
    monitor._checkThresholds(TestDataFactory.createMetrics({
      fps: { current: threshold - 1 }
    }));
    
    expect(alertSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: expectedType })
    );
  }
  
  simulateTimeProgression(monitor, duration, interval) {
    const steps = Math.floor(duration / interval);
    for (let i = 0; i < steps; i++) {
      jest.advanceTimersByTime(interval);
      this.mockMetrics.push(TestDataFactory.createMetrics());
    }
  }
  
  cleanup() {
    window.performance = this.originalPerformance;
    this.mockMetrics = [];
    jest.clearAllMocks();
    jest.clearAllTimers();
  }
}
```

## 📋 テスト実施チェックリスト

### NPMスクリプト統合
```json
{
  "scripts": {
    "test:performance": "jest --config jest.config.performance.js",
    "test:performance:unit": "jest --config jest.config.performance.js --testPathPattern=unit",
    "test:performance:integration": "jest --config jest.config.performance.js --testPathPattern=integration",
    "test:performance:coverage": "jest --config jest.config.performance.js --coverage",
    "test:performance:watch": "jest --config jest.config.performance.js --watch",
    "test:performance:debug": "node --inspect-brk node_modules/.bin/jest --config jest.config.performance.js --runInBand"
  }
}
```

### 実装前チェック
- [ ] テスト環境セットアップ完了
- [ ] モック戦略実装完了
- [ ] テストデータファクトリー実装完了
- [ ] テストヘルパークラス実装完了
- [ ] Jest設定統合完了
- [ ] NPMスクリプト設定完了
- [ ] CI/CD統合確認完了

### 実装中チェック
- [ ] Red Phase: すべてのテストが失敗することを確認
- [ ] Green Phase: 最小実装でテストを通す
- [ ] Refactor Phase: コード品質とパフォーマンス向上

### 完了チェック
- [ ] カバレッジ目標達成 (95%以上)
- [ ] パフォーマンス要件達成
- [ ] ブラウザ互換性確認
- [ ] 統合テスト成功
- [ ] E2Eテスト成功
- [ ] ドキュメント更新完了

## 🎊 期待される成果

### テスト品質
- **総テスト数**: 176テスト (Unit: 146, Integration: 25, E2E: 5)
- **実行時間**: 30秒以内
- **成功率**: 99%以上

### コード品質
- **カバレッジ**: 95%以上
- **保守性**: 高い可読性と拡張性
- **安定性**: 各ブラウザでの一貫した動作

### 開発効率
- **TDD**: 設計品質の向上
- **CI/CD**: 自動品質保証
- **ドキュメント**: 包括的な仕様書

この包括的なテスト設計により、PerformanceOptimizerの高品質な実装を保証します。
