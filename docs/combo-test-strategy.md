# コンボシステム包括的テスト戦略

## 🧪 テスト戦略概要

**アプローチ**: Test-Driven Development (TDD)  
**構造**: テストピラミッド準拠  
**カバレッジ目標**: 95%以上  
**品質保証**: CI/CD自動化

## 📊 テストピラミッド構成

```
        E2E Tests (10%)
       ┌─────────────────┐
      │  視覚回帰テスト    │
     │  パフォーマンステスト │
    └─────────────────────┘
           Integration Tests (20%)
          ┌─────────────────────┐
         │   システム統合テスト   │
        │    UI統合テスト       │
       └─────────────────────────┘
              Unit Tests (70%)
             ┌─────────────────────────┐
            │ ComboState, ComboSystem  │
           │ ComboChainEffect, UI      │
          └─────────────────────────────┘
```

## 🔬 Unit Tests（ユニットテスト）

### 対象コンポーネント
1. **ComboState** - コンボ状態管理
2. **ComboSystem** - コンボロジック
3. **ComboChainEffect** - エフェクト生成
4. **ComboDisplayUI** - UI表示
5. **ComboAnimationController** - アニメーション制御

### テストケース例
```javascript
describe('ComboState', () => {
  test('コンボ増加が正しく動作する', () => {
    const comboState = new ComboState();
    comboState.incrementCombo();
    expect(comboState.currentCombo).toBe(1);
    expect(comboState.maxCombo).toBe(1);
  });

  test('履歴サイズが制限される', () => {
    const comboState = new ComboState();
    for (let i = 0; i < 150; i++) {
      comboState.addToHistory({ maxCombo: i, duration: 1000 });
    }
    expect(comboState.comboHistory.length).toBeLessThanOrEqual(100);
  });
});
```

## 🔗 Integration Tests（統合テスト）

### 統合範囲
1. **ComboSystem × GameLogic** - ゲームロジック統合
2. **ComboSystem × EffectManager** - エフェクト統合
3. **ComboDisplayUI × ModernGameUI** - UI統合
4. **ComboSystem × SpecialRulesEngine** - ルールエンジン統合

### パフォーマンス統合テスト
```javascript
describe('ComboSystem Performance Integration', () => {
  test('高速連続処理でもパフォーマンスが維持される', () => {
    const startTime = performance.now();
    
    for (let i = 0; i < 100; i++) {
      comboSystem.updateCombo(1, gameState);
    }
    
    const endTime = performance.now();
    expect(endTime - startTime).toBeLessThan(100); // 100ms以内
  });
});
```

## 🌐 E2E Tests（End-to-End テスト）

### テストシナリオ
1. **基本コンボ機能**
   - 連続ライン削除でコンボ表示
   - コンボ継続で数値増加
   - コンボメーター動作

2. **コンボエフェクト**
   - パーティクルエフェクト発生
   - 高コンボ時の特別演出

3. **パフォーマンステスト**
   - 高速コンボでのFPS維持
   - メモリ使用量制限

4. **アクセシビリティ**
   - スクリーンリーダー対応
   - キーボードナビゲーション

5. **レスポンシブ動作**
   - モバイル・タブレット・デスクトップ対応

### E2Eテスト例
```javascript
describe('コンボシステム E2Eテスト', () => {
  test('連続ライン削除でコンボが表示される', async () => {
    await gameHelper.setupLineClearScenario(2);
    await gameHelper.clearLines();
    
    const comboNumber = await page.$eval('[data-testid="combo-number"]', 
      el => el.textContent);
    expect(comboNumber).toBe('1');
  });

  test('高コンボ時に特別エフェクトが発生する', async () => {
    for (let i = 0; i < 10; i++) {
      await gameHelper.setupLineClearScenario(1);
      await gameHelper.clearLines();
      await page.waitForTimeout(50);
    }
    
    const hasSpecialEffect = await page.evaluate(() => {
      return window.effectManager ? 
        window.effectManager.hasEffect('combo-mega') : false;
    });
    expect(hasSpecialEffect).toBe(true);
  });
});
```

## 🎨 Visual Regression Tests（視覚回帰テスト）

### スクリーンショット比較
1. **コンボ表示状態**
2. **高コンボ特別演出**
3. **コンボメーター満タン**
4. **モバイル・タブレット表示**

```javascript
describe('コンボシステム視覚回帰テスト', () => {
  test('コンボ表示のスクリーンショット比較', async () => {
    await gameHelper.setupLineClearScenario(2);
    await gameHelper.clearLines();
    await page.waitForTimeout(500);
    
    const screenshot = await screenshotHelper.capture('combo-display-active');
    expect(screenshot).toMatchSnapshot('combo-display-active.png');
  });
});
```

