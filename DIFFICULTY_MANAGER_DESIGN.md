# 🎯 DifficultyManager 設計仕様書

## 📋 概要

DifficultyManagerは、テトリスゲームの動的難易度調整システムです。プレイヤーのスキルレベルを評価し、適応的に難易度を調整することで、常に適切なチャレンジを提供し、プレイヤーの継続的な成長をサポートします。

## 🎮 実装する難易度調整機能

### 1. プレイヤースキル評価システム

#### 定義
- プレイヤーの実際のゲームプレイパフォーマンスを分析
- 複数の指標を組み合わせた総合的なスキル評価
- リアルタイムでのスキルレベル更新

#### 評価指標
```javascript
// スキル評価の基本構造
const skillMetrics = {
  // 基本スコア指標
  scoreEfficiency: 0.0,        // スコア効率（獲得スコア/時間）
  lineClearRate: 0.0,          // ライン削除率
  piecePlacementEfficiency: 0.0, // ピース配置効率
  
  // 高度なテクニック指標
  tspinUsage: 0.0,             // T-Spin使用率
  perfectClearRate: 0.0,       // Perfect Clear率
  comboEfficiency: 0.0,        // コンボ効率
  
  // 生存指標
  survivalTime: 0.0,           // 生存時間
  levelProgression: 0.0,       // レベル進行速度
  
  // エラー指標
  dropErrors: 0.0,             // ドロップエラー率
  rotationErrors: 0.0,         // 回転エラー率
  
  // 総合スキルスコア
  overallSkill: 0.0            // 0.0-1.0の範囲
};
```

#### スキル計算アルゴリズム
```javascript
const calculateSkillLevel = (metrics) => {
  // 重み付けによる総合スコア計算
  const weights = {
    scoreEfficiency: 0.25,
    lineClearRate: 0.20,
    piecePlacementEfficiency: 0.20,
    tspinUsage: 0.15,
    perfectClearRate: 0.10,
    comboEfficiency: 0.10
  };
  
  let totalScore = 0;
  let totalWeight = 0;
  
  for (const [metric, value] of Object.entries(metrics)) {
    if (weights[metric]) {
      totalScore += value * weights[metric];
      totalWeight += weights[metric];
    }
  }
  
  return totalWeight > 0 ? totalScore / totalWeight : 0;
};
```

### 2. 動的難易度調整システム

#### 定義
- プレイヤーのスキルレベルに応じた難易度の自動調整
- ゲーム進行中のリアルタイム調整
- プレイヤーの成長に合わせた段階的な難易度上昇

#### 調整パラメータ
```javascript
const difficultyParams = {
  // 落下速度調整
  dropSpeed: {
    base: 1000,           // 基本落下間隔（ms）
    min: 100,             // 最小落下間隔
    max: 2000,            // 最大落下間隔
    adjustment: 0.1       // 調整係数
  },
  
  // ピース生成調整
  pieceGeneration: {
    bagSize: 7,           // 7-bagシステムのサイズ
    biasAdjustment: 0.0,  // ピース生成の偏り調整
    previewCount: 3       // プレビュー表示数
  },
  
  // 特殊ルール調整
  specialRules: {
    tspinDifficulty: 1.0, // T-Spin判定の難易度
    perfectClearBonus: 1.0, // Perfect Clearボーナス
    comboMultiplier: 1.0   // コンボ倍率
  },
  
  // ボーナス調整
  bonuses: {
    lineClearBonus: 1.0,  // ライン削除ボーナス
    dropBonus: 1.0,       // ドロップボーナス
    levelUpBonus: 1.0     // レベルアップボーナス
  }
};
```

#### 難易度調整アルゴリズム
```javascript
const adjustDifficulty = (currentSkill, targetSkill, currentParams) => {
  const skillDifference = targetSkill - currentSkill;
  const adjustmentFactor = Math.tanh(skillDifference * 2) * 0.1;
  
  return {
    dropSpeed: Math.max(
      currentParams.dropSpeed.min,
      Math.min(
        currentParams.dropSpeed.max,
        currentParams.dropSpeed.base * (1 + adjustmentFactor)
      )
    ),
    
    pieceGeneration: {
      ...currentParams.pieceGeneration,
      biasAdjustment: Math.max(-0.3, Math.min(0.3, adjustmentFactor * 2))
    },
    
    specialRules: {
      ...currentParams.specialRules,
      tspinDifficulty: 1 + adjustmentFactor * 0.5
    }
  };
};
```

