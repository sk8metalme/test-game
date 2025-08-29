# UI/UX 設計書

## 1. 概要

本文書では、テトリス生成AIプロジェクトのユーザーインターフェース（UI）とユーザーエクスペリエンス（UX）の詳細設計を定義します。モダンで直感的、かつアクセシブルなデザインを目指します。

## 2. デザイン原則

### 2.1 核心原則
- **シンプルさ**: 不要な要素を排除し、ゲームプレイに集中できるデザイン
- **明確性**: 情報の階層が明確で、重要な情報が瞬時に認識可能
- **応答性**: ユーザーの操作に対する即座のフィードバック
- **一貫性**: 全体を通じて統一されたデザイン言語
- **アクセシビリティ**: 多様なユーザーが利用できるインクルーシブデザイン

### 2.2 視覚的原則
- **コントラスト**: ゲームプレイエリアと情報エリアの明確な区分
- **バランス**: 要素の視覚的重みの適切な配置
- **リズム**: 一定の間隔とパターンによる視覚的リズム
- **強調**: 重要な情報やアクションの適切な強調

## 3. 全体レイアウト設計

### 3.1 画面構成

```
┌─────────────────────────────────────────────┐
│                 Header Bar                  │ 60px
├─────────────┬─────────────────┬─────────────┤
│             │                 │             │
│    Hold     │   Game Board    │    Next     │
│   Area      │     Area        │   Pieces    │
│             │                 │    Area     │
│  150x120    │    400x800     │   150x300   │
│             │                 │             │
├─────────────┼─────────────────┼─────────────┤
│             │                 │             │
│   Score     │     Ghost       │  Controls   │
│   Area      │     Guide       │    Help     │
│             │                 │             │
│  150x200    │                 │   150x200   │
│             │                 │             │
└─────────────┴─────────────────┴─────────────┘
│                Footer Bar                   │ 40px
└─────────────────────────────────────────────┘
```

### 3.2 レスポンシブデザイン

#### デスクトップ（1024px以上）
- 横配置レイアウト
- 全ての情報パネルを同時表示
- キーボード操作中心

#### タブレット（768px-1023px）
- 縦配置レイアウト
- 重要な情報パネルを優先表示
- タッチ操作対応

#### モバイル（767px以下）
- 単列レイアウト
- ゲームボード中心
- タッチコントロール表示

## 4. コンポーネント詳細設計

### 4.1 ヘッダーバー

#### 構成要素
```html
<header class="game-header">
  <div class="header-left">
    <button class="menu-button">≡</button>
    <h1 class="game-title">Tetris AI</h1>
  </div>
  <div class="header-center">
    <div class="game-timer">00:00:00</div>
  </div>
  <div class="header-right">
    <button class="pause-button">⏸</button>
    <button class="settings-button">⚙</button>
  </div>
</header>
```

#### スタイル仕様
```css
.game-header {
  height: 60px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.game-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0;
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
}

.game-timer {
  font-family: 'Roboto Mono', monospace;
  font-size: 18px;
  font-weight: 500;
  background: rgba(255,255,255,0.1);
  padding: 5px 15px;
  border-radius: 20px;
  backdrop-filter: blur(10px);
}
```

### 4.2 ゲームボードエリア

#### 構成要素
```html
<div class="game-board-container">
  <canvas id="game-canvas" class="game-board"></canvas>
  <div class="game-overlay">
    <div class="level-indicator">Level: <span id="level">1</span></div>
    <div class="lines-indicator">Lines: <span id="lines">0</span></div>
  </div>
</div>
```

#### ビジュアル仕様
- **ボードサイズ**: 400x800px (20x40 セル)
- **セルサイズ**: 20x20px
- **グリッドライン**: 1px solid rgba(255,255,255,0.1)
- **境界線**: 2px solid #333
- **背景**: グラデーション #1a1a2e → #16213e

#### テトロミノデザイン
```css
/* テトロミノカラーパレット */
.tetromino-I { color: #00f5ff; } /* シアン */
.tetromino-O { color: #ffed4e; } /* イエロー */
.tetromino-T { color: #d500f9; } /* パープル */
.tetromino-S { color: #76ff03; } /* グリーン */
.tetromino-Z { color: #ff1744; } /* レッド */
.tetromino-J { color: #2979ff; } /* ブルー */
.tetromino-L { color: #ff9100; } /* オレンジ */

/* ピース描画スタイル */
.tetromino-cell {
  border: 1px solid rgba(255,255,255,0.3);
  border-radius: 2px;
  box-shadow: 
    inset 0 1px 0 rgba(255,255,255,0.2),
    0 1px 2px rgba(0,0,0,0.3);
}
```

### 4.3 スコアエリア

#### 構成要素
```html
<div class="score-panel">
  <div class="score-item">
    <label>Score</label>
    <span class="score-value" id="score">0</span>
  </div>
  <div class="score-item">
    <label>Level</label>
    <span class="level-value" id="level">1</span>
  </div>
  <div class="score-item">
    <label>Lines</label>
    <span class="lines-value" id="lines">0</span>
  </div>
  <div class="score-item">
    <label>Time</label>
    <span class="time-value" id="time">00:00</span>
  </div>
</div>
```

