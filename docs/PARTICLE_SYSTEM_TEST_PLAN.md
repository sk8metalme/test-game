# パーティクルシステムテスト設計書

## 📋 概要
パーティクルシステムの品質保証のための包括的なテスト計画です。単体テスト、統合テスト、パフォーマンステストを含む多層的なテスト戦略を提供します。

## 🧪 テスト戦略

### テストピラミッド
```
    E2E Tests (少数)
        ▲
   Integration Tests (中程度)
        ▲
   Unit Tests (多数)
```

### テストカバレッジ目標
- **単体テスト**: 95%以上
- **統合テスト**: 90%以上
- **パフォーマンステスト**: 100%
- **全体カバレッジ**: 93%以上

## 🔧 単体テスト設計

### 1. Particle (Entity) テスト

#### テストケース
```javascript
describe('Particle', () => {
  describe('初期化', () => {
    test('デフォルト設定で正しく初期化される');
    test('カスタム設定で正しく初期化される');
    test('無効な設定値は適切に処理される');
  });

  describe('状態更新', () => {
    test('位置が正しく更新される');
    test('速度が正しく更新される');
    test('加速度が正しく適用される');
    test('重力が正しく適用される');
    test('摩擦が正しく適用される');
  });

  describe('ライフサイクル', () => {
    test('ライフが正しく減少する');
    test('ライフが0になると死亡状態になる');
    test('リセットで正しく初期状態に戻る');
  });

  describe('物理演算', () => {
    test('回転が正しく適用される');
    test('サイズ変更が正しく処理される');
    test('アルファ値の変更が正しく処理される');
  });
});
```

### 2. ParticleSystem (Use Case) テスト

#### テストケース
```javascript
describe('ParticleSystem', () => {
  describe('初期化', () => {
    test('デフォルト設定で正しく初期化される');
    test('カスタム設定で正しく初期化される');
    test('パーティクルプールが正しく設定される');
  });

  describe('パーティクル管理', () => {
    test('パーティクルが正しく作成される');
    test('パーティクルが正しく更新される');
    test('死亡したパーティクルが適切に削除される');
    test('最大パーティクル数が正しく制限される');
  });

  describe('エミッター管理', () => {
    test('エミッターが正しく追加される');
    test('エミッターが正しく削除される');
    test('存在しないエミッターの操作は安全に処理される');
  });

  describe('エフェクト管理', () => {
    test('エフェクトが正しく追加される');
    test('エフェクトが正しく開始される');
    test('エフェクトが正しく停止される');
    test('ループエフェクトが正しく動作する');
  });

  describe('レンダリング', () => {
    test('パーティクルが正しく描画される');
    test('空のパーティクルリストでの描画は安全');
    test('大量パーティクルでの描画パフォーマンス');
  });
});
```

### 3. ParticleEmitter (Use Case) テスト

#### テストケース
```javascript
describe('ParticleEmitter', () => {
  describe('初期化', () => {
    test('設定が正しく適用される');
    test('デフォルト値が適切に設定される');
  });

  describe('パーティクル発射', () => {
    test('指定された数のパーティクルが発射される');
    test('発射率が正しく制御される');
    test('バースト発射が正しく動作する');
    test('継続発射が正しく動作する');
  });

  describe('ライフサイクル', () => {
    test('指定された時間で自動停止する');
    test('手動停止が正しく動作する');
    test('再開が正しく動作する');
  });

  describe('設定変更', () => {
    test('発射率の動的変更が可能');
    test('パーティクル設定の動的変更が可能');
    test('無効な設定値は適切に処理される');
  });
});
```

### 4. ParticleEffect (Use Case) テスト

#### テストケース
```javascript
describe('ParticleEffect', () => {
  describe('初期化', () => {
    test('エミッターが正しく設定される');
    test('設定が正しく適用される');
  });

  describe('エフェクト制御', () => {
    test('エフェクトが正しく開始される');
    test('エフェクトが正しく停止される');
    test('ループエフェクトが正しく動作する');
    test('継続時間が正しく制御される');
  });

  describe('エミッター連携', () => {
    test('複数エミッターが正しく動作する');
    test('エミッターの順序が正しく処理される');
    test('エミッターエラーが適切に処理される');
  });
});
```

### 5. ParticleRenderer (Infrastructure) テスト

