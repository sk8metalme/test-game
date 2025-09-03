# PerformanceOptimizer API リファレンス

## 📚 概要

PerformanceOptimizer Phase 2-3の6つのコンポーネントのAPIリファレンスです。各コンポーネントの初期化、メソッド、イベント、設定を詳細に説明します。

---

## 🏗️ アーキテクチャ

```javascript
// 基本的な使用例
import { PerformanceMonitor } from './core/RealtimePerformanceMonitor.js';
import { PerformanceController } from './core/RealtimePerformanceController.js';
import { AutoOptimizer } from './core/usecases/AutoOptimizer.js';
import { MemoryManager } from './core/usecases/MemoryManager.js';
import { QualityController } from './core/usecases/QualityController.js';
import { PredictiveAnalyzer } from './core/usecases/PredictiveAnalyzer.js';

// システム初期化
const performanceMonitor = new PerformanceMonitor(config);
const performanceController = new PerformanceController(performanceMonitor, config);
const autoOptimizer = new AutoOptimizer(performanceMonitor, configManager);
const memoryManager = new MemoryManager(objectPool, configManager);
const qualityController = new QualityController(effectManager, particleSystem, configManager);
const predictiveAnalyzer = new PredictiveAnalyzer(performanceMonitor, dataProcessor);
```

---

## 🔧 Core Components (Phase 1)

### PerformanceMonitor

**概要**: リアルタイムパフォーマンス監視システム

#### コンストラクタ
```javascript
constructor(config = {})
```

#### 主要メソッド
```javascript
// 監視制御
startMonitoring()                    // 監視開始
stopMonitoring()                     // 監視停止
pauseMonitoring()                    // 監視一時停止
resumeMonitoring()                   // 監視再開

// データ取得
getCurrentMetrics()                  // 現在のメトリクス取得
getHistoricalMetrics(timeRange)      // 履歴データ取得
getAverageMetrics(timeRange)         // 平均値取得
getTrendAnalysis(timeRange)          // トレンド分析

// 閾値管理
setThresholds(thresholds)            // 閾値設定
getThresholds()                      // 閾値取得
checkThresholds(metrics)             // 閾値チェック

// イベント管理
on(event, callback)                  // イベントリスナー登録
off(event, callback)                 // イベントリスナー削除
emit(event, data)                    // イベント発行

// ライフサイクル
destroy()                            // リソース解放
```

#### イベント
```javascript
// パフォーマンス関連
'fps.low'                           // FPS低下
'fps.critical'                      // FPS危険レベル
'memory.high'                       // メモリ使用量高
'memory.critical'                   // メモリ危険レベル

// システム関連
'monitoring.started'                // 監視開始
'monitoring.stopped'                // 監視停止
'threshold.exceeded'                // 閾値超過
```

#### 設定オプション
```javascript
const config = {
  monitoring: {
    interval: 16,                   // 監視間隔 (ms)
    historySize: 100,              // 履歴サイズ
    enableAutoStart: true          // 自動開始
  },
  thresholds: {
    fps: {
      warning: 45,                // FPS警告閾値
      critical: 30                // FPS危険閾値
    },
    memory: {
      warning: 80,                // メモリ警告閾値 (MB)
      critical: 100               // メモリ危険閾値 (MB)
    }
  }
};
```

### PerformanceController

**概要**: 統合制御・既存システム連携

#### コンストラクタ
```javascript
constructor(performanceMonitor, config = {})
```

#### 主要メソッド
```javascript
// 最適化実行
applyOptimization(optimization)      // 最適化適用
revertOptimization(optimizationId)   // 最適化取り消し
getActiveOptimizations()             // アクティブな最適化取得

// 設定管理
updateConfiguration(config)          // 設定更新
getConfiguration()                   // 設定取得
resetToDefaults()                    // デフォルト設定にリセット

// 統計
getOptimizationHistory()             // 最適化履歴
getPerformanceReport()               // パフォーマンスレポート

// ライフサイクル
initialize()                         // 初期化
destroy()                           // 破棄
```

---

## ⚡ Optimizers (Phase 2)

### AutoOptimizer

**概要**: 自動最適化エンジン

#### コンストラクタ
```javascript
constructor(performanceMonitor, configManager)
```

#### 主要メソッド
```javascript
// 最適化実行
async optimize(performanceData)      // メイン最適化メソッド
setOptimizationLevel(level)          // 最適化レベル設定
getOptimizationHistory()             // 最適化履歴取得

// 戦略管理
getAvailableStrategies()             // 利用可能戦略一覧
setStrategy(strategy)                // 戦略設定
getCurrentStrategy()                 // 現在の戦略取得

// 統計・レポート
getOptimizationReport()              // 最適化レポート
getEffectivenessMetrics()            // 効果測定メトリクス

// ライフサイクル
start()                             // 自動最適化開始
stop()                              // 自動最適化停止
destroy()                           // リソース解放
```

#### 最適化レベル
```javascript
'aggressive'                        // 積極的最適化
'moderate'                          // 中程度最適化
'conservative'                      // 保守的最適化
```

