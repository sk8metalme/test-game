# ParticleRenderer 詳細設計書

## 📋 概要
ParticleRendererクラスは、パーティクルシステムの描画処理を担当します。Canvas APIを最適化し、大量のパーティクルを60FPSで描画することを目標とします。

## 🏗️ クラス設計

### クラス定義
```javascript
export default class ParticleRenderer {
  constructor(canvas, config = {}) {
    // Canvas設定
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    
    // 描画設定
    this.batchSize = config.batchSize || 100;
    this.maxParticles = config.maxParticles || 1000;
    this.enableBlending = config.enableBlending !== false;
    this.enableLOD = config.enableLOD !== false;
    
    // パフォーマンス設定
    this.targetFPS = config.targetFPS || 60;
    this.frameTime = 1000 / this.targetFPS;
    this.lastFrameTime = 0;
    
    // 描画統計
    this.stats = {
      totalRendered: 0,
      framesRendered: 0,
      averageFrameTime: 0,
      particlesPerFrame: 0,
      renderCalls: 0
    };
    
    // 内部状態
    this._isInitialized = true;
    this._lastUpdateTime = Date.now();
    this._renderQueue = [];
    this._activeParticles = new Set();
  }
}
```

### プロパティ詳細

#### Canvas設定
- **`canvas`**: 描画対象のCanvas要素
- **`context`**: Canvas 2Dコンテキスト

#### 描画設定
- **`batchSize`**: バッチ描画のサイズ
- **`maxParticles`**: 最大パーティクル数
- **`enableBlending`**: ブレンドモードの有効化
- **`enableLOD`**: レベルオブディテール（LOD）の有効化

#### パフォーマンス設定
- **`targetFPS`**: 目標フレームレート
- **`frameTime`**: 目標フレーム時間
- **`lastFrameTime`**: 前回フレームの時間

#### 描画統計
- **`totalRendered`**: 総描画パーティクル数
- **`framesRendered`**: 描画フレーム数
- **`averageFrameTime`**: 平均フレーム時間
- **`particlesPerFrame`**: フレームあたりのパーティクル数
- **`renderCalls`**: 描画呼び出し回数

## 🔧 メソッド設計

### 1. 描画処理

#### `render(particles, deltaTime)`
```javascript
render(particles, deltaTime) {
  if (!particles || particles.length === 0) return;
  
  const startTime = performance.now();
  
  // パフォーマンスチェック
  if (!this._shouldRender(deltaTime)) return;
  
  // パーティクルを描画キューに追加
  this._addToRenderQueue(particles);
  
  // バッチ描画の実行
  this._executeBatchRender();
  
  // 統計の更新
  this._updateStats(particles.length, startTime);
}
```

#### `renderParticle(particle)`
```javascript
renderParticle(particle) {
  if (!particle || !particle.isActive || particle.isDead()) return;
  
  const ctx = this.context;
  
  // 描画状態の保存
  ctx.save();
  
  // ブレンドモードの設定
  if (this.enableBlending) {
    ctx.globalCompositeOperation = 'source-over';
  }
  
  // パーティクルの描画
  this._drawParticleShape(particle);
  
  // 描画状態の復元
  ctx.restore();
}
```

### 2. バッチ処理

#### `_executeBatchRender()`
```javascript
_executeBatchRender() {
  const ctx = this.context;
  const queue = this._renderQueue;
  
  // 描画前の準備
  ctx.save();
  this._setupRenderContext();
  
  // バッチ単位での描画
  for (let i = 0; i < queue.length; i += this.batchSize) {
    const batch = queue.slice(i, i + this.batchSize);
    this._renderBatch(batch);
  }
  
  // 描画後のクリーンアップ
  ctx.restore();
  this._renderQueue = [];
}
```

#### `_renderBatch(batch)`
```javascript
_renderBatch(batch) {
  const ctx = this.context;
  
  // バッチ内のパーティクルを描画
  batch.forEach(particle => {
    if (particle && particle.isActive && !particle.isDead()) {
      this._drawParticleShape(particle);
    }
  });
}
```

### 3. パーティクル描画

#### `_drawParticleShape(particle)`
```javascript
_drawParticleShape(particle) {
  const ctx = this.context;
  
  // 位置とサイズの取得
  const x = particle.position.x;
  const y = particle.position.y;
  const size = particle.size;
  const alpha = particle.alpha;
  const rotation = particle.rotation;
  
  // 透明度の設定
  ctx.globalAlpha = alpha;
  
  // 回転の適用
  if (rotation !== 0) {
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.translate(-x, -y);
  }
  
  // 色の設定
  ctx.fillStyle = particle.color;
  
  // 形状の描画（円形パーティクル）
  ctx.beginPath();
  ctx.arc(x, y, size / 2, 0, Math.PI * 2);
  ctx.fill();
}
```

### 4. パフォーマンス最適化

#### `_shouldRender(deltaTime)`
```javascript
_shouldRender(deltaTime) {
  const now = Date.now();
  
  // フレームレート制限のチェック
  if (now - this.lastFrameTime < this.frameTime) {
    return false;
  }
  
  // パーティクル数の制限
  if (this._activeParticles.size > this.maxParticles) {
    return false;
  }
  
  this.lastFrameTime = now;
  return true;
}
```