#### テストケース
```javascript
describe('ParticleRenderer', () => {
  describe('初期化', () => {
    test('Canvasが正しく設定される');
    test('設定が正しく適用される');
    test('無効なCanvasでエラーが発生する');
  });

  describe('描画処理', () => {
    test('個別パーティクルが正しく描画される');
    test('バッチ描画が正しく動作する');
    test('ブレンドモードが正しく適用される');
    test('大量パーティクルでの描画パフォーマンス');
  });

  describe('最適化', () => {
    test('画面外パーティクルの描画スキップ');
    test('LODシステムの動作確認');
    test('描画領域の最適化');
  });
});
```

### 6. ParticlePool (ObjectPool拡張) テスト

#### テストケース
```javascript
describe('ParticlePool', () => {
  describe('初期化', () => {
    test('ObjectPoolが正しく継承される');
    test('パーティクル固有の設定が適用される');
  });

  describe('パーティクル管理', () => {
    test('パーティクルが正しく取得される');
    test('パーティクルが正しく返却される');
    test('最大サイズ制限が正しく動作する');
    test('パーティクルのリセットが正しく動作する');
  });

  describe('パフォーマンス', () => {
    test('大量パーティクルでの効率性');
    test('メモリリークの検出');
    test('ガベージコレクションの圧力軽減');
  });
});
```

## 🔗 統合テスト設計

### 1. ObjectPool統合テスト

#### テストケース
```javascript
describe('ParticlePool-ObjectPool Integration', () => {
  test('ObjectPoolの基本機能が正しく動作する');
  test('パーティクル固有の拡張が正しく動作する');
  test('プールサイズの制限が正しく動作する');
  test('パフォーマンス監視が正しく動作する');
});
```

### 2. OptimizedRenderer統合テスト

#### テストケース
```javascript
describe('ParticleRenderer-OptimizedRenderer Integration', () => {
  test('レンダリング最適化が正しく動作する');
  test('フレームスキップが正しく動作する');
  test('ビューポート管理が正しく動作する');
  test('パフォーマンス統計が正しく記録される');
});
```

### 3. ゲームイベント統合テスト

#### テストケース
```javascript
describe('ParticleSystem-GameEvent Integration', () => {
  test('ライン削除時にエフェクトが正しく発動する');
  test('T-Spin時にエフェクトが正しく発動する');
  test('Perfect Clear時にエフェクトが正しく発動する');
  test('レベルアップ時にエフェクトが正しく発動する');
  test('ゲームオーバー時にエフェクトが正しく発動する');
});
```

## 📊 パフォーマンステスト設計

### 1. フレームレートテスト

#### テストケース
```javascript
describe('Performance Tests', () => {
  describe('フレームレート', () => {
    test('1000パーティクルで60FPSを維持');
    test('2000パーティクルで30FPS以上を維持');
    test('5000パーティクルで15FPS以上を維持');
  });

  describe('メモリ使用量', () => {
    test('長時間動作でのメモリリーク検出');
    test('大量パーティクルでのメモリ効率');
    test('ガベージコレクションの圧力測定');
  });

  describe('描画パフォーマンス', () => {
    test('バッチ描画の効率性');
    test('LODシステムの効果測定');
    test('画面外パーティクルの描画スキップ効果');
  });
});
```

### 2. 負荷テスト

#### テストケース
```javascript
describe('Load Tests', () => {
  test('同時100エフェクトの動作');
  test('連続1000エフェクトの動作');
  test('極端な設定値での動作');
  test('長時間連続動作での安定性');
});
```

## 🧹 クリーンアップテスト

### 1. リソース管理テスト

#### テストケース
```javascript
describe('Resource Management', () => {
  test('パーティクルの適切な破棄');
  test('エミッターの適切な破棄');
  test('エフェクトの適切な破棄');
  test('システム全体の適切な破棄');
  test('メモリリークの検出');
});
```

### 2. エラーハンドリングテスト

#### テストケース
```javascript
describe('Error Handling', () => {
  test('無効な設定値での安全な処理');
  test('存在しないリソースへのアクセス');
  test('Canvasエラーの適切な処理');
  test('メモリ不足時の適切な処理');
  test('例外発生時の適切な処理');
});
```

## 📋 テスト実行計画

### フェーズ1: 単体テスト
- Particleエンティティのテスト
- ParticlePoolのテスト
- 基本的な機能の動作確認