#### 使用例
```javascript
const autoOptimizer = new AutoOptimizer(performanceMonitor, configManager);

// 最適化レベル設定
autoOptimizer.setOptimizationLevel('moderate');

// パフォーマンスデータに基づく最適化
const performanceData = performanceMonitor.getCurrentMetrics();
await autoOptimizer.optimize(performanceData);

// 結果確認
const report = autoOptimizer.getOptimizationReport();
console.log(`最適化効果: ${report.improvement}%`);
```

### MemoryManager

**概要**: メモリ効率化システム

#### コンストラクタ
```javascript
constructor(objectPool, configManager)
```

#### 主要メソッド
```javascript
// メモリ管理
checkMemoryLeaks()                   // メモリリーク検出
forceGarbageCollection()             // 強制ガベージコレクション
optimizeMemory()                     // メモリ最適化実行

// プール管理
optimizeObjectPool()                 // ObjectPool最適化
resizePool(newSize)                  // プールサイズ調整
clearUnusedObjects()                 // 未使用オブジェクト削除

// 監視・レポート
getMemoryReport()                    // メモリレポート取得
getMemoryTrend()                     // メモリ使用傾向
shouldTriggerGC()                    // GC実行判定

// WeakRef管理
createWeakReference(object)          // WeakRef作成
cleanupWeakReferences()              // WeakRef クリーンアップ

// ライフサイクル
startMemoryTracking()                // メモリ追跡開始
stopMemoryTracking()                 // メモリ追跡停止
destroy()                           // リソース解放
```

#### 使用例
```javascript
const memoryManager = new MemoryManager(objectPool, configManager);

// メモリ追跡開始
memoryManager.startMemoryTracking();

// メモリリーク検出
const leaks = memoryManager.checkMemoryLeaks();
if (leaks.length > 0) {
  console.warn('メモリリーク検出:', leaks);
}

// 必要に応じて最適化実行
if (memoryManager.shouldTriggerGC()) {
  await memoryManager.forceGarbageCollection();
}

// レポート取得
const report = memoryManager.getMemoryReport();
console.log('メモリ使用状況:', report);
```

---

## 📊 Analytics (Phase 3)

### QualityController

**概要**: 動的品質調整システム

#### コンストラクタ
```javascript
constructor(effectManager, particleSystem, configManager)
```

#### 主要メソッド
```javascript
// 品質制御
setQualityLevel(level)               // 品質レベル設定
getQualityLevel()                    // 現在の品質レベル取得
adjustQualityBasedOnPerformance(performanceData) // パフォーマンスベース調整

// デバイス評価
benchmarkDevice()                    // デバイスベンチマーク実行
getDeviceCapabilities()              // デバイス能力取得
getRecommendedQuality()              // 推奨品質レベル取得

// 品質設定
applyQualitySettings(level)          // 品質設定適用
getQualitySettings(level)            // 品質設定取得
createCustomQuality(settings)        // カスタム品質作成

// 履歴・レポート
getQualityHistory()                  // 品質変更履歴
getQualityReport()                   // 品質レポート

// ライフサイクル
initialize()                         // 初期化
destroy()                           // 破棄
```

#### 品質レベル
```javascript
'high'                              // 高品質
'medium'                            // 中品質
'low'                               // 低品質
```

#### 使用例
```javascript
const qualityController = new QualityController(effectManager, particleSystem, configManager);

// デバイスベンチマーク
await qualityController.benchmarkDevice();
const recommended = qualityController.getRecommendedQuality();

// 推奨品質レベル設定
qualityController.setQualityLevel(recommended);

// パフォーマンスベース動的調整
const performanceData = performanceMonitor.getCurrentMetrics();
const result = qualityController.adjustQualityBasedOnPerformance(performanceData);

if (result.adjusted) {
  console.log(`品質を${result.from}から${result.to}に変更`);
}
```

### PredictiveAnalyzer

**概要**: パフォーマンス予測分析システム

#### コンストラクタ
```javascript
constructor(performanceMonitor, dataProcessor)
```

#### 主要メソッド
```javascript
// 予測分析
predictFuturePerformance(timeHorizon) // 将来パフォーマンス予測
analyzeBottlenecks()                 // ボトルネック分析
getOptimizationRecommendations()     // 最適化推奨取得

// 継続分析
startContinuousAnalysis()            // 継続分析開始
stopContinuousAnalysis()             // 継続分析停止
pauseAnalysis()                      // 分析一時停止

// アルゴリズム制御
setAlgorithm(algorithm)              // 予測アルゴリズム設定
getAvailableAlgorithms()             // 利用可能アルゴリズム取得
getAlgorithmAccuracy()               // アルゴリズム精度取得

// レポート・統計
getPredictionHistory()               // 予測履歴取得
getAnalysisReport()                  // 分析レポート取得
getConfidenceMetrics()               // 信頼度メトリクス

// ライフサイクル
initialize()                         // 初期化
destroy()                           // 破棄
```

#### 予測アルゴリズム
```javascript
'movingAverage'                     // 移動平均
'linearRegression'                  // 線形回帰
'exponentialSmoothing'              // 指数平滑化
'ensemble'                          // アンサンブル (デフォルト)
```

