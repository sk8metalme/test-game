# パーティクルシステム詳細設計書

## 📋 概要
テトリスゲームに視覚的な魅力を追加するパーティクルシステムの詳細設計です。既存のObjectPoolとOptimizedRendererを活用して、60FPSを維持しながら美しいエフェクトを提供します。

## 🏗️ アーキテクチャ設計

### レイヤー構成
```
Application Layer (Use Cases)
├── ParticleSystem
├── ParticleEmitter
└── ParticleEffect

Entity Layer
└── Particle

Infrastructure Layer
├── ParticleRenderer
└── ParticlePool (ObjectPool拡張)
```

### クラス設計

#### 1. Particle (Entity)
```javascript
class Particle {
  constructor(config) {
    this.id = generateUniqueId();
    this.position = { x: 0, y: 0 };
    this.velocity = { x: 0, y: 0 };
    this.acceleration = { x: 0, y: 0 };
    this.life = 1.0; // 0.0 - 1.0
    this.maxLife = 1000; // ミリ秒
    this.size = 2;
    this.color = '#ffffff';
    this.alpha = 1.0;
    this.rotation = 0;
    this.rotationSpeed = 0;
    this.gravity = 0.1;
    this.friction = 0.98;
  }
  
  update(deltaTime) { /* パーティクルの状態更新 */ }
  isDead() { return this.life <= 0; }
  reset() { /* パーティクルのリセット */ }
}
```

#### 2. ParticleSystem (Use Case)
```javascript
class ParticleSystem {
  constructor() {
    this.particles = new ParticlePool();
    this.emitters = new Map();
    this.effects = new Map();
    this.activeParticles = new Set();
    this.eventListeners = {};
  }
  
  createParticle(config) { /* パーティクルの作成 */ }
  addEmitter(name, emitter) { /* エミッターの追加 */ }
  addEffect(name, effect) { /* エフェクトの追加 */ }
  emit(name, position, count) { /* パーティクルの発射 */ }
  update(deltaTime) { /* システム全体の更新 */ }
  render(context) { /* レンダリング */ }
  clear() { /* 全パーティクルのクリア */ }
}
```

#### 3. ParticleEmitter (Use Case)
```javascript
class ParticleEmitter {
  constructor(config) {
    this.name = config.name;
    this.particleConfig = config.particleConfig;
    this.emissionRate = config.emissionRate || 10; // パーティクル/秒
    this.burstCount = config.burstCount || 1;
    this.duration = config.duration || -1; // -1 = 無限
    this.active = true;
  }
  
  emit(position, count) { /* パーティクルの発射 */ }
  update(deltaTime) { /* エミッターの更新 */ }
  isActive() { return this.active; }
}
```

#### 4. ParticleEffect (Use Case)
```javascript
class ParticleEffect {
  constructor(config) {
    this.name = config.name;
    this.emitters = config.emitters || [];
    this.duration = config.duration || 1000;
    this.loop = config.loop || false;
    this.active = false;
    this.startTime = 0;
  }
  
  start(position) { /* エフェクトの開始 */ }
  stop() { /* エフェクトの停止 */ }
  update(deltaTime) { /* エフェクトの更新 */ }
  isActive() { return this.active; }
}
```

#### 5. ParticleRenderer (Infrastructure)
```javascript
class ParticleRenderer {
  constructor(canvas, config) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    this.config = config;
    this.batchSize = config.batchSize || 100;
  }
  
  render(particles) { /* パーティクルの一括描画 */ }
  renderParticle(particle) { /* 個別パーティクルの描画 */ }
  setBlendMode(mode) { /* ブレンドモードの設定 */ }
}
```

#### 6. ParticlePool (ObjectPool拡張)
```javascript
class ParticlePool extends ObjectPool {
  constructor(config) {
    super(config);
    this.particleClass = Particle;
    this.maxSize = config.maxSize || 1000;
  }
  
  createParticle() { /* パーティクルの作成 */ }
  resetParticle(particle) { /* パーティクルのリセット */ }
  getActiveCount() { /* アクティブなパーティクル数 */ }
}
```

## 🎮 エフェクト設計

### 1. ライン削除エフェクト
```javascript
const lineClearEffect = {
  name: 'lineClear',
  emitters: [
    {
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
    }
  ],
  duration: 1000
};
```

### 2. T-Spinエフェクト
```javascript
const tSpinEffect = {
  name: 'tSpin',
  emitters: [
    {
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
    }
  ],
  duration: 1200
};
```

### 3. Perfect Clearエフェクト
```javascript
const perfectClearEffect = {
  name: 'perfectClear',
  emitters: [
    {
      name: 'celebration',
      particleConfig: {
        velocity: { x: [-3, 3], y: [-4, -2] },
        size: [4, 8],
        color: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'],
        life: [1500, 2000],
        gravity: 0.05
      },
      emissionRate: 25,
      burstCount: 100,
      duration: 1000
    }
  ],
  duration: 2000
};
```

## 🔧 パフォーマンス最適化

### 1. ObjectPool活用
- パーティクルの生成・破棄を最小限に抑制
- メモリ割り当ての最適化
- ガベージコレクションの圧力軽減

### 2. バッチ描画
- 複数パーティクルを一括描画
- Canvas APIの最適化
- GPU描画の効率化

### 3. LODシステム
- 距離に応じたパーティクル数の調整
- 画面外パーティクルの描画スキップ
- パフォーマンス設定の動的調整

### 4. パーティクル制限
- 最大パーティクル数の制限
- 重要度に基づく描画優先度
- フレームレート監視による自動調整

## 📊 パフォーマンス指標

### 目標値
- **フレームレート**: 60FPS維持
- **最大パーティクル数**: 1000個
- **メモリ使用量**: 100MB以下
- **描画時間**: 16ms以下

### 監視項目
- アクティブパーティクル数
- フレーム描画時間
- メモリ使用量
- パーティクル生成・破棄頻度

## 🧪 テスト設計

### 1. 単体テスト
- Particleクラスの動作確認
- ParticleSystemの基本機能
- エミッター・エフェクトの動作

### 2. 統合テスト
- ObjectPoolとの連携
- OptimizedRendererとの統合
- ゲームイベントとの連携

### 3. パフォーマンステスト
- 大量パーティクルでの動作
- 長時間動作での安定性
- メモリリークの検出

## 🚀 実装順序

1. **Particleエンティティ**の実装
2. **ParticlePool**の実装
3. **ParticleRenderer**の実装
4. **ParticleEmitter**の実装
5. **ParticleEffect**の実装
6. **ParticleSystem**の統合
7. **テスト**の作成
8. **パフォーマンス最適化**

## 📚 参考資料

- [Canvas Performance](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas)
- [Particle System Design](https://gamedev.stackexchange.com/questions/1155/particle-system-design)
- [Object Pool Pattern](https://en.wikipedia.org/wiki/Object_pool_pattern)