### フェーズ2: 統合テスト
- ObjectPoolとの統合
- OptimizedRendererとの統合
- ゲームイベントとの統合

### フェーズ3: パフォーマンステスト
- フレームレートテスト
- メモリ使用量テスト
- 負荷テスト

### フェーズ4: クリーンアップテスト
- リソース管理テスト
- エラーハンドリングテスト
- 最終品質確認

## 🎯 成功基準

### 技術的基準
- **テストカバレッジ**: 95%以上
- **フレームレート**: 60FPS維持（1000パーティクル）
- **メモリ使用量**: 100MB以下
- **エラー率**: 0%

### 品質基準
- **ESLint**: エラー0件
- **JSDoc**: 全メソッドにドキュメント
- **型安全性**: 適切なバリデーション
- **エラーハンドリング**: 包括的な例外処理

## 📚 テストツール

### 使用ツール
- **Jest**: テストフレームワーク
- **Performance API**: パフォーマンス測定
- **Memory API**: メモリ使用量監視
- **Canvas Mock**: Canvas APIのモック

### カスタムツール
- **ParticleTestHelper**: パーティクルテスト支援
- **PerformanceMonitor**: パフォーマンス監視
- **MemoryLeakDetector**: メモリリーク検出

# ParticleSystem テスト計画

## 🎯 概要

`ParticleSystem`クラスの包括的なテスト計画です。単体テストから統合テスト、パフォーマンステストまで、全機能の品質を保証します。

## 🧪 テスト戦略

### テストカテゴリ
1. **初期化テスト**: コンストラクタと設定の動作確認
2. **ライフサイクルテスト**: 開始・停止・一時停止の動作確認
3. **エフェクト管理テスト**: エフェクトの追加・削除・制御
4. **統合テスト**: 全コンポーネントとの連携確認
5. **パフォーマンステスト**: 大量エフェクトでの動作確認
6. **エラーハンドリングテスト**: 異常系の処理確認

### テスト環境
- **テストフレームワーク**: Jest
- **モック対象**: ParticlePool、ParticleEffect、ParticleRenderer
- **テストデータ**: 様々な設定パターンとエッジケース

## 📋 テストケース詳細

### 1. 初期化テスト

#### 1.1 正常な設定でシステムが作成される
```javascript
test('正常な設定でシステムが作成される', () => {
  const config = {
    maxParticles: 1000,
    targetFPS: 60,
    enableOptimization: true
  };
  
  const system = new ParticleSystem(config);
  
  expect(system.name).toBe('ParticleSystem');
  expect(system.enabled).toBe(true);
  expect(system.maxEffects).toBe(100);
  expect(system.isRunning).toBe(false);
  expect(system.isPaused).toBe(false);
  expect(system.particlePool).toBeDefined();
  expect(system.renderer).toBeDefined();
  expect(system.effects).toBeInstanceOf(Map);
});
```

#### 1.2 無効な設定値は適切に処理される
```javascript
test('無効な設定値は適切に処理される', () => {
  const config = {
    maxParticles: -100,
    targetFPS: 0,
    enableOptimization: 'invalid'
  };
  
  const system = new ParticleSystem(config);
  
  expect(system.config.maxParticles).toBe(100);
  expect(system.config.targetFPS).toBe(30);
  expect(system.config.enableOptimization).toBe(false);
});
```

#### 1.3 デフォルト設定が正しく適用される
```javascript
test('デフォルト設定が正しく適用される', () => {
  const system = new ParticleSystem();
  
  expect(system.config.maxParticles).toBe(1000);
  expect(system.config.targetFPS).toBe(60);
  expect(system.config.enableOptimization).toBe(true);
  expect(system.config.cleanupInterval).toBe(5000);
});
```

### 2. ライフサイクル管理テスト

#### 2.1 システムが正しく開始される
```javascript
test('システムが正しく開始される', () => {
  const system = new ParticleSystem();
  
  system.start();
  
  expect(system.isRunning).toBe(true);
  expect(system.isPaused).toBe(false);
  expect(system.startTime).toBeGreaterThan(0);
  expect(system.getStatus()).toBe('running');
});
```

