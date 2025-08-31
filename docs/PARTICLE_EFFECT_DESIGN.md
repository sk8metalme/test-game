# ParticleEffect 詳細設計書

## 📋 概要
ParticleEffectクラスは、パーティクルシステムのエフェクト管理を担当します。複数のParticleEmitterを組み合わせて、複雑な視覚効果を作成・制御します。

## 🏗️ クラス設計

### クラス定義
```javascript
export default class ParticleEffect {
  constructor(config = {}) {
    // 基本設定
    this.name = config.name || 'unnamed';
    this.duration = config.duration || -1; // -1 = 無限
    this.loop = config.loop || false;
    
    // エミッター管理
    this.emitters = [];
    this.emitterMap = new Map(); // 名前による高速検索
    
    // 状態管理
    this.active = false;
    this.startTime = 0;
    this.elapsedTime = 0;
    this.currentLoop = 0;
    
    // 統計情報
    this.stats = {
      totalRuns: 0,
      totalDuration: 0,
      averageDuration: 0,
      lastRunDuration: 0
    };
    
    // 内部状態
    this._isInitialized = true;
    this._lastUpdateTime = Date.now();
  }
}
```

### プロパティ詳細

#### 基本設定
- **`name`**: エフェクトの識別名
- **`duration`**: エフェクトの継続時間（ミリ秒、-1で無限）
- **`loop`**: ループ実行フラグ

#### エミッター管理
- **`emitters`**: エミッターの配列
- **`emitterMap`**: 名前によるエミッターの高速検索用Map

#### 状態管理
- **`active`**: エフェクトのアクティブ状態
- **`startTime`**: 開始時刻
- **`elapsedTime`**: 経過時間
- **`currentLoop`**: 現在のループ回数

#### 統計情報
- **`totalRuns`**: 総実行回数
- **`totalDuration`**: 総実行時間
- **`averageDuration`**: 平均実行時間
- **`lastRunDuration`**: 前回の実行時間

## 🔧 メソッド設計

### 1. ライフサイクル管理

#### `start(position = null)`
```javascript
start(position = null) {
  if (this.active) return false;
  
  this.active = true;
  this.startTime = Date.now();
  this.elapsedTime = 0;
  this.currentLoop = 0;
  
  // 全エミッターを開始
  this.emitters.forEach(emitter => {
    if (position && emitter.position) {
      emitter.position.x = position.x;
      emitter.position.y = position.y;
    }
    emitter.start();
  });
  
  this.stats.totalRuns++;
  return true;
}
```

#### `stop()`
```javascript
stop() {
  if (!this.active) return false;
  
  this.active = false;
  this.elapsedTime = Date.now() - this.startTime;
  
  // 統計を更新
  this.stats.lastRunDuration = this.elapsedTime;
  this.stats.totalDuration += this.elapsedTime;
  this.stats.averageDuration = this.stats.totalDuration / this.stats.totalRuns;
  
  // 全エミッターを停止
  this.emitters.forEach(emitter => emitter.stop());
  
  return true;
}
```

#### `update(deltaTime)`
```javascript
update(deltaTime) {
  if (!this.active) return;
  
  const now = Date.now();
  this.elapsedTime = now - this.startTime;
  
  // 継続時間のチェック
  if (this.duration > 0 && this.elapsedTime >= this.duration) {
    if (this.loop) {
      this._restart();
    } else {
      this.stop();
    }
    return;
  }
  
  // 全エミッターを更新
  this.emitters.forEach(emitter => {
    emitter.update(deltaTime);
  });
}
```

### 2. エミッター管理

#### `addEmitter(emitter)`
```javascript
addEmitter(emitter) {
  if (!emitter || typeof emitter.name !== 'string') {
    throw new Error('ParticleEffect: 無効なエミッターです');
  }
  
  if (this.emitterMap.has(emitter.name)) {
    throw new Error(`ParticleEffect: エミッター名 "${emitter.name}" は既に存在します`);
  }
  
  this.emitters.push(emitter);
  this.emitterMap.set(emitter.name, emitter);
  
  return this;
}
```

#### `removeEmitter(emitterOrName)`
```javascript
removeEmitter(emitterOrName) {
  let emitter;
  let name;
  
  if (typeof emitterOrName === 'string') {
    name = emitterOrName;
    emitter = this.emitterMap.get(name);
  } else {
    emitter = emitterOrName;
    name = emitter.name;
  }
  
  if (!emitter) return false;
  
  const index = this.emitters.indexOf(emitter);
  if (index > -1) {
    this.emitters.splice(index, 1);
    this.emitterMap.delete(name);
    return true;
  }
  
  return false;
}
```

#### `getEmitter(name)`
```javascript
getEmitter(name) {
  return this.emitterMap.get(name) || null;
}
```

### 3. 設定管理

#### `updateConfig(config)`
```javascript
updateConfig(config) {
  if (config.name !== undefined) {
    this.name = config.name;
  }
  
  if (config.duration !== undefined) {
    this.duration = config.duration;
  }
  
  if (config.loop !== undefined) {
    this.loop = config.loop;
  }
  
  return this;
}
```

