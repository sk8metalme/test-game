# ParticleEffect テスト計画

## 📋 概要
ParticleEffectクラスの包括的なテスト計画です。エフェクトの定義、管理、ライフサイクル制御をテストします。

## 🎯 テスト対象
- **ParticleEffectクラス**: パーティクルエフェクトの定義と管理
- **エフェクトライフサイクル**: 開始、停止、更新、完了
- **エミッター管理**: 複数エミッターの制御
- **設定管理**: 動的な設定変更
- **エラー処理**: 無効な設定や操作の処理

## 🧪 テストカテゴリ

### 1. 初期化テスト
- **正常な設定での初期化**: 基本的な設定でエフェクトが正しく作成される
- **デフォルト値の確認**: 設定が指定されていない場合のデフォルト値
- **無効な設定の処理**: 不正な設定値の安全な処理

### 2. ライフサイクルテスト
- **エフェクトの開始**: start()メソッドでエフェクトが開始される
- **エフェクトの停止**: stop()メソッドでエフェクトが停止される
- **自動完了**: 継続時間到達時の自動停止
- **ループ処理**: ループ設定での継続実行

### 3. エミッター管理テスト
- **エミッターの追加**: エミッターが正しく追加される
- **エミッターの削除**: エミッターが正しく削除される
- **複数エミッターの制御**: 複数エミッターの同時制御
- **エミッターの順序**: エミッターの実行順序

### 4. 設定管理テスト
- **動的設定変更**: 実行中の設定変更
- **設定の検証**: 設定値の妥当性チェック
- **設定のリセット**: 設定の初期化

### 5. 状態管理テスト
- **アクティブ状態の確認**: isActive()メソッドの動作
- **統計情報の更新**: 実行統計の正確性
- **状態の永続性**: 状態変更の保持

### 6. エラー処理テスト
- **無効なエミッター**: 不正なエミッターの処理
- **無効な設定**: 不正な設定値の処理
- **例外処理**: エラー発生時の適切な処理

### 7. パフォーマンステスト
- **大量エミッター**: 多数のエミッターでの動作
- **長時間実行**: 長時間の実行での安定性
- **メモリ使用量**: メモリリークの検出

### 8. 統合テスト
- **ParticleEmitterとの連携**: エミッターとの正常な連携
- **ParticlePoolとの連携**: パーティクルプールとの連携
- **イベントシステム**: イベントの発火と処理

## 📊 テストケース詳細

### 初期化テスト
```javascript
describe('初期化', () => {
  test('正常な設定でエフェクトが作成される', () => {
    const effect = new ParticleEffect({
      name: 'testEffect',
      duration: 1000,
      loop: false
    });
    
    expect(effect.name).toBe('testEffect');
    expect(effect.duration).toBe(1000);
    expect(effect.loop).toBe(false);
    expect(effect.active).toBe(false);
  });
  
  test('デフォルト値が正しく設定される', () => {
    const effect = new ParticleEffect();
    
    expect(effect.name).toBe('unnamed');
    expect(effect.duration).toBe(-1);
    expect(effect.loop).toBe(false);
    expect(effect.active).toBe(false);
  });
});
```

### ライフサイクルテスト
```javascript
describe('ライフサイクル', () => {
  test('エフェクトが開始される', () => {
    const effect = new ParticleEffect({ duration: 1000 });
    
    effect.start();
    
    expect(effect.active).toBe(true);
    expect(effect.startTime).toBeGreaterThan(0);
  });
  
  test('エフェクトが停止される', () => {
    const effect = new ParticleEffect();
    effect.start();
    
    effect.stop();
    
    expect(effect.active).toBe(false);
  });
  
  test('継続時間で自動停止される', () => {
    const effect = new ParticleEffect({ duration: 100 });
    
    effect.start();
    effect.update(0.15); // 150ms経過
    
    expect(effect.active).toBe(false);
  });
});
```

### エミッター管理テスト
```javascript
describe('エミッター管理', () => {
  test('エミッターが追加される', () => {
    const effect = new ParticleEffect();
    const emitter = new ParticleEmitter({ name: 'test' });
    
    effect.addEmitter(emitter);
    
    expect(effect.emitters).toContain(emitter);
  });
  
  test('エミッターが削除される', () => {
    const effect = new ParticleEffect();
    const emitter = new ParticleEmitter({ name: 'test' });
    effect.addEmitter(emitter);
    
    effect.removeEmitter(emitter);
    
    expect(effect.emitters).not.toContain(emitter);
  });
});
```

## 🔧 テスト環境

### 依存関係
- **Jest**: テストフレームワーク
- **ParticleEmitter**: モックまたは実際のインスタンス
- **ParticlePool**: モックまたは実際のインスタンス

### モック戦略
- **ParticleEmitter**: 基本的な動作をモック
- **ParticlePool**: パーティクル作成・管理をモック
- **Date.now**: 時間ベースのテスト用

### テストデータ
- **有効な設定**: 正常な動作を確認する設定
- **無効な設定**: エラー処理を確認する設定
- **境界値**: 最小・最大値での動作確認

## 📈 成功基準

### テストカバレッジ
- **行カバレッジ**: 95%以上
- **分岐カバレッジ**: 90%以上
- **関数カバレッジ**: 100%

### パフォーマンス
- **初期化時間**: 1ms以下
- **更新処理**: 0.1ms以下
- **メモリ使用量**: 安定（リークなし）

### 品質
- **ESLintエラー**: 0件
- **テスト失敗**: 0件
- **エラー処理**: 100%カバー

## 🚀 実装順序

1. **基本テストケース**: 初期化、ライフサイクル
2. **エミッター管理テスト**: 追加、削除、制御
3. **設定管理テスト**: 動的変更、検証
4. **エラー処理テスト**: 例外処理、無効値
5. **パフォーマンステスト**: 負荷テスト、メモリ監視
6. **統合テスト**: 他クラスとの連携

## 📝 注意事項

- **時間ベースのテスト**: Date.nowのモックに注意
- **非同期処理**: エミッターの非同期処理を考慮
- **メモリリーク**: 長時間実行でのメモリ監視
- **エラー境界**: 極端な値での動作確認
