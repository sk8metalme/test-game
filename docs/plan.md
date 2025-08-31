# PJ 概要

## 🎯 パーティクルシステム実装計画

### 📋 実装概要
テトリスゲームに視覚的な魅力を追加するパーティクルシステムを実装します。既存のObjectPoolとOptimizedRendererを活用して、60FPSを維持しながら美しいエフェクトを提供します。

### 🏗️ アーキテクチャ設計
```
ParticleSystem (Application Layer)
├── Particle (Entity)
├── ParticleEmitter (Use Case)
├── ParticleEffect (Use Case)
└── ParticleRenderer (Infrastructure)
```

### 🔧 実装ステップ

#### ステップ1: 基盤設計 ✅
- [x] ParticleSystemクラスの設計
- [x] Particleエンティティの設計
- [x] パーティクルライフサイクル管理

#### ステップ2: ParticlePool実装 🔄
- [ ] ParticlePoolクラスの実装（ObjectPool拡張）
- [ ] パーティクルプールの単体テスト
- [ ] ObjectPoolとの統合テスト
- [ ] パフォーマンステスト

#### ステップ3: エミッターシステム
- [ ] ParticleEmitterクラスの実装
- [ ] 各種エミッター（爆発、光、煙など）
- [ ] エミッター設定の管理

#### ステップ4: エフェクトシステム
- [ ] ParticleEffectクラスの実装
- [ ] ライン削除エフェクト
- [ ] T-Spinエフェクト
- [ ] Perfect Clearエフェクト

#### ステップ5: レンダリング最適化
- [ ] ParticleRendererの実装
- [ ] ObjectPoolとの統合
- [ ] パフォーマンス監視
- [ ] LODシステムの実装

#### ステップ6: 統合テスト
- [ ] 単体テストの作成
- [ ] 統合テストの作成
- [ ] パフォーマンステストの作成

### 📊 成功指標
- **パフォーマンス**: 60FPS維持（パーティクル1000個以上）
- **メモリ使用量**: 100MB以下
- **テストカバレッジ**: 95%以上
- **コード品質**: ESLintエラー0件

### 🎮 実装するエフェクト
1. **ライン削除**: 爆発効果、光の粒子
2. **T-Spin**: 特殊な光の効果
3. **Perfect Clear**: 壮大なクリア効果
4. **レベルアップ**: 祝福の効果
5. **ゲームオーバー**: 悲しい効果

## 🚀 現在のフェーズ: ParticlePool実装

### 📋 ParticlePool実装計画

#### 実装概要
既存のObjectPoolクラスを拡張して、パーティクル専用のプールシステムを実装します。メモリ効率化とパフォーマンス向上を実現します。

#### 技術仕様
- **継承**: ObjectPoolクラスを継承
- **特殊化**: パーティクル固有の機能を追加
- **最適化**: パーティクルの生成・破棄を効率化
- **監視**: パフォーマンス指標の監視

#### 実装するメソッド
```javascript
class ParticlePool extends ObjectPool {
  constructor(config) { /* 初期化 */ }
  createParticle() { /* パーティクル作成 */ }
  resetParticle(particle) { /* パーティクルリセット */ }
  getActiveCount() { /* アクティブ数取得 */ }
  getPoolStats() { /* プール統計取得 */ }
  optimizePool() { /* プール最適化 */ }
}
```

#### テスト戦略
1. **単体テスト**: 各メソッドの動作確認
2. **統合テスト**: ObjectPoolとの連携確認
3. **パフォーマンステスト**: 大量パーティクルでの効率性確認
4. **メモリテスト**: メモリリークの検出

#### 成功基準
- **テストカバレッジ**: 95%以上
- **パフォーマンス**: 既存ObjectPoolと同等以上
- **メモリ効率**: ガベージコレクション圧力の軽減
- **統合性**: 既存システムとの完全な互換性
