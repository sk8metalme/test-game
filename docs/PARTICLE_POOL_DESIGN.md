# ParticlePool詳細設計書

## 📋 概要
既存のObjectPoolクラスを拡張して、パーティクル専用のプールシステムを実装します。メモリ効率化とパフォーマンス向上を実現し、大量のパーティクルを効率的に管理します。

## 🏗️ アーキテクチャ設計

### 継承関係
```
ObjectPool (基底クラス)
    ▲
ParticlePool (派生クラス)
```

### クラス設計

#### ParticlePoolクラス
```javascript
class ParticlePool extends ObjectPool {
  constructor(config) {
    // ObjectPoolの初期化
    super(
      () => new Particle(),           // createFn
      (particle) => particle.reset(), // resetFn
      config.initialSize || 100,      // initialSize
      config.maxSize || 1000          // maxSize
    );
    
    // パーティクル固有の設定
    this.particleConfig = config.particleConfig || {};
    this.particleType = config.particleType || 'default';
    this.autoOptimize = config.autoOptimize !== false;
    
    // パーティクル固有の統計
    this.particleStats = {
      totalEmitted: 0,
      totalRecycled: 0,
      averageLifeTime: 0,
      peakActiveCount: 0
    };
    
    // 最適化設定
    this.optimizationThreshold = config.optimizationThreshold || 0.8;
    this.cleanupInterval = config.cleanupInterval || 5000; // 5秒
    this._lastCleanup = Date.now();
  }
}
```

## 🔧 実装するメソッド

### 1. パーティクル管理メソッド

#### createParticle()
```javascript
/**
 * パーティクルを作成・取得
 * @param {Object} config - パーティクルの設定
 * @returns {Particle} パーティクルインスタンス
 */
createParticle(config = {}) {
  // ObjectPoolからパーティクルを取得
  const particle = this.acquire();
  
  // 設定を適用
  if (config) {
    particle.updateConfig(config);
  }
  
  // 統計を更新
  this.particleStats.totalEmitted++;
  this.particleStats.peakActiveCount = Math.max(
    this.particleStats.peakActiveCount, 
    this.activeCount
  );
  
  return particle;
}
```

#### resetParticle(particle)
```javascript
/**
 * パーティクルをリセットしてプールに返却
 * @param {Particle} particle - リセットするパーティクル
 */
resetParticle(particle) {
  if (!particle) return;
  
  // ライフタイム統計を更新
  this._updateLifeTimeStats(particle);
  
  // ObjectPoolに返却
  this.release(particle);
  
  // 統計を更新
  this.particleStats.totalRecycled++;
}
```

### 2. 統計・監視メソッド

#### getPoolStats()
```javascript
/**
 * プールの詳細統計を取得
 * @returns {Object} 統計情報
 */
getPoolStats() {
  const baseStats = super.getStats();
  
  return {
    ...baseStats,
    particleStats: { ...this.particleStats },
    particleType: this.particleType,
    autoOptimize: this.autoOptimize,
    optimizationThreshold: this.optimizationThreshold,
    lastCleanup: this._lastCleanup
  };
}
```

#### getActiveParticles()
```javascript
/**
 * アクティブなパーティクルのリストを取得
 * @returns {Array} アクティブなパーティクルの配列
 */
getActiveParticles() {
  // 注意: このメソッドはパフォーマンスに影響する可能性があります
  // 必要に応じて使用を制限してください
  return this._getActiveObjects();
}
```

### 3. 最適化メソッド

#### optimizePool()
```javascript
/**
 * プールの最適化を実行
 */
optimizePool() {
  const stats = this.getStats();
  
  // 使用率が高い場合はプールサイズを拡張
  if (stats.utilization > this.optimizationThreshold) {
    const newSize = Math.min(
      this.maxSize,
      Math.ceil(this.maxSize * 1.5)
    );
    this.resize(newSize);
  }
  
  // メモリ効率が低い場合はプールサイズを調整
  if (stats.memoryEfficiency < 0.1) {
    const newSize = Math.max(
      this.activeCount + 10,
      Math.ceil(this.maxSize * 0.7)
    );
    this.resize(newSize);
  }
  
  // クリーンアップ時間を更新
  this._lastCleanup = Date.now();
}
```