#### 2.2 システムが正しく停止される
```javascript
test('システムが正しく停止される', () => {
  const system = new ParticleSystem();
  system.start();
  
  system.stop();
  
  expect(system.isRunning).toBe(false);
  expect(system.isPaused).toBe(false);
  expect(system.getStatus()).toBe('stopped');
});
```

#### 2.3 一時停止と再開が正しく動作する
```javascript
test('一時停止と再開が正しく動作する', () => {
  const system = new ParticleSystem();
  system.start();
  
  system.pause();
  expect(system.isPaused).toBe(true);
  expect(system.getStatus()).toBe('paused');
  
  system.resume();
  expect(system.isPaused).toBe(false);
  expect(system.getStatus()).toBe('running');
});
```

#### 2.4 再起動が正しく動作する
```javascript
test('再起動が正しく動作する', () => {
  const system = new ParticleSystem();
  system.start();
  system.update(1000);
  
  const firstStartTime = system.startTime;
  const firstRunTime = system.totalRunTime;
  
  system.restart();
  
  expect(system.isRunning).toBe(true);
  expect(system.isPaused).toBe(false);
  expect(system.startTime).toBeGreaterThan(firstStartTime);
  expect(system.totalRunTime).toBe(0);
});
```

### 3. エフェクト管理テスト

#### 3.1 エフェクトが正しく追加される
```javascript
test('エフェクトが正しく追加される', () => {
  const system = new ParticleSystem();
  const effect = new ParticleEffect({ name: 'test' });
  
  const result = system.addEffect(effect);
  
  expect(result).toBe(true);
  expect(system.effects.has('test')).toBe(true);
  expect(system.effects.get('test')).toBe(effect);
  expect(system.getEffect('test')).toBe(effect);
});
```

#### 3.2 エフェクトが正しく削除される
```javascript
test('エフェクトが正しく削除される', () => {
  const system = new ParticleSystem();
  const effect = new ParticleEffect({ name: 'test' });
  system.addEffect(effect);
  
  const result = system.removeEffect('test');
  
  expect(result).toBe(true);
  expect(system.effects.has('test')).toBe(false);
  expect(system.getEffect('test')).toBeUndefined();
});
```

#### 3.3 複数エフェクトが同時実行される
```javascript
test('複数エフェクトが同時実行される', () => {
  const system = new ParticleSystem();
  const effect1 = new ParticleEffect({ name: 'effect1' });
  const effect2 = new ParticleEffect({ name: 'effect2' });
  
  system.addEffect(effect1);
  system.addEffect(effect2);
  system.start();
  
  system.playEffect('effect1');
  system.playEffect('effect2');
  
  expect(effect1.isActive).toBe(true);
  expect(effect2.isActive).toBe(true);
  expect(system.stats.activeEffects).toBe(2);
});
```

#### 3.4 エフェクトの制御が正しく動作する
```javascript
test('エフェクトの制御が正しく動作する', () => {
  const system = new ParticleSystem();
  const effect = new ParticleEffect({ name: 'test' });
  system.addEffect(effect);
  system.start();
  
  // 再生
  system.playEffect('test');
  expect(effect.isActive).toBe(true);
  
  // 一時停止
  system.pauseEffect('test');
  expect(effect.isPaused).toBe(true);
  
  // 再開
  system.resumeEffect('test');
  expect(effect.isPaused).toBe(false);
  
  // 停止
  system.stopEffect('test');
  expect(effect.isActive).toBe(false);
});
```

### 4. システム更新テスト

#### 4.1 システム更新が正しく動作する
```javascript
test('システム更新が正しく動作する', () => {
  const system = new ParticleSystem();
  const mockEffect = new ParticleEffect({ name: 'test' });
  system.addEffect(mockEffect);
  system.start();
  
  const deltaTime = 16.67;
  system.update(deltaTime);
  
  expect(system.stats.lastUpdateTime).toBeGreaterThan(0);
  expect(system.totalRunTime).toBeGreaterThan(0);
});
```

#### 4.2 描画が正しく実行される
```javascript
test('描画が正しく実行される', () => {
  const system = new ParticleSystem();
  const mockRenderer = system.renderer;
  jest.spyOn(mockRenderer, 'render');
  
  system.render();
  
  expect(mockRenderer.render).toHaveBeenCalled();
});
```

