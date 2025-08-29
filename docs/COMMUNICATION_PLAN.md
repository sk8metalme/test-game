# エージェント間コミュニケーション計画

## 1. コミュニケーション体制

### エージェント役割分担

#### プロジェクト管理層
- **@project-manager-expert**: 全体統括、スケジュール管理、リスク管理
- **@project-analyzer**: プロジェクト分析、現状把握、洞察提供

#### 設計・アーキテクチャ層  
- **@design-expert**: UI/UXデザイン、アーキテクチャ設計、ユーザビリティ
- **@deliverable-documentation-expert**: ドキュメント作成、成果物整合性確認

#### 開発・実装層
- **@tdd-development-expert**: 機能実装、バグ修正（TDDアプローチ）
- **@tdd-test-implementer**: テスト実装、TDDサイクル実行

#### 品質保証層
- **@test-design-expert**: テスト戦略設計、テスト計画策定
- **@test-verification-expert**: テスト実行、品質検証
- **@code-quality-reviewer**: コード品質レビュー、ベストプラクティス確認

## 2. コミュニケーションフロー

### 標準ワークフロー

```mermaid
graph TD
    A[要件受領] --> B[@project-manager-expert]
    B --> C[@project-analyzer]
    C --> D[@design-expert]
    D --> E[@test-design-expert]
    E --> F[@tdd-development-expert]
    F --> G[@tdd-test-implementer]
    G --> H[@test-verification-expert]
    H --> I[@code-quality-reviewer]
    I --> J[@deliverable-documentation-expert]
    J --> K[成果物完成]
    
    F -.-> D
    H -.-> F
    I -.-> F
```

### エージェント間連携パターン

#### パターン1: 計画フェーズ
```
@project-manager-expert → @project-analyzer → @design-expert
                       ↓
                   @test-design-expert
```

#### パターン2: 実装フェーズ
```
@tdd-development-expert ⟷ @tdd-test-implementer
           ↓
@test-verification-expert → @code-quality-reviewer
```

#### パターン3: 完成フェーズ
```
@deliverable-documentation-expert → @design-expert → @project-manager-expert
```

## 3. 定期ミーティング

### 日次スタンドアップ（毎日 9:00）
- **参加者**: 全エージェント
- **時間**: 15分
- **アジェンダ**:
  - 昨日の完了作業
  - 今日の予定作業  
  - ブロッカーの報告
  - 支援要請

**テンプレート**:
```
## Daily Standup - [日付]

### @[エージェント名]
- **Yesterday**: 完了した作業
- **Today**: 予定している作業
- **Blockers**: 妨げになっている問題
- **Help Needed**: 他エージェントへの支援要請
```

### 週次プランニング（毎週月曜 10:00）
- **参加者**: @project-manager-expert, @design-expert, @test-design-expert
- **時間**: 30分
- **アジェンダ**:
  - 前週の振り返り
  - 今週のスプリント計画
  - リソース配分
  - リスク評価

### 週次レトロスペクティブ（毎週金曜 16:00）
- **参加者**: 全エージェント
- **時間**: 45分
- **アジェンダ**:
  - Keep（続けたいこと）
  - Problem（問題点）
  - Try（試したいこと）
  - Action Items（改善アクション）

## 4. コミュニケーションルール

### 基本原則
1. **透明性**: 全ての作業と決定は文書化し共有
2. **迅速性**: 問題発見時は即座に関係者に連絡
3. **建設性**: フィードバックは具体的で改善提案を含む
4. **責任**: 各自の役割と責任を明確に認識

### コミュニケーション方法

#### 通常連絡
- **方法**: ドキュメント更新 + メンション
- **対象**: 日常的な進捗報告、質問
- **レスポンス時間**: 2時間以内

#### 緊急連絡
- **方法**: 緊急フラグ付きメンション
- **対象**: ブロッカー、重大バグ、スケジュール遅延
- **レスポンス時間**: 30分以内

#### 意思決定
- **方法**: 提案書作成 + レビューサイクル
- **対象**: アーキテクチャ変更、仕様変更
- **レスポンス時間**: 24時間以内

### エスカレーション手順

1. **Level 1**: 直接関係者間で解決
2. **Level 2**: @project-manager-expert に相談
3. **Level 3**: 全エージェントでの議論
4. **Level 4**: 外部有識者への相談