### 3. 適応的難易度制御

#### 定義
- プレイヤーの学習曲線に合わせた難易度の段階的調整
- フラストレーションと退屈のバランスを保つ
- 長期的なプレイヤー成長のサポート

#### 制御アルゴリズム
```javascript
const adaptiveDifficultyControl = (playerHistory, currentSession) => {
  // セッション内のパフォーマンス分析
  const sessionPerformance = analyzeSessionPerformance(currentSession);
  
  // 長期的な成長トレンド分析
  const growthTrend = analyzeGrowthTrend(playerHistory);
  
  // 難易度調整の決定
  const adjustment = calculateAdjustment(sessionPerformance, growthTrend);
  
  return {
    immediate: adjustment.immediate,    // 即座の調整
    gradual: adjustment.gradual,       // 段階的調整
    longTerm: adjustment.longTerm      // 長期的調整
  };
};
```

### 4. 難易度プリセットシステム

#### 定義
- 事前定義された難易度レベルの提供
- カスタム難易度設定の作成・保存
- プレイヤーによる手動調整のサポート

#### プリセット定義
```javascript
const difficultyPresets = {
  beginner: {
    name: 'Beginner',
    description: '初心者向けの優しい難易度',
    dropSpeed: 1500,
    pieceGeneration: { bagSize: 7, biasAdjustment: 0.1 },
    specialRules: { tspinDifficulty: 0.8, perfectClearBonus: 1.2 },
    bonuses: { lineClearBonus: 1.2, dropBonus: 1.1 }
  },
  
  casual: {
    name: 'Casual',
    description: 'カジュアルプレイヤー向け',
    dropSpeed: 1000,
    pieceGeneration: { bagSize: 7, biasAdjustment: 0.0 },
    specialRules: { tspinDifficulty: 1.0, perfectClearBonus: 1.0 },
    bonuses: { lineClearBonus: 1.0, dropBonus: 1.0 }
  },
  
  advanced: {
    name: 'Advanced',
    description: '上級者向けの高難易度',
    dropSpeed: 500,
    pieceGeneration: { bagSize: 7, biasAdjustment: -0.1 },
    specialRules: { tspinDifficulty: 1.2, perfectClearBonus: 0.9 },
    bonuses: { lineClearBonus: 0.9, dropBonus: 0.9 }
  },
  
  expert: {
    name: 'Expert',
    description: 'エキスパート向けの極限難易度',
    dropSpeed: 200,
    pieceGeneration: { bagSize: 7, biasAdjustment: -0.2 },
    specialRules: { tspinDifficulty: 1.5, perfectClearBonus: 0.8 },
    bonuses: { lineClearBonus: 0.8, dropBonus: 0.8 }
  }
};
```

## 🏗️ アーキテクチャ設計

### クラス構造

```javascript
class DifficultyManager {
  constructor(config) {
    this.config = config;
    this.currentDifficulty = {};
    this.playerSkill = new PlayerSkillEvaluator();
    this.adaptiveController = new AdaptiveDifficultyController();
    this.presets = new DifficultyPresetManager();
    this.history = new DifficultyHistory();
    this.listeners = new Map();
  }
  
  // スキル評価
  evaluatePlayerSkill(gameData) { /* ... */ }
  updateSkillMetrics(metrics) { /* ... */ }
  getCurrentSkillLevel() { /* ... */ }
  
  // 難易度調整
  adjustDifficulty(targetSkill) { /* ... */ }
  applyDifficultySettings(settings) { /* ... */ }
  getCurrentDifficulty() { /* ... */ }
  
  // 適応的制御
  analyzePerformance(sessionData) { /* ... */ }
  calculateAdjustment(performance, trend) { /* ... */ }
  applyAdaptiveChanges(changes) { /* ... */ }
  
  // プリセット管理
  loadPreset(presetName) { /* ... */ }
  saveCustomPreset(name, settings) { /* ... */ }
  getAvailablePresets() { /* ... */ }
  
  // 履歴管理
  recordDifficultyChange(change) { /* ... */ }
  getDifficultyHistory() { /* ... */ }
  analyzeTrends() { /* ... */ }
}
```