#### `reset()`
```javascript
reset() {
  this.stop();
  this.startTime = 0;
  this.elapsedTime = 0;
  this.currentLoop = 0;
  
  this.emitters.forEach(emitter => emitter.reset());
  
  return this;
}
```

### 4. 状態確認

#### `isActive()`
```javascript
isActive() {
  return this.active;
}
```

#### `isFinished()`
```javascript
isFinished() {
  if (this.duration <= 0) return false;
  return this.elapsedTime >= this.duration;
}
```

#### `getProgress()`
```javascript
getProgress() {
  if (this.duration <= 0) return 0;
  return Math.min(1.0, this.elapsedTime / this.duration);
}
```

### 5. 統計・情報

#### `getStats()`
```javascript
getStats() {
  return {
    ...this.stats,
    active: this.active,
    elapsedTime: this.elapsedTime,
    progress: this.getProgress(),
    emitterCount: this.emitters.length
  };
}
```

#### `getEmitterStats()`
```javascript
getEmitterStats() {
  return this.emitters.map(emitter => ({
    name: emitter.name,
    active: emitter.isActive(),
    stats: emitter.getStats()
  }));
}
```

## 🎮 エフェクト設定例

### 1. ライン削除エフェクト
```javascript
const lineClearEffect = new ParticleEffect({
  name: 'lineClear',
  duration: 1000,
  loop: false
});

// 爆発エミッター
const explosionEmitter = new ParticleEmitter({
  name: 'explosion',
  particleConfig: {
    velocity: { x: [-2, 2], y: [-3, -1] },
    size: [3, 6],
    color: ['#ff6b6b', '#4ecdc4', '#45b7d1'],
    life: [800, 1200]
  },
  emissionRate: 20,
  burstCount: 50,
  duration: 500
});

lineClearEffect.addEmitter(explosionEmitter);
```

### 2. T-Spinエフェクト
```javascript
const tSpinEffect = new ParticleEffect({
  name: 'tSpin',
  duration: 1200,
  loop: false
});

// スパークルエミッター
const sparkleEmitter = new ParticleEmitter({
  name: 'sparkle',
  particleConfig: {
    velocity: { x: [-1, 1], y: [-2, 0] },
    size: [2, 4],
    color: ['#ffd700', '#ffed4e', '#fff'],
    life: [600, 1000],
    rotationSpeed: [-0.1, 0.1]
  },
  emissionRate: 15,
  burstCount: 30,
  duration: 800
});

tSpinEffect.addEmitter(sparkleEmitter);
```

## 🔧 内部メソッド

### `_restart()`
```javascript
_restart() {
  this.currentLoop++;
  this.startTime = Date.now();
  this.elapsedTime = 0;
  
  // 全エミッターを再開始
  this.emitters.forEach(emitter => emitter.start());
}
```

### `_validateEmitter(emitter)`
```javascript
_validateEmitter(emitter) {
  if (!emitter) return false;
  if (typeof emitter.name !== 'string') return false;
  if (typeof emitter.start !== 'function') return false;
  if (typeof emitter.stop !== 'function') return false;
  if (typeof emitter.update !== 'function') return false;
  
  return true;
}
```

## 📊 パフォーマンス最適化

### 1. エミッター管理
- **Map使用**: 名前による高速検索
- **配列管理**: 順序を保持したエミッター管理
- **効率的な追加・削除**: O(1)の検索、O(n)の削除

### 2. 更新処理
- **早期リターン**: 非アクティブ時の処理スキップ
- **バッチ処理**: 全エミッターの一括更新
- **時間計算の最適化**: 必要時のみ計算

### 3. メモリ管理
- **参照管理**: エミッターの適切な参照管理
- **統計情報**: 必要な統計のみ保持
- **クリーンアップ**: 停止時の適切なクリーンアップ

## 🧪 テスト戦略

### 1. 単体テスト
- **初期化**: 設定値の正しい設定
- **ライフサイクル**: 開始・停止・更新の動作
- **エミッター管理**: 追加・削除・検索の動作

### 2. 統合テスト
- **ParticleEmitter連携**: エミッターとの正常な連携
- **ParticlePool連携**: パーティクルプールとの連携
- **イベントシステム**: イベントの発火と処理

### 3. パフォーマンステスト
- **大量エミッター**: 多数のエミッターでの動作
- **長時間実行**: 長時間の実行での安定性
- **メモリ監視**: メモリリークの検出

## 🚀 実装順序

1. **基本クラス**: コンストラクタとプロパティ
2. **ライフサイクル**: start, stop, updateメソッド
3. **エミッター管理**: addEmitter, removeEmitter, getEmitter
4. **設定管理**: updateConfig, reset
5. **状態確認**: isActive, isFinished, getProgress
6. **統計・情報**: getStats, getEmitterStats
7. **内部メソッド**: _restart, _validateEmitter
8. **テスト**: 包括的なテストスイート

## 📝 注意事項

- **エミッター検証**: 追加時のエミッター妥当性チェック
- **時間管理**: 正確な時間計算とループ処理
- **エラー処理**: 無効な操作の適切な処理
- **パフォーマンス**: 大量エミッターでの効率的な処理
