# コーディング規約・品質基準

## 📋 概要

Week 2改善実装により策定されたテトリスゲーム開発プロジェクトのコーディング規約と品質基準です。

## 🎯 目的

- **コード品質の統一** - チーム全体での一貫した品質
- **保守性の向上** - 長期的な開発効率
- **バグ減少** - 予防的品質保証
- **開発効率向上** - 迷いの排除

## 📊 品質メトリクス目標

| 指標 | 目標値 | 測定方法 |
|------|--------|----------|
| **テストカバレッジ** | 85%+ | Jest coverage |
| **ESLint エラー** | 0件 | CI/CD pipeline |
| **実行時間** | <100ms | パフォーマンステスト |
| **メモリ使用量** | <50MB | Node.js monitoring |
| **CI成功率** | 95%+ | GitHub Actions |

---

## 🔧 ESLint設定

### .eslintrc.js 標準設定

```javascript
export default {
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  rules: {
    // エラーレベル設定
    'no-console': 'warn',
    'no-unused-vars': 'error',
    'no-undef': 'error',
    'no-prototype-builtins': 'error',
    'no-constant-condition': 'error',
    
    // スタイル設定
    'indent': ['error', 2],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'comma-dangle': ['error', 'never'],
    
    // ベストプラクティス
    'eqeqeq': 'error',
    'no-var': 'error',
    'prefer-const': 'error',
    'arrow-spacing': 'error',
    'object-shorthand': 'error'
  }
};
```

### プロジェクト固有ルール

```javascript
// 開発環境のみconsole許可
'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',

// テストファイルでの例外
overrides: [
  {
    files: ['**/*.test.js'],
    rules: {
      'no-unused-vars': 'off' // テストでの未使用変数許可
    }
  }
]
```

---

## 🏗️ アーキテクチャ規約

### オニオンアーキテクチャ準拠

```
src/
├── core/                  # 🎯 Domain Layer
│   ├── entities/          # ビジネスエンティティ
│   └── interfaces/        # 抽象インターフェース
├── application/           # 🔄 Application Layer  
│   ├── usecases/          # ユースケース実装
│   └── services/          # アプリケーションサービス
├── infrastructure/       # 🛠️ Infrastructure Layer
│   ├── input/             # 入力処理
│   ├── storage/           # データ永続化
│   └── rendering/         # 描画処理
└── presentation/          # 🎨 Presentation Layer
    ├── components/        # UIコンポーネント
    └── config/            # 設定ファイル
```

### 依存関係ルール

```javascript
// ✅ 許可される依存関係
Core → なし
Application → Core
Infrastructure → Core, Application  
Presentation → Core, Application, Infrastructure

// ❌ 禁止される依存関係
Core → Application, Infrastructure, Presentation
Application → Infrastructure, Presentation
Infrastructure → Presentation
```

---

## 📝 命名規約

### ファイル・ディレクトリ名

```javascript
// ✅ 正しい命名
GameLogic.js           // PascalCase for classes
gameLogic.test.js      // camelCase for tests
game-config.json       // kebab-case for config
README.md              // UPPER for documentation

// ❌ 間違った命名
gamelogic.js           // 小文字のみ
GameLogic.Test.js      // 不適切なPascalCase
game_logic.js          // snake_case使用
```

### 変数・関数名

```javascript
// ✅ 正しい命名
const gameState = new GameState();          // camelCase
const MAX_BOARD_WIDTH = 10;                 // UPPER_SNAKE for constants
function calculateScore() {}                // camelCase for functions
class KeyboardHandler {}                    // PascalCase for classes

// プライベートメソッド
_validateInput() {}                         // アンダースコアプレフィックス
#privateField;                             // プライベートフィールド

// ❌ 間違った命名
const game_state = new GameState();        // snake_case
const maxboardwidth = 10;                  // 定数が不明確
function CalculateScore() {}               // PascalCase関数
```

### 定数・列挙型

```javascript
// ✅ 正しい定数定義
const GAME_STATES = {
  MENU: 'MENU',
  PLAYING: 'PLAYING', 
  PAUSED: 'PAUSED',
  GAME_OVER: 'GAME_OVER'
};

const TETROMINO_TYPES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

// テスト用定数
const TEST_CONSTANTS = {
  BOARD_WIDTH: 10,
  BOARD_HEIGHT: 20,
  MAX_EXECUTION_TIME: 100
};
```

---

## 🧪 テスト規約

### ファイル構造

```javascript
describe('ClassName', () => {
  describe('初期化', () => {
    test('正常な初期化', () => {});
    test('エラーケース', () => {});
  });
  
  describe('基本機能', () => {
    test('正常系テスト', () => {});
    test('異常系テスト', () => {});
  });
  
  describe('パフォーマンス', () => {
    test('実行時間テスト', () => {});
    test('メモリ使用量テスト', () => {});
  });
  
  describe('エラーハンドリング', () => {
    test('null/undefined安全性', () => {});
    test('境界値テスト', () => {});
  });
});
```

### テスト命名

```javascript
// ✅ 正しいテスト名
test('should initialize GameState with default values', () => {});
test('should throw error when invalid input provided', () => {});
test('should update score correctly after line clear', () => {});

// ❌ 間違ったテスト名  
test('test1', () => {});                    // 内容不明
test('GameState', () => {});                // 抽象的すぎ
test('it works', () => {});                 // 具体性不足
```