### 依存関係

```
DifficultyManager
├── PlayerSkillEvaluator (プレイヤースキル評価)
├── AdaptiveDifficultyController (適応的難易度制御)
├── DifficultyPresetManager (難易度プリセット管理)
├── DifficultyHistory (難易度変更履歴)
├── GameState (ゲーム状態の取得)
├── SpecialRulesEngine (特殊ルールとの連携)
└── EventSystem (難易度変更の通知)
```

## 🔧 技術実装詳細

### 1. プレイヤースキル評価システム

```javascript
class PlayerSkillEvaluator {
  constructor() {
    this.metrics = new Map();
    this.weights = this.initializeWeights();
    this.history = [];
  }
  
  initializeWeights() {
    return {
      scoreEfficiency: 0.25,
      lineClearRate: 0.20,
      piecePlacementEfficiency: 0.20,
      tspinUsage: 0.15,
      perfectClearRate: 0.10,
      comboEfficiency: 0.10
    };
  }
  
  evaluateSkill(gameData) {
    const metrics = this.calculateMetrics(gameData);
    const skillLevel = this.calculateSkillLevel(metrics);
    
    this.updateHistory(metrics, skillLevel);
    
    return {
      metrics,
      skillLevel,
      confidence: this.calculateConfidence(),
      trend: this.analyzeTrend()
    };
  }
  
  calculateMetrics(gameData) {
    const { score, time, lines, pieces, specialMoves } = gameData;
    
    return {
      scoreEfficiency: this.calculateScoreEfficiency(score, time),
      lineClearRate: this.calculateLineClearRate(lines, pieces),
      piecePlacementEfficiency: this.calculatePlacementEfficiency(pieces),
      tspinUsage: this.calculateTSpinUsage(specialMoves),
      perfectClearRate: this.calculatePerfectClearRate(specialMoves),
      comboEfficiency: this.calculateComboEfficiency(specialMoves)
    };
  }
  
  calculateSkillLevel(metrics) {
    let totalScore = 0;
    let totalWeight = 0;
    
    for (const [metric, value] of Object.entries(metrics)) {
      if (this.weights[metric]) {
        totalScore += value * this.weights[metric];
        totalWeight += this.weights[metric];
      }
    }
    
    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }
}
```

### 2. 動的難易度調整システム

```javascript
class DynamicDifficultyAdjuster {
  constructor(baseConfig) {
    this.baseConfig = baseConfig;
    this.currentConfig = { ...baseConfig };
    this.adjustmentHistory = [];
  }
  
  adjustDifficulty(currentSkill, targetSkill) {
    const skillDifference = targetSkill - currentSkill;
    const adjustmentFactor = this.calculateAdjustmentFactor(skillDifference);
    
    const newConfig = this.applyAdjustments(adjustmentFactor);
    
    this.recordAdjustment({
      skillDifference,
      adjustmentFactor,
      oldConfig: { ...this.currentConfig },
      newConfig
    });
    
    this.currentConfig = newConfig;
    return newConfig;
  }
  
  calculateAdjustmentFactor(skillDifference) {
    // シグモイド関数による滑らかな調整
    return Math.tanh(skillDifference * 2) * 0.1;
  }
  
  applyAdjustments(adjustmentFactor) {
    return {
      dropSpeed: this.adjustDropSpeed(adjustmentFactor),
      pieceGeneration: this.adjustPieceGeneration(adjustmentFactor),
      specialRules: this.adjustSpecialRules(adjustmentFactor),
      bonuses: this.adjustBonuses(adjustmentFactor)
    };
  }
  
  adjustDropSpeed(adjustmentFactor) {
    const baseSpeed = this.baseConfig.dropSpeed.base;
    const adjustedSpeed = baseSpeed * (1 + adjustmentFactor);
    
    return Math.max(
      this.baseConfig.dropSpeed.min,
      Math.min(this.baseConfig.dropSpeed.max, adjustedSpeed)
    );
  }
}
```

### 3. 適応的難易度制御

