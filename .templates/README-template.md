# {{TemplateName}} テンプレート使用ガイド

## 📋 概要

このテンプレートは Week 2改善実装で作成された、高品質な開発を支援するためのコードテンプレートです。

## 🎯 使用目的

- 開発速度向上
- コード品質標準化
- ベストプラクティス適用
- エラー防止

## 📁 テンプレート一覧

### 1. class-template.js
**用途**: 新しいクラス実装用テンプレート

**置換変数**:
- `{{ClassName}}` - クラス名
- `{{ClassDescription}}` - クラス説明
- `{{ArchitectureLayer}}` - アーキテクチャ層（Core/Application/Infrastructure/Presentation）
- `{{Responsibility1-3}}` - 責任範囲
- `{{AssignedAgent}}` - 担当エージェント
- `{{PublicMethod1}}` - パブリックメソッド名
- `{{ParamType}}` - パラメータ型
- `{{ReturnType}}` - 戻り値型

**使用例**:
```bash
cp .templates/class-template.js src/application/GameController.js
# 置換作業実施
```

### 2. test-template.js
**用途**: ユニットテスト実装用テンプレート

**置換変数**:
- `{{ClassName}}` - テスト対象クラス名
- `{{ClassDescription}}` - クラス説明
- `{{TestAgent}}` - テスト担当エージェント
- `{{ImportPath}}` - インポートパス
- `{{TestHelpersPath}}` - テストヘルパーパス
- `{{instanceName}}` - インスタンス変数名
- `{{publicMethod1}}` - テスト対象メソッド
- `{{testValue}}` - テスト値

**使用例**:
```bash
cp .templates/test-template.js tests/unit/application/GameController.test.js
# 置換作業実施
```

## 🔧 使用手順

### 1. 基本的な使用方法

```bash
# 1. テンプレートをコピー
cp .templates/class-template.js src/path/to/NewClass.js

# 2. 置換変数を実際の値に変更
# エディタの置換機能を使用して一括置換

# 3. 具体的な実装を追加
# テンプレートをベースに機能実装
```

### 2. VSCode での効率的な置換

```json
// .vscode/settings.json に追加推奨
{
  "emmet.includeLanguages": {
    "javascript": "html"
  },
  "editor.quickSuggestions": {
    "strings": true
  }
}
```

### 3. 置換推奨順序

1. `{{ClassName}}` - 最初に置換（全体の一貫性確保）
2. `{{ClassDescription}}` - 説明文
3. `{{ArchitectureLayer}}` - アーキテクチャ層
4. `{{AssignedAgent}}` - 担当エージェント
5. メソッド関連変数 - 機能別に置換
6. 型関連変数 - TypeScript使用時

## 📊 品質保証チェックリスト

### ✅ 実装品質
- [ ] 全ての置換変数が実際の値に変更済み
- [ ] JSDoc コメントが適切に記述されている
- [ ] エラーハンドリングが実装されている
- [ ] メモリリーク対策（destroyメソッド）が実装されている
- [ ] プライベートメソッドが適切に使用されている

### ✅ テスト品質  
- [ ] 初期化テストが実装されている
- [ ] 基本機能テストが実装されている
- [ ] エラーハンドリングテストが実装されている
- [ ] パフォーマンステストが実装されている
- [ ] 境界値テストが実装されている
- [ ] リソース管理テストが実装されている

### ✅ アーキテクチャ準拠
- [ ] オニオンアーキテクチャ層が正しく設定されている
- [ ] 依存関係方向が正しい
- [ ] 単一責任原則が守られている
- [ ] インターフェース分離原則が適用されている

## 🚀 カスタマイズ方針

### エージェント別特化テンプレート

**@tdd-development-expert 用**:
- より詳細なTDDパターン
- パフォーマンス重視の実装

**@test-verification-expert 用**:
- 包括的なテストケース
- エッジケーステスト強化

**@design-expert 用**:
- アーキテクチャパターン適用
- 設計原則チェック

## 📈 改善履歴

### Version 1.0 (Week 2改善実装)
- 基本テンプレート作成
- TDDパターン適用
- エラーハンドリング標準化
- パフォーマンステスト統合

### 今後の改善予定
- TypeScript対応テンプレート
- React Component テンプレート
- Integration Test テンプレート
- Documentation テンプレート

## 🔗 関連ドキュメント

- [CODING_STANDARDS.md](../docs/CODING_STANDARDS.md) - コーディング規約
- [TDD_PROCESS.md](../docs/TDD_PROCESS.md) - TDDプロセス
- [ARCHITECTURE_GUIDE.md](../docs/ARCHITECTURE_GUIDE.md) - アーキテクチャガイド

---

**テンプレート活用で開発効率と品質の両立を実現！** 🚀
