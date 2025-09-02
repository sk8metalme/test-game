# PJ 概要

## 🎯 パーティクルシステム実装計画

### 📋 実装概要
テトリスゲームに視覚的な魅力を追加するパーティクルシステムを実装します。既存のObjectPoolとOptimizedRendererを活用して、60FPSを維持しながら美しいエフェクトを提供します。

### 🏗️ アーキテクチャ設計
```
ParticleSystem (Application Layer)
├── Particle (Entity)
├── ParticlePool (Use Case)
├── ParticleEmitter (Use Case)
├── ParticleEffect (Use Case)
└── ParticleRenderer (Infrastructure)
```

### 🔧 実装ステップ

#### ステップ1: 基盤設計 ✅
- [x] ParticleSystemクラスの設計
- [x] Particleエンティティの設計
- [x] パーティクルライフサイクル管理

#### ステップ2: ParticlePool実装 ✅
- [x] ParticlePoolクラスの実装（ObjectPool拡張）
- [x] パーティクルプールの単体テスト
- [x] ObjectPoolとの統合テスト
- [x] パフォーマンステスト

#### ステップ3: エミッターシステム ✅
- [x] ParticleEmitterクラスの実装
- [x] 各種エミッター（爆発、光、煙など）
- [x] エミッター設定の管理

#### ステップ4: エフェクトシステム ✅
- [x] ParticleEffectクラスの実装
- [x] ライン削除エフェクト
- [x] T-Spinエフェクト
- [x] Perfect Clearエフェクト

#### ステップ5: レンダリング最適化 ✅
- [x] ParticleRendererの実装
- [x] ObjectPoolとの統合
- [x] パフォーマンス監視
- [x] LODシステムの実装

#### ステップ6: システム統合 ✅
- [x] ParticleSystemクラスの実装
- [x] 全コンポーネントの統合テスト
- [x] システム全体のパフォーマンステスト
- [x] 最終的なドキュメント更新

#### ステップ7: ゲームエフェクト実装 ✅
- [x] LineClearEffect（ライン削除エフェクト）
- [x] TSpinEffect（T-Spinエフェクト）
- [x] PerfectClearEffect（Perfect Clearエフェクト）
- [x] LevelUpEffect（レベルアップエフェクト）
- [x] GameOverEffect（ゲームオーバーエフェクト）
- [x] EffectManager（エフェクト管理システム）

#### ステップ8: ゲームイベントとの連携実装 ✅ (100%完了)
- [x] GameEventEmitterクラスの実装
- [x] GameEventIntegratorクラスの実装
- [x] GameLogicとのイベント連携
- [x] エフェクト自動実行システム
- [x] 統合テストの実装（100%成功）
- [x] イベント名統一（`level.up` dot notation）
- [x] 統計システム統合
- [x] main.jsでの完全統合（完了）

#### ステップ9: main.js初期化順序修正とエフェクト統合 ✅ (100%完了)
- [x] 初期化順序修正（EventEmitter → GameLogic → EffectManager）
- [x] EffectManager統合（キャンバス初期化後）
- [x] GameEventIntegrator統合（自動イベント連携）
- [x] キャンバスID統一（#main-canvas）
- [x] エラーハンドリング強化
- [x] 破棄処理追加（destroy()メソッド）
- [x] E2Eテスト環境構築
- [x] 全テスト成功確認（1326/1326）

### 📊 成功指標
- **パフォーマンス**: 60FPS維持（パーティクル1000個以上）
- **メモリ使用量**: 100MB以下
- **テストカバレッジ**: 95%以上
- **コード品質**: ESLintエラー0件

### 🎮 実装するエフェクト
1. **ライン削除**: 爆発効果、光の粒子 ✅
2. **T-Spin**: 特殊な光の効果 ✅
3. **Perfect Clear**: 壮大なクリア効果 ✅
4. **レベルアップ**: 祝福の効果 ✅
5. **ゲームオーバー**: 悲しい効果 ✅

## 🚀 現在のフェーズ: ゲームイベントとの連携実装

### 📋 ゲームイベント連携実装計画

#### 実装概要
GameLogicとEffectManagerを連携させ、ゲームイベントに応じて自動的にパーティクルエフェクトを実行するシステムを実装します。

#### 技術仕様
- **イベントシステム**: GameEventEmitterによるイベント配信
- **自動連携**: ゲームイベントとエフェクトの自動実行
- **設定管理**: エフェクトの有効/無効切り替え
- **パフォーマンス監視**: エフェクト実行時の性能監視
- **統合テスト**: 全システムの動作確認

#### 実装するメソッド
```javascript
class GameEventEmitter {
  constructor() { /* 初期化 */ }
  emit(eventName, data) { /* イベント配信 */ }
  on(eventName, callback) { /* イベントリスナー登録 */ }
  off(eventName, callback) { /* イベントリスナー削除 */ }
}

class GameEventIntegrator {
  constructor(gameLogic, effectManager) { /* 初期化 */ }
  integrate() { /* イベント連携設定 */ }
  handleLineClear(data) { /* ライン削除イベント処理 */ }
  handleTSpin(data) { /* T-Spinイベント処理 */ }
  handlePerfectClear(data) { /* Perfect Clearイベント処理 */ }
  handleLevelUp(data) { /* レベルアップイベント処理 */ }
  handleGameOver(data) { /* ゲームオーバーイベント処理 */ }
}
```

#### 連携するゲームイベント
1. **ライン削除イベント**: `checkAndClearLines()` → `line-clear`エフェクト
2. **T-Spinイベント**: SpecialRulesEngine → `t-spin`エフェクト
3. **Perfect Clearイベント**: SpecialRulesEngine → `perfect-clear`エフェクト
4. **レベルアップイベント**: `updateLines()` → `level-up`エフェクト
5. **ゲームオーバーイベント**: `spawnNextPiece()` → `game-over`エフェクト

#### テスト戦略
1. **単体テスト**: 各イベントハンドラーの動作確認
2. **統合テスト**: GameLogicとEffectManagerの連携確認
3. **パフォーマンステスト**: エフェクト実行時の性能確認
4. **イベントテスト**: イベント配信と受信の動作確認

#### 成功基準
- **テストカバレッジ**: 95%以上
- **パフォーマンス**: エフェクト実行時も60FPS維持
- **統合性**: 既存システムとの完全な互換性
- **安定性**: 長時間動作での安定性確保
- **自動化**: ゲームイベントとエフェクトの自動連携

### 🔗 連携アーキテクチャ
```
GameLogic → GameEventEmitter → EffectManager → ParticleSystem
     ↓              ↓              ↓              ↓
  イベント発生   イベント配信    エフェクト実行   パーティクル描画
```

### 📝 実装順序
1. **GameEventEmitter**: イベント配信システム
2. **GameEventIntegrator**: イベント連携システム
3. **GameLogic修正**: イベント発行の追加
4. **統合テスト**: 全システムの動作確認
5. **パフォーマンス最適化**: エフェクト実行時の最適化