## ⚡ Performance Tests（パフォーマンステスト）

### 測定項目
1. **処理速度**: 1000回のコンボ更新が1秒以内
2. **UI応答性**: UI更新が16ms以内（60FPS維持）
3. **メモリ効率**: 長時間実行でメモリリークなし
4. **DOM操作**: バッチ更新によるパフォーマンス最適化

```javascript
describe('ComboSystem Performance Tests', () => {
  test('1000回のコンボ更新が1秒以内に完了する', async () => {
    const startTime = performance.now();
    
    for (let i = 0; i < 1000; i++) {
      comboSystem.updateCombo(1, mockGameState);
    }
    
    const endTime = performance.now();
    expect(endTime - startTime).toBeLessThan(1000);
  });

  test('UI更新が16ms以内に完了する（60FPS維持）', async () => {
    const updates = [];
    
    for (let i = 0; i < 100; i++) {
      const startTime = performance.now();
      comboDisplayUI.updateDisplay({ comboLevel: i, animated: true });
      const endTime = performance.now();
      updates.push(endTime - startTime);
    }
    
    const averageTime = updates.reduce((a, b) => a + b) / updates.length;
    expect(averageTime).toBeLessThan(16);
  });
});
```

## 🔧 テストヘルパーとユーティリティ

### ComboTestHelper
```javascript
export class ComboTestHelper extends BaseHelper {
  async getCurrentCombo() {
    return await this.page.$eval('[data-testid="combo-number"]', 
      el => parseInt(el.textContent) || 0);
  }

  async waitForComboAnimation() {
    await this.page.waitForFunction(() => {
      const element = document.querySelector('.combo-number');
      return !element.classList.contains('combo-animation');
    }, { timeout: 2000 });
  }

  async simulateComboSequence(count) {
    for (let i = 0; i < count; i++) {
      await this.page.evaluate((index) => {
        if (window.tetrisGame && window.tetrisGame.comboSystem) {
          window.tetrisGame.comboSystem.getTestAPI().simulateCombo(index + 1);
        }
      }, i);
      await this.waitForComboAnimation();
    }
  }
}
```

## 📊 テスト実行計画

### 段階的実行
```bash
# Phase 1: Unit Tests
npm run test:combo:unit

# Phase 2: Integration Tests  
npm run test:combo:integration

# Phase 3: E2E Tests
npm run test:combo:e2e

# Phase 4: Performance Tests
npm run test:combo:performance

# All Tests
npm run test:combo:all
```

### CI/CD統合
```yaml
name: Combo System Tests
on: [push, pull_request]

jobs:
  combo-tests:
    runs-on: ubuntu-latest
    steps:
      - name: Unit Tests
        run: npm run test:combo:unit
        
      - name: Integration Tests  
        run: npm run test:combo:integration
        
      - name: E2E Tests
        run: npm run test:combo:e2e:ci
        
      - name: Performance Tests
        run: npm run test:combo:performance
        
      - name: Coverage Report
        run: npm run test:combo:coverage
```

## 📋 テスト設定

### Jest設定拡張
```javascript
// tests/combo/config/jest-combo.config.js
export default {
  displayName: 'Combo System Tests',
  testMatch: [
    '**/tests/unit/**/*combo*.test.js',
    '**/tests/integration/**/*combo*.test.js'
  ],
  collectCoverageFrom: [
    'src/core/usecases/ComboSystem.js',
    'src/core/entities/ComboState.js',
    'src/core/effects/ComboChainEffect.js',
    'src/presentation/ui/ComboDisplayUI.js'
  ],
  coverageThreshold: {
    global: {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95
    }
  }
};
```

## 🎯 品質保証

### カバレッジ目標
- **Branches**: 95%
- **Functions**: 95%
- **Lines**: 95%
- **Statements**: 95%

### 品質ゲート
- すべてのテストがパス
- カバレッジ目標達成
- パフォーマンス要件満たす
- アクセシビリティ基準準拠

## 📝 テスト実装状況

### 完了項目
- ✅ テスト戦略策定
- ✅ テストケース設計
- ✅ ヘルパークラス設計
- ✅ CI/CD統合計画

### 次のステップ
- ⏳ Unit Tests実装
- ⏳ Integration Tests実装
- ⏳ E2E Tests実装
- ⏳ Performance Tests実装

---

**テスト設計完了**: TDD開発に必要な包括的テスト戦略準備完了。