#### 4.3 最適化が適切に実行される
```javascript
test('最適化が適切に実行される', () => {
  const system = new ParticleSystem({ enableOptimization: true });
  const mockPool = system.particlePool;
  jest.spyOn(mockPool, 'optimizePool');
  
  system.optimizeSystem();
  
  expect(mockPool.optimizePool).toHaveBeenCalled();
});
```

### 5. 統計・監視テスト

#### 5.1 システム統計が正しく取得される
```javascript
test('システム統計が正しく取得される', () => {
  const system = new ParticleSystem();
  system.start();
  
  const stats = system.getSystemStats();
  
  expect(stats).toHaveProperty('totalParticles');
  expect(stats).toHaveProperty('activeEffects');
  expect(stats).toHaveProperty('fps');
  expect(stats).toHaveProperty('memoryUsage');
  expect(stats).toHaveProperty('lastUpdateTime');
});
```

#### 5.2 パフォーマンス指標が正しく計算される
```javascript
test('パフォーマンス指標が正しく計算される', () => {
  const system = new ParticleSystem();
  system.start();
  
  const metrics = system.getPerformanceMetrics();
  
  expect(metrics).toHaveProperty('averageFPS');
  expect(metrics).toHaveProperty('peakFPS');
  expect(metrics).toHaveProperty('frameTime');
  expect(metrics).toHaveProperty('memoryEfficiency');
});
```

#### 5.3 メモリ使用量が正しく監視される
```javascript
test('メモリ使用量が正しく監視される', () => {
  const system = new ParticleSystem();
  
  const memoryUsage = system.getMemoryUsage();
  
  expect(memoryUsage).toHaveProperty('current');
  expect(memoryUsage).toHaveProperty('peak');
  expect(memoryUsage).toHaveProperty('average');
  expect(memoryUsage.current).toBeGreaterThan(0);
});
```

### 6. 設定管理テスト

#### 6.1 設定が正しく更新される
```javascript
test('設定が正しく更新される', () => {
  const system = new ParticleSystem();
  const newConfig = {
    maxParticles: 2000,
    targetFPS: 120
  };
  
  system.updateConfig(newConfig);
  
  expect(system.config.maxParticles).toBe(2000);
  expect(system.config.targetFPS).toBe(120);
});
```

#### 6.2 設定が正しく取得される
```javascript
test('設定が正しく取得される', () => {
  const config = {
    maxParticles: 1500,
    targetFPS: 90
  };
  const system = new ParticleSystem(config);
  
  const currentConfig = system.getConfig();
  
  expect(currentConfig.maxParticles).toBe(1500);
  expect(currentConfig.targetFPS).toBe(90);
  expect(currentConfig.enableOptimization).toBe(true);
});
```

#### 6.3 設定が正しくリセットされる
```javascript
test('設定が正しくリセットされる', () => {
  const system = new ParticleSystem();
  system.updateConfig({ maxParticles: 2000 });
  
  system.resetConfig();
  
  expect(system.config.maxParticles).toBe(1000);
  expect(system.config.targetFPS).toBe(60);
  expect(system.config.enableOptimization).toBe(true);
});
```

### 7. 統合テスト

#### 7.1 全コンポーネントが正しく連携する
```javascript
test('全コンポーネントが正しく連携する', () => {
  const system = new ParticleSystem();
  const effect = new ParticleEffect({
    name: 'test',
    emitters: [new ParticleEmitter({ name: 'emitter1' })]
  });
  
  system.addEffect(effect);
  system.start();
  system.playEffect('test');
  
  // エフェクトがアクティブ
  expect(effect.isActive).toBe(true);
  
  // エミッターが動作
  const emitter = effect.emitters[0];
  expect(emitter.isActive).toBe(true);
  
  // パーティクルが生成される
  system.update(16.67);
  expect(system.stats.totalParticles).toBeGreaterThan(0);
});
```

#### 7.2 大量エフェクトでの安定動作
```javascript
test('大量エフェクトでの安定動作', () => {
  const system = new ParticleSystem({ maxEffects: 1000 });
  
  // 大量のエフェクトを追加
  for (let i = 0; i < 100; i++) {
    const effect = new ParticleEffect({ name: `effect${i}` });
    system.addEffect(effect);
  }
  
  expect(system.effects.size).toBe(100);
  expect(system.getAllEffects()).toHaveLength(100);
  
  // システム開始
  system.start();
  
  // 全エフェクトを再生
  for (let i = 0; i < 100; i++) {
    system.playEffect(`effect${i}`);
  }
  
  expect(system.stats.activeEffects).toBe(100);
});
```

