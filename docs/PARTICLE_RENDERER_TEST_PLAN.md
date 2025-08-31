# ParticleRenderer テスト計画

## 📋 概要
ParticleRendererクラスの包括的なテスト計画です。パーティクルの描画処理、バッチ処理、パフォーマンス最適化をテストします。

## 🎯 テスト対象
- **ParticleRendererクラス**: パーティクルの描画処理と最適化
- **Canvas描画**: 2Dコンテキストとの連携
- **バッチ処理**: 複数パーティクルの一括描画
- **パフォーマンス制御**: フレームレート制限とパーティクル数制限
- **統計情報**: 描画統計の正確性

## 🧪 テストカテゴリ

### 1. 初期化テスト
- **正常な設定での初期化**: 基本的な設定でレンダラーが正しく作成される
- **デフォルト値の確認**: 設定が指定されていない場合のデフォルト値
- **無効な設定の処理**: 不正な設定値の安全な処理
- **Canvas要素の検証**: 有効なCanvas要素の確認

### 2. 描画処理テスト
- **個別パーティクルの描画**: renderParticleメソッドの動作確認
- **複数パーティクルの描画**: renderメソッドでの一括描画
- **描画状態の管理**: Canvasコンテキストの状態保存・復元
- **描画エラーの処理**: 無効なパーティクルでの安全な処理

### 3. バッチ処理テスト
- **バッチサイズの制御**: 指定されたバッチサイズでの描画
- **描画キューの管理**: パーティクルの描画キューへの追加・削除
- **バッチ描画の実行**: _executeBatchRenderメソッドの動作
- **描画後のクリーンアップ**: キューの適切なクリア

### 4. パフォーマンス最適化テスト
- **フレームレート制限**: _shouldRenderメソッドでの制限チェック
- **パーティクル数制限**: 最大パーティクル数での描画制限
- **描画コンテキストの最適化**: _setupRenderContextメソッドの設定
- **LODシステム**: レベルオブディテールの動作確認

### 5. 統計・監視テスト
- **描画統計の更新**: _updateStatsメソッドでの統計計算
- **統計情報の取得**: getStatsメソッドでの情報取得
- **統計のリセット**: resetメソッドでの統計クリア
- **統計の正確性**: 描画回数と統計値の一致確認

### 6. 設定管理テスト
- **動的設定変更**: updateConfigメソッドでの設定更新
- **設定値の検証**: 無効な設定値の適切な処理
- **設定の範囲制限**: 最小・最大値での制限確認
- **設定変更のチェーン**: メソッドチェーンの動作確認

### 7. エラー処理テスト
- **無効なCanvas要素**: null/undefinedのCanvasでの処理
- **無効なパーティクル**: 不正なパーティクルオブジェクトの処理
- **Canvas操作エラー**: 描画コンテキストエラーの処理
- **メモリ不足**: 大量パーティクルでのメモリ制限

### 8. パフォーマンステスト
- **大量パーティクル**: 1000個以上のパーティクルでの描画
- **長時間実行**: 長時間の描画処理での安定性
- **メモリ使用量**: メモリリークの検出
- **フレームレート**: 目標FPSの維持

### 9. 統合テスト
- **ParticlePool連携**: パーティクルプールとの正常な連携
- **ParticleEmitter連携**: エミッターとの連携確認
- **イベントシステム**: 描画イベントの発火と処理
- **Canvas API**: 2Dコンテキストとの完全な連携

## 📊 テストケース詳細

### 初期化テスト
```javascript
describe('初期化', () => {
  test('正常な設定でレンダラーが作成される', () => {
    const canvas = document.createElement('canvas');
    const renderer = new ParticleRenderer(canvas, {
      batchSize: 200,
      maxParticles: 2000,
      targetFPS: 120
    });
    
    expect(renderer.canvas).toBe(canvas);
    expect(renderer.context).toBe(canvas.getContext('2d'));
    expect(renderer.batchSize).toBe(200);
    expect(renderer.maxParticles).toBe(2000);
    expect(renderer.targetFPS).toBe(120);
  });
  
  test('デフォルト値が正しく設定される', () => {
    const canvas = document.createElement('canvas');
    const renderer = new ParticleRenderer(canvas);
    
    expect(renderer.batchSize).toBe(100);
    expect(renderer.maxParticles).toBe(1000);
    expect(renderer.enableBlending).toBe(true);
    expect(renderer.enableLOD).toBe(true);
    expect(renderer.targetFPS).toBe(60);
  });
});
```

