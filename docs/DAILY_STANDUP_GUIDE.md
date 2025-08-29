# Daily Standup 運営ガイド

## 📋 概要

Week 2改善実装により導入されるDaily Standupの運営ガイドです。効率的なプロジェクト進行と早期課題発見を目的とします。

## 🎯 目的

- **進捗透明性** - 全エージェントの作業状況共有
- **早期課題発見** - ブロッカーの迅速な特定と解決
- **連携強化** - エージェント間のコミュニケーション促進
- **品質確保** - 継続的な品質監視

## ⏰ 開催要項

### 📅 基本設定
- **開催時間**: 毎日 9:00 AM (JST)
- **所要時間**: 15分厳守
- **参加者**: 全エージェント
- **ファシリテーター**: @project-manager-expert

### 🔄 開催サイクル
```
月曜日: Week Planning + Daily Standup
火〜金曜日: Daily Standup
土曜日: Tech Sharing + Daily Standup  
日曜日: Weekly Retrospective
```

---

## 📋 Standup フォーマット

### 🎤 発言順序

1. **@project-manager-expert** (2分)
2. **@tdd-development-expert** (3分)
3. **@test-verification-expert** (2分)
4. **@design-expert** (2分)
5. **@code-quality-reviewer** (2分)
6. **@deliverable-documentation-expert** (2分)
7. **全体調整** (2分)

### 💬 各エージェント発言テンプレート

```markdown
## 昨日の成果 (30秒)
- 完了したタスク
- 主要な成果物

## 今日の予定 (30秒)  
- 実装予定のタスク
- 重要なマイルストーン

## ブロッカー・課題 (30秒)
- 現在の障害
- 支援が必要な事項
```

---

## 🎯 エージェント別フォーカス

### @project-manager-expert
```markdown
昨日: プロジェクト進捗管理、リスク評価
今日: リソース調整、マイルストーン確認
ブロッカー: スケジュール遅延、リソース競合
```

### @tdd-development-expert  
```markdown
昨日: 実装完了機能、テスト通過状況
今日: 新機能実装、リファクタリング
ブロッカー: 技術的課題、設計判断
```

### @test-verification-expert
```markdown
昨日: テスト実装・実行結果、品質指標
今日: テストカバレッジ向上、統合テスト
ブロッカー: テスト環境問題、テストデータ
```

### @design-expert
```markdown
昨日: アーキテクチャ設計、UI/UX設計
今日: 設計レビュー、インターフェース設計
ブロッカー: 設計方針、技術選択
```

### @code-quality-reviewer
```markdown
昨日: コードレビュー、品質チェック
今日: CI/CD改善、静的解析
ブロッカー: 品質基準違反、ツール設定
```

### @deliverable-documentation-expert
```markdown
昨日: ドキュメント更新、仕様書作成
今日: API文書、ユーザーガイド
ブロッカー: 情報不足、仕様変更
```

---

## 📊 進捗トラッキング

### 🎯 日次メトリクス

```javascript
// Daily Metrics Template
const dailyMetrics = {
  date: '2024-XX-XX',
  completed_tasks: 0,
  in_progress_tasks: 0,
  blocked_tasks: 0,
  test_coverage: 0.0,
  ci_success_rate: 0.0,
  code_quality_score: 0.0,
  blockers: []
};
```

### 📈 進捗可視化

```markdown
## 📊 Today's Dashboard

### ✅ Completed (Target: 5)
- TODAY-XXX: Feature implementation ✅
- TODAY-XXX: Unit testing ✅
- TODAY-XXX: Documentation ✅

### 🔄 In Progress (Target: 3)
- TODAY-XXX: Integration testing 🔄
- TODAY-XXX: Performance optimization 🔄

### ⚠️ Blocked (Target: 0)
- TODAY-XXX: Waiting for design decision ⚠️

### 📈 Quality Metrics
- Test Coverage: 87% ✅ (Target: 85%+)
- CI Success Rate: 92% ⚠️ (Target: 95%+)
- ESLint Errors: 2 ⚠️ (Target: 0)
```

---

## 🚨 ブロッカー管理

### 🔴 高優先度ブロッカー

**即座解決（当日中）**:
- CI/CD 失敗
- 開発環境問題
- クリティカルバグ
- 依存関係エラー

### 🟡 中優先度ブロッカー

**24時間以内解決**:
- 設計判断待ち
- レビュー待ち
- 外部ライブラリ問題
- パフォーマンス課題

### 🔵 低優先度ブロッカー