### 8. エラーハンドリングテスト

#### 8.1 無効なエフェクト名での操作は安全に処理される
```javascript
test('無効なエフェクト名での操作は安全に処理される', () => {
  const system = new ParticleSystem();
  
  expect(system.getEffect('nonexistent')).toBeUndefined();
  expect(system.removeEffect('nonexistent')).toBe(false);
  expect(system.playEffect('nonexistent')).toBe(false);
  expect(system.stopEffect('nonexistent')).toBe(false);
  expect(system.pauseEffect('nonexistent')).toBe(false);
});
```

#### 8.2 無効な設定値は適切に処理される
```javascript
test('無効な設定値は適切に処理される', () => {
  const system = new ParticleSystem();
  
  // 無効な設定を更新
  system.updateConfig({
    maxParticles: 'invalid',
    targetFPS: -100,
    enableOptimization: 'invalid'
  });
  
  // デフォルト値が維持される
  expect(system.config.maxParticles).toBe(1000);
  expect(system.config.targetFPS).toBe(30);
  expect(system.config.enableOptimization).toBe(false);
});
```

#### 8.3 システム停止中の操作は適切に処理される
```javascript
test('システム停止中の操作は適切に処理される', () => {
  const system = new ParticleSystem();
  
  // 停止中の状態確認
  expect(system.isActive()).toBe(false);
  expect(system.getStatus()).toBe('stopped');
  
  // 更新は実行されるが効果はない
  system.update(16.67);
  expect(system.totalRunTime).toBe(0);
});
```

### 9. パフォーマンステスト

#### 9.1 大量パーティクルでの動作
```javascript
test('大量パーティクルでの動作', () => {
  const system = new ParticleSystem({ maxParticles: 10000 });
  const effect = new ParticleEffect({
    name: 'massive',
    emitters: [new ParticleEmitter({ emissionRate: 1000, burstCount: 1000 })]
  });
  
  system.addEffect(effect);
  system.start();
  system.playEffect('massive');
  
  // 大量パーティクル生成
  system.update(1000);
  
  expect(system.stats.totalParticles).toBeGreaterThan(5000);
  expect(system.stats.fps).toBeGreaterThan(30);
});
```

#### 9.2 長時間動作での安定性
```javascript
test('長時間動作での安定性', () => {
  const system = new ParticleSystem();
  const effect = new ParticleEffect({ name: 'longRunning', loop: true });
  system.addEffect(effect);
  system.start();
  system.playEffect('longRunning');
  
  // 長時間のシミュレーション
  for (let i = 0; i < 1000; i++) {
    system.update(16.67);
    system.render();
  }
  
  expect(system.isRunning).toBe(true);
  expect(system.stats.fps).toBeGreaterThan(30);
  expect(system.stats.memoryUsage).toBeLessThan(100 * 1024 * 1024); // 100MB以下
});
```

#### 9.3 メモリリークの検出
```javascript
test('メモリリークの検出', () => {
  const system = new ParticleSystem();
  const initialMemory = system.getMemoryUsage().current;
  
  // 大量のエフェクトを追加・削除
  for (let i = 0; i < 100; i++) {
    const effect = new ParticleEffect({ name: `effect${i}` });
    system.addEffect(effect);
    system.removeEffect(`effect${i}`);
  }
  
  const finalMemory = system.getMemoryUsage().current;
  const memoryIncrease = finalMemory - initialMemory;
  
  // メモリ増加は許容範囲内
  expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // 10MB以下
});
```

## 📊 テスト実行計画

### 実行順序
1. **単体テスト**: 各メソッドの個別動作確認
2. **統合テスト**: コンポーネント間の連携確認
3. **パフォーマンステスト**: 負荷テストと安定性確認
4. **エラーハンドリングテスト**: 異常系の処理確認

### 成功基準
- **テストカバレッジ**: 95%以上
- **全テスト成功**: 100%
- **パフォーマンス**: 目標値を達成
- **メモリ使用量**: 許容範囲内

### 継続的テスト
- **コミット前**: 全テストの実行
- **PR作成時**: 統合テストの実行
- **リリース前**: パフォーマンステストの実行