#### アニメーション効果
```css
.score-value {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.score-value.updating {
  transform: scale(1.2);
  color: #00f5ff;
  text-shadow: 0 0 10px currentColor;
}

@keyframes scoreIncrease {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}
```

### 4.4 次ピース表示エリア

#### 構成要素
```html
<div class="next-pieces-panel">
  <h3>Next</h3>
  <div class="next-piece-container">
    <canvas class="next-piece-preview" data-index="0"></canvas>
    <canvas class="next-piece-preview" data-index="1"></canvas>
    <canvas class="next-piece-preview" data-index="2"></canvas>
    <canvas class="next-piece-preview" data-index="3"></canvas>
    <canvas class="next-piece-preview" data-index="4"></canvas>
  </div>
</div>
```

#### ビジュアル階層
- **第1ピース**: 大きいサイズ（80x80px）、強調表示
- **第2-3ピース**: 中サイズ（60x60px）、通常表示
- **第4-5ピース**: 小サイズ（40x40px）、薄い表示

### 4.5 ホールドエリア

#### 構成要素
```html
<div class="hold-panel">
  <h3>Hold</h3>
  <div class="hold-container">
    <canvas id="hold-piece-preview"></canvas>
    <div class="hold-hint">Press C to hold</div>
  </div>
</div>
```

#### 状態表示
- **利用可能**: 通常の明度
- **利用不可**: 50%透明度、グレースケール
- **アニメーション**: ホールド時にフェードイン/アウト

## 5. インタラクションデザイン

### 5.1 キーボード操作

#### 主要操作
| キー | 動作 | ビジュアルフィードバック |
|------|------|-------------------------|
| ← → | 移動 | ピース位置の即座な更新 |
| ↑ | 回転 | 回転アニメーション |
| ↓ | ソフトドロップ | 加速落下表示 |
| Space | ハードドロップ | 落下軌跡表示 |
| C | ホールド | ホールドアニメーション |
| P/Esc | 一時停止 | オーバーレイ表示 |

#### 操作フィードバック
```css
.piece-highlight {
  box-shadow: 0 0 15px rgba(255, 255, 255, 0.8);
  animation: pulse 0.3s ease-in-out;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}
```

### 5.2 タッチ操作

#### ジェスチャーマッピング
- **スワイプ左/右**: 移動
- **タップ**: 回転
- **下スワイプ**: ソフトドロップ
- **上スワイプ**: ハードドロップ
- **ロングタップ**: ホールド

#### タッチコントロール
```html
<div class="touch-controls">
  <button class="control-btn move-left">←</button>
  <button class="control-btn rotate">↻</button>
  <button class="control-btn move-right">→</button>
  <button class="control-btn soft-drop">↓</button>
  <button class="control-btn hard-drop">⬇</button>
  <button class="control-btn hold">Hold</button>
</div>
```

## 6. アニメーション設計

### 6.1 ピースアニメーション

#### 移動アニメーション
```css
.piece-moving {
  transition: transform 0.1s cubic-bezier(0.4, 0, 0.2, 1);
}

.piece-fast-drop {
  transition: transform 0.05s linear;
}
```

#### 回転アニメーション
```css
@keyframes pieceRotate {
  0% { transform: rotate(0deg) scale(1); }
  50% { transform: rotate(45deg) scale(1.1); }
  100% { transform: rotate(90deg) scale(1); }
}

.piece-rotating {
  animation: pieceRotate 0.2s ease-out;
}
```

### 6.2 ライン消去アニメーション

#### フェードアウト効果
```css
@keyframes lineClear {
  0% { 
    opacity: 1; 
    transform: scaleX(1); 
    background: white;
  }
  50% { 
    opacity: 0.8; 
    transform: scaleX(1.1); 
    background: #00f5ff;
  }
  100% { 
    opacity: 0; 
    transform: scaleX(0); 
  }
}

.line-clearing {
  animation: lineClear 0.6s ease-in-out;
}
```

### 6.3 レベルアップエフェクト

#### パーティクル効果
```css
@keyframes levelUpParticle {
  0% {
    opacity: 1;
    transform: translateY(0) scale(0);
  }
  50% {
    opacity: 0.8;
    transform: translateY(-50px) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(-100px) scale(0);
  }
}

.level-up-particle {
  animation: levelUpParticle 1s ease-out;
}
```

## 7. メニューシステム

### 7.1 メインメニュー

#### 構成要素
```html
<div class="main-menu">
  <div class="menu-header">
    <h1>Tetris AI</h1>
    <p>The Ultimate Puzzle Experience</p>
  </div>
  <nav class="menu-navigation">
    <button class="menu-btn primary">Start Game</button>
    <button class="menu-btn">Continue</button>
    <button class="menu-btn">Settings</button>
    <button class="menu-btn">Statistics</button>
    <button class="menu-btn">About</button>
  </nav>
</div>
```

