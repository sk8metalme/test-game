# ParticleSystem 設計ドキュメント

## 🎯 概要

`ParticleSystem`は、パーティクルシステム全体を統合するアプリケーション層のクラスです。全コンポーネントの管理、ライフサイクル制御、パフォーマンス監視を提供し、ゲームエンジンとパーティクルシステムの橋渡しを担います。

## 🏗️ アーキテクチャ

### クラス階層
```
ParticleSystem (Application Layer)
├── ParticlePool (Use Case) - パーティクル管理
├── ParticleEmitter (Use Case) - パーティクル発射
├── ParticleEffect (Use Case) - エフェクト管理
└── ParticleRenderer (Infrastructure) - 描画処理
```

### 依存関係
- **ParticlePool**: パーティクルの生成・管理
- **ParticleEmitter**: パーティクルの発射制御
- **ParticleEffect**: エフェクトの統合管理
- **ParticleRenderer**: パーティクルの描画
- **EventEmitter**: イベント通知

## 🔧 クラス定義

### プロパティ
```javascript
class ParticleSystem {
  // 基本設定
  name: string                    // システム名
  enabled: boolean               // 有効/無効フラグ
  maxEffects: number            // 最大エフェクト数
  
  // ライフサイクル状態
  isRunning: boolean            // 実行中フラグ
  isPaused: boolean             // 一時停止フラグ
  startTime: number             // 開始時刻
  totalRunTime: number          // 総実行時間
  
  // コンポーネント管理
  particlePool: ParticlePool    // パーティクルプール
  renderer: ParticleRenderer    // レンダラー
  effects: Map<string, ParticleEffect>  // エフェクト管理
  
  // パフォーマンス監視
  stats: {
    totalParticles: number      // 総パーティクル数
    activeEffects: number       // アクティブエフェクト数
    fps: number                 // 現在のFPS
    memoryUsage: number         // メモリ使用量
    lastUpdateTime: number      // 最後の更新時刻
  }
  
  // 設定
  config: {
    maxParticles: number        // 最大パーティクル数
    targetFPS: number          // 目標FPS
    enableOptimization: boolean // 最適化有効フラグ
    cleanupInterval: number     // クリーンアップ間隔
  }
}
```

### メソッド

#### ライフサイクル管理
```javascript
// システム制御
start(): void                   // システム開始
stop(): void                    // システム停止
pause(): void                   // 一時停止
resume(): void                  // 再開
restart(): void                 // 再起動

// 状態確認
isActive(): boolean             // アクティブ状態確認
getStatus(): string             // 現在の状態取得
```

#### エフェクト管理
```javascript
// エフェクト操作
addEffect(effect: ParticleEffect): boolean     // エフェクト追加
removeEffect(effectName: string): boolean      // エフェクト削除
getEffect(effectName: string): ParticleEffect  // エフェクト取得
getAllEffects(): ParticleEffect[]               // 全エフェクト取得
clearEffects(): void                           // 全エフェクト削除

// エフェクト制御
playEffect(effectName: string): boolean        // エフェクト再生
stopEffect(effectName: string): boolean        // エフェクト停止
pauseEffect(effectName: string): boolean       // エフェクト一時停止
```

#### システム更新
```javascript
// メインループ
update(deltaTime: number): void               // システム更新
render(): void                               // 描画実行

// 最適化
optimizeSystem(): void                       // システム最適化
cleanup(): void                              // クリーンアップ実行
```

#### 統計・監視
```javascript
// 統計情報
getSystemStats(): object                     // システム統計取得
getPerformanceMetrics(): object              // パフォーマンス指標取得
getMemoryUsage(): object                     // メモリ使用量取得

// 監視
startMonitoring(): void                      // 監視開始
stopMonitoring(): void                       // 監視停止
```

#### 設定管理
```javascript
// 設定操作
updateConfig(newConfig: object): void        // 設定更新
getConfig(): object                          // 設定取得
resetConfig(): void                          // 設定リセット
```

## 🔄 ライフサイクル

### 状態遷移
```
[初期化] → [停止] → [開始] → [実行中] → [一時停止] → [実行中] → [停止] → [終了]
    ↓         ↓        ↓         ↓           ↓           ↓        ↓        ↓
  new()    start()   update()  pause()    resume()   update()  stop()   destroy()
```