### アサーション規約

```javascript
// ✅ 推奨アサーション
expect(result).toBe(expected);              // プリミティブ比較
expect(object).toEqual(expectedObject);     // オブジェクト比較
expect(array).toHaveLength(3);              // 配列長
expect(fn).toThrow('Error message');        // エラー検証
expect(value).toBeCloseTo(1.0, 2);          // 浮動小数点
expect(mockFn).toHaveBeenCalledTimes(1);    // モック検証

// ✅ カスタムアサーション使用
AssertionHelper.expectExecutionTimeLessThan(fn, 100);
AssertionHelper.expectDASPattern(callCount);
```

---

## 🔐 エラーハンドリング規約

### 入力値検証

```javascript
// ✅ 標準的な検証パターン
function processInput(input) {
  // null/undefined チェック
  if (input == null) {
    throw new Error('Input cannot be null or undefined');
  }
  
  // 型チェック
  if (typeof input !== 'string') {
    throw new Error(`Expected string, got ${typeof input}`);
  }
  
  // 範囲チェック
  if (input.length === 0) {
    throw new Error('Input cannot be empty');
  }
  
  // 処理実行
  return processValidInput(input);
}
```

### エラーログ規約

```javascript
// ✅ 環境別ログ出力
function handleError(method, error) {
  if (process.env.NODE_ENV === 'development') {
    console.error(`${this.constructor.name}.${method} error:`, error);
  }
  
  // 本番環境ではエラー収集サービスに送信
  if (process.env.NODE_ENV === 'production') {
    // errorReportingService.report(error);
  }
}

// ✅ 構造化ログ
const logError = (context, error, metadata = {}) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: 'error',
    context,
    message: error.message,
    stack: error.stack,
    ...metadata
  };
  
  console.error(JSON.stringify(logEntry));
};
```

---

## ⚡ パフォーマンス規約

### 実行時間基準

```javascript
// ✅ パフォーマンス基準
const PERFORMANCE_THRESHOLDS = {
  INITIALIZATION: 50,     // 初期化: 50ms以内
  USER_ACTION: 16,        // ユーザーアクション: 16ms以内(60FPS)
  BATCH_PROCESSING: 100,  // バッチ処理: 100ms以内
  MEMORY_CLEANUP: 200     // メモリクリーンアップ: 200ms以内
};

// テストでの使用例
AssertionHelper.expectExecutionTimeLessThan(
  () => gameLogic.processUserInput(input),
  PERFORMANCE_THRESHOLDS.USER_ACTION
);
```

### メモリ管理

```javascript
// ✅ リソース解放パターン
class ResourceManager {
  constructor() {
    this.resources = new Set();
  }
  
  addResource(resource) {
    this.resources.add(resource);
  }
  
  destroy() {
    // 全リソースを解放
    for (const resource of this.resources) {
      if (typeof resource.destroy === 'function') {
        resource.destroy();
      }
    }
    this.resources.clear();
  }
}
```

---

## 🛠️ 開発ツール設定

### VSCode 推奨設定

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact"
  ],
  "files.associations": {
    "*.test.js": "javascript"
  },
  "emmet.includeLanguages": {
    "javascript": "javascriptreact"
  }
}
```

### Git Hooks 活用

```bash
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged

# .husky/commit-msg  
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx commitlint --edit $1
```

---

## 📊 品質チェックリスト

### ✅ コミット前チェック

- [ ] ESLint エラー 0件
- [ ] Prettier フォーマット適用済み
- [ ] 新規テスト実装済み（新機能の場合）
- [ ] 既存テスト全通過
- [ ] JSDoc コメント記述済み
- [ ] TODO/FIXME コメント整理済み

### ✅ プルリクエスト前チェック

- [ ] CI/CD全通過
- [ ] テストカバレッジ85%以上
- [ ] パフォーマンステスト通過
- [ ] セキュリティチェック実施
- [ ] コードレビューコメント対応完了
- [ ] ドキュメント更新済み

### ✅ リリース前チェック

- [ ] E2E テスト全通過
- [ ] ブラウザ互換性確認
- [ ] パフォーマンス基準クリア
- [ ] セキュリティ監査完了
- [ ] ユーザビリティテスト実施
- [ ] 本番環境動作確認

---

## 🔄 継続的改善

### 品質メトリクス監視

```javascript
// 週次品質レポート自動生成
const generateQualityReport = () => {
  return {
    testCoverage: calculateCoverage(),
    eslintErrors: countESLintErrors(),
    performanceMetrics: gatherPerformanceData(),
    ciSuccessRate: calculateCISuccessRate(),
    codeComplexity: measureComplexity()
  };
};
```

### ルール更新プロセス

1. **問題発見** - 開発中の課題特定
2. **提案** - 改善案作成
3. **議論** - チーム内レビュー
4. **試行** - 限定的適用
5. **採用** - 正式ルール化
6. **文書化** - 規約更新

---

**📚 関連ドキュメント**

- [TDD_PROCESS.md](./TDD_PROCESS.md) - TDD実践ガイド
- [ARCHITECTURE_GUIDE.md](./ARCHITECTURE_GUIDE.md) - アーキテクチャ設計
- [PERFORMANCE_GUIDE.md](./PERFORMANCE_GUIDE.md) - パフォーマンス最適化

---

**🚀 高品質なコードで安定したゲーム開発を実現！**