#### ビジュアルスタイル
```css
.main-menu {
  background: linear-gradient(45deg, #1a1a2e, #16213e, #0f3460);
  background-size: 400% 400%;
  animation: gradientShift 8s ease infinite;
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.menu-btn {
  padding: 15px 30px;
  border: 2px solid transparent;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 18px;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.menu-btn:hover {
  border-color: #00f5ff;
  box-shadow: 0 0 20px rgba(0, 245, 255, 0.3);
  transform: translateY(-2px);
}
```

### 7.2 ポーズメニュー

#### オーバーレイデザイン
```html
<div class="pause-overlay">
  <div class="pause-menu">
    <h2>Game Paused</h2>
    <button class="pause-btn">Resume</button>
    <button class="pause-btn">Restart</button>
    <button class="pause-btn">Settings</button>
    <button class="pause-btn">Main Menu</button>
  </div>
</div>
```

#### ブラー効果
```css
.pause-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.3s ease;
}
```

## 8. テーマシステム

### 8.1 カラーパレット

#### デフォルトテーマ（Modern Dark）
```css
:root {
  /* プライマリカラー */
  --primary-bg: #1a1a2e;
  --secondary-bg: #16213e;
  --accent-bg: #0f3460;
  
  /* テキストカラー */
  --text-primary: #ffffff;
  --text-secondary: #b8b8b8;
  --text-muted: #666666;
  
  /* アクセントカラー */
  --accent-cyan: #00f5ff;
  --accent-purple: #d500f9;
  --accent-green: #76ff03;
  
  /* 状態カラー */
  --success: #4caf50;
  --warning: #ff9800;
  --error: #f44336;
  --info: #2196f3;
}
```

#### クラシックテーマ
```css
.theme-classic {
  --primary-bg: #000000;
  --secondary-bg: #333333;
  --accent-bg: #666666;
  --text-primary: #00ff00;
  --text-secondary: #00cc00;
  --accent-cyan: #00ffff;
}
```

### 8.2 アクセシビリティテーマ

#### ハイコントラスト
```css
.theme-high-contrast {
  --primary-bg: #000000;
  --secondary-bg: #ffffff;
  --text-primary: #ffffff;
  --text-secondary: #000000;
  filter: contrast(150%);
}
```

#### 色覚サポート
```css
.theme-colorblind-friendly {
  /* 色覚特性に配慮したカラーパレット */
  --tetromino-I: #0173b2; /* ブルー */
  --tetromino-O: #de8f05; /* オレンジ */
  --tetromino-T: #cc78bc; /* ピンク */
  --tetromino-S: #029e73; /* グリーン */
  --tetromino-Z: #d55e00; /* 赤橙 */
  --tetromino-J: #ca9161; /* ブラウン */
  --tetromino-L: #fbafe4; /* ライトピンク */
}
```

## 9. レスポンシブブレークポイント

### 9.1 デバイス対応

```css
/* デスクトップ */
@media (min-width: 1024px) {
  .game-container {
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .side-panels {
    display: flex;
  }
  
  .touch-controls {
    display: none;
  }
}

/* タブレット */
@media (min-width: 768px) and (max-width: 1023px) {
  .game-container {
    padding: 10px;
  }
  
  .side-panels {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
  
  .touch-controls {
    display: flex;
  }
}

/* モバイル */
@media (max-width: 767px) {
  .game-container {
    padding: 5px;
  }
  
  .side-panels {
    display: none;
  }
  
  .touch-controls {
    display: flex;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
  }
  
  .game-board {
    transform: scale(0.8);
  }
}
```

### 9.2 縦向き・横向き対応

```css
/* 縦向き */
@media (orientation: portrait) {
  .game-layout {
    flex-direction: column;
  }
  
  .game-board {
    order: 1;
  }
  
  .game-info {
    order: 2;
  }
}

/* 横向き */
@media (orientation: landscape) {
  .game-layout {
    flex-direction: row;
  }
  
  .game-board {
    order: 1;
  }
  
  .game-info {
    order: 2;
    flex-direction: column;
  }
}
```

## 10. パフォーマンス最適化

### 10.1 CSS最適化

#### GPU加速の活用
```css
.game-board,
.tetromino-piece,
.animation-element {
  will-change: transform;
  transform: translateZ(0);
}
```

#### 効率的なアニメーション
```css
/* transform と opacity のみ使用 */
.smooth-animation {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

/* アニメーション中のレイアウト再計算を避ける */
.animating {
  position: absolute;
  top: 0;
  left: 0;
}
```

### 10.2 レンダリング最適化

#### Canvas最適化
```javascript
// オフスクリーンキャンバスでの事前描画
const offscreenCanvas = new OffscreenCanvas(width, height);
const offscreenCtx = offscreenCanvas.getContext('2d');

// バッファリング戦略
class RenderBuffer {
    constructor() {
        this.dirtyRegions = [];
        this.frameBuffer = null;
    }
    
    markDirty(x, y, width, height) {
        this.dirtyRegions.push({x, y, width, height});
    }
    
    render() {
        // 汚れた領域のみ再描画
        this.dirtyRegions.forEach(region => {
            this.renderRegion(region);
        });
        this.dirtyRegions = [];
    }
}
```

これでUI/UX設計書が完成しました。最後にデータフロー設計書を作成いたします。