#### autoOptimize()
```javascript
/**
 * 自動最適化の実行
 */
autoOptimize() {
  if (!this.autoOptimize) return;
  
  const now = Date.now();
  if (now - this._lastCleanup > this.cleanupInterval) {
    this.optimizePool();
  }
}
```

### 4. パーティクル固有のメソッド

#### emitParticles(count, config)
```javascript
/**
 * 指定された数のパーティクルを一括発射
 * @param {number} count - 発射するパーティクル数
 * @param {Object} config - パーティクルの設定
 * @returns {Array} 発射されたパーティクルの配列
 */
emitParticles(count, config = {}) {
  const particles = [];
  
  for (let i = 0; i < count; i++) {
    const particle = this.createParticle(config);
    particles.push(particle);
  }
  
  return particles;
}
```

#### cleanupDeadParticles()
```javascript
/**
 * 死亡したパーティクルを自動クリーンアップ
 */
cleanupDeadParticles() {
  const activeParticles = this.getActiveParticles();
  const deadParticles = [];
  
  // 死亡したパーティクルを特定
  activeParticles.forEach(particle => {
    if (particle.isDead()) {
      deadParticles.push(particle);
    }
  });
  
  // 死亡したパーティクルをリセット
  deadParticles.forEach(particle => {
    this.resetParticle(particle);
  });
  
  return deadParticles.length;
}
```

## 📊 パフォーマンス最適化

### 1. メモリ管理
- **オブジェクト再利用**: パーティクルの生成・破棄を最小限に抑制
- **プールサイズ調整**: 使用状況に応じた動的サイズ調整
- **ガベージコレクション**: 圧力の軽減

### 2. 統計監視
- **リアルタイム監視**: プールの使用状況を継続監視
- **自動最適化**: 設定された閾値に基づく自動調整
- **パフォーマンス警告**: 問題の早期発見

### 3. クリーンアップ戦略
- **定期的クリーンアップ**: 設定可能な間隔での自動クリーンアップ
- **死亡パーティクル検出**: 自動的な死亡パーティクルの回収
- **メモリリーク防止**: 適切なリソース管理

## 🧪 テスト設計

### 1. 単体テスト
- **初期化テスト**: コンストラクタの動作確認
- **パーティクル作成テスト**: createParticleメソッドの動作確認
- **パーティクルリセットテスト**: resetParticleメソッドの動作確認
- **統計取得テスト**: getPoolStatsメソッドの動作確認

### 2. 統合テスト
- **ObjectPool継承テスト**: 基底クラスとの連携確認
- **Particle統合テスト**: Particleエンティティとの連携確認
- **パフォーマンス統合テスト**: 大量パーティクルでの動作確認

### 3. パフォーマンステスト
- **大量パーティクルテスト**: 1000パーティクルでの効率性確認
- **メモリ使用量テスト**: メモリリークの検出
- **最適化テスト**: 自動最適化の効果測定

## 🎯 成功基準

### 技術的基準
- **テストカバレッジ**: 95%以上
- **パフォーマンス**: 既存ObjectPoolと同等以上
- **メモリ効率**: ガベージコレクション圧力の軽減
- **統合性**: 既存システムとの完全な互換性

### 品質基準
- **ESLint**: エラー0件
- **JSDoc**: 全メソッドにドキュメント
- **エラーハンドリング**: 包括的な例外処理
- **パフォーマンス監視**: 継続的な性能測定

## 🚀 実装順序

1. **ParticlePoolクラスの基本実装**
2. **ObjectPool継承の実装**
3. **パーティクル管理メソッドの実装**
4. **統計・監視メソッドの実装**
5. **最適化メソッドの実装**
6. **単体テストの作成**
7. **統合テストの作成**
8. **パフォーマンステストの作成**

## 📚 参考資料

- [ObjectPool実装](src/core/usecases/ObjectPool.js)
- [Particleエンティティ](src/core/entities/Particle.js)
- [Object Pool Pattern](https://en.wikipedia.org/wiki/Object_pool_pattern)
- [JavaScript Performance](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Performance)