```javascript
class AdaptiveDifficultyController {
  constructor() {
    this.performanceHistory = [];
    this.adjustmentStrategy = 'balanced';
    this.learningRate = 0.01;
  }
  
  analyzePerformance(sessionData) {
    const performance = this.calculatePerformanceScore(sessionData);
    this.performanceHistory.push({
      timestamp: Date.now(),
      performance,
      sessionData
    });
    
    return {
      current: performance,
      trend: this.calculateTrend(),
      volatility: this.calculateVolatility(),
      recommendation: this.generateRecommendation()
    };
  }
  
  calculatePerformanceScore(sessionData) {
    const { score, time, lines, errors, specialMoves } = sessionData;
    
    // 複合的なパフォーマンススコア計算
    const scoreEfficiency = score / Math.max(time, 1);
    const lineEfficiency = lines / Math.max(time, 1);
    const errorPenalty = errors * 0.1;
    const specialBonus = specialMoves.length * 0.05;
    
    return Math.max(0, Math.min(1,
      scoreEfficiency * 0.4 +
      lineEfficiency * 0.3 +
      specialBonus * 0.2 -
      errorPenalty * 0.1
    ));
  }
  
  generateRecommendation() {
    const trend = this.calculateTrend();
    const volatility = this.calculateVolatility();
    
    if (trend > 0.1 && volatility < 0.2) {
      return { action: 'increase', factor: 0.1, reason: '安定した成長' };
    } else if (trend < -0.1) {
      return { action: 'decrease', factor: 0.15, reason: 'パフォーマンス低下' };
    } else if (volatility > 0.3) {
      return { action: 'stabilize', factor: 0.05, reason: '不安定なパフォーマンス' };
    } else {
      return { action: 'maintain', factor: 0.0, reason: '適切な難易度' };
    }
  }
}
```

### 4. 難易度プリセット管理

```javascript
class DifficultyPresetManager {
  constructor() {
    this.presets = new Map();
    this.customPresets = new Map();
    this.initializeDefaultPresets();
  }
  
  initializeDefaultPresets() {
    const defaultPresets = {
      beginner: {
        name: 'Beginner',
        description: '初心者向けの優しい難易度',
        dropSpeed: 1500,
        pieceGeneration: { bagSize: 7, biasAdjustment: 0.1 },
        specialRules: { tspinDifficulty: 0.8, perfectClearBonus: 1.2 },
        bonuses: { lineClearBonus: 1.2, dropBonus: 1.1 }
      },
      // ... 他のプリセット
    };
    
    for (const [key, preset] of Object.entries(defaultPresets)) {
      this.presets.set(key, preset);
    }
  }
  
  loadPreset(presetName) {
    const preset = this.presets.get(presetName) || this.customPresets.get(presetName);
    
    if (!preset) {
      throw new Error(`DifficultyManager: プリセット '${presetName}' は見つかりません`);
    }
    
    return { ...preset };
  }
  
  saveCustomPreset(name, settings) {
    if (this.presets.has(name)) {
      throw new Error(`DifficultyManager: プリセット名 '${name}' は予約されています`);
    }
    
    this.customPresets.set(name, {
      name,
      description: `カスタムプリセット: ${name}`,
      ...settings,
      isCustom: true,
      createdAt: Date.now()
    });
    
    return true;
  }
  
  getAvailablePresets() {
    const allPresets = [];
    
    // デフォルトプリセット
    for (const [key, preset] of this.presets) {
      allPresets.push({ ...preset, key, isDefault: true });
    }
    
    // カスタムプリセット
    for (const [key, preset] of this.customPresets) {
      allPresets.push({ ...preset, key, isDefault: false });
    }
    
    return allPresets.sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      return a.name.localeCompare(b.name);
    });
  }
}
```

## 📊 イベントシステム

### 発火されるイベント

```javascript
// スキル評価時
this.emit('skillEvaluated', { metrics, skillLevel, confidence, trend });

// 難易度調整時
this.emit('difficultyAdjusted', { oldSettings, newSettings, reason });

// 適応的制御時
this.emit('adaptiveAdjustment', { performance, recommendation, changes });

// プリセット変更時
this.emit('presetChanged', { presetName, settings });

// カスタムプリセット保存時
this.emit('customPresetSaved', { name, settings });

// 履歴更新時
this.emit('historyUpdated', { change, timestamp });
```

