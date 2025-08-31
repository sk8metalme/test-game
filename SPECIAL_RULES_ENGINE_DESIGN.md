# 🎯 SpecialRulesEngine 設計仕様書

## 📋 概要

SpecialRulesEngineは、テトリスゲームの特殊ルールを管理・実行するシステムです。T-Spin、Perfect Clear、Combo System、Back-to-Back等の高度なゲームメカニクスを提供し、プレイヤーのスキル向上とゲーム体験の向上を目指します。

## 🎮 実装する特殊ルール

### 1. T-Spin（T字ピースの特殊回転）

#### 定義
- T字ピースが回転によって壁や他のピースに押し込まれる形で配置される
- 通常の回転では配置できない位置に配置される

#### 判定条件
```javascript
// T-Spin判定の基本条件
const isTSpin = (piece, board, rotationResult) => {
  // 1. T字ピースである
  if (piece.type !== 'T') return false;
  
  // 2. 回転が壁キックによって行われた
  if (!rotationResult.wallKick) return false;
  
  // 3. 3つの角のうち2つ以上が埋まっている
  const corners = getCornerPositions(piece, board);
  const filledCorners = corners.filter(pos => board.getCell(pos.y, pos.x) !== 0);
  
  return filledCorners.length >= 2;
};
```

#### スコアボーナス
- **T-Spin Single**: 800点
- **T-Spin Double**: 1200点
- **T-Spin Triple**: 1600点

### 2. Perfect Clear（全ライン削除）

#### 定義
- ボード上の全てのブロックを削除する
- 最も高難度の特殊ルール

#### 判定条件
```javascript
const isPerfectClear = (board) => {
  // ボード上の全セルが空である
  for (let row = 0; row < board.ROWS; row++) {
    for (let col = 0; col < board.COLS; col++) {
      if (board.getCell(row, col) !== 0) {
        return false;
      }
    }
  }
  return true;
};
```

#### スコアボーナス
- **Perfect Clear Single**: 800点
- **Perfect Clear Double**: 1200点
- **Perfect Clear Triple**: 1600点
- **Perfect Clear Tetris**: 2000点

### 3. Combo System（連続ライン削除）

#### 定義
- 連続してライン削除を行うことでボーナススコアが増加
- コンボ数に応じてスコアが指数関数的に増加

#### 判定条件
```javascript
const calculateCombo = (linesCleared, comboCount) => {
  if (linesCleared === 0) {
    return { combo: 0, bonus: 0 };
  }
  
  const newCombo = comboCount + 1;
  const bonus = Math.pow(2, newCombo) * 50; // 指数関数的増加
  
  return { combo: newCombo, bonus };
};
```

#### スコアボーナス
- **1コンボ**: 50点
- **2コンボ**: 100点
- **3コンボ**: 200点
- **4コンボ**: 400点
- **5コンボ以上**: 800点

### 4. Back-to-Back（特殊ライン削除の連続）

#### 定義
- T-SpinやPerfect Clear等の特殊ライン削除を連続で行う
- 通常のライン削除ではカウントされない

#### 判定条件
```javascript
const isBackToBack = (currentClear, previousClear) => {
  const specialClears = ['tspin', 'perfectclear'];
  
  return specialClears.includes(currentClear.type) && 
         specialClears.includes(previousClear.type);
};
```

#### スコアボーナス
- **Back-to-Back**: 1.5倍のスコア倍率

### 5. Soft Drop Bonus（ソフトドロップボーナス）

#### 定義
- ソフトドロップ（下キー）を使用してピースを配置
- 通常のドロップより高いスコア

#### 判定条件
```javascript
const calculateSoftDropBonus = (dropDistance) => {
  return dropDistance * 2; // 1マスにつき2点
};
```

## 🏗️ アーキテクチャ設計

### クラス構造

```javascript
class SpecialRulesEngine {
  constructor(config) {
    this.config = config;
    this.rules = new Map();
    this.activeRules = new Set();
    this.ruleHistory = [];
    this.comboCount = 0;
    this.lastClearType = null;
    this.backToBackCount = 0;
  }
  
  // ルールの登録・管理
  registerRule(name, ruleFunction) { /* ... */ }
  activateRule(name) { /* ... */ }
  deactivateRule(name) { /* ... */ }
  
  // 特殊ルールの判定
  checkTSpin(piece, board, rotationResult) { /* ... */ }
  checkPerfectClear(board) { /* ... */ }
  calculateCombo(linesCleared) { /* ... */ }
  checkBackToBack(clearType) { /* ... */ }
  calculateSoftDropBonus(dropDistance) { /* ... */ }
  
  // スコア計算
  calculateSpecialScore(ruleType, baseScore, modifiers) { /* ... */ }
  
  // 統計情報
  getRuleStats() { /* ... */ }
  getComboHistory() { /* ... */ }
}
```