#### `_setupRenderContext()`
```javascript
_setupRenderContext() {
  const ctx = this.context;
  
  // アンチエイリアシングの設定
  ctx.imageSmoothingEnabled = false;
  
  // ブレンドモードの設定
  if (this.enableBlending) {
    ctx.globalCompositeOperation = 'source-over';
  }
  
  // 描画品質の設定
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
}
```

### 5. 統計・監視

#### `getStats()`
```javascript
getStats() {
  return {
    ...this.stats,
    activeParticles: this._activeParticles.size,
    renderQueueSize: this._renderQueue.length,
    canvasSize: {
      width: this.canvas.width,
      height: this.canvas.height
    }
  };
}
```

#### `_updateStats(particleCount, startTime)`
```javascript
_updateStats(particleCount, startTime) {
  const endTime = performance.now();
  const frameTime = endTime - startTime;
  
  this.stats.totalRendered += particleCount;
  this.stats.framesRendered++;
  this.stats.particlesPerFrame = particleCount;
  this.stats.renderCalls++;
  
  // 平均フレーム時間の更新
  this.stats.averageFrameTime = 
    (this.stats.averageFrameTime * (this.stats.framesRendered - 1) + frameTime) / 
    this.stats.framesRendered;
}
```

### 6. 設定管理

#### `updateConfig(config)`
```javascript
updateConfig(config) {
  if (config.batchSize !== undefined) {
    this.batchSize = Math.max(1, config.batchSize);
  }
  
  if (config.maxParticles !== undefined) {
    this.maxParticles = Math.max(100, config.maxParticles);
  }
  
  if (config.enableBlending !== undefined) {
    this.enableBlending = config.enableBlending;
  }
  
  if (config.enableLOD !== undefined) {
    this.enableLOD = config.enableLOD;
  }
  
  if (config.targetFPS !== undefined) {
    this.targetFPS = Math.max(30, Math.min(120, config.targetFPS));
    this.frameTime = 1000 / this.targetFPS;
  }
  
  return this;
}
```

#### `reset()`
```javascript
reset() {
  this.stats = {
    totalRendered: 0,
    framesRendered: 0,
    averageFrameTime: 0,
    particlesPerFrame: 0,
    renderCalls: 0
  };
  
  this._renderQueue = [];
  this._activeParticles.clear();
  this.lastFrameTime = 0;
  
  return this;
}
```

## 🎮 描画最適化戦略

### 1. バッチ描画
- **複数パーティクルの一括描画**: 描画コンテキストの切り替えを最小限に抑制
- **描画状態の共有**: 同じ設定のパーティクルをグループ化
- **GPU描画の効率化**: Canvas APIの最適化

### 2. LODシステム
- **距離ベースの描画**: カメラからの距離に応じた描画品質の調整
- **サイズベースの最適化**: 小さなパーティクルの描画スキップ
- **フレームレート監視**: パフォーマンスに応じた自動調整

### 3. メモリ最適化
- **描画キューの再利用**: 配列の再割り当てを最小限に抑制
- **オブジェクトプール**: パーティクルオブジェクトの再利用
- **ガベージコレクション**: メモリリークの防止

### 4. 描画品質
- **アンチエイリアシング**: 必要に応じた有効/無効切り替え
- **ブレンドモード**: パーティクルの視覚効果の向上
- **透明度処理**: アルファブレンディングの最適化

## 📊 パフォーマンス指標

### 目標値
- **フレームレート**: 60FPS維持
- **描画時間**: 16ms以下
- **最大パーティクル数**: 1000個
- **メモリ使用量**: 50MB以下

### 監視項目
- フレーム描画時間
- パーティクル描画数
- 描画呼び出し回数
- メモリ使用量
- GPU使用率

## 🧪 テスト戦略

### 1. 単体テスト
- **初期化**: 設定値の正しい設定
- **描画処理**: 個別パーティクルの描画
- **バッチ処理**: 複数パーティクルの一括描画
- **パフォーマンス**: フレームレート制限とパーティクル数制限

### 2. 統合テスト
- **ParticlePool連携**: パーティクルプールとの連携
- **Canvas連携**: Canvas APIとの正常な連携
- **イベントシステム**: 描画イベントの発火と処理

### 3. パフォーマンステスト
- **大量パーティクル**: 1000個以上のパーティクルでの描画
- **長時間実行**: 長時間の描画処理での安定性
- **メモリ監視**: メモリリークの検出

## 🚀 実装順序

1. **基本クラス**: コンストラクタとプロパティ
2. **描画処理**: render, renderParticleメソッド
3. **バッチ処理**: _executeBatchRender, _renderBatch
4. **パーティクル描画**: _drawParticleShape
5. **パフォーマンス最適化**: _shouldRender, _setupRenderContext
6. **統計・監視**: getStats, _updateStats
7. **設定管理**: updateConfig, reset
8. **テスト**: 包括的なテストスイート

## 📝 注意事項

- **Canvas API最適化**: 描画コンテキストの状態変更を最小限に抑制
- **メモリ管理**: 描画キューの適切な管理とクリーンアップ
- **パフォーマンス監視**: フレームレートとメモリ使用量の継続的監視
- **エラー処理**: Canvas操作エラーの適切な処理
- **クロスブラウザ対応**: 異なるブラウザでの動作確認