## 🧪 テスト戦略

### 単体テスト

#### プレイヤースキル評価テスト
- 各指標の正確な計算
- 重み付けによる総合スコア計算
- 履歴データの管理
- トレンド分析の正確性

#### 難易度調整テスト
- 調整係数の計算
- パラメータ範囲の制限
- 調整履歴の記録
- 設定の適用

#### 適応的制御テスト
- パフォーマンス分析
- 推奨事項の生成
- 学習率の適用
- 安定性の確認

#### プリセット管理テスト
- デフォルトプリセットの読み込み
- カスタムプリセットの保存
- プリセットの検証
- エラーハンドリング

### 統合テスト

#### ゲームプレイ統合テスト
- 実際のゲームプレイでの難易度調整
- スキル評価との連携
- パフォーマンスへの影響
- ユーザー体験の確認

#### パフォーマンステスト
- 大量のデータ処理での性能
- メモリ使用量の確認
- リアルタイム処理の応答性
- 履歴データの管理効率

## 🔍 パフォーマンス最適化

### 1. 計算の最適化
- **キャッシュ**: 頻繁に使用される計算結果の保存
- **遅延評価**: 必要な時のみ計算を実行
- **バッチ処理**: 複数の計算をまとめて実行

### 2. メモリ管理
- **履歴制限**: 履歴データの最大数制限
- **データ圧縮**: 古いデータの圧縮保存
- **ガベージコレクション**: 不要なオブジェクトの適切な破棄

### 3. リアルタイム処理
- **フレーム分割**: 重い処理の分散実行
- **優先度制御**: 重要な処理の優先実行
- **非同期処理**: 時間のかかる処理の非同期化

## 📈 成功指標

### 技術指標
- **テストカバレッジ**: 95%以上
- **パフォーマンス**: 評価処理16ms以下
- **メモリ使用量**: 15MB以下
- **エラー率**: 0.1%以下

### 機能指標
- **スキル評価精度**: 90%以上
- **難易度調整精度**: 85%以上
- **適応性**: プレイヤー成長への追従性
- **安定性**: 難易度の急激な変動防止

### ユーザビリティ指標
- **学習曲線**: 適切な難易度の提供
- **エンゲージメント**: プレイヤーの継続性
- **満足度**: 難易度調整への満足度
- **カスタマイズ性**: 手動調整の柔軟性

## 🚀 実装スケジュール

### フェーズ1: 基盤システム（2-3日）
- [ ] DifficultyManagerクラスの基本構造
- [ ] PlayerSkillEvaluatorの実装
- [ ] 基本テスト

### フェーズ2: スキル評価システム（3-4日）
- [ ] 各指標の計算ロジック
- [ ] 重み付けシステム
- [ ] 履歴管理
- [ ] テストケース

### フェーズ3: 難易度調整システム（2-3日）
- [ ] 動的調整ロジック
- [ ] パラメータ制限
- [ ] 調整履歴
- [ ] テストケース

### フェーズ4: 適応的制御（3-4日）
- [ ] パフォーマンス分析
- [ ] 推奨事項生成
- [ ] 学習アルゴリズム
- [ ] テストケース

### フェーズ5: プリセット管理（1-2日）
- [ ] プリセットシステム
- [ ] カスタムプリセット
- [ ] テストケース

### フェーズ6: 統合・最適化（2-3日）
- [ ] 全機能の統合テスト
- [ ] パフォーマンス最適化
- [ ] 最終テスト
- [ ] ドキュメント整備

## 🔧 技術的課題と解決策

### 1. スキル評価の精度
- **課題**: 複雑な指標の組み合わせによる評価の不正確性
- **解決策**: 機械学習アルゴリズムの導入、重み付けの動的調整

### 2. リアルタイム処理
- **課題**: ゲームプレイ中のリアルタイム難易度調整
- **解決策**: フレーム分割、非同期処理、優先度制御

### 3. データ管理
- **課題**: 大量の履歴データの効率的な管理
- **解決策**: データ圧縮、履歴制限、効率的なストレージ

---

**DifficultyManagerの設計仕様が策定されました。プレイヤーのスキルレベルを評価し、適応的に難易度を調整することで、常に適切なチャレンジを提供し、プレイヤーの継続的な成長をサポートします。**