### 依存関係

```
SpecialRulesEngine
├── Board (ボード状態の確認)
├── Tetromino (ピース情報の取得)
├── GameState (ゲーム状態の管理)
├── ScoreManager (スコア計算の連携)
└── EventSystem (ルール発動の通知)
```

## 🔧 技術実装詳細

### 1. ルール登録システム

```javascript
registerRule(name, ruleFunction) {
  if (this.rules.has(name)) {
    throw new Error(`SpecialRulesEngine: ルール '${name}' は既に登録されています`);
  }
  
  // ルール関数の検証
  if (typeof ruleFunction !== 'function') {
    throw new Error('SpecialRulesEngine: ルール関数が必要です');
  }
  
  this.rules.set(name, {
    function: ruleFunction,
    enabled: true,
    priority: this.rules.size,
    lastUsed: null,
    usageCount: 0
  });
  
  this.emit('ruleRegistered', { name, ruleFunction });
}
```

### 2. T-Spin判定システム

```javascript
checkTSpin(piece, board, rotationResult) {
  if (piece.type !== 'T') {
    return { isTSpin: false, type: null, bonus: 0 };
  }
  
  // 壁キックの確認
  if (!rotationResult.wallKick || !rotationResult.wallKick.validKick) {
    return { isTSpin: false, type: null, bonus: 0 };
  }
  
  // 角の位置を取得
  const corners = this.getCornerPositions(piece, board);
  const filledCorners = corners.filter(pos => 
    board.getCell(pos.y, pos.x) !== 0
  );
  
  if (filledCorners.length < 2) {
    return { isTSpin: false, type: null, bonus: 0 };
  }
  
  // T-Spinタイプの判定
  const type = this.determineTSpinType(piece, board);
  const bonus = this.calculateTSpinBonus(type);
  
  return { isTSpin: true, type, bonus };
}

getCornerPositions(piece, board) {
  const positions = piece.getOccupiedCells();
  const piecePos = piece.position;
  
  // T字ピースの角の位置を計算
  const corners = [];
  // 実装詳細...
  
  return corners;
}
```

### 3. Perfect Clear判定システム

```javascript
checkPerfectClear(board) {
  // ボードの全セルをチェック
  for (let row = 0; row < board.ROWS; row++) {
    for (let col = 0; col < board.COLS; col++) {
      if (board.getCell(row, col) !== 0) {
        return { isPerfectClear: false, bonus: 0 };
      }
    }
  }
  
  const bonus = this.calculatePerfectClearBonus();
  
  return { isPerfectClear: true, bonus };
}

calculatePerfectClearBonus() {
  // Perfect Clearのボーナス計算
  // 実装詳細...
  return 2000; // 例: 2000点
}
```

### 4. Combo System

```javascript
calculateCombo(linesCleared) {
  if (linesCleared === 0) {
    // コンボが途切れた
    this.comboCount = 0;
    return { combo: 0, bonus: 0, broken: true };
  }
  
  // コンボ継続
  this.comboCount++;
  const bonus = this.calculateComboBonus(this.comboCount);
  
  // コンボ履歴に追加
  this.ruleHistory.push({
    type: 'combo',
    count: this.comboCount,
    bonus,
    timestamp: Date.now()
  });
  
  return { combo: this.comboCount, bonus, broken: false };
}

calculateComboBonus(comboCount) {
  if (comboCount <= 1) return 0;
  
  // 指数関数的なボーナス計算
  return Math.pow(2, comboCount - 1) * 50;
}
```

### 5. Back-to-Back System

```javascript
checkBackToBack(clearType) {
  const specialTypes = ['tspin', 'perfectclear'];
  
  if (!specialTypes.includes(clearType)) {
    this.lastClearType = clearType;
    return { isBackToBack: false, multiplier: 1.0 };
  }
  
  if (this.lastClearType && specialTypes.includes(this.lastClearType)) {
    // Back-to-Back成立
    this.backToBackCount++;
    this.lastClearType = clearType;
    
    return { 
      isBackToBack: true, 
      multiplier: 1.5,
      count: this.backToBackCount
    };
  }
  
  this.lastClearType = clearType;
  return { isBackToBack: false, multiplier: 1.0 };
}
```

## 📊 イベントシステム

### 発火されるイベント