## 5. 情報共有

### ドキュメント管理

#### 必須ドキュメント
- **PROJECT_PLAN.md**: プロジェクト全体計画
- **TASK_TRACKING.md**: タスク進捗管理
- **TECHNICAL_SPEC.md**: 技術仕様書
- **QUALITY_REPORT.md**: 品質レポート
- **COMMUNICATION_LOG.md**: コミュニケーション履歴

#### 更新責任者
- **@project-manager-expert**: PROJECT_PLAN.md, TASK_TRACKING.md
- **@design-expert**: TECHNICAL_SPEC.md
- **@test-verification-expert**: QUALITY_REPORT.md
- **全エージェント**: COMMUNICATION_LOG.md

### 知識共有セッション

#### 技術共有会（隔週水曜 15:00）
- **参加者**: 開発・テスト関連エージェント
- **内容**: 技術トピック、ベストプラクティス、困難な問題の解決法

#### デザインレビュー（隔週火曜 14:00）
- **参加者**: @design-expert, @project-manager-expert, @deliverable-documentation-expert
- **内容**: UI/UX設計、アーキテクチャ設計のレビュー

## 6. 品質保証コミュニケーション

### コードレビュープロセス

#### プルリクエスト作成時
1. **@tdd-development-expert**: PRを作成、概要を記載
2. **@test-verification-expert**: テスト観点でレビュー
3. **@code-quality-reviewer**: コード品質観点でレビュー
4. **@design-expert**: アーキテクチャ観点でレビュー（必要時）

#### レビューコメント規則
- **Must Fix**: 必須修正項目
- **Should Fix**: 推奨修正項目  
- **Consider**: 検討提案項目
- **Nitpick**: 軽微な改善提案

### バグ報告・修正フロー

#### バグ発見時
1. **発見者**: Issue作成、詳細情報記載
2. **@test-verification-expert**: 再現確認、影響度評価
3. **@project-manager-expert**: 優先度設定、担当者アサイン
4. **@tdd-development-expert**: 修正実装
5. **@test-verification-expert**: 修正確認

#### バグ分類
- **Critical**: システム停止、データ損失
- **High**: 主要機能停止
- **Medium**: 一部機能不具合
- **Low**: UI/UXの軽微な問題

## 7. プロジェクト報告

### ステークホルダー報告

#### 週次進捗レポート
- **担当**: @project-manager-expert
- **頻度**: 毎週金曜
- **内容**:
  - 完了作業サマリー
  - 進捗状況（計画対実績）
  - 品質メトリクス
  - リスク状況
  - 次週予定

#### マイルストーンレポート
- **担当**: @deliverable-documentation-expert
- **頻度**: 各フェーズ完了時
- **内容**:
  - 成果物詳細
  - 品質評価結果
  - 設計仕様との整合性
  - 改善提案

### メトリクス追跡

#### 開発メトリクス
- コード行数、テストカバレッジ
- バグ発見・修正件数
- PR作成・マージ件数
- ビルド成功率

#### 品質メトリクス
- パフォーマンステスト結果
- セキュリティスキャン結果
- ユーザビリティテスト結果
- アクセシビリティ準拠度

## 8. トラブルシューティング

### よくある問題と対処法

#### コミュニケーション問題
**問題**: エージェント間の認識齟齬
**対処**: 
- 定義の明確化
- 共通用語集の作成
- ドキュメントでの確認

#### 技術的問題
**問題**: 実装困難な要件
**対処**:
- @design-expert との仕様再検討
- 代替案の提示
- 段階的実装の検討

#### スケジュール問題
**問題**: 作業遅延
**対処**:
- 優先度の再設定
- スコープの調整
- リソース追加検討

### エスカレーション連絡先
- **技術問題**: @design-expert → @project-analyzer
- **品質問題**: @test-verification-expert → @code-quality-reviewer
- **スケジュール問題**: @project-manager-expert

## 9. 改善プロセス

### 継続的改善
- 月次でコミュニケーション効果を評価
- エージェント間フィードバックの収集
- プロセス改善提案の実施

### ベストプラクティス
- 成功事例の文書化
- 失敗事例の分析・共有
- ノウハウの蓄積・継承

---

**最終更新**: 2024年12月19日  
**次回見直し**: 2025年1月19日