**週内解決**:
- ドキュメント不足
- コード改善提案
- 将来的な技術的負債
- ツール最適化

### 📋 ブロッカー対応プロセス

```markdown
1. 🚨 ブロッカー特定
   - 影響度・緊急度評価
   - 担当者アサイン

2. 🔄 解決アクション
   - 具体的な対策実行
   - 進捗状況追跡

3. ✅ 解決確認
   - 成果確認
   - 再発防止策検討
```

---

## 💡 効率化 Tips

### ⚡ 時間管理

```markdown
## ⏰ Time Boxing Rules

- 各エージェント発言: 最大90秒
- 全体ディスカッション: 最大2分
- 総時間: 15分厳守
- オーバーした場合: 別途ミーティング設定
```

### 🎯 フォーカス維持

```markdown
## 🎯 Discussion Guidelines

✅ 適切な内容:
- 進捗報告
- ブロッカー共有
- 支援要請
- 重要な決定事項

❌ 避けるべき内容:
- 技術的な詳細議論
- 長時間の問題解決
- 過去の振り返り
- 将来の大きな計画
```

### 📝 記録・追跡

```markdown
## 📊 Meeting Record Template

**Date**: YYYY-MM-DD
**Facilitator**: @project-manager-expert
**Attendees**: All agents

### Key Updates
- [Agent]: Major accomplishment
- [Agent]: Important milestone

### Action Items
1. [Responsible]: [Action] - [Deadline]
2. [Responsible]: [Action] - [Deadline]

### Blockers Identified
1. [Blocker]: [Owner] - [Resolution Plan]

### Metrics
- Velocity: X tasks/day
- Quality: X% coverage
- Blockers: X items
```

---

## 🔄 Standup運営改善

### 📈 継続的改善

**週次改善レビュー**:
- Standup効果性評価
- 時間配分最適化
- フォーマット調整
- ツール改善

### 🎯 成功指標

```javascript
const standupMetrics = {
  // 効率性指標
  average_duration: 15, // 目標: 15分以内
  on_time_start_rate: 0.95, // 目標: 95%以上
  
  // 効果性指標
  blocker_resolution_time: 24, // 目標: 24時間以内
  action_item_completion_rate: 0.90, // 目標: 90%以上
  
  // 満足度指標
  participant_engagement: 4.5, // 目標: 4.5/5.0以上
  value_perceived: 4.0 // 目標: 4.0/5.0以上
};
```

### 🛠️ ツール活用

**推奨ツール**:
- **進捗管理**: GitHub Projects, TASK_TRACKING.md
- **品質監視**: CI/CD Dashboard, SonarQube
- **コミュニケーション**: Slack, Discord
- **ドキュメント**: Confluence, GitHub Wiki

---

## 📅 特別なStandup

### 🚀 スプリント開始時

```markdown
## Sprint Kickoff Standup

### Agenda (20分)
1. Sprint目標確認 (5分)
2. タスク分担確認 (5分)  
3. リスク・依存関係 (5分)
4. 成功基準確認 (3分)
5. Q&A (2分)
```

### 🏁 スプリント終了時

```markdown
## Sprint Review Standup  

### Agenda (20分)
1. 完了成果報告 (8分)
2. 未完了タスク処理 (4分)
3. 学習・改善点 (4分)
4. 次スプリント準備 (4分)
```

### 🚨 緊急時Standup

```markdown
## Emergency Standup

### トリガー条件
- クリティカルバグ発生
- 本番環境障害
- 重要な仕様変更
- 外部依存問題

### Agenda (10分)
1. 状況確認 (2分)
2. 影響評価 (2分)
3. 対応計画 (4分)
4. 役割分担 (2分)
```

---

## 🎊 Success Stories

### 📈 期待される成果

**Week 2での効果測定**:
- ブロッカー解決時間: 50%短縮
- タスク完了率: 15%向上  
- コミュニケーション効率: 30%向上
- 品質指標: 安定維持

**長期的な価値**:
- チーム一体感向上
- 予防的問題解決
- 継続的品質改善
- 知識共有促進

---

**📚 関連ドキュメント**

- [COMMUNICATION_PLAN.md](./COMMUNICATION_PLAN.md) - コミュニケーション戦略
- [PROJECT_PLAN.md](./PROJECT_PLAN.md) - プロジェクト計画
- [TASK_TRACKING.md](./TASK_TRACKING.md) - タスク管理

---

**🚀 効率的なDaily Standupで高品質開発を加速！**