#### 使用例
```javascript
const predictiveAnalyzer = new PredictiveAnalyzer(performanceMonitor, dataProcessor);

// 継続分析開始
predictiveAnalyzer.startContinuousAnalysis();

// 将来パフォーマンス予測
const prediction = await predictiveAnalyzer.predictFuturePerformance(5000); // 5秒後予測
console.log(`予測FPS: ${prediction.fps}, 信頼度: ${prediction.confidence}`);

// ボトルネック分析
const bottlenecks = predictiveAnalyzer.analyzeBottlenecks();
bottlenecks.forEach(bottleneck => {
  console.log(`${bottleneck.type}: 深刻度 ${bottleneck.severity}`);
});

// 最適化推奨取得
const recommendations = predictiveAnalyzer.getOptimizationRecommendations();
recommendations.immediate.forEach(rec => {
  console.log(`即座推奨: ${rec.action} (優先度: ${rec.priority})`);
});
```

---

## 🔗 統合使用例

### 完全システム初期化
```javascript
// 1. 基盤システム初期化
const performanceMonitor = new PerformanceMonitor({
  monitoring: { interval: 16, historySize: 100 },
  thresholds: { fps: { warning: 45, critical: 30 } }
});

const performanceController = new PerformanceController(performanceMonitor);

// 2. 最適化エンジン初期化
const autoOptimizer = new AutoOptimizer(performanceMonitor, configManager);
const memoryManager = new MemoryManager(objectPool, configManager);

// 3. 分析システム初期化
const qualityController = new QualityController(effectManager, particleSystem, configManager);
const predictiveAnalyzer = new PredictiveAnalyzer(performanceMonitor, dataProcessor);

// 4. システム開始
await performanceMonitor.startMonitoring();
await autoOptimizer.start();
await memoryManager.startMemoryTracking();
await qualityController.initialize();
await predictiveAnalyzer.startContinuousAnalysis();
```

### 統合ワークフロー
```javascript
// パフォーマンス監視イベント処理
performanceMonitor.on('fps.low', async (data) => {
  // 1. 予測分析実行
  const prediction = await predictiveAnalyzer.predictFuturePerformance(3000);
  
  // 2. ボトルネック分析
  const bottlenecks = predictiveAnalyzer.analyzeBottlenecks();
  
  // 3. 品質調整
  const qualityResult = qualityController.adjustQualityBasedOnPerformance(data);
  
  // 4. 自動最適化
  if (prediction.confidence > 0.7) {
    await autoOptimizer.optimize(data);
  }
  
  // 5. メモリ最適化 (必要時)
  if (bottlenecks.some(b => b.type === 'memory')) {
    await memoryManager.optimizeMemory();
  }
});
```

### システム終了
```javascript
// 全システム安全終了
async function shutdown() {
  await predictiveAnalyzer.stopContinuousAnalysis();
  await autoOptimizer.stop();
  await memoryManager.stopMemoryTracking();
  await performanceMonitor.stopMonitoring();
  
  // リソース解放
  predictiveAnalyzer.destroy();
  qualityController.destroy();
  memoryManager.destroy();
  autoOptimizer.destroy();
  performanceController.destroy();
  performanceMonitor.destroy();
}
```

---

## 📋 設定オプション

### 共通設定
```javascript
const commonConfig = {
  // ログレベル
  logLevel: 'info',                 // 'debug', 'info', 'warn', 'error'
  
  // パフォーマンス設定
  performance: {
    targetFPS: 60,
    memoryLimit: 100,               // MB
    enablePrediction: true
  },
  
  // 品質設定
  quality: {
    autoAdjust: true,
    hysteresis: 3000,               // ms
    defaultLevel: 'medium'
  }
};
```

---

## 🚨 エラーハンドリング

### 一般的なエラー
```javascript
try {
  await autoOptimizer.optimize(performanceData);
} catch (error) {
  if (error.name === 'InvalidPerformanceData') {
    console.warn('無効なパフォーマンスデータ:', error.message);
  } else if (error.name === 'OptimizationFailed') {
    console.error('最適化失敗:', error.message);
  } else {
    console.error('予期しないエラー:', error);
  }
}
```

### エラータイプ
- `InvalidPerformanceData`: 無効なパフォーマンスデータ
- `OptimizationFailed`: 最適化処理失敗
- `MemoryOptimizationError`: メモリ最適化エラー
- `PredictionError`: 予測処理エラー
- `QualityAdjustmentError`: 品質調整エラー

---

## 📊 パフォーマンス考慮事項

### 推奨設定
- **監視間隔**: 16ms (60FPS対応)
- **履歴サイズ**: 100エントリ (約1.6秒分)
- **予測信頼度閾値**: 0.7以上
- **メモリ追跡間隔**: 1000ms

### 最適化のベストプラクティス
1. 継続監視は必要時のみ有効化
2. 予測分析の頻度を適切に調整
3. メモリ最適化は閾値ベースで実行
4. 品質調整にヒステリシスを活用

---

*このAPIリファレンスは、PerformanceOptimizer Phase 2-3の完全実装に基づいています。実際の使用時は、最新の実装状況を確認してください。*