### 描画処理テスト
```javascript
describe('描画処理', () => {
  test('個別パーティクルが正しく描画される', () => {
    const canvas = document.createElement('canvas');
    const renderer = new ParticleRenderer(canvas);
    const mockParticle = createMockParticle();
    
    const spy = jest.spyOn(renderer.context, 'arc');
    
    renderer.renderParticle(mockParticle);
    
    expect(spy).toHaveBeenCalledWith(
      mockParticle.position.x,
      mockParticle.position.y,
      mockParticle.size / 2,
      0,
      Math.PI * 2
    );
  });
  
  test('複数パーティクルが一括描画される', () => {
    const canvas = document.createElement('canvas');
    const renderer = new ParticleRenderer(canvas);
    const particles = [createMockParticle(), createMockParticle()];
    
    const spy = jest.spyOn(renderer, 'renderParticle');
    
    renderer.render(particles, 0.016);
    
    expect(spy).toHaveBeenCalledTimes(2);
  });
});
```

### バッチ処理テスト
```javascript
describe('バッチ処理', () => {
  test('指定されたバッチサイズで描画される', () => {
    const canvas = document.createElement('canvas');
    const renderer = new ParticleRenderer(canvas, { batchSize: 50 });
    const particles = Array.from({ length: 150 }, () => createMockParticle());
    
    const batchSpy = jest.spyOn(renderer, '_renderBatch');
    
    renderer.render(particles, 0.016);
    
    expect(batchSpy).toHaveBeenCalledTimes(3); // 150 / 50 = 3
  });
});
```

### パフォーマンス最適化テスト
```javascript
describe('パフォーマンス最適化', () => {
  test('フレームレート制限が正しく動作する', () => {
    const canvas = document.createElement('canvas');
    const renderer = new ParticleRenderer(canvas, { targetFPS: 30 });
    
    // 最初の描画は許可される
    expect(renderer._shouldRender(0.016)).toBe(true);
    
    // 短時間での再描画は制限される
    expect(renderer._shouldRender(0.016)).toBe(false);
  });
  
  test('最大パーティクル数制限が正しく動作する', () => {
    const canvas = document.createElement('canvas');
    const renderer = new ParticleRenderer(canvas, { maxParticles: 100 });
    
    // 最大数以下の場合は描画可能
    renderer._activeParticles = new Set(Array.from({ length: 50 }));
    expect(renderer._shouldRender(0.016)).toBe(true);
    
    // 最大数を超える場合は描画制限
    renderer._activeParticles = new Set(Array.from({ length: 150 }));
    expect(renderer._shouldRender(0.016)).toBe(false);
  });
});
```

## 🔧 テスト環境

### 依存関係
- **Jest**: テストフレームワーク
- **jsdom**: DOM環境のシミュレーション
- **Canvas API**: 2Dコンテキストのモック
- **Particle**: モックまたは実際のParticleインスタンス

### モック戦略
- **Canvas要素**: jsdom環境でのCanvas要素作成
- **2Dコンテキスト**: 描画メソッドのスパイ
- **Particle**: 基本的な動作をモック
- **performance.now**: 時間ベースのテスト用

### テストデータ
- **有効なパーティクル**: 正常な描画を確認するパーティクル
- **無効なパーティクル**: エラー処理を確認するパーティクル
- **大量パーティクル**: パフォーマンスを確認するパーティクル配列
- **境界値**: 最小・最大値での動作確認

## 📈 成功基準

### テストカバレッジ
- **行カバレッジ**: 95%以上
- **分岐カバレッジ**: 90%以上
- **関数カバレッジ**: 100%

### パフォーマンス
- **初期化時間**: 1ms以下
- **描画処理**: 16ms以下（60FPS）
- **メモリ使用量**: 安定（リークなし）

### 品質
- **ESLintエラー**: 0件
- **テスト失敗**: 0件
- **エラー処理**: 100%カバー

## 🚀 実装順序

1. **基本テストケース**: 初期化、描画処理
2. **バッチ処理テスト**: 描画キュー、バッチ描画
3. **パフォーマンステスト**: フレームレート制限、パーティクル数制限
4. **統計・監視テスト**: 統計更新、情報取得
5. **設定管理テスト**: 動的変更、検証
6. **エラー処理テスト**: 無効値、例外処理
7. **パフォーマンステスト**: 負荷テスト、メモリ監視
8. **統合テスト**: 他クラスとの連携

## 📝 注意事項

- **Canvas APIモック**: jsdom環境でのCanvas操作の制限
- **パフォーマンス測定**: 実際のブラウザ環境での測定
- **メモリリーク**: 長時間実行でのメモリ監視
- **クロスブラウザ**: 異なるブラウザでの動作確認
- **描画品質**: 視覚的な描画結果の確認