### 更新ループ
```javascript
while (isRunning && !isPaused) {
  const deltaTime = getDeltaTime();
  
  // 1. エフェクト更新
  updateEffects(deltaTime);
  
  // 2. パーティクル更新
  updateParticles(deltaTime);
  
  // 3. 描画実行
  render();
  
  // 4. 統計更新
  updateStats();
  
  // 5. 最適化チェック
  if (shouldOptimize()) {
    optimizeSystem();
  }
  
  // 6. クリーンアップ
  if (shouldCleanup()) {
    cleanup();
  }
}
```

## 📊 パフォーマンス最適化

### 最適化戦略
1. **フレームレート制御**: 目標FPSに基づく更新頻度調整
2. **LODシステム**: 距離に基づく描画品質調整
3. **バッチ処理**: 複数パーティクルの一括描画
4. **メモリ管理**: オブジェクトプールによる効率的なメモリ使用
5. **クリーンアップ**: 定期的な不要オブジェクトの削除

### 最適化トリガー
- パーティクル数が閾値を超えた場合
- FPSが目標値を下回った場合
- メモリ使用量が閾値を超えた場合
- 定期的なクリーンアップ間隔

## 🧪 テスト戦略

### テストカテゴリ
1. **初期化テスト**: コンストラクタと設定の動作確認
2. **ライフサイクルテスト**: 開始・停止・一時停止の動作確認
3. **エフェクト管理テスト**: エフェクトの追加・削除・制御
4. **統合テスト**: 全コンポーネントとの連携確認
5. **パフォーマンステスト**: 大量エフェクトでの動作確認
6. **エラーハンドリングテスト**: 異常系の処理確認

### テストケース例
```javascript
describe('ParticleSystem', () => {
  describe('初期化', () => {
    test('正常な設定でシステムが作成される', () => {});
    test('無効な設定値は適切に処理される', () => {});
  });
  
  describe('ライフサイクル管理', () => {
    test('システムが正しく開始される', () => {});
    test('システムが正しく停止される', () => {});
    test('一時停止と再開が正しく動作する', () => {});
  });
  
  describe('エフェクト管理', () => {
    test('エフェクトが正しく追加される', () => {});
    test('エフェクトが正しく削除される', () => {});
    test('複数エフェクトが同時実行される', () => {});
  });
  
  describe('統合テスト', () => {
    test('全コンポーネントが正しく連携する', () => {});
    test('大量パーティクルでの安定動作', () => {});
  });
});
```

## 🎮 使用例

### 基本的な使用例
```javascript
// システム作成
const particleSystem = new ParticleSystem({
  maxParticles: 1000,
  targetFPS: 60,
  enableOptimization: true
});

// エフェクト追加
const explosionEffect = new ParticleEffect({
  name: 'explosion',
  duration: 2000,
  loop: false
});

particleSystem.addEffect(explosionEffect);

// システム開始
particleSystem.start();

// エフェクト再生
particleSystem.playEffect('explosion');

// ゲームループ内で更新
function gameLoop() {
  const deltaTime = 16.67; // 60FPS
  particleSystem.update(deltaTime);
  particleSystem.render();
  
  requestAnimationFrame(gameLoop);
}
```

### ゲームイベントとの連携
```javascript
// ライン削除時のエフェクト
gameState.on('lineCleared', (lines) => {
  const lineEffect = createLineClearEffect(lines);
  particleSystem.addEffect(lineEffect);
  particleSystem.playEffect(lineEffect.name);
});

// T-Spin時のエフェクト
gameState.on('tSpin', () => {
  const tSpinEffect = createTSpinEffect();
  particleSystem.addEffect(tSpinEffect);
  particleSystem.playEffect(tSpinEffect.name);
});
```

## 🔮 将来の拡張

### 計画されている機能
1. **エフェクトテンプレート**: 事前定義されたエフェクトの再利用
2. **パーティクルシェーダー**: WebGLシェーダーによる高度な描画
3. **物理シミュレーション**: より現実的な物理演算
4. **音響連携**: パーティクルエフェクトと音の同期
5. **VR/AR対応**: 3D空間でのパーティクル表示

### パフォーマンス改善
1. **Web Workers**: バックグラウンドでの計算処理
2. **WebGL**: GPU加速による描画処理
3. **インスタンス描画**: 大量パーティクルの効率的描画
4. **空間分割**: 視界内パーティクルのみ描画