```javascript
// ルール登録時
this.emit('ruleRegistered', { name, ruleFunction });

// ルール有効化時
this.emit('ruleActivated', { name });

// ルール無効化時
this.emit('ruleDeactivated', { name });

// T-Spin成立時
this.emit('tspinAchieved', { type, bonus, position });

// Perfect Clear成立時
this.emit('perfectClearAchieved', { bonus });

// コンボ継続時
this.emit('comboContinued', { count, bonus });

// コンボ途切れ時
this.emit('comboBroken', { lastCount });

// Back-to-Back成立時
this.emit('backToBackAchieved', { count, multiplier });
```

## 🧪 テスト戦略

### 単体テスト

#### T-Spin判定テスト
- T字ピースでの正常なT-Spin判定
- 非T字ピースでのT-Spin非判定
- 壁キックなしでのT-Spin非判定
- 角の埋まり具合による判定

#### Perfect Clear判定テスト
- 空のボードでのPerfect Clear判定
- ブロックがあるボードでの非判定
- 部分的なブロック配置での非判定

#### Combo Systemテスト
- コンボ継続の計算
- コンボ途切れの処理
- ボーナス計算の正確性
- 履歴管理の確認

#### Back-to-Backテスト
- 特殊クリア連続での成立
- 通常クリアでの非成立
- 倍率計算の正確性

### 統合テスト

#### ゲームプレイ統合テスト
- 実際のゲームプレイでのルール発動
- スコア計算との連携
- イベント通知の確認

#### パフォーマンステスト
- 大量のルール判定での性能
- メモリ使用量の確認
- フレームレートへの影響

## 🔍 パフォーマンス最適化

### 1. 判定の最適化
- **遅延評価**: 必要な時のみ判定を実行
- **キャッシュ**: 判定結果の一時保存
- **早期リターン**: 不可能な場合の早期終了

### 2. メモリ管理
- **オブジェクトプール**: 判定結果オブジェクトの再利用
- **履歴制限**: 履歴データの最大数制限
- **ガベージコレクション**: 不要なオブジェクトの適切な破棄

### 3. 描画最適化
- **バッチ処理**: 複数のエフェクトをまとめて描画
- **LOD**: 距離に応じた詳細度調整
- **フレームスキップ**: 重い処理の分散実行

## 📈 成功指標

### 技術指標
- **テストカバレッジ**: 95%以上
- **パフォーマンス**: 判定処理16ms以下
- **メモリ使用量**: 10MB以下
- **エラー率**: 0.1%以下

### 機能指標
- **ルール判定精度**: 99%以上
- **スコア計算精度**: 100%
- **イベント通知**: 100%到達
- **履歴管理**: 正確性100%

### ユーザビリティ指標
- **学習曲線**: 新規ユーザーの理解時間
- **操作感**: ルール発動の応答性
- **視認性**: ルール成立の分かりやすさ
- **満足度**: ユーザー評価スコア

## 🚀 実装スケジュール

### フェーズ1: 基盤システム（1-2日）
- [ ] SpecialRulesEngineクラスの基本構造
- [ ] ルール登録・管理システム
- [ ] イベントシステム
- [ ] 基本テスト

### フェーズ2: T-Spin実装（2-3日）
- [ ] T-Spin判定ロジック
- [ ] 角位置計算
- [ ] タイプ判定
- [ ] テストケース

### フェーズ3: Perfect Clear実装（1-2日）
- [ ] Perfect Clear判定
- [ ] ボーナス計算
- [ ] テストケース

### フェーズ4: Combo System実装（2-3日）
- [ ] コンボ計算ロジック
- [ ] 履歴管理
- [ ] ボーナス計算
- [ ] テストケース

### フェーズ5: Back-to-Back実装（1-2日）
- [ ] Back-to-Back判定
- [ ] 倍率計算
- [ ] テストケース

### フェーズ6: 統合・最適化（2-3日）
- [ ] 全機能の統合テスト
- [ ] パフォーマンス最適化
- [ ] 最終テスト
- [ ] ドキュメント整備

## 🔧 技術的課題と解決策

### 1. T-Spin判定の精度
- **課題**: 複雑な判定ロジックによる誤判定
- **解決策**: 段階的な判定、テストケースの充実

### 2. パフォーマンス
- **課題**: 毎フレームの判定処理による負荷
- **解決策**: 遅延評価、キャッシュ、最適化

### 3. メモリ管理
- **課題**: 履歴データの蓄積によるメモリ増加
- **解決策**: 履歴制限、オブジェクトプール

---

**SpecialRulesEngineの設計仕様が策定されました。T-Spin、Perfect Clear、Combo System、Back-to-Back等の高度なゲームメカニクスを提供し、プレイヤーのスキル向上とゲーム体験の向上を実現します。**
