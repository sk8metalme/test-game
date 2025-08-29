# 即座実行アクションプラン

## 🚀 今すぐ開始する作業

### Phase 1: プロジェクト基盤確立（今日開始）

#### アクション1: ディレクトリ構造構築 ⏰ 15分
```bash
# オニオンアーキテクチャ構造を作成
mkdir -p src/core/entities
mkdir -p src/core/usecases  
mkdir -p src/core/interfaces
mkdir -p src/infrastructure/rendering
mkdir -p src/infrastructure/input
mkdir -p src/infrastructure/storage
mkdir -p src/application
mkdir -p src/presentation/config
mkdir -p tests/unit/entities
mkdir -p tests/unit/usecases
mkdir -p tests/unit/infrastructure
mkdir -p tests/integration
mkdir -p tests/e2e
```

#### アクション2: 基本設定ファイル作成 ⏰ 10分
**package.json 作成**
```json
{
  "name": "tetris-ai-game",
  "version": "1.0.0",
  "description": "Tetris Generation AI Game",
  "main": "src/presentation/main.js",
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "dev": "webpack serve --mode development",
    "build": "webpack --mode production",
    "lint": "eslint src tests",
    "format": "prettier --write src tests"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "jsdom": "^23.0.0",
    "@babel/core": "^7.23.0",
    "@babel/preset-env": "^7.23.0",
    "babel-jest": "^29.7.0",
    "eslint": "^8.56.0",
    "prettier": "^3.1.0",
    "webpack": "^5.89.0",
    "webpack-cli": "^5.1.0",
    "webpack-dev-server": "^4.15.0"
  }
}
```

#### アクション3: ESLint・Prettier設定 ⏰ 5分
**.eslintrc.js**
```javascript
module.exports = {
  env: {
    browser: true,
    es2021: true,
    jest: true
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  rules: {
    'no-unused-vars': 'error',
    'no-console': 'warn',
    'prefer-const': 'error',
    'no-var': 'error'
  }
};
```

### Phase 2: TDD環境確立（今日完了）

#### アクション4: 最初のTDDサイクル開始 ⏰ 30分
**担当エージェント**: @tdd-development-expert

**手順**:
1. `tests/unit/entities/Board.test.js` を作成
2. 最初の失敗テストを記述（RED）
3. `src/core/entities/Board.js` で最小実装（GREEN）
4. コード改善（REFACTOR）

**最初のテストケース**:
```javascript
// tests/unit/entities/Board.test.js
import Board from '../../../src/core/entities/Board.js';

describe('Board', () => {
  test('should initialize empty 20x10 grid', () => {
    const board = new Board();
    
    expect(board.grid).toHaveLength(20);
    expect(board.grid[0]).toHaveLength(10);
    expect(board.isEmpty(0, 0)).toBe(true);
    expect(board.isEmpty(19, 9)).toBe(true);
  });
});
```

### Phase 3: 継続的インテグレーション設定（今日完了）

#### アクション5: GitHub Actions設定 ⏰ 20分
**.github/workflows/ci.yml**
```yaml
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linting
      run: npm run lint
    
    - name: Run tests
      run: npm run test:coverage
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
```

## 📋 今日の詳細タスクリスト

### 🔴 最優先（今すぐ実行）

- [ ] **IMMEDIATE-001**: ディレクトリ構造作成（15分）
- [ ] **IMMEDIATE-002**: package.json作成とnpm install（10分）  
- [ ] **IMMEDIATE-003**: ESLint/Prettier設定（5分）
- [ ] **IMMEDIATE-004**: 最初のTDDサイクル（30分）
- [ ] **IMMEDIATE-005**: GitHub Actions設定（20分）

**合計作業時間**: 約1時間20分

### 🟡 本日中完了目標

- [ ] **TODAY-001**: Board.js の基本機能実装（2時間）
- [ ] **TODAY-002**: Tetromino.js の基本実装（2時間）
- [ ] **TODAY-003**: 基本テストスイート完成（1時間）
- [ ] **TODAY-004**: コード品質チェック通過（30分）

**合計作業時間**: 約5.5時間

### 🟢 今週中完了目標

- [ ] **WEEK-001**: 全エンティティクラス完成
- [ ] **WEEK-002**: 全ユースケースクラス完成  
- [ ] **WEEK-003**: 基本インフラストラクチャ完成
- [ ] **WEEK-004**: 統合テスト実装
- [ ] **WEEK-005**: HTMLプロトタイプ作成

## 🔄 エージェント実行順序

### 順序1: プロジェクト基盤（今すぐ）
```
@project-manager-expert → 基盤作業実行
```

### 順序2: TDD開発開始（30分後）
```
@tdd-development-expert → Board.js実装開始
@tdd-test-implementer → テスト作成
```

### 順序3: 品質確認（2時間後）
```
@test-verification-expert → テスト実行・検証
@code-quality-reviewer → コード品質チェック
```

### 順序4: ドキュメント更新（本日終了時）
```
@deliverable-documentation-expert → 進捗ドキュメント更新
```

## 📊 本日の成功指標

### 完了基準
- [ ] プロジェクト構造が正しく作成されている
- [ ] 最初のTDDサイクルが完了している
- [ ] CI/CDパイプラインが動作している
- [ ] Board.js の基本機能が実装されている
- [ ] 全テストがパスしている

### 品質基準
- [ ] ESLint エラー: 0件
- [ ] テストカバレッジ: >80%
- [ ] ビルド成功率: 100%
- [ ] レスポンス時間: <100ms（基本操作）

## 🚨 本日の想定リスク

### リスク1: 環境設定問題
- **確率**: 中
- **対策**: 事前に動作確認済みの設定を使用
- **エスカレーション**: 30分で解決しない場合は既知の設定に戻す

### リスク2: TDD習熟時間
- **確率**: 低
- **対策**: シンプルなテストケースから開始
- **エスカレーション**: @test-verification-expert からサポート

### リスク3: Git/GitHub設定
- **確率**: 低  
- **対策**: 基本的なワークフローから開始
- **エスカレーション**: 手動デプロイに一時切り替え

## 📞 緊急時連絡

### 技術的問題
- **第1連絡先**: @tdd-development-expert
- **第2連絡先**: @design-expert
- **エスカレーション**: @project-manager-expert

### プロジェクト管理問題
- **第1連絡先**: @project-manager-expert
- **バックアップ**: @project-analyzer

## 🎯 明日の準備

### 明日開始予定
- [ ] Tetromino.js の詳細実装
- [ ] GameState.js の実装開始
- [ ] 最初の統合テスト作成
- [ ] Canvas描画プロトタイプ

### 明日までに準備すること
- [ ] Canvas API リファレンス確認
- [ ] ゲームロジック詳細仕様確認
- [ ] パフォーマンステスト要件整理

---

## 🏁 実行開始コマンド

```bash
# 1. 基盤作成
npm init -y
npm install --save-dev jest jsdom @babel/core @babel/preset-env babel-jest eslint prettier

# 2. 最初のコミット
git add .
git commit -m "feat: プロジェクト基盤設定完了

- オニオンアーキテクチャ構造作成
- Jest/TDD環境設定
- ESLint/Prettier設定
- GitHub Actions CI設定"

# 3. TDD開始
npm run test:watch
```

**プロジェクト開始時刻**: [記録してください]  
**本日完了目標時刻**: 18:00  
**次回計画レビュー**: 明日 9:00

---

**最終更新**: 2024年12月19日  
**ステータス**: 実行準備完了 ✅
